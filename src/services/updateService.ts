import { AppVersionInfo } from "../types";
import { CURRENT_APP_VERSION } from "../data/bsebClass10Data";
import { StoreService } from "./storeService";

export type UpdateStatus = 
  | "idle" 
  | "checking" 
  | "available" 
  | "downloading" 
  | "download_paused"
  | "ready" 
  | "installing" 
  | "error"
  | "up_to_date";

export interface UpdateState {
  status: UpdateStatus;
  isModalOpen: boolean;
  installedVersionCode: number;
  installedVersionName: string;
  remoteVersion: AppVersionInfo | null;
  hasUpdate: boolean;
  isForceUpdate: boolean;
  downloadProgress: number; // 0 to 100
  downloadedBytes: number;
  totalBytes: number;
  downloadSpeed: string; // e.g. "1.2 MB/s"
  errorMessage: string | null;
  downloadBlobUrl: string | null;
  downloadFileName: string;
  lastCheckedTime: number;
}

type UpdateListener = (state: UpdateState) => void;

// In-memory state
let state: UpdateState = {
  status: "idle",
  isModalOpen: false,
  installedVersionCode: CURRENT_APP_VERSION.versionCode,
  installedVersionName: CURRENT_APP_VERSION.versionName,
  remoteVersion: null,
  hasUpdate: false,
  isForceUpdate: false,
  downloadProgress: 0,
  downloadedBytes: 0,
  totalBytes: 0,
  downloadSpeed: "0 KB/s",
  errorMessage: null,
  downloadBlobUrl: null,
  downloadFileName: "sk-mission-board-update.apk",
  lastCheckedTime: 0
};

const listeners = new Set<UpdateListener>();
let sessionDismissed = false;
let isCheckInProgress = false;
let isDownloadInProgress = false;
let downloadAbortController: AbortController | null = null;
let lastAutoCheckTime = 0;
const MIN_AUTO_CHECK_INTERVAL_MS = 60 * 1000; // 60 seconds minimum interval between background auto-checks

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

