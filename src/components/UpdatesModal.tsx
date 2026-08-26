import React, { useState, useEffect } from "react";
import { AppVersionInfo } from "../types";
import { UpdateService, UpdateState } from "../services/updateService";
import { StoreService } from "../services/storeService";
import { 
  X, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Smartphone, 
  ShieldCheck, 
  Sparkles,
  ExternalLink,
  AlertTriangle,
  PackageCheck,
  RotateCcw,
  Settings,
  Info
} from "lucide-react";

interface UpdatesModalProps {
  versionInfo: AppVersionInfo;
  onClose: () => void;
}

export const UpdatesModal: React.FC<UpdatesModalProps> = ({ versionInfo, onClose }) => {
  const [updateState, setUpdateState] = useState<UpdateState>(UpdateService.getState());

  useEffect(() => {
    const unsubscribe = UpdateService.subscribe((s) => {
      setUpdateState(s);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const remote = updateState.remoteVersion || versionInfo;
    if (remote?.versionName) {
      StoreService.markWhatsNewAsSeen(remote.versionName);
    }
  }, [updateState.remoteVersion, versionInfo]);

  const handleManualCheck = async () => {
    await UpdateService.checkForUpdate(true);
  };

  const handleStartDownload = () => {
    UpdateService.startDownload();
  };

  const handleInstall = () => {
    UpdateService.installApk();
  };

  const handleLater = () => {
    UpdateService.dismissForSession();
    onClose();
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const remote = updateState.remoteVersion || versionInfo;
  const isForce = updateState.isForceUpdate || remote.forceUpdate;
  const hasNewUpdate = updateState.hasUpdate || (Number(remote.versionCode) > Number(updateState.installedVersionCode));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl overflow-y-auto">
      <div 
        id="in-app-update-dialog"
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all"
      >
        {/* Header with Dynamic Build # */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center gap-3.5">
            <div className={`p-3 rounded-2xl ${hasNewUpdate ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"}`}>
              <Smartphone className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-0.5 rounded-full text-xs sm:text-sm font-mono font-extrabold uppercase ${hasNewUpdate ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"}`}>
                  {hasNewUpdate ? "NEW UPDATE" : "INSTALLED"}
                </span>
                <span id="current-build-header-badge" className="text-xs sm:text-sm text-slate-400 font-mono">
                  Current Build #{updateState.installedVersionCode}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide mt-1">
                {hasNewUpdate ? "New Update Available" : "App Version & Updates"}
              </h2>
            </div>
          </div>

          {!isForce && (
            <button
              id="update-modal-close-btn"
              onClick={handleLater}
              className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">

          {/* ========================================================================= */}
          {/* CASE 1: NEW UPDATE IS AVAILABLE */}
          {/* ========================================================================= */}
          {hasNewUpdate ? (
            <div className="space-y-5">
              {/* Target vs Installed Highlight Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-cyan-500/10 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                      Target Release Version
                    </span>
                    <h3 className="text-3xl font-black text-amber-300 font-mono mt-0.5">
                      v{remote.versionName} <span className="text-sm font-normal text-slate-400">(code {remote.versionCode})</span>
                    </h3>
                  </div>
                  <span className="text-xs font-mono px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300">
                    Installed: v{updateState.installedVersionName} ({updateState.installedVersionCode})
                  </span>
                </div>

                {/* Server Update Message */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-sm leading-relaxed">
                  <p className="font-semibold text-amber-200 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Update Message:
                  </p>
                  <p className="text-slate-300">
                    {remote.updateMessage || "A new version of SK MISSION BOARD is ready for download with updated 2026 study notes, VVI practice questions, and performance improvements."}
                  </p>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* STATE: DOWNLOADING */}
              {/* ---------------------------------------------------- */}
              {updateState.status === "downloading" && (
                <div className="p-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span className="text-cyan-300 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                      Downloading update... {updateState.downloadProgress}%
                    </span>
                    <span className="text-slate-400 font-mono text-xs">
                      {formatBytes(updateState.downloadedBytes)} / {formatBytes(updateState.totalBytes)} ({updateState.downloadSpeed})
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-cyan-500/30 p-0.5">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 transition-all duration-300 shadow-[0_0_12px_rgba(6,182,212,0.6)]"
                      style={{ width: `${Math.max(5, updateState.downloadProgress)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[11px] text-slate-400">
                      Downloading in background. You can continue using the app.
                    </p>
                    <button
                      onClick={() => UpdateService.cancelDownload()}
                      className="text-xs text-red-400 hover:text-red-300 font-semibold underline cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* STATE: READY TO INSTALL (Verified) */}
              {/* ---------------------------------------------------- */}
              {updateState.status === "ready" && (
                <div className="p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                      <PackageCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-emerald-300">
                        Update Ready & Verified
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        APK package (v2.0.0, Build #200) has been downloaded and cryptographically verified. Click 'Install Update' to proceed.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* STATE: INSTALLING */}
              {/* ---------------------------------------------------- */}
              {updateState.status === "installing" && (
                <div className="p-5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 animate-spin">
                      <RefreshCw className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-cyan-300">
                        Launching Android Package Installer...
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        System installer is opening. Please tap <strong>'Update'</strong> or <strong>'Install'</strong> on the screen prompt.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* ERROR & DIAGNOSTIC REASON DISPLAY */}
              {/* ---------------------------------------------------- */}
              {(updateState.errorMessage || updateState.status === "download_failed" || updateState.status === "install_failed") && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs sm:text-sm flex flex-col gap-2">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-red-200">
                        {updateState.status === "install_failed" ? "Installation Notice" : "Download Notice"}
                      </p>
                      <p className="text-red-200/90 mt-0.5">
                        {updateState.errorMessage || "The downloaded APK could not be verified as a compatible update for this device."}
                      </p>
                    </div>
                  </div>

                  {updateState.errorDiagnosticReason && (
                    <div className="mt-1 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-red-500/20 text-[11px] font-mono text-red-300 flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-red-400" />
                      <span>Diagnostic Code: {updateState.errorDiagnosticReason}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Release Notes & What's New */}
              {((remote.whatsNew && remote.whatsNew.length > 0) || (remote.releaseNotes && remote.releaseNotes.length > 0)) && (
                <div>
                  <h4 className="text-sm font-bold text-white mb-2.5 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    What's New in v{remote.versionName} (Build #{remote.versionCode})
                  </h4>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5 text-xs sm:text-sm text-slate-300">
                    {remote.whatsNew && remote.whatsNew.map((item, idx) => {
                      if (typeof item === "string") {
                        return (
                          <div key={`wn-${idx}`} className="flex items-start gap-2">
                            <span className="text-cyan-400 font-mono font-bold">•</span>
                            <span>{item}</span>
                          </div>
                        );
                      }
                      const category = item.category || "new";
                      return (
                        <div key={`wn-${idx}`} className="flex items-start gap-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 mt-0.5 ${
                            category === "feature" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" :
                            category === "fix" ? "bg-red-500/20 text-red-300 border border-red-500/30" :
                            "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          }`}>
                            {category}
                          </span>
                          <div>
                            {item.title && <span className="font-bold text-slate-100 mr-1.5">{item.title}:</span>}
                            <span>{item.description}</span>
                          </div>
                        </div>
                      );
                    })}

                    {(!remote.whatsNew || remote.whatsNew.length === 0) && remote.releaseNotes && remote.releaseNotes.map((note, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-cyan-400 font-mono font-bold">•</span>
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-800">
                {!isForce && updateState.status !== "downloading" && (
                  <button
                    id="update-later-btn"
                    onClick={handleLater}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-sm transition-all cursor-pointer"
                  >
                    Later
                  </button>
                )}

                {updateState.status === "ready" ? (
                  <button
                    id="install-update-btn"
                    onClick={handleInstall}
                    className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black text-sm sm:text-base shadow-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  >
                    <PackageCheck className="w-5 h-5" />
                    <span>Install Update</span>
                  </button>
                ) : updateState.status === "install_failed" ? (
                  <button
                    id="retry-install-btn"
                    onClick={handleInstall}
                    className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 font-black text-sm sm:text-base shadow-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span>Retry Installation</span>
                  </button>
                ) : updateState.status === "download_failed" ? (
                  <button
                    id="retry-download-btn"
                    onClick={handleStartDownload}
                    className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-cyan-400 text-slate-950 font-black text-sm sm:text-base shadow-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span>Retry Download</span>
                  </button>
                ) : (
                  <button
                    id="update-now-btn"
                    onClick={handleStartDownload}
                    disabled={updateState.status === "downloading"}
                    className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-cyan-400 to-emerald-400 text-slate-950 font-black text-sm sm:text-base shadow-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Download className={`w-5 h-5 ${updateState.status === "downloading" ? "animate-bounce" : ""}`} />
                    <span>
                      {updateState.status === "downloading" ? "Downloading..." : "Update Now"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* CASE 2: APP IS ALREADY UP TO DATE (OR MANUAL CHECK) */
            /* ========================================================================= */
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Installed App Version</p>
                  <h3 className="text-3xl font-black text-emerald-400 font-mono mt-1">
                    v{updateState.installedVersionName} <span className="text-sm font-normal text-slate-400">(code {updateState.installedVersionCode})</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1.5 flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Release Date: {remote.releaseDate || "2026-08-23"}
                  </p>
                </div>

                <button
                  id="check-updates-manual-btn"
                  onClick={handleManualCheck}
                  disabled={updateState.status === "checking"}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs sm:text-sm transition-all shrink-0 shadow-md cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${updateState.status === "checking" ? "animate-spin text-cyan-400" : ""}`} />
                  <span>{updateState.status === "checking" ? "Checking Server..." : "Check for Updates"}</span>
                </button>
              </div>

              {updateState.status === "up_to_date" && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-medium flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>You are using the latest version of the application (v{updateState.installedVersionName}, Build #{updateState.installedVersionCode}).</span>
                </div>
              )}

              {/* Release Notes */}
              <div>
                <h4 className="text-sm font-bold text-white mb-2.5 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Current Features & Architecture
                </h4>
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs sm:text-sm text-slate-300">
                  {(remote.releaseNotes || []).map((note, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-cyan-400 font-mono font-bold">•</span>
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct APK Link fallback */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  Direct Signed Release (.APK)
                </span>

                <a
                  href={remote.apkDownloadUrl || remote.apkUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Direct Download APK</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
