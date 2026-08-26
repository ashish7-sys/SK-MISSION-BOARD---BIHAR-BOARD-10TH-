import React, { useState, useEffect } from "react";
import { BookmarkItem, PDFMaterial, YouTubeVideo, SubjectInfo, Chapter } from "../types";
import { BookmarkService } from "../services/bookmarkService";
import { OFFICIAL_SUBJECTS } from "../data/bsebClass10Data";
import { DownloadService } from "../services/downloadService";
import { 
  Bookmark, 
  FileText, 
  Video, 
  BookOpen, 
  Trash2, 
  X, 
  Search, 
  ExternalLink, 
  Download, 
  Play, 
  Sparkles,
  ChevronRight,
  AlertCircle
} from "lucide-react";

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  allPdfs: PDFMaterial[];
  allVideos: YouTubeVideo[];
  allChapters: Chapter[];
  onOpenPdf: (pdf: PDFMaterial) => void;
  onOpenVideo: (video: YouTubeVideo) => void;
  onSelectSubject: (subject: SubjectInfo) => void;
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  isOpen,
  onClose,
  allPdfs,
  allVideos,
  allChapters,
  onOpenPdf,
  onOpenVideo,
  onSelectSubject
}) => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(BookmarkService.getBookmarks());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "pdf" | "video" | "chapter">("all");

  useEffect(() => {
    BookmarkService.refreshForCurrentUser();
    setBookmarks(BookmarkService.getBookmarks());
    const unsubscribe = BookmarkService.subscribe(() => {
      setBookmarks(BookmarkService.getBookmarks());
    });
    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredBookmarks = bookmarks.filter((bm) => {
    const matchesType = selectedType === "all" || bm.type === selectedType;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      bm.title.toLowerCase().includes(q) ||
      (bm.chapterTitle && bm.chapterTitle.toLowerCase().includes(q)) ||
      (bm.subjectName && bm.subjectName.toLowerCase().includes(q)) ||
      (bm.description && bm.description.toLowerCase().includes(q));
    return matchesType && matchesSearch;
  });

  const pdfBookmarks = bookmarks.filter((b) => b.type === "pdf");
  const videoBookmarks = bookmarks.filter((b) => b.type === "video");
  const chapterBookmarks = bookmarks.filter((b) => b.type === "chapter");

  const handleOpenBookmark = (bm: BookmarkItem) => {
    if (bm.type === "pdf") {
      const existingPdf = allPdfs.find((p) => p.id === bm.targetId);
      if (existingPdf) {
        onOpenPdf(existingPdf);
      } else {
        // Fallback synthetic PDF using saved bookmark metadata
        const syntheticPdf: PDFMaterial = {
          id: bm.targetId,
          title: bm.title,
          fileUrl: bm.fileUrl || "",
          chapterTitle: bm.chapterTitle || "Saved PDF Notes",
          subjectId: bm.subjectId || "science",
          chapterId: "bm-ch",
          description: bm.description || "Saved bookmark note",
          uploadDate: bm.addedAt,
          isPublished: true,
          orderIndex: 0
        };
        onOpenPdf(syntheticPdf);
      }
      onClose();
    } else if (bm.type === "video") {
      const existingVid = allVideos.find((v) => v.id === bm.targetId);
      if (existingVid) {
        onOpenVideo(existingVid);
      } else {
        const syntheticVid: YouTubeVideo = {
          id: bm.targetId,
          title: bm.title,
          youtubeUrl: bm.youtubeUrl || "",
          youtubeVideoId: bm.youtubeVideoId || "",
          chapterTitle: bm.chapterTitle || "Saved Video",
          subjectId: bm.subjectId || "science",
          chapterId: "bm-ch",
          description: bm.description || "Saved bookmark video",
          uploadDate: bm.addedAt,
          isPublished: true,
          orderIndex: 0
        };
        onOpenVideo(syntheticVid);
      }
      onClose();
    } else if (bm.type === "chapter") {
      const subj = OFFICIAL_SUBJECTS.find((s) => s.id === bm.subjectId);
      if (subj) {
        onSelectSubject(subj);
      }
      onClose();
    }
  };

  const handleRemove = (e: React.MouseEvent, targetId: string) => {
    e.stopPropagation();
    BookmarkService.removeBookmark(targetId);
  };

  const handleDirectDownloadPdf = (e: React.MouseEvent, bm: BookmarkItem) => {
    e.stopPropagation();
    if (!bm.fileUrl) return;
    const subj = OFFICIAL_SUBJECTS.find((s) => s.id === bm.subjectId);
    DownloadService.triggerDeviceDownload(bm.fileUrl, `${bm.title}.pdf`, {
      id: bm.targetId,
      title: bm.title,
      fileType: "pdf",
      subjectId: bm.subjectId,
      subjectName: subj?.nameHindi || bm.subjectName,
      chapterTitle: bm.chapterTitle,
      fileSize: "2.5 MB"
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl bg-slate-900/95 border border-slate-800 shadow-[0_25px_60px_rgba(0,0,0,0.9)] p-5 sm:p-7 backdrop-blur-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-lg shadow-amber-500/10">
              <Bookmark className="w-6 h-6 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest text-amber-300 bg-amber-500/15 border border-amber-500/30 uppercase">
                  PRIVATE TO YOU
                </span>
                <span className="text-xs text-slate-400">
                  • {bookmarks.length} Saved {bookmarks.length === 1 ? "Item" : "Items"}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                Saved Favorites & Bookmarks
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            aria-label="Close Favorites Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Type Filter Tabs */}
        <div className="py-4 space-y-3 shrink-0">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search saved bookmarks, chapters, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-500 font-medium"
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

          {/* Type Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedType("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedType === "all"
                  ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              All Saved ({bookmarks.length})
            </button>

            <button
              onClick={() => setSelectedType("pdf")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedType === "pdf"
                  ? "bg-pink-500 text-white font-black shadow-md shadow-pink-500/20"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF Notes ({pdfBookmarks.length})</span>
            </button>

            <button
              onClick={() => setSelectedType("video")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedType === "video"
                  ? "bg-rose-500 text-white font-black shadow-md shadow-rose-500/20"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Videos ({videoBookmarks.length})</span>
            </button>

            <button
              onClick={() => setSelectedType("chapter")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedType === "chapter"
                  ? "bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Chapters ({chapterBookmarks.length})</span>
            </button>
          </div>
        </div>

        {/* List of Bookmarks */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
          {filteredBookmarks.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <Bookmark className="w-12 h-12 mx-auto text-slate-600 mb-1" />
              <p className="text-base font-bold text-slate-200">
                {bookmarks.length === 0 ? "No bookmarks saved yet" : "No bookmarks match your search query"}
              </p>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Tap the <Bookmark className="w-3.5 h-3.5 inline text-amber-400" /> bookmark icon on any chapter, PDF note, or video class to quickly access it here.
              </p>
            </div>
          ) : (
            filteredBookmarks.map((bm) => {
              const subj = OFFICIAL_SUBJECTS.find((s) => s.id === bm.subjectId);
              const isPdf = bm.type === "pdf";
              const isVid = bm.type === "video";
              const isChap = bm.type === "chapter";

              return (
                <div
                  key={bm.id}
                  onClick={() => handleOpenBookmark(bm)}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-400/60 cursor-pointer transition-all flex items-center justify-between group shadow-sm gap-3"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`p-3 rounded-2xl shrink-0 ${
                        isPdf
                          ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                          : isVid
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                      }`}
                    >
                      {isPdf && <FileText className="w-5 h-5" />}
                      {isVid && <Video className="w-5 h-5" />}
                      {isChap && <BookOpen className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold uppercase tracking-wider truncate ${
                            isPdf ? "text-pink-400" : isVid ? "text-amber-400" : "text-cyan-400"
                          }`}
                        >
                          {bm.chapterTitle || subj?.nameHindi || "STUDY MATERIAL"}
                        </span>
                        {subj && (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                            {subj.code}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-slate-100 group-hover:text-amber-300 transition-colors mt-0.5 truncate">
                        {bm.title}
                      </h4>

                      <p className="text-[11px] text-slate-500 mt-1 font-mono">
                        Saved: {bm.addedAt}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isPdf && bm.fileUrl && (
                      <button
                        onClick={(e) => handleDirectDownloadPdf(e, bm)}
                        className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                        title="Download to device"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">SAVE</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => handleRemove(e, bm.targetId)}
                      className="p-2.5 rounded-xl bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/30 transition-all cursor-pointer"
                      title="Remove from favorites"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-amber-400 transition-colors" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Private offline bookmarks stored securely on this device</span>
          {bookmarks.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to clear all your saved bookmarks?")) {
                  BookmarkService.clearBookmarks();
                }
              }}
              className="text-red-400/80 hover:text-red-400 font-semibold cursor-pointer"
            >
              Clear All Bookmarks
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
