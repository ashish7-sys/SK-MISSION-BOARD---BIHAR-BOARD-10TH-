import React, { useState, useEffect } from "react";
import { DownloadedItem, PDFMaterial, MusicTrack } from "../types";
import { DownloadService } from "../services/downloadService";
import { audioPlayer } from "../services/audioPlayer";
import { 
  Download, 
  FileText, 
  Music, 
  Trash2, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  BookOpen, 
  Play, 
  Clock, 
  HardDrive,
  FolderDown,
  RefreshCw,
  XCircle,
  AlertCircle,
  Pause,
  Loader2,
  Check
} from "lucide-react";

interface DownloadSectionProps {
  onOpenPdf: (pdf: PDFMaterial) => void;
  onNavigateToSubjects: () => void;
  onNavigateToSpecial: () => void;
}

export const DownloadSection: React.FC<DownloadSectionProps> = ({
  onOpenPdf,
  onNavigateToSubjects,
  onNavigateToSpecial
}) => {
  const [downloads, setDownloads] = useState<DownloadedItem[]>(DownloadService.getDownloads());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "downloading" | "failed">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "pdf" | "music">("all");

  useEffect(() => {
    setDownloads(DownloadService.getDownloads());
    const unsubscribe = DownloadService.subscribe(() => {
      setDownloads(DownloadService.getDownloads());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const filteredDownloads = downloads.filter((item) => {
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesType = typeFilter === "all" || item.fileType === typeFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      (item.subjectName && item.subjectName.toLowerCase().includes(q)) ||
      (item.chapterTitle && item.chapterTitle.toLowerCase().includes(q));
    return matchesStatus && matchesType && matchesSearch;
  });

  const handleOpenFile = async (item: DownloadedItem) => {
    if (item.status !== "completed") return;

    if (item.fileType === "pdf") {
      // Check if genuine offline blob URL exists
      const offlineBlobUrl = await DownloadService.getOfflineBlobUrl(item.id);

      const syntheticPdf: PDFMaterial = {
        id: item.id,
        title: item.title,
        fileUrl: offlineBlobUrl || item.fileUrl,
        chapterTitle: item.chapterTitle || "Downloaded Notes",
        subjectId: item.subjectId || "science",
        chapterId: "dl-chap",
        description: "Downloaded file from SK MISSION BOARD (Offline Storage)",
        uploadDate: item.downloadedAt,
        isPublished: true,
        orderIndex: 0
      };
      onOpenPdf(syntheticPdf);
    } else if (item.fileType === "music") {
      const offlineBlobUrl = await DownloadService.getOfflineBlobUrl(item.id);
      const syntheticTrack: MusicTrack = {
        id: item.id,
        title: item.title,
        audioUrl: offlineBlobUrl || item.fileUrl,
        durationText: "Offline Audio",
        isPublished: true,
        orderIndex: 0
      };
      audioPlayer.togglePlay(syntheticTrack);
    } else {
      window.open(item.fileUrl, "_blank");
    }
  };

  const handleRetry = (item: DownloadedItem) => {
    DownloadService.retryDownload(item.id);
  };

  const handleCancel = (item: DownloadedItem) => {
    DownloadService.cancelDownload(item.id);
  };

  const handleRemove = (id: string) => {
    DownloadService.removeDownload(id);
  };

  const handleClearAll = () => {
    if (window.confirm("क्या आप डाउनलोड सूची से सभी फाइल्स के रिकॉर्ड हटाना चाहते हैं?")) {
      DownloadService.clearAllDownloads();
    }
  };

  const completedCount = downloads.filter((d) => d.status === "completed").length;
  const activeCount = downloads.filter((d) => d.status === "downloading" || d.status === "queued").length;
  const failedCount = downloads.filter((d) => d.status === "failed").length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="text-center my-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-mono font-black uppercase tracking-widest mb-3 shadow-sm backdrop-blur-md">
          <FolderDown className="w-4 h-4 text-emerald-400" />
          <span>DOWNLOAD MANAGER & OFFLINE VAULT</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-200 to-teal-400 tracking-wider uppercase drop-shadow-[0_2px_15px_rgba(16,185,129,0.4)]">
          DOWNLOADS
        </h1>

        <p className="text-sm sm:text-base font-semibold text-slate-300 mt-2 max-w-2xl mx-auto drop-shadow">
          डाउनलोड की गई PDF सामग्री एवं अध्ययन संगीत का सुरक्षित ऑफलाइन संग्रह
        </p>
      </div>

      {/* Overview Metric Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 backdrop-blur-md">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Files</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-white">{downloads.length}</span>
            <HardDrive className="w-5 h-5 text-slate-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 backdrop-blur-md">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Offline Ready</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-emerald-300">{completedCount}</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 backdrop-blur-md">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">Downloading</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-cyan-300">{activeCount}</span>
            <Loader2 className={`w-5 h-5 text-cyan-400 ${activeCount > 0 ? "animate-spin" : ""}`} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/30 backdrop-blur-md">
          <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">Failed / Retry</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-red-300">{failedCount}</span>
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Status Filters */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-950/60 backdrop-blur-xl border border-white/15 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="डाउनलोड की गई फाइल्स खोजें (Search Downloads)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === "all"
                  ? "bg-emerald-500 text-slate-950 shadow-md font-black"
                  : "bg-slate-900/80 text-slate-300 hover:bg-slate-800"
              }`}
            >
              All ({downloads.length})
            </button>
            
            {activeCount > 0 && (
              <button
                onClick={() => setStatusFilter("downloading")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === "downloading"
                    ? "bg-cyan-500 text-slate-950 shadow-md font-black"
                    : "bg-slate-900/80 text-cyan-300 hover:bg-slate-800"
                }`}
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>In Progress ({activeCount})</span>
              </button>
            )}

            <button
              onClick={() => setStatusFilter("completed")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === "completed"
                  ? "bg-emerald-500 text-slate-950 shadow-md font-black"
                  : "bg-slate-900/80 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Completed ({completedCount})</span>
            </button>

            {failedCount > 0 && (
              <button
                onClick={() => setStatusFilter("failed")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === "failed"
                    ? "bg-red-500 text-white shadow-md font-black"
                    : "bg-slate-900/80 text-red-400 hover:bg-slate-800"
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Failed ({failedCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-Filter: PDF vs Music */}
        <div className="flex items-center justify-between border-t border-slate-900 pt-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Type:</span>
            <button
              onClick={() => setTypeFilter("all")}
              className={`px-2.5 py-1 rounded-lg ${typeFilter === "all" ? "text-emerald-400 font-bold bg-emerald-500/10" : "text-slate-400 hover:text-white"}`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter("pdf")}
              className={`px-2.5 py-1 rounded-lg ${typeFilter === "pdf" ? "text-pink-400 font-bold bg-pink-500/10" : "text-slate-400 hover:text-white"}`}
            >
              PDFs
            </button>
            <button
              onClick={() => setTypeFilter("music")}
              className={`px-2.5 py-1 rounded-lg ${typeFilter === "music" ? "text-purple-400 font-bold bg-purple-500/10" : "text-slate-400 hover:text-white"}`}
            >
              Music
            </button>
          </div>

          {downloads.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-red-400/80 hover:text-red-400 font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Download Items List */}
      <div className="space-y-4">
        {filteredDownloads.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-950/40 border border-slate-800/80 backdrop-blur-md space-y-4">
            <FolderDown className="w-14 h-14 mx-auto text-slate-600 mb-2" />
            <h3 className="text-xl font-bold text-slate-200">
              {downloads.length === 0 ? "कोई डाउनलोड फाइल नहीं है" : "खोज के अनुसार कोई फाइल नहीं मिली"}
            </h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              विषय अध्यायों या PDF नोट्स सेक्शन में जाकर "SAVE" बटन दबाएं ताकि नोट्स आपकी डिवाइस पर ऑफलाइन उपलब्ध हो सकें।
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={onNavigateToSubjects}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs sm:text-sm hover:brightness-110 transition-all shadow-lg cursor-pointer"
              >
                Browse Study Subjects
              </button>
              <button
                onClick={onNavigateToSpecial}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs sm:text-sm transition-all border border-cyan-500/30 cursor-pointer"
              >
                AI Study Assistant
              </button>
            </div>
          </div>
        ) : (
          filteredDownloads.map((item) => {
            const isPdf = item.fileType === "pdf";
            const isMusic = item.fileType === "music";
            const isDownloading = item.status === "downloading" || item.status === "queued";
            const isCompleted = item.status === "completed";
            const isFailed = item.status === "failed";
            const progress = item.progress || 0;

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 rounded-3xl backdrop-blur-xl border transition-all relative overflow-hidden group shadow-md ${
                  isDownloading
                    ? "bg-cyan-950/40 border-cyan-500/40"
                    : isFailed
                    ? "bg-red-950/30 border-red-500/40"
                    : "bg-slate-950/70 border-white/10 hover:border-emerald-500/50"
                }`}
              >
                {/* Progress bar background indicator when downloading */}
                {isDownloading && (
                  <div
                    className="absolute bottom-0 left-0 top-0 bg-cyan-500/10 pointer-events-none transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                )}

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Icon & File Info */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    <div
                      className={`p-3 rounded-2xl shrink-0 ${
                        isPdf
                          ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                          : isMusic
                          ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {isPdf && <FileText className="w-6 h-6" />}
                      {isMusic && <Music className="w-6 h-6" />}
                      {!isPdf && !isMusic && <HardDrive className="w-6 h-6" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {item.chapterTitle && (
                          <span className="text-xs font-bold text-cyan-400 truncate max-w-[200px]">
                            {item.chapterTitle}
                          </span>
                        )}
                        {item.subjectName && (
                          <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {item.subjectName}
                          </span>
                        )}

                        {/* Status Badge */}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            OFFLINE READY
                          </span>
                        )}

                        {isDownloading && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/30">
                            <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                            DOWNLOADING {progress}%
                          </span>
                        )}

                        {isFailed && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-red-300 bg-red-500/20 px-2 py-0.5 rounded-full border border-red-500/30">
                            <AlertCircle className="w-3 h-3 text-red-400" />
                            DOWNLOAD FAILED
                          </span>
                        )}
                      </div>

                      <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                        {item.title}
                      </h4>

                      {/* Download size and date */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono mt-1">
                        <span>Size: {item.fileSize || "2.4 MB"}</span>
                        <span>•</span>
                        <span>{item.downloadedAt}</span>
                      </div>

                      {/* Error Message if failed */}
                      {isFailed && item.errorMsg && (
                        <p className="text-xs text-red-400 mt-1.5 font-medium">
                          {item.errorMsg}
                        </p>
                      )}

                      {/* Active Progress Bar */}
                      {isDownloading && (
                        <div className="mt-2.5 space-y-1">
                          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[11px] text-cyan-300 font-mono">
                            <span>Downloading stream...</span>
                            <span>{progress}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {isDownloading && (
                      <button
                        onClick={() => handleCancel(item)}
                        className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Cancel download"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    )}

                    {isFailed && (
                      <button
                        onClick={() => handleRetry(item)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer hover:brightness-110 active:scale-95"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>RETRY</span>
                      </button>
                    )}

                    {isCompleted && (
                      <>
                        <button
                          onClick={() => handleOpenFile(item)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          {isPdf ? <BookOpen className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          <span>{isPdf ? "READ OFFLINE" : "PLAY"}</span>
                        </button>

                        <button
                          onClick={() => handleRetry(item)}
                          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
                          title="Re-download file"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleRemove(item.id)}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/30 transition-all cursor-pointer"
                      title="Remove from history"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
