import React, { useState, useEffect } from "react";
import { PDFMaterial, SubjectId } from "../types";
import { OFFICIAL_SUBJECTS } from "../data/bsebClass10Data";
import { DownloadService } from "../services/downloadService";
import { BookmarkService } from "../services/bookmarkService";
import { 
  FileText, 
  Search, 
  X, 
  BookOpen, 
  Download, 
  Bookmark, 
  CheckCircle2, 
  Loader2 
} from "lucide-react";

interface PdfListModalProps {
  pdfs: PDFMaterial[];
  onClose: () => void;
  onOpenPdf: (pdf: PDFMaterial) => void;
}

export const PdfListModal: React.FC<PdfListModalProps> = ({ pdfs, onClose, onOpenPdf }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<SubjectId | "all">("all");
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubBookmark = BookmarkService.subscribe(() => {
      setTick((t) => t + 1);
    });
    const unsubDownload = DownloadService.subscribe(() => {
      setTick((t) => t + 1);
    });
    return () => {
      unsubBookmark();
      unsubDownload();
    };
  }, []);

  const publishedPdfs = pdfs.filter((p) => p.isPublished !== false);

  const filteredPdfs = publishedPdfs.filter((pdf) => {
    const matchesSubject = selectedSubjectFilter === "all" || pdf.subjectId === selectedSubjectFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      pdf.title.toLowerCase().includes(q) ||
      pdf.chapterTitle.toLowerCase().includes(q) ||
      (pdf.description && pdf.description.toLowerCase().includes(q));
    return matchesSubject && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900/95 border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-5 sm:p-7 backdrop-blur-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Latest PDF Notes & Study Materials
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                BSEB Class 10th - Chapter-wise Notes & Solutions ({publishedPdfs.length} PDFs)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            aria-label="Close PDF Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Subject Filters */}
        <div className="py-4 space-y-3 shrink-0">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search PDF notes or chapter title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-pink-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Subject Pills Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedSubjectFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedSubjectFilter === "all"
                  ? "bg-pink-500 text-white shadow-md shadow-pink-500/20"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              All Subjects ({publishedPdfs.length})
            </button>
            {OFFICIAL_SUBJECTS.map((subj) => {
              const count = publishedPdfs.filter((p) => p.subjectId === subj.id).length;
              return (
                <button
                  key={subj.id}
                  onClick={() => setSelectedSubjectFilter(subj.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedSubjectFilter === subj.id
                      ? "bg-pink-500 text-white shadow-md shadow-pink-500/20"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {subj.nameHindi} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* PDF Items List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
          {filteredPdfs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No PDF study materials found matching your query.
            </div>
          ) : (
            filteredPdfs.map((pdf) => {
              const isSaved = DownloadService.isDownloaded(pdf.id) || DownloadService.isDownloaded(pdf.fileUrl);
              const dlItem = DownloadService.getDownloadItem(pdf.id) || DownloadService.getDownloadItem(pdf.fileUrl);
              const isDownloading = dlItem?.status === "downloading";

              return (
                <div
                  key={pdf.id}
                  onClick={() => {
                    onOpenPdf(pdf);
                  }}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-pink-500/50 cursor-pointer transition-all flex items-center justify-between group shadow-sm"
                >
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-pink-400 uppercase tracking-wider truncate">
                        {pdf.chapterTitle}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                        {pdf.subjectId}
                      </span>
                      {isSaved && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          OFFLINE
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-slate-100 group-hover:text-pink-300 transition-colors mt-0.5 truncate">
                      {pdf.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      {pdf.fileSizeMb || 3.5} MB • {pdf.pageCount || 12} Pages • BSEB 2026
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        BookmarkService.toggleBookmark({
                          targetId: pdf.id,
                          type: "pdf",
                          title: pdf.title,
                          chapterTitle: pdf.chapterTitle,
                          subjectId: pdf.subjectId,
                          fileUrl: pdf.fileUrl
                        });
                      }}
                      className={`p-2 sm:p-2.5 rounded-xl transition-all cursor-pointer ${
                        BookmarkService.isBookmarked(pdf.id)
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400"
                      }`}
                      title={BookmarkService.isBookmarked(pdf.id) ? "Remove Bookmark" : "Save Bookmark"}
                    >
                      <Bookmark
                        className={`w-4 h-4 ${BookmarkService.isBookmarked(pdf.id) ? "fill-amber-400" : ""}`}
                      />
                    </button>

                    {isDownloading ? (
                      <div className="p-2 sm:px-3 sm:py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                        <span className="hidden sm:inline">{dlItem.progress || 0}%</span>
                      </div>
                    ) : isSaved ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const subj = OFFICIAL_SUBJECTS.find((s) => s.id === pdf.subjectId);
                          DownloadService.triggerDeviceDownload(pdf.fileUrl, `${pdf.title}.pdf`, {
                            id: pdf.id,
                            title: pdf.title,
                            fileType: "pdf",
                            subjectId: pdf.subjectId,
                            subjectName: subj?.nameHindi || pdf.subjectId,
                            chapterTitle: pdf.chapterTitle,
                            fileSize: pdf.fileSizeMb ? `${pdf.fileSizeMb} MB` : "3.5 MB"
                          });
                        }}
                        className="p-2 sm:px-3 sm:py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                        title="File is saved offline. Click to re-download."
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="hidden sm:inline">SAVED</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const subj = OFFICIAL_SUBJECTS.find((s) => s.id === pdf.subjectId);
                          DownloadService.triggerDeviceDownload(pdf.fileUrl, `${pdf.title}.pdf`, {
                            id: pdf.id,
                            title: pdf.title,
                            fileType: "pdf",
                            subjectId: pdf.subjectId,
                            subjectName: subj?.nameHindi || pdf.subjectId,
                            chapterTitle: pdf.chapterTitle,
                            fileSize: pdf.fileSizeMb ? `${pdf.fileSizeMb} MB` : "3.5 MB"
                          });
                        }}
                        className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                        title="Download to device"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">SAVE</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPdf(pdf);
                      }}
                      className="px-4 py-2 rounded-xl bg-pink-500/20 group-hover:bg-pink-500 text-pink-300 group-hover:text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>READ</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
