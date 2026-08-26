import React, { useState, useEffect } from "react";
import { SubjectInfo, Chapter, PDFMaterial, YouTubeVideo } from "../types";
import { DownloadService } from "../services/downloadService";
import { BookmarkService } from "../services/bookmarkService";
import { AnalyticsService } from "../services/analyticsService";
import { 
  X, 
  Search, 
  FileText, 
  Video, 
  Download, 
  Play, 
  Sparkles, 
  BookOpen, 
  Layers,
  Eye,
  Clock,
  Bookmark,
  CheckCircle2,
  Loader2
} from "lucide-react";

interface ChapterListModalProps {
  subject: SubjectInfo;
  chapters: Chapter[];
  pdfs: PDFMaterial[];
  videos: YouTubeVideo[];
  onClose: () => void;
  onOpenPdf: (pdf: PDFMaterial) => void;
  onOpenVideo: (video: YouTubeVideo) => void;
}

export const ChapterListModal: React.FC<ChapterListModalProps> = ({
  subject,
  chapters,
  pdfs,
  videos,
  onClose,
  onOpenPdf,
  onOpenVideo
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<"all" | "pdfs" | "videos">("all");
  const [, setTick] = useState(0);

  useEffect(() => {
    // Track chapter views for analytics
    chapters.forEach((ch) => {
      AnalyticsService.trackChapterView(ch.id, ch.titleHindi, subject.id);
    });

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
  }, [chapters, subject.id]);

  const filteredChapters = chapters.filter((ch) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      ch.titleHindi.toLowerCase().includes(query) ||
      (ch.subtitle && ch.subtitle.toLowerCase().includes(query)) ||
      (ch.titleEnglish && ch.titleEnglish.toLowerCase().includes(query)) ||
      ch.chapterNumber.toString().includes(query);

    return matchesSearch;
  });

  const handleDirectDownload = (e: React.MouseEvent, pdf: PDFMaterial) => {
    e.stopPropagation();
    AnalyticsService.trackPdfDownload(pdf.id, pdf.title, pdf.subjectId, pdf.chapterTitle);
    DownloadService.triggerDeviceDownload(pdf.fileUrl, `${pdf.title}.pdf`, {
      id: pdf.id,
      title: pdf.title,
      fileType: "pdf",
      subjectId: pdf.subjectId,
      subjectName: subject.nameHindi,
      chapterTitle: pdf.chapterTitle,
      fileSize: pdf.fileSizeMb ? `${pdf.fileSizeMb} MB` : "2.0 MB"
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-950/90 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div 
          className="relative p-6 border-b border-slate-800 flex items-center justify-between text-white overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${subject.themeColor}33, #0f172a)` }}
        >
          <div className="flex items-center gap-4 z-10">
            <div 
              className="flex items-center justify-center w-14 h-14 rounded-2xl shadow-xl border border-white/20 text-white font-bold"
              style={{ backgroundColor: subject.themeColor }}
            >
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-mono font-bold uppercase bg-slate-900 border border-slate-700 text-amber-400">
                  {subject.code}
                </span>
                <span className="text-sm sm:text-base text-slate-300 font-semibold">
                  {subject.totalChapters} Chapters
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-wide mt-1">
                {subject.nameHindi} <span className="text-xl sm:text-2xl font-medium text-slate-300">({subject.nameEnglish})</span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors z-10"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 bg-slate-900/95 border-b border-slate-800 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search chapter name or number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950/90 border border-slate-800 text-white text-base focus:outline-none focus:border-cyan-500 placeholder-slate-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setSelectedTab("all")}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                selectedTab === "all" ? "bg-cyan-500 text-slate-950 shadow-md" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              All Chapters ({filteredChapters.length})
            </button>
            <button
              onClick={() => setSelectedTab("pdfs")}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5 ${
                selectedTab === "pdfs" ? "bg-pink-500 text-white shadow-md" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <FileText className="w-4 h-4" /> PDF Notes
            </button>
            <button
              onClick={() => setSelectedTab("videos")}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5 ${
                selectedTab === "videos" ? "bg-amber-500 text-slate-950 shadow-md" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <Video className="w-4 h-4" /> Videos
            </button>
          </div>
        </div>

        {/* Chapters & Content List */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 bg-slate-950/50">
          {filteredChapters.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Layers className="w-12 h-12 mx-auto text-slate-600 mb-2" />
              <p className="text-lg font-bold text-slate-300">No chapters found</p>
              <p className="text-sm text-slate-500">Please try adjusting your search terms.</p>
            </div>
          ) : (
            filteredChapters.map((ch) => {
              const chPdfs = pdfs.filter((p) => p.subjectId === subject.id && p.chapterId === ch.id && p.isPublished);
              const chVideos = videos.filter((v) => v.subjectId === subject.id && v.chapterId === ch.id && v.isPublished);

              if (selectedTab === "pdfs" && chPdfs.length === 0) return null;
              if (selectedTab === "videos" && chVideos.length === 0) return null;

              return (
                <div
                  key={ch.id}
                  className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 hover:border-slate-700 transition-all shadow-md group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div className="flex items-start gap-3.5">
                      <div 
                        className="flex items-center justify-center w-11 h-11 rounded-xl font-mono font-black text-base shrink-0 text-slate-950 shadow"
                        style={{ backgroundColor: subject.themeColor }}
                      >
                        {ch.chapterNumber}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-amber-300 transition-colors">
                            {ch.titleHindi}
                          </h3>
                          {ch.isImportant && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> VVI
                            </span>
                          )}
                        </div>

                        {ch.subtitle && (
                          <p className="text-sm font-medium text-slate-300 mt-0.5">
                            {ch.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Chapter Bookmark Button */}
                    <button
                      onClick={() => {
                        BookmarkService.toggleBookmark({
                          targetId: ch.id,
                          type: "chapter",
                          title: ch.titleHindi,
                          chapterTitle: `Chapter ${ch.chapterNumber}: ${ch.titleHindi}`,
                          chapterNumber: ch.chapterNumber,
                          subjectId: subject.id,
                          subjectName: subject.nameHindi
                        });
                      }}
                      className={`p-2 rounded-xl transition-all self-start sm:self-center flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                        BookmarkService.isBookmarked(ch.id)
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-amber-400"
                      }`}
                      title={BookmarkService.isBookmarked(ch.id) ? "Remove Bookmark" : "Save Bookmark"}
                    >
                      <Bookmark className={`w-4 h-4 ${BookmarkService.isBookmarked(ch.id) ? "fill-amber-400" : ""}`} />
                      <span className="hidden sm:inline">{BookmarkService.isBookmarked(ch.id) ? "Saved" : "Save Chapter"}</span>
                    </button>
                  </div>

                  {/* PDFs & Videos Action Items */}
                  <div className="mt-4 space-y-3">
                    {/* PDF Materials */}
                    {chPdfs.length > 0 ? (
                      chPdfs.map((pdf) => (
                        <div
                          key={pdf.id}
                          className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950 border border-pink-500/20 hover:border-pink-500/40 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 shrink-0">
                              <FileText className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-base font-bold text-slate-100 line-clamp-1">{pdf.title}</p>
                              <span className="text-xs sm:text-sm text-slate-400 font-mono">
                                {pdf.fileSizeMb || 3.5} MB • {pdf.pageCount || 12} Pages
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            {/* Bookmark PDF Button */}
                            <button
                              onClick={() => {
                                BookmarkService.toggleBookmark({
                                  targetId: pdf.id,
                                  type: "pdf",
                                  title: pdf.title,
                                  chapterTitle: pdf.chapterTitle,
                                  subjectId: pdf.subjectId,
                                  fileUrl: pdf.fileUrl
                                });
                              }}
                              className={`p-2 rounded-xl transition-all cursor-pointer ${
                                BookmarkService.isBookmarked(pdf.id)
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400"
                              }`}
                              title={BookmarkService.isBookmarked(pdf.id) ? "Remove Bookmark" : "Save Bookmark"}
                            >
                              <Bookmark className={`w-4 h-4 ${BookmarkService.isBookmarked(pdf.id) ? "fill-amber-400" : ""}`} />
                            </button>

                            {/* View PDF Button */}
                            <button
                              onClick={() => onOpenPdf(pdf)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-300 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                              <span>VIEW</span>
                            </button>

                            {/* Download PDF Button */}
                            {(() => {
                              const dlItem = DownloadService.getDownloadItem(pdf.id) || DownloadService.getDownloadItem(pdf.fileUrl);
                              const isDownloading = dlItem?.status === "downloading";
                              const isSaved = DownloadService.isDownloaded(pdf.id) || DownloadService.isDownloaded(pdf.fileUrl);

                              if (isDownloading) {
                                return (
                                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                                    <span>{dlItem?.progress || 0}%</span>
                                  </div>
                                );
                              }

                              if (isSaved) {
                                return (
                                  <button
                                    onClick={(e) => handleDirectDownload(e, pdf)}
                                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                                    title="File is saved offline. Click to re-download."
                                  >
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span className="hidden sm:inline">SAVED</span>
                                  </button>
                                );
                              }

                              return (
                                <button
                                  onClick={(e) => handleDirectDownload(e, pdf)}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                                >
                                  <Download className="w-4 h-4" />
                                  <span>DOWNLOAD</span>
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-2 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-slate-400 font-medium">
                        <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>PDF study notes for this chapter will be available soon.</span>
                      </div>
                    )}

                    {/* Video Materials */}
                    {chVideos.length > 0 && (
                      chVideos.map((vid) => (
                        <div
                          key={vid.id}
                          className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950 border border-amber-500/20 hover:border-amber-500/40 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                              <Video className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-base font-bold text-slate-100 line-clamp-1">{vid.title}</p>
                              <span className="text-xs sm:text-sm text-slate-400 font-mono">
                                Duration: {vid.durationText || "45:00"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Bookmark Video Button */}
                            <button
                              onClick={() => {
                                BookmarkService.toggleBookmark({
                                  targetId: vid.id,
                                  type: "video",
                                  title: vid.title,
                                  chapterTitle: vid.chapterTitle,
                                  subjectId: vid.subjectId,
                                  youtubeUrl: vid.youtubeUrl,
                                  youtubeVideoId: vid.youtubeVideoId,
                                  description: vid.description
                                });
                              }}
                              className={`p-2 rounded-xl transition-all cursor-pointer ${
                                BookmarkService.isBookmarked(vid.id)
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400"
                              }`}
                              title={BookmarkService.isBookmarked(vid.id) ? "Remove Bookmark" : "Save Bookmark"}
                            >
                              <Bookmark className={`w-4 h-4 ${BookmarkService.isBookmarked(vid.id) ? "fill-amber-400" : ""}`} />
                            </button>

                            <button
                              onClick={() => onOpenVideo(vid)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer"
                            >
                              <Play className="w-4 h-4 fill-amber-400" />
                              <span>WATCH</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
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
