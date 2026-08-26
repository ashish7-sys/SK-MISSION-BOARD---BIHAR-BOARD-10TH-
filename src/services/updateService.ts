import { AppVersionInfo } from "../types";
import { CURRENT_APP_VERSION } from "../data/bsebClass10Data";
import { StoreService } from "./storeService";

export type UpdateStatus = 
  | "idle" 
  | "checking" 
  | "available" 
  | "downloading" 
  | "download_failed"
  | "ready" 
  | "installing" 
  | "install_success"
  | "install_failed"
  | "error"
  | "up_to_date";

export interface ApkVerificationResult {
  isValid: boolean;
  errorReason?: string;
  errorMessage?: string;
  apkVersionCode?: number;
  apkVersionName?: string;
  apkPackageName?: string;
  filePath?: string;
  fileSizeBytes?: number;
}

export interface UpdateState {
  status: UpdateStatus;
  isModalOpen: boolean;
  installedVersionCode: number;
  installedVersionName: string;
  isNativeAndroid: boolean;
  remoteVersion: AppVersionInfo | null;
  hasUpdate: boolean;
  isForceUpdate: boolean;
  downloadProgress: number; // 0 to 100
  downloadedBytes: number;
  totalBytes: number;
  downloadSpeed: string;
  errorMessage: string | null;
  errorDiagnosticReason: string | null;
  downloadBlobUrl: string | null;
  nativeApkPath: string | null;
  downloadFileName: string;
  lastCheckedTime: number;
  verificationResult: ApkVerificationResult | null;
  installationAttempted: boolean;
}

type UpdateListener = (state: UpdateState) => void;

// In-memory state with dynamic defaults
let state: UpdateState = {
  status: "idle",
  isModalOpen: false,
  installedVersionCode: CURRENT_APP_VERSION.versionCode,
  installedVersionName: CURRENT_APP_VERSION.versionName,
  isNativeAndroid: false,
  remoteVersion: null,
  hasUpdate: false,
  isForceUpdate: false,
  downloadProgress: 0,
  downloadedBytes: 0,
  totalBytes: 0,
  downloadSpeed: "0 KB/s",
  errorMessage: null,
  errorDiagnosticReason: null,
  downloadBlobUrl: null,
  nativeApkPath: null,
  downloadFileName: "sk-mission-board-v2.0.0.apk",
  lastCheckedTime: 0,
  verificationResult: null,
  installationAttempted: false
};

const listeners = new Set<UpdateListener>();
let sessionDismissed = false;
let isCheckInProgress = false;
let isDownloadInProgress = false;
let webDownloadAbortController: AbortController | null = null;
let lastAutoCheckTime = 0;
const MIN_AUTO_CHECK_INTERVAL_MS = 15 * 1000; // 15s interval

function notify() {
  listeners.forEach(cb => {
    try {
      cb({ ...state });
    } catch (e) {
      console.warn("Update listener error:", e);
    }
  });
}

function updateState(partial: Partial<UpdateState>) {
  state = { ...state, ...partial };
  notify();
}

/**
 * Reads actual installed version directly from Android PackageManager via Capacitor plugin.
 * Falls back to single source of truth CURRENT_APP_VERSION when running on Web.
 */
async function getActualInstalledVersion(): Promise<{ versionCode: number; versionName: string; isNative: boolean }> {
  try {
    const win = window as any;
    if (win.Capacitor?.isNativePlatform && win.Capacitor.isNativePlatform()) {
      if (win.Capacitor.Plugins?.AppUpdatePlugin?.getInstalledVersion) {
        const res = await win.Capacitor.Plugins.AppUpdatePlugin.getInstalledVersion();
        if (res && typeof res.versionCode !== "undefined") {
          const vCode = Number(res.versionCode);
          const vName = String(res.versionName || "2.0.0");
          state.installedVersionCode = vCode;
          state.installedVersionName = vName;
          state.isNativeAndroid = true;
          return { versionCode: vCode, versionName: vName, isNative: true };
        }
      }
    }
  } catch (e) {
    console.warn("Could not read native Android PackageManager:", e);
  }

  const defaultCode = Number(CURRENT_APP_VERSION.versionCode);
  const defaultName = CURRENT_APP_VERSION.versionName;

  state.installedVersionCode = defaultCode;
  state.installedVersionName = defaultName;
  state.isNativeAndroid = false;

  return {
    versionCode: defaultCode,
    versionName: defaultName,
    isNative: false
  };
}

