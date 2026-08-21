import React from "react";
import { UploadProgressState } from "../services/uploadService";
import { CheckCircle2, AlertCircle, Loader2, ArrowUpCircle, FileText, Music, Video, Image as ImageIcon } from "lucide-react";

interface UploadProgressCardProps {
  progress: UploadProgressState | null;
  type?: "pdf" | "music" | "theme" | "video" | "general";
  onClear?: () => void;
}

export const UploadProgressCard: React.FC<UploadProgressCardProps> = ({
  progress,
  type = "general",
  onClear
}) => {
  if (!progress || progress.status === "idle") return null;

  const isUploading = progress.status === "uploading" || progress.status === "processing";
  const isCompleted = progress.status === "completed";
  const isError = progress.status === "error";

  const getThemeColor = () => {
    switch (type) {
      case "pdf": return "pink";
      case "music": return "emerald";
      case "theme": return "cyan";
      case "video": return "amber";
      default: return "cyan";
    }
  };

  const color = getThemeColor();

  const getIcon = () => {
    switch (type) {
      case "pdf": return <FileText className="w-4 h-4 text-pink-400" />;
      case "music": return <Music className="w-4 h-4 text-emerald-400" />;
      case "theme": return <ImageIcon className="w-4 h-4 text-cyan-400" />;
      case "video": return <Video className="w-4 h-4 text-amber-400" />;
      default: return <ArrowUpCircle className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className={`p-3.5 rounded-2xl border transition-all duration-300 ${
      isCompleted 
        ? "bg-emerald-950/40 border-emerald-500/40 shadow-lg shadow-emerald-500/10" 
        : isError 
          ? "bg-red-950/40 border-red-500/40" 
          : "bg-slate-900/90 border-slate-700 shadow-md"
    }`}>
      {/* Header with Title & Percentage */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 shrink-0">
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : isError ? (
              <AlertCircle className="w-4 h-4 text-red-400" />
            ) : (
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            )}
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
              {getIcon()}
              <span className="truncate">{progress.fileName}</span>
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              {progress.loadedMb} / {progress.totalMb} MB • {progress.speedText}
            </p>
          </div>
        </div>

        {/* Live Percentage Badge */}
        <div className="shrink-0 flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-xl text-xs font-black font-mono tracking-wider shadow-inner ${
            isCompleted 
              ? "bg-emerald-500 text-slate-950" 
              : isError 
                ? "bg-red-500 text-white" 
                : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white animate-pulse"
          }`}>
            {progress.percent}%
          </span>
        </div>
      </div>

      {/* Real-Time Smooth Progress Bar */}
      <div className="relative w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800/80 mb-2">
        <div
          className={`h-full transition-all duration-150 rounded-full ${
            isCompleted
              ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]"
              : isError
                ? "bg-red-500"
                : color === "pink"
                  ? "bg-gradient-to-r from-pink-500 to-rose-400 shadow-[0_0_10px_rgba(244,114,182,0.8)]"
                  : color === "emerald"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]"
                    : color === "amber"
                      ? "bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_10px_rgba(245,158,11,0.8)]"
                      : "bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
          }`}
          style={{ width: `${Math.max(progress.percent, 3)}%` }}
        />
      </div>

      {/* Footer Status Message & Close */}
      <div className="flex items-center justify-between text-[11px]">
        <span className={`${
          isCompleted ? "text-emerald-300 font-semibold" : isError ? "text-red-400" : "text-cyan-300"
        }`}>
          {progress.statusText}
        </span>

        {isCompleted && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
          >
            हटाएं (Dismiss)
          </button>
        )}
      </div>
    </div>
  );
};