// Get installed version from Android native runtime or fallback
async function getLocalInstalledVersion(): Promise<{ versionCode: number; versionName: string; isNative: boolean }> {
  try {
    // Check if Capacitor native bridge plugin is available
    const win = window as any;
    if (win.Capacitor?.isNativePlatform && win.Capacitor.isNativePlatform()) {
      if (win.Capacitor.Plugins?.AppUpdatePlugin?.getInstalledVersion) {
        const res = await win.Capacitor.Plugins.AppUpdatePlugin.getInstalledVersion();
        if (res && res.versionCode) {
          const vCode = Number(res.versionCode);
          const vName = res.versionName || CURRENT_APP_VERSION.versionName;
          state.installedVersionCode = vCode;
          state.installedVersionName = vName;
          return { versionCode: vCode, versionName: vName, isNative: true };
        }
      }
    }
  } catch (e) {
    console.warn("Could not read native Android package info:", e);
  }

  return {
    versionCode: CURRENT_APP_VERSION.versionCode,
    versionName: CURRENT_APP_VERSION.versionName,
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
    updateState({ isModalOpen: false });
  },

  resetDismissForSession: () => {
    sessionDismissed = false;
  },

  // Primary update check logic
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
      lastCheckedTime: now
    });

    try {
      // 1. Get current installed version
      const installed = await getLocalInstalledVersion();
      updateState({
        installedVersionCode: installed.versionCode,
        installedVersionName: installed.versionName
      });

      // 2. Fetch remote update information
      let remoteInfo: AppVersionInfo | null = null;

      // Source A: StoreService (Firestore synchronized real-time)
      const firestoreVer = StoreService.getVersionInfo();
      if (firestoreVer && typeof firestoreVer.versionCode === "number") {
        remoteInfo = { ...firestoreVer };
      }

      // Source B: Dedicated API endpoint fallback
      try {
        const res = await fetch("/api/app-update", { cache: "no-store" });
        if (res.ok) {
          const apiData = await res.json();
          if (apiData && typeof apiData.versionCode === "number") {
            remoteInfo = {
              versionName: apiData.versionName || remoteInfo?.versionName || "1.0.0",
              versionCode: Number(apiData.versionCode),
              releaseDate: apiData.releaseDate || remoteInfo?.releaseDate || new Date().toISOString().split("T")[0],
              apkDownloadUrl: apiData.apkUrl || apiData.apkDownloadUrl || remoteInfo?.apkDownloadUrl || "",
              apkUrl: apiData.apkUrl || apiData.apkDownloadUrl || remoteInfo?.apkUrl || "",
              updateMessage: apiData.updateMessage || remoteInfo?.updateMessage || "New version available with improvements.",
              forceUpdate: Boolean(apiData.forceUpdate ?? remoteInfo?.forceUpdate),
              releaseNotes: Array.isArray(apiData.releaseNotes) ? apiData.releaseNotes : remoteInfo?.releaseNotes || [],
              isMandatory: Boolean(apiData.forceUpdate ?? remoteInfo?.isMandatory),
              latestVersionCode: Number(apiData.versionCode)
            };
          }
        }
      } catch (err) {
        // Safe continue if local API is unavailable
      }

      // Source C: Fallback to version.json if remoteInfo is still empty
      if (!remoteInfo) {
        try {
          const jsonRes = await fetch("/version.json", { cache: "no-store" });
          if (jsonRes.ok) {
            const jsonData = await jsonRes.json();
            if (jsonData && typeof jsonData.versionCode === "number") {
              remoteInfo = {
                versionName: jsonData.versionName || "1.0.0",
                versionCode: Number(jsonData.versionCode),
                releaseDate: jsonData.releaseDate || new Date().toISOString().split("T")[0],
                apkDownloadUrl: jsonData.apkUrl || jsonData.apkDownloadUrl || "",
                apkUrl: jsonData.apkUrl || jsonData.apkDownloadUrl || "",
                updateMessage: jsonData.updateMessage || "New version available with improvements.",
                forceUpdate: Boolean(jsonData.forceUpdate),
                releaseNotes: Array.isArray(jsonData.releaseNotes) ? jsonData.releaseNotes : [],
                isMandatory: Boolean(jsonData.forceUpdate),
                latestVersionCode: Number(jsonData.versionCode)
              };
            }
          }
        } catch {
          // Ignore fallback error
        }
      }

      // Default fallback to CURRENT_APP_VERSION
      if (!remoteInfo) {
        remoteInfo = CURRENT_APP_VERSION;
      }

      // 3. Version comparison (NUMERICAL ONLY)
      const remoteCode = Number(remoteInfo.versionCode || remoteInfo.latestVersionCode || 0);
      const installedCode = Number(installed.versionCode);
      const isNewer = remoteCode > installedCode;
      const isForce = Boolean(remoteInfo.forceUpdate || remoteInfo.isMandatory);

      updateState({
        remoteVersion: remoteInfo,
        hasUpdate: isNewer,
        isForceUpdate: isForce,
        status: isNewer ? "available" : "up_to_date"
      });

      // Auto-open update modal if a newer version is available and not dismissed this session
      if (isNewer) {
        if (isManual || isForce || !sessionDismissed) {
          updateState({ isModalOpen: true });
        }
      } else if (isManual) {
        // If manual check and already up to date, keep dialog or inform user
        updateState({ isModalOpen: true });
      }

      return { hasUpdate: isNewer, remoteVersion: remoteInfo };
    } catch (err: any) {
      console.warn("Update check failed safely:", err);
      updateState({
        status: "error",
        errorMessage: "अपडेट की जांच करने में असमर्थ। इंटरनेट कनेक्शन जांचें।"
      });
      return { hasUpdate: false, remoteVersion: null };
    } finally {
      isCheckInProgress = false;
    }
  },

  // Start Downloading APK with real stream progress tracking
  startDownload: async (targetApkUrl?: string) => {
    if (isDownloadInProgress) return;

    const url = targetApkUrl || state.remoteVersion?.apkUrl || state.remoteVersion?.apkDownloadUrl;
    if (!url || typeof url !== "string" || !url.trim()) {
      updateState({
        status: "error",
        errorMessage: "APK डाउनलोड लिंक उपलब्ध नहीं है।"
      });
      return;
    }

    const cleanUrl = url.trim();

    // Enforce HTTPS safety
    if (!cleanUrl.startsWith("https://") && !cleanUrl.startsWith("http://localhost")) {
      updateState({
        status: "error",
        errorMessage: "सुरक्षा कारण से केवल HTTPS डाउनलोड लिंक स्वीकार्य हैं।"
      });
      return;
    }

    isDownloadInProgress = true;
    downloadAbortController = new AbortController();

    const fileName = `sk-mission-board-v${state.remoteVersion?.versionName || "update"}.apk`;

    updateState({
      status: "downloading",
      downloadProgress: 0,
      downloadedBytes: 0,
      totalBytes: 0,
      downloadSpeed: "Connecting...",
      errorMessage: null,
      downloadFileName: fileName
    });

    let startTime = Date.now();
    let lastLoaded = 0;

    try {
      const response = await fetch(cleanUrl, {
        signal: downloadAbortController.signal,
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

          // Calculate progress percentage and download speed
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

      // Concatenate chunks safely
      const blob = new Blob(chunks as BlobPart[], {
        type: "application/vnd.android.package-archive"
      });

      // Revoke previous blob URL if any
      if (state.downloadBlobUrl) {
        URL.revokeObjectURL(state.downloadBlobUrl);
      }

      const blobUrl = URL.createObjectURL(blob);

      updateState({
        status: "ready",
        downloadProgress: 100,
        downloadBlobUrl: blobUrl,
        downloadSpeed: "Complete",
        errorMessage: null
      });

    } catch (err: any) {
      if (err.name === "AbortError") {
        updateState({
          status: "idle",
          downloadProgress: 0,
          errorMessage: "डाउनलोड रद्द किया गया।"
        });
      } else {
        console.warn("APK Download error:", err);
        updateState({
          status: "error",
          errorMessage: err.message || "APK डाउनलोड करने में त्रुटि हुई। कृपया पुनः प्रयास करें।"
        });
      }
    } finally {
      isDownloadInProgress = false;
      downloadAbortController = null;
    }
  },

  // Cancel in-progress download safely
  cancelDownload: () => {
    if (downloadAbortController) {
      downloadAbortController.abort();
    }
    isDownloadInProgress = false;
    updateState({
      status: "idle",
      downloadProgress: 0,
      downloadSpeed: "0 KB/s"
    });
  },

  // Launch official Android installer flow or trigger download on Web
  installApk: async () => {
    updateState({ status: "installing", errorMessage: null });

    const win = window as any;

    // Check if running on Android via Capacitor
    if (win.Capacitor?.isNativePlatform && win.Capacitor.isNativePlatform()) {
      try {
        const appUpdatePlugin = win.Capacitor.Plugins?.AppUpdatePlugin;

        if (appUpdatePlugin) {
          // 1. Check if permission to install unknown apps is granted
          const permRes = await appUpdatePlugin.canRequestPackageInstalls();
          if (permRes && permRes.canInstall === false) {
            updateState({
              status: "error",
              errorMessage: "कृपया 'Unknown Apps' इंस्टॉल करने की अनुमति दें।"
            });
            await appUpdatePlugin.openInstallPermissionSettings();
            return;
          }

          // 2. Trigger native APK installation
          // Note: In native Android, if APK is downloaded as local file
          const apkUrl = state.remoteVersion?.apkUrl || state.remoteVersion?.apkDownloadUrl;
          if (appUpdatePlugin.installApk) {
            const installRes = await appUpdatePlugin.installApk({
              filePath: state.downloadFileName,
              url: apkUrl
            });
            if (installRes?.permissionRequired) {
              await appUpdatePlugin.openInstallPermissionSettings();
              return;
            }
          }
        }
      } catch (err: any) {
        console.warn("Native APK install attempt notice:", err);
      }
    }

    // Standard Browser / Web View APK download trigger
    try {
      const url = state.downloadBlobUrl || state.remoteVersion?.apkUrl || state.remoteVersion?.apkDownloadUrl;
      if (url) {
        const link = document.createElement("a");
        link.href = url;
        link.download = state.downloadFileName || "sk-mission-board.apk";
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
        status: "error",
        errorMessage: "APK खोलने में असमर्थ: " + (e.message || "")
      });
    }
  },

  // Lifecycle listeners for start and foreground resume
  initLifecycle: () => {
    // Initial check on app startup (debounced 1.5s after load)
    const startupTimeout = setTimeout(() => {
      UpdateService.checkForUpdate(false);
    }, 1500);

    // Foreground resume listener (visibility change)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        UpdateService.checkForUpdate(false);
      }
    };

    // Window focus listener
    const handleFocus = () => {
      UpdateService.checkForUpdate(false);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    // Capacitor App state change listener if available
    const win = window as any;
    let removeCapListener: any = null;
    if (win.Capacitor?.Plugins?.App?.addListener) {
      win.Capacitor.Plugins.App.addListener("appStateChange", (stateObj: any) => {
        if (stateObj?.isActive) {
          UpdateService.checkForUpdate(false);
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