export const UpdateService = {
  getState: (): UpdateState => ({ ...state }),

  subscribe: (listener: UpdateListener) => {
    listeners.add(listener);
    listener({ ...state });
    return () => {
      listeners.delete(listener);
    };
  },

  setModalOpen: (open: boolean) => {
    updateState({ isModalOpen: open });
  },

  dismissForSession: () => {
    sessionDismissed = true;
    if (state.remoteVersion?.versionCode) {
      try {
        localStorage.setItem("sk_dismissed_update_version", String(state.remoteVersion.versionCode));
      } catch {}
    }
    updateState({ isModalOpen: false });
  },

  resetDismissForSession: () => {
    sessionDismissed = false;
  },

  /**
   * Primary update check logic:
   * 1. Query Android PackageManager for installed version
   * 2. Query Remote sources (Firestore -> API -> version.json)
   * 3. Numerical comparison: if installed >= remote -> NO UPDATE DIALOG
   */
  checkForUpdate: async (isManual = false): Promise<{ hasUpdate: boolean; remoteVersion: AppVersionInfo | null }> => {
    if (isCheckInProgress) {
      return { hasUpdate: state.hasUpdate, remoteVersion: state.remoteVersion };
    }

    const now = Date.now();
    if (!isManual && now - lastAutoCheckTime < MIN_AUTO_CHECK_INTERVAL_MS) {
      return { hasUpdate: state.hasUpdate, remoteVersion: state.remoteVersion };
    }
    lastAutoCheckTime = now;
    isCheckInProgress = true;

    updateState({
      status: "checking",
      errorMessage: null,
      errorDiagnosticReason: null,
      lastCheckedTime: now
    });

    try {
      // 1. Get current installed version from Android runtime
      const installed = await getActualInstalledVersion();
      updateState({
        installedVersionCode: installed.versionCode,
        installedVersionName: installed.versionName,
        isNativeAndroid: installed.isNative
      });

      // 2. Fetch remote update information from dynamic endpoints
      let remoteInfo: AppVersionInfo | null = null;

      // Source A: StoreService (Firestore real-time)
      const firestoreVer = StoreService.getVersionInfo();
      if (firestoreVer && typeof firestoreVer.versionCode === "number") {
        remoteInfo = { ...firestoreVer };
      }

      // Source B: Dedicated Server API endpoint
      if (!remoteInfo || !remoteInfo.apkUrl) {
        try {
          const res = await fetch("/api/app-update", { cache: "no-store" });
          if (res.ok) {
            const apiData = await res.json();
            if (apiData && typeof apiData.versionCode === "number") {
              remoteInfo = {
                versionName: apiData.versionName || "2.0.0",
                versionCode: Number(apiData.versionCode),
                releaseDate: apiData.releaseDate || new Date().toISOString().split("T")[0],
                apkDownloadUrl: apiData.apkUrl || apiData.apkDownloadUrl || "",
                apkUrl: apiData.apkUrl || apiData.apkDownloadUrl || "",
                updateMessage: apiData.updateMessage || "SK MISSION BOARD v2.0.0 का नया संस्करण उपलब्ध है।",
                forceUpdate: Boolean(apiData.forceUpdate),
                releaseNotes: Array.isArray(apiData.releaseNotes) ? apiData.releaseNotes : [],
                isMandatory: Boolean(apiData.forceUpdate),
                latestVersionCode: Number(apiData.versionCode)
              };
            }
          }
        } catch {
          // Safe continue
        }
      }

      // Source C: Fallback to version.json
      if (!remoteInfo || !remoteInfo.apkUrl) {
        try {
          const jsonRes = await fetch("/version.json", { cache: "no-store" });
          if (jsonRes.ok) {
            const jsonData = await jsonRes.json();
            if (jsonData && typeof jsonData.versionCode === "number") {
              remoteInfo = {
                versionName: jsonData.versionName || "2.0.0",
                versionCode: Number(jsonData.versionCode),
                releaseDate: jsonData.releaseDate || new Date().toISOString().split("T")[0],
                apkDownloadUrl: jsonData.apkUrl || jsonData.apkDownloadUrl || "",
                apkUrl: jsonData.apkUrl || jsonData.apkDownloadUrl || "",
                updateMessage: jsonData.updateMessage || "SK MISSION BOARD v2.0.0 का नया संस्करण उपलब्ध है।",
                forceUpdate: Boolean(jsonData.forceUpdate),
                releaseNotes: Array.isArray(jsonData.releaseNotes) ? jsonData.releaseNotes : [],
                isMandatory: Boolean(jsonData.forceUpdate),
                latestVersionCode: Number(jsonData.versionCode)
              };
            }
          }
        } catch {
          // Safe continue
        }
      }

      if (!remoteInfo) {
        remoteInfo = CURRENT_APP_VERSION;
      }

      // 3. Strict Numerical Version Comparison
      const remoteCode = Number(remoteInfo.versionCode || remoteInfo.latestVersionCode || 200);
      const installedCode = Number(installed.versionCode);
      const isNewer = remoteCode > installedCode;
      const isForce = Boolean(remoteInfo.forceUpdate || remoteInfo.isMandatory);

      // Check dismissed status
      const dismissedVer = localStorage.getItem("sk_dismissed_update_version");
      const isLocallyDismissed = dismissedVer === String(remoteCode);

      // If user had attempted install and restarted app with newer version
      if (installedCode >= remoteCode) {
        // App is up to date! Clean up any leftover update state
        if (state.installationAttempted) {
          const win = window as any;
          if (win.Capacitor?.Plugins?.AppUpdatePlugin?.deleteDownloadedApk) {
            try {
              win.Capacitor.Plugins.AppUpdatePlugin.deleteDownloadedApk();
            } catch {}
          }
        }

        updateState({
          remoteVersion: remoteInfo,
          hasUpdate: false,
          isForceUpdate: false,
          status: "up_to_date",
          installationAttempted: false,
          errorMessage: null,
          errorDiagnosticReason: null,
          isModalOpen: isManual // Only open modal if explicitly triggered by user clicking "Check for Updates"
        });

        return { hasUpdate: false, remoteVersion: remoteInfo };
      }

      // App is older than remote version:
      updateState({
        remoteVersion: remoteInfo,
        hasUpdate: isNewer,
        isForceUpdate: isForce,
        status: isNewer ? (state.status === "ready" ? "ready" : "available") : "up_to_date"
      });

      if (isNewer) {
        if (isManual || isForce || (!sessionDismissed && !isLocallyDismissed)) {
          updateState({ isModalOpen: true });
        }
      }

      return { hasUpdate: isNewer, remoteVersion: remoteInfo };
    } catch (err: any) {
      console.warn("Update check failed safely:", err);
      updateState({
        status: "error",
        errorMessage: "अपडेट की जांच करने में असमर्थ। कृपया इंटरनेट कनेक्शन जांचें।",
        errorDiagnosticReason: "CHECK_NETWORK_ERROR"
      });
      return { hasUpdate: false, remoteVersion: null };
    } finally {
      isCheckInProgress = false;
    }
  },

  /**
   * Start Downloading APK with Native Android Engine or Web Fallback
   */
  startDownload: async (targetApkUrl?: string) => {
    if (isDownloadInProgress) return;

    const url = targetApkUrl || state.remoteVersion?.apkUrl || state.remoteVersion?.apkDownloadUrl;
    if (!url || typeof url !== "string" || !url.trim()) {
      updateState({
        status: "download_failed",
        errorMessage: "APK डाउनलोड लिंक उपलब्ध नहीं है।",
        errorDiagnosticReason: "MISSING_DOWNLOAD_URL"
      });
      return;
    }

    const cleanUrl = url.trim();
    const fileName = `sk-mission-board-v${state.remoteVersion?.versionName || "2.0.0"}.apk`;

    isDownloadInProgress = true;
    updateState({
      status: "downloading",
      downloadProgress: 0,
      downloadedBytes: 0,
      totalBytes: 0,
      downloadSpeed: "Connecting...",
      errorMessage: null,
      errorDiagnosticReason: null,
      downloadFileName: fileName,
      verificationResult: null,
      installationAttempted: false
    });

    const win = window as any;

    // -------------------------------------------------------------
    // PATH 1: NATIVE ANDROID DOWNLOAD VIA CAPACITOR PLUGIN
    // -------------------------------------------------------------
    if (win.Capacitor?.isNativePlatform && win.Capacitor.isNativePlatform() && win.Capacitor.Plugins?.AppUpdatePlugin?.downloadApk) {
      const plugin = win.Capacitor.Plugins.AppUpdatePlugin;

      // Add Native Event Listeners
      let removeProgListener: any = null;
      let removeErrListener: any = null;
      let removeDoneListener: any = null;

      try {
        if (plugin.addListener) {
          removeProgListener = await plugin.addListener("downloadProgress", (data: any) => {
            const dl = Number(data.downloadedBytes || 0);
            const tot = Number(data.totalBytes || 0);
            const prog = Math.min(100, Math.max(0, Number(data.progress || 0)));
            updateState({
              downloadProgress: prog,
              downloadedBytes: dl,
              totalBytes: tot,
              downloadSpeed: `${(dl / (1024 * 1024)).toFixed(1)} MB`
            });
          });

          removeErrListener = await plugin.addListener("downloadError", (data: any) => {
            isDownloadInProgress = false;
            updateState({
              status: "download_failed",
              errorMessage: data?.errorMessage || "APK डाउनलोड विफल रहा।",
              errorDiagnosticReason: data?.errorReason || "NATIVE_DOWNLOAD_FAILED"
            });
          });

          removeDoneListener = await plugin.addListener("downloadComplete", (data: any) => {
            isDownloadInProgress = false;
            updateState({
              status: "ready",
              downloadProgress: 100,
              nativeApkPath: data?.filePath || null,
              downloadSpeed: "Complete",
              errorMessage: null,
              errorDiagnosticReason: null,
              verificationResult: {
                isValid: true,
                filePath: data?.filePath,
                apkVersionCode: data?.apkVersionCode || 200,
                apkVersionName: data?.apkVersionName || "2.0.0"
              }
            });
          });
        }

        // Trigger native download
        const result = await plugin.downloadApk({ url: cleanUrl });
        if (result && result.status === "ready") {
          updateState({
            status: "ready",
            downloadProgress: 100,
            nativeApkPath: result.filePath || null,
            verificationResult: {
              isValid: true,
              filePath: result.filePath,
              apkVersionCode: result.apkVersionCode || 200,
              apkVersionName: result.apkVersionName || "2.0.0"
            }
          });
        }
        return;
      } catch (nativeErr: any) {
        console.warn("Native download trigger error:", nativeErr);
        isDownloadInProgress = false;
        const msg = nativeErr?.message || "Downloaded APK इस app के compatible update के रूप में verify नहीं हुआ।";
        const reason = nativeErr?.errorReason || "APK_VERIFICATION_FAILED";
        updateState({
          status: "download_failed",
          errorMessage: msg,
          errorDiagnosticReason: reason
        });
        return;
      } finally {
        isDownloadInProgress = false;
      }
    }

    // -------------------------------------------------------------
    // PATH 2: WEB BROWSER STREAM DOWNLOAD WITH CHUNK PARSING
    // -------------------------------------------------------------
    webDownloadAbortController = new AbortController();
    let startTime = Date.now();

    try {
      const response = await fetch(cleanUrl, {
        signal: webDownloadAbortController.signal,
        headers: {
          Accept: "application/vnd.android.package-archive, application/octet-stream, */*"
        }
      });

      if (!response.ok) {
        throw new Error(`सर्वर से डाउनलोड विफल (HTTP ${response.status})`);
      }

      const contentLength = response.headers.get("Content-Length");
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      let loaded = 0;

      if (!response.body) {
        throw new Error("स्ट्रीम डेटा प्राप्त नहीं हुआ।");
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (value) {
          chunks.push(value);
          loaded += value.length;

          const progress = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
          const elapsedSec = Math.max(0.1, (Date.now() - startTime) / 1000);
          const bytesPerSec = loaded / elapsedSec;
          const speedText = bytesPerSec > 1024 * 1024 
            ? `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s` 
            : `${Math.round(bytesPerSec / 1024)} KB/s`;

          updateState({
            downloadProgress: progress,
            downloadedBytes: loaded,
            totalBytes: total,
            downloadSpeed: speedText
          });
        }
      }

      const blob = new Blob(chunks as BlobPart[], {
        type: "application/vnd.android.package-archive"
      });

      if (state.downloadBlobUrl) {
        URL.revokeObjectURL(state.downloadBlobUrl);
      }

      const blobUrl = URL.createObjectURL(blob);

      updateState({
        status: "ready",
        downloadProgress: 100,
        downloadBlobUrl: blobUrl,
        downloadSpeed: "Complete",
        errorMessage: null,
        errorDiagnosticReason: null,
        verificationResult: {
          isValid: true,
          apkVersionCode: 200,
          apkVersionName: "2.0.0",
          fileSizeBytes: loaded
        }
      });

    } catch (err: any) {
      if (err.name === "AbortError") {
        updateState({
          status: "idle",
          downloadProgress: 0,
          errorMessage: "डाउनलोड रद्द किया गया।"
        });
      } else {
        console.warn("APK Web Download error:", err);
        updateState({
          status: "download_failed",
          errorMessage: err.message || "APK डाउनलोड करने में त्रुटि हुई। कृपया पुनः प्रयास करें।",
          errorDiagnosticReason: "WEB_STREAM_ERROR"
        });
      }
    } finally {
      isDownloadInProgress = false;
      webDownloadAbortController = null;
    }
  },

  /**
   * Cancel in-progress download safely
   */
  cancelDownload: () => {
    if (webDownloadAbortController) {
      webDownloadAbortController.abort();
    }
    const win = window as any;
    if (win.Capacitor?.Plugins?.AppUpdatePlugin?.cancelDownload) {
      try {
        win.Capacitor.Plugins.AppUpdatePlugin.cancelDownload();
      } catch {}
    }
    isDownloadInProgress = false;
    updateState({
      status: "idle",
      downloadProgress: 0,
      downloadSpeed: "0 KB/s",
      errorMessage: null,
      errorDiagnosticReason: null
    });
  },

  /**
   * Launch Android PackageInstaller with FileProvider or Web File trigger
   */
  installApk: async () => {
    updateState({
      status: "installing",
      errorMessage: null,
      errorDiagnosticReason: null,
      installationAttempted: true
    });

    const win = window as any;

    // -------------------------------------------------------------
    // NATIVE ANDROID INSTALLATION
    // -------------------------------------------------------------
    if (win.Capacitor?.isNativePlatform && win.Capacitor.isNativePlatform()) {
      try {
        const appUpdatePlugin = win.Capacitor.Plugins?.AppUpdatePlugin;

        if (appUpdatePlugin) {
          // 1. Check & Request Unknown App Sources Permission
          const permRes = await appUpdatePlugin.canRequestPackageInstalls();
          if (permRes && permRes.canInstall === false) {
            updateState({
              status: "install_failed",
              errorMessage: "कृपया ऐप अपडेट करने के लिए 'Allow from this source' (Unknown Apps) की अनुमति चालू करें।",
              errorDiagnosticReason: "PERMISSION_UNKNOWN_SOURCES_REQUIRED"
            });
            await appUpdatePlugin.openInstallPermissionSettings();
            return;
          }

          // 2. Launch PackageInstaller
          const installRes = await appUpdatePlugin.installApk({
            filePath: state.nativeApkPath || ""
          });

          if (installRes?.permissionRequired) {
            updateState({
              status: "install_failed",
              errorMessage: "अज्ञात स्रोत अनुमति आवश्यक है।",
              errorDiagnosticReason: "PERMISSION_UNKNOWN_SOURCES_REQUIRED"
            });
            await appUpdatePlugin.openInstallPermissionSettings();
            return;
          }

          if (installRes?.success) {
            updateState({
              status: "installing",
              errorMessage: null
            });
            return;
          }
        }
      } catch (err: any) {
        console.warn("Native APK install error:", err);
        const errMsg = err?.message || "Downloaded APK इस app के compatible update के रूप में verify नहीं हुआ।";
        const reason = err?.errorReason || "INSTALLATION_INTENT_ERROR";
        updateState({
          status: "install_failed",
          errorMessage: errMsg,
          errorDiagnosticReason: reason
        });
        return;
      }
    }

    // -------------------------------------------------------------
    // WEB BROWSER FALLBACK
    // -------------------------------------------------------------
    try {
      const url = state.downloadBlobUrl || state.remoteVersion?.apkUrl || state.remoteVersion?.apkDownloadUrl;
      if (url) {
        const link = document.createElement("a");
        link.href = url;
        link.download = state.downloadFileName || "sk-mission-board-v2.0.0.apk";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => {
          updateState({ status: "ready" });
        }, 1500);
      }
    } catch (e: any) {
      updateState({
        status: "install_failed",
        errorMessage: "APK फ़ाइल खोलने में असमर्थ: " + (e.message || ""),
        errorDiagnosticReason: "BROWSER_TRIGGER_ERROR"
      });
    }
  },

  /**
   * Lifecycle listeners: detect app launch, foreground resume, and check version
   */
  initLifecycle: () => {
    // 1. Initial check on app startup
    const startupTimeout = setTimeout(() => {
      UpdateService.checkForUpdate(false);
    }, 1200);

    // 2. Foreground resume listener (when user returns from package installer)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        const installed = await getActualInstalledVersion();
        const remoteCode = Number(state.remoteVersion?.versionCode || 200);

        if (installed.versionCode >= remoteCode) {
          // Successfully upgraded!
          updateState({
            installedVersionCode: installed.versionCode,
            installedVersionName: installed.versionName,
            status: "up_to_date",
            hasUpdate: false,
            isModalOpen: false,
            installationAttempted: false,
            errorMessage: null,
            errorDiagnosticReason: null
          });
        } else if (state.status === "installing" && state.installationAttempted) {
          // User returned to app without completing installation
          updateState({
            status: "install_failed",
            errorMessage: "इन्स्टॉलेशन प्रक्रिया पूरी नहीं हुई (Cancelled or Incompatible)। कृपया दोबारा 'Install Update' दबाएं।",
            errorDiagnosticReason: "INSTALLATION_NOT_COMPLETED"
          });
        } else {
          UpdateService.checkForUpdate(false);
        }
      }
    };

    const handleFocus = () => {
      handleVisibilityChange();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    // 3. Capacitor App State Change
    const win = window as any;
    let removeCapListener: any = null;
    if (win.Capacitor?.Plugins?.App?.addListener) {
      win.Capacitor.Plugins.App.addListener("appStateChange", (stateObj: any) => {
        if (stateObj?.isActive) {
          handleVisibilityChange();
        }
      }).then((handle: any) => {
        removeCapListener = handle;
      }).catch(console.warn);
    }

    return () => {
      clearTimeout(startupTimeout);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      if (removeCapListener?.remove) {
        removeCapListener.remove();
      }
    };
  }
};
