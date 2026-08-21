import React, { useState, useMemo, useEffect } from "react";
import { PDFMaterial } from "../types";
import { DownloadService } from "../services/downloadService";
import { BookmarkService } from "../services/bookmarkService";
import { AnalyticsService } from "../services/analyticsService";
import { 
  X, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  FileText, 
  Printer, 
  ExternalLink,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Loader2,
  Maximize2,
  Bookmark
} from "lucide-react";

interface PdfViewerModalProps {
  pdf: PDFMaterial;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ pdf, onClose }) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(BookmarkService.isBookmarked(pdf.id));

  useEffect(() => {
    AnalyticsService.trackPdfView(pdf.id, pdf.title, pdf.subjectId, pdf.chapterTitle);
    setIsBookmarked(BookmarkService.isBookmarked(pdf.id));
    const unsub = BookmarkService.subscribe(() => {
      setIsBookmarked(BookmarkService.isBookmarked(pdf.id));
    });
    return () => unsub();
  }, [pdf.id, pdf.title, pdf.subjectId, pdf.chapterTitle]);

  const handleToggleBookmark = () => {
    BookmarkService.toggleBookmark({
      targetId: pdf.id,
      type: "pdf",
      title: pdf.title,
      chapterTitle: pdf.chapterTitle,
      subjectId: pdf.subjectId,
      fileUrl: pdf.fileUrl
    });
  };

  const totalPages = pdf.pageCount || 12;

  // Resolve best embed URL for PDF (handles Google Drive URLs, Data URLs, and standard web URLs)
  const viewerUrl = useMemo(() => {
    const rawUrl = pdf.fileUrl?.trim() || "";
    if (!rawUrl) return "";

    // 1. Data URL or Blob URL (Direct uploaded PDFs)
    if (rawUrl.startsWith("data:application/pdf") || rawUrl.startsWith("blob:")) {
      return rawUrl;
    }

    // 2. Google Drive Links (Extract file ID and convert to preview mode)
    // Examples:
    // https://drive.google.com/file/d/1A2B3C4D5E/view?usp=sharing
    // https://drive.google.com/open?id=1A2B3C4D5E
    // https://drive.google.com/uc?id=1A2B3C4D5E
    const driveMatch1 = rawUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch1 && driveMatch1[1]) {
      return `https://drive.google.com/file/d/${driveMatch1[1]}/preview`;
    }

    const driveMatch2 = rawUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (driveMatch2 && driveMatch2[1] && rawUrl.includes("drive.google.com")) {
      return `https://drive.google.com/file/d/${driveMatch2[1]}/preview`;
    }

    // 3. If standard web URL, provide directly or fallback
    return rawUrl;
  }, [pdf.fileUrl]);

  const isGoogleDrive = viewerUrl.includes("drive.google.com");

  const handleDownload = () => {
    AnalyticsService.trackPdfDownload(pdf.id, pdf.title, pdf.subjectId, pdf.chapterTitle);
    DownloadService.triggerDeviceDownload(pdf.fileUrl, `${pdf.title}.pdf`, {
      id: pdf.id,
      title: pdf.title,
      fileType: "pdf",
      subjectId: pdf.subjectId,
      chapterTitle: pdf.chapterTitle,
      fileSize: pdf.fileSizeMb ? `${pdf.fileSizeMb} MB` : "2.4 MB"
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNextPage = () => {
    setCurrentPage((p) => Math.min(p + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((p) => Math.max(p - 1, 1));
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-xl">
      <div className="relative w-full max-w-5xl h-[92vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* PDF Header Bar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-white z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="p-2.5 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30 shrink-0">
              <FileText className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-semibold text-cyan-400 line-clamp-1">{pdf.chapterTitle}</span>
                {pdf.isNew && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                    NEW
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white line-clamp-1">{pdf.title}</h3>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Page Navigation (for standard multi-page PDFs) */}
            {!isGoogleDrive && (
              <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1 gap-2 text-base text-slate-300">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1}
                  className="p-1 rounded hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono font-bold text-cyan-300 min-w-[50px] text-center text-sm">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  className="p-1 rounded hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Zoom Out */}
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 20, 60))}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <button
              onClick={() => setZoomLevel(100)}
              className="text-sm font-mono font-bold text-cyan-300 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700"
              title="Reset Zoom"
            >
              {zoomLevel}%
            </button>

            {/* Zoom In */}
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 20, 180))}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            {/* Bookmark Button */}
            <button
              onClick={handleToggleBookmark}
              className={`p-2.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold ${
                isBookmarked
                  ? "bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400"
              }`}
              title={isBookmarked ? "Remove Bookmark" : "Save Bookmark"}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-amber-400 text-amber-400" : ""}`} />
              <span className="hidden sm:inline">{isBookmarked ? "Saved" : "Bookmark"}</span>
            </button>

            {/* Direct Download */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-sm shadow-lg hover:brightness-110 transition-all shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download ({pdf.fileSizeMb || 3.5} MB)</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Viewer Canvas */}
        <div className="flex-1 bg-slate-950 p-2 sm:p-4 overflow-auto flex items-center justify-center relative">
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 text-cyan-400 gap-3">
              <Loader2 className="w-10 h-10 animate-spin" />
              <p className="text-sm font-bold text-slate-300">Loading PDF document, please wait...</p>
            </div>
          )}

          {/* Error Overlay */}
          {hasError ? (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-3xl max-w-md text-center shadow-2xl">
              <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
              <h4 className="text-lg font-bold text-white mb-1">Unable to preview PDF directly</h4>
              <p className="text-sm text-slate-400 mb-5 leading-relaxed">
                The document source is secured or requires external viewer access. You can open it directly or download it below.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href={pdf.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-colors shadow-lg"
                >
                  <ExternalLink className="w-4 h-4" /> Open in Google Drive
                </a>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold text-xs hover:bg-slate-700 transition-colors"
                >
                  <Download className="w-4 h-4" /> Direct Download
                </button>
              </div>
            </div>
          ) : (
            <div 
              className="w-full h-full bg-slate-900 rounded-2xl border border-slate-800 shadow-inner overflow-hidden flex flex-col items-center justify-center transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
            >
              <iframe
                src={viewerUrl.startsWith("data:") ? viewerUrl : `${viewerUrl}${viewerUrl.includes("drive.google.com") ? "" : `#page=${currentPage}&toolbar=0`}`}
                title={pdf.title}
                allow="autoplay"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
                className="w-full h-full min-h-[550px] border-none rounded-2xl bg-white"
              />
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verified BSEB 10th Study Material • {pdf.fileSizeMb || 3.5} MB • {totalPages} Pages</span>
          </div>

          <a
            href={pdf.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:underline flex items-center gap-1.5 font-semibold text-xs"
          >
            <span>Open in External Viewer</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

