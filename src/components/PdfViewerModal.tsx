import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { PDFMaterial } from "../types";
import { DownloadService } from "../services/downloadService";
import { BookmarkService } from "../services/bookmarkService";
import { AnalyticsService } from "../services/analyticsService";
import { PdfService, readBlobAsUint8Array } from "../services/pdfService";
import { 
  X, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  FileText, 
  ExternalLink,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Loader2,
  Bookmark,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Layers,
  Sparkles,
  ChevronsUp
} from "lucide-react";

interface PdfViewerModalProps {
  pdf: PDFMaterial;
  onClose: () => void;
}

/**
 * Individual PDF Page Item Component
 * Renders on a canvas with high-DPI clarity, intersection observer for lazy loading,
 * and handles click (fullscreen) and double-tap (exit fullscreen).
 */
interface PdfPageItemProps {
  pdfDoc: any;
  pageNumber: number;
  totalPages: number;
  zoomLevel: number;
  containerWidth: number;
  isFullscreen: boolean;
  onVisible: (pageNumber: number) => void;
  onPageClick: () => void;
  onPageDoubleClick: () => void;
  onPageTouchDoubleTap: () => void;
}

const PdfPageItem: React.FC<PdfPageItemProps> = ({
  pdfDoc,
  pageNumber,
  totalPages,
  zoomLevel,
  containerWidth,
  isFullscreen,
  onVisible,
  onPageClick,
  onPageDoubleClick,
  onPageTouchDoubleTap
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const itemContainerRef = useRef<HTMLDivElement | null>(null);
  const [isNearViewport, setIsNearViewport] = useState(pageNumber <= 3); // Preload first 3 pages
  const [isRendered, setIsRendered] = useState(false);
  const [renderError, setRenderError] = useState(false);
  const lastTouchTimeRef = useRef<number>(0);

  // Intersection Observer to render when scrolled near & update active page
  useEffect(() => {
    const el = itemContainerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsNearViewport(true);
            if (entry.intersectionRatio >= 0.3) {
              onVisible(pageNumber);
            }
          }
        });
      },
      {
        rootMargin: "500px 0px", // Pre-render 500px before scrolling into view
        threshold: [0.1, 0.3, 0.6]
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [pageNumber, onVisible]);

  // Render canvas when doc, page, zoom, width, or visibility changes
  useEffect(() => {
    if (!pdfDoc || !isNearViewport || !canvasRef.current) return;

    let isMounted = true;
    setRenderError(false);

    // Calculate width: full available width (with margin) bounded by zoom
    const availableWidth = containerWidth > 320 ? containerWidth - (isFullscreen ? 24 : 48) : 800;

    PdfService.renderPageToCanvas(pdfDoc, pageNumber, canvasRef.current, zoomLevel, availableWidth)
      .then(() => {
        if (isMounted) {
          setIsRendered(true);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn(`Error rendering page ${pageNumber}:`, err);
          setRenderError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [pdfDoc, pageNumber, zoomLevel, containerWidth, isNearViewport, isFullscreen]);

  // Handle touch interactions for mobile double tap vs single tap
  const handleTouchEnd = (e: React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_THRESHOLD = 300;
    if (now - lastTouchTimeRef.current < DOUBLE_TAP_THRESHOLD) {
      // Double Tap detected
      e.preventDefault();
      onPageTouchDoubleTap();
      lastTouchTimeRef.current = 0;
    } else {
      lastTouchTimeRef.current = now;
    }
  };

  return (
    <div
      id={`pdf-page-${pageNumber}`}
      ref={itemContainerRef}
      onClick={onPageClick}
      onDoubleClick={onPageDoubleClick}
      onTouchEnd={handleTouchEnd}
      className={`relative flex flex-col items-center justify-center transition-all duration-200 cursor-pointer group select-none ${
        isFullscreen ? "mb-4 sm:mb-6" : "mb-6 sm:mb-8"
      }`}
    >
      {/* Page Header Badge with number & quick hint */}
      <div className="w-full flex items-center justify-between px-3 py-1 mb-1.5 max-w-[900px] text-[11px] font-mono font-bold text-slate-400">
        <span className="flex items-center gap-1 bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-slate-800 backdrop-blur-sm text-cyan-400">
          Page {pageNumber} of {totalPages}
        </span>
        <span className="hidden sm:inline text-slate-500 group-hover:text-cyan-400/80 transition-colors text-[10px]">
          {isFullscreen ? "Double-tap to exit fullscreen" : "Click to view fullscreen"}
        </span>
      </div>

      {/* Page White Canvas Card */}
      <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden border border-slate-700/80 transition-transform duration-200 group-hover:border-cyan-500/50">
        <canvas
          ref={canvasRef}
          className={`block max-w-full h-auto transition-opacity duration-300 ${
            isRendered ? "opacity-100" : "opacity-0 min-h-[400px]"
          }`}
        />

        {/* Skeleton placeholder while page loads */}
        {!isRendered && !renderError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/20 backdrop-blur-sm text-slate-400 min-h-[450px] w-full p-8">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-2" />
            <p className="text-xs font-semibold text-slate-500">Loading Page {pageNumber}...</p>
          </div>
        )}

        {/* Error Fallback for single page render error */}
        {renderError && (
          <div className="flex flex-col items-center justify-center p-8 bg-slate-900 text-slate-300 min-h-[300px]">
            <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
            <p className="text-xs font-medium">Page {pageNumber} preview unavailable</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ pdf, onClose }) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(pdf.pageCount || 1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatusText, setLoadingStatusText] = useState("Loading Document...");
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isBookmarked, setIsBookmarked] = useState(BookmarkService.isBookmarked(pdf.id));
  const [activeDownload, setActiveDownload] = useState(DownloadService.getDownloadItem(pdf.id));
  const [isOfflineAvailable, setIsOfflineAvailable] = useState(false);
  const [viewerMode, setViewerMode] = useState<"native" | "embed">("native");
  
  // Fullscreen mode state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenHint, setShowFullscreenHint] = useState(false);
  const [containerWidth, setContainerWidth] = useState(800);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const modalWrapperRef = useRef<HTMLDivElement | null>(null);
  const pdfDocRef = useRef<any>(null);
  const abortCtrlRef = useRef<AbortController | null>(null);

  const sourceType = useMemo(() => PdfService.detectSourceType(pdf.fileUrl), [pdf.fileUrl]);

  // Track container width for responsive canvas resizing
  useEffect(() => {
    const updateWidth = () => {
      if (scrollContainerRef.current) {
        setContainerWidth(scrollContainerRef.current.clientWidth || window.innerWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [isFullscreen]);

  // Sync bookmark and download state
  useEffect(() => {
    AnalyticsService.trackPdfView(pdf.id, pdf.title, pdf.subjectId, pdf.chapterTitle);
    setIsBookmarked(BookmarkService.isBookmarked(pdf.id));
    setActiveDownload(DownloadService.getDownloadItem(pdf.id));

    const unsubBookmark = BookmarkService.subscribe(() => {
      setIsBookmarked(BookmarkService.isBookmarked(pdf.id));
    });

    const unsubDownload = DownloadService.subscribe(async () => {
      const item = DownloadService.getDownloadItem(pdf.id);
      setActiveDownload(item);
      const isOffline = await DownloadService.verifyOfflineAvailability(pdf.id);
      setIsOfflineAvailable(isOffline);
    });

    DownloadService.verifyOfflineAvailability(pdf.id).then(setIsOfflineAvailable);

    return () => {
      unsubBookmark();
      unsubDownload();
    };
  }, [pdf.id, pdf.title, pdf.subjectId, pdf.chapterTitle]);

  // Main PDF Document Loader Engine (Optimized for instant 0-second offline & cache loading)
  const loadPdf = useCallback(async () => {
    // 0. Check instant in-memory doc cache first (0ms latency!)
    const instantDoc = PdfService.getCachedDoc(pdf.id) || PdfService.getCachedDoc(pdf.fileUrl);
    if (instantDoc) {
      pdfDocRef.current = instantDoc;
      const total = instantDoc.numPages || pdf.pageCount || 1;
      setTotalPages(total);
      setCurrentPage(1);
      setIsLoading(false);
      return;
    }

    // 0B. Check instant in-memory bytes
    const instantBytes = PdfService.getCachedBytes(pdf.id) || PdfService.getCachedBytes(pdf.fileUrl);
    if (instantBytes) {
      try {
        const loadedDoc = await PdfService.loadPdfDocument(instantBytes, pdf.id);
        pdfDocRef.current = loadedDoc;
        const total = loadedDoc.numPages || pdf.pageCount || 1;
        setTotalPages(total);
        setCurrentPage(1);
        setIsLoading(false);
        return;
      } catch (e) {
        console.warn("Cached bytes decode failed, falling back to full fetch:", e);
      }
    }

    setIsLoading(true);
    setHasError(false);
    setErrorMessage("");
    setLoadingStatusText("Loading PDF Document...");

    if (abortCtrlRef.current) {
      abortCtrlRef.current.abort();
    }
    abortCtrlRef.current = new AbortController();

    try {
      // 1. Check if genuine offline blob exists in IndexedDB
      const offlineBlob = await DownloadService.getOfflineBlob(pdf.id) || await DownloadService.getOfflineBlob(pdf.fileUrl);
      let loadedDoc: any;

      if (offlineBlob) {
        setLoadingStatusText("Opening offline document...");
        const uint8 = await readBlobAsUint8Array(offlineBlob);
        PdfService.setCachedBytes(pdf.id, uint8);
        loadedDoc = await PdfService.loadPdfDocument(uint8, pdf.id);
      } else if (pdf.fileUrl) {
        if (!pdf.fileUrl.startsWith("data:")) {
          setLoadingStatusText("Fetching document...");
        }
        loadedDoc = await PdfService.loadPdfDocument(pdf.fileUrl, pdf.id);
      } else {
        throw new Error("No valid PDF source found.");
      }

      pdfDocRef.current = loadedDoc;
      const total = loadedDoc.numPages || pdf.pageCount || 1;
      setTotalPages(total);
      setCurrentPage(1);
      setIsLoading(false);
    } catch (err: any) {
      console.warn("Native canvas PDF loading error:", err);
      if (sourceType === "DRIVE_LINK") {
        setViewerMode("embed");
      }
      setIsLoading(false);
      setHasError(true);
      setErrorMessage(err?.message || "Unable to render PDF directly. Please retry or open in Google Drive.");
    }
  }, [pdf.id, pdf.fileUrl, pdf.pageCount, sourceType]);

  // Trigger load on mount
  useEffect(() => {
    loadPdf();
    return () => {
      if (abortCtrlRef.current) {
        abortCtrlRef.current.abort();
      }
    };
  }, [loadPdf]);

  // Scroll to a specific page smoothly
  const scrollToPage = useCallback((pageNum: number) => {
    const pageEl = document.getElementById(`pdf-page-${pageNum}`);
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentPage(pageNum);
    }
  }, []);

  // Keyboard navigation & zoom shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        setCurrentPage((p) => {
          const next = Math.min(p + 1, totalPages);
          scrollToPage(next);
          return next;
        });
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        setCurrentPage((p) => {
          const prev = Math.max(p - 1, 1);
          scrollToPage(prev);
          return prev;
        });
      } else if (e.key === "+" || e.key === "=") {
        setZoomLevel((z) => Math.min(z + 20, 260));
      } else if (e.key === "-") {
        setZoomLevel((z) => Math.max(z - 20, 50));
      } else if (e.key === "0") {
        setZoomLevel(100);
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      } else if (e.key === "Escape") {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalPages, isFullscreen, onClose, scrollToPage]);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => {
      const next = !prev;
      if (next) {
        setShowFullscreenHint(true);
        setTimeout(() => setShowFullscreenHint(false), 3200);
      }
      return next;
    });
  };

  const handlePageVisible = useCallback((pageNum: number) => {
    setCurrentPage(pageNum);
  }, []);

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

  const handleDownload = () => {
    AnalyticsService.trackPdfDownload(pdf.id, pdf.title, pdf.subjectId, pdf.chapterTitle);
    DownloadService.triggerDeviceDownload(pdf.fileUrl, `${pdf.title}.pdf`, {
      id: pdf.id,
      title: pdf.title,
      fileType: "pdf",
      subjectId: pdf.subjectId,
      chapterTitle: pdf.chapterTitle,
      fileSize: pdf.fileSizeMb ? `${pdf.fileSizeMb} MB` : "3.5 MB"
    });
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 20, 260));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 20, 50));
  const handleResetZoom = () => setZoomLevel(100);

  // Array of page numbers for continuous vertical rendering [1, 2, ..., totalPages]
  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);

  // Resolve Embed URL if user opts for Embed Mode or for Drive links
  const embedUrl = useMemo(() => {
    const rawUrl = pdf.fileUrl?.trim() || "";
    const driveMatch =
      rawUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      rawUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);

    if (driveMatch && driveMatch[1]) {
      return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }
    return rawUrl;
  }, [pdf.fileUrl]);

  return (
    <div 
      ref={modalWrapperRef}
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isFullscreen 
          ? "p-0 bg-slate-950 w-screen h-screen" 
          : "p-2 sm:p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in"
      }`}
    >
      <div 
        className={`relative w-full bg-slate-900 flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? "h-screen rounded-none border-none shadow-none"
            : "max-w-5xl h-[94vh] border border-slate-800 rounded-3xl shadow-2xl"
        }`}
      >
        {/* ========================================================
            TOP TOOLBAR (Hidden in Fullscreen Mode for 100% Immersive Reading)
        ======================================================== */}
        {!isFullscreen && (
          <div className="p-3 sm:p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-white z-10 shrink-0">
            {/* Left: Back button & Document Metadata */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                id="pdf-viewer-close-back-btn"
                onClick={onClose}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer active:scale-95"
                title="Close Viewer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="p-2.5 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30 shrink-0">
                <FileText className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-cyan-400 truncate max-w-[220px]">
                    {pdf.chapterTitle}
                  </span>
                  {isOfflineAvailable && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      SAVED OFFLINE
                    </span>
                  )}
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-[260px] sm:max-w-md">
                  {pdf.title}
                </h3>
              </div>
            </div>

            {/* Right Toolbar Controls */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Page Indicator & Quick Jump */}
              {viewerMode === "native" && !hasError && !isLoading && (
                <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl px-2 py-1 gap-1 text-slate-300">
                  <button
                    id="pdf-prev-page-btn"
                    onClick={() => scrollToPage(Math.max(currentPage - 1, 1))}
                    disabled={currentPage <= 1}
                    className="p-1 rounded hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer active:scale-95"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="font-mono font-bold text-cyan-300 text-xs sm:text-sm px-1 min-w-[65px] text-center">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    id="pdf-next-page-btn"
                    onClick={() => scrollToPage(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage >= totalPages}
                    className="p-1 rounded hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer active:scale-95"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Prominent Zoom Controls */}
              {viewerMode === "native" && (
                <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-0.5">
                  <button
                    id="pdf-zoom-out-btn"
                    onClick={handleZoomOut}
                    disabled={isLoading}
                    className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer active:scale-95 disabled:opacity-50"
                    title="Zoom Out (-20%)"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    id="pdf-zoom-reset-btn"
                    onClick={handleResetZoom}
                    className="text-xs font-mono font-bold text-cyan-300 px-2 py-1 hover:bg-slate-700 rounded cursor-pointer"
                    title="Reset Zoom (100%)"
                  >
                    {zoomLevel}%
                  </button>
                  <button
                    id="pdf-zoom-in-btn"
                    onClick={handleZoomIn}
                    disabled={isLoading}
                    className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer active:scale-95 disabled:opacity-50"
                    title="Zoom In (+20%)"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Fullscreen Button */}
              <button
                id="pdf-fullscreen-btn"
                onClick={toggleFullscreen}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                title="View Fullscreen (or click anywhere on PDF)"
              >
                <Maximize2 className="w-4 h-4" />
                <span className="hidden md:inline">Fullscreen</span>
              </button>

              {/* Drive Mode Switcher */}
              {sourceType === "DRIVE_LINK" && (
                <button
                  id="pdf-view-mode-toggle"
                  onClick={() => setViewerMode((m) => (m === "native" ? "embed" : "native"))}
                  className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                  title="Switch Viewer Mode"
                >
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">{viewerMode === "native" ? "Drive Embed" : "Native HD"}</span>
                </button>
              )}

              {/* Bookmark Button */}
              <button
                id="pdf-bookmark-btn"
                onClick={handleToggleBookmark}
                className={`p-2 sm:px-3 sm:py-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                  isBookmarked
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400"
                }`}
                title={isBookmarked ? "Remove Bookmark" : "Save Bookmark"}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-amber-400 text-amber-400" : ""}`} />
                <span className="hidden md:inline">{isBookmarked ? "Saved" : "Save"}</span>
              </button>

              {/* Smart Download Button */}
              {activeDownload?.status === "downloading" ? (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Downloading {activeDownload.progress || 0}%</span>
                </div>
              ) : isOfflineAvailable ? (
                <button
                  id="pdf-redownload-btn"
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-xs hover:bg-emerald-500/30 transition-all cursor-pointer"
                  title="Re-download / Export PDF"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Saved</span>
                </button>
              ) : (
                <button
                  id="pdf-download-btn"
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </button>
              )}

              {/* Close Button */}
              <button
                id="pdf-viewer-top-close-btn"
                onClick={onClose}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            FULLSCREEN MINIMAL FLOATING HUD & TOAST HINT
        ======================================================== */}
        {isFullscreen && (
          <>
            {/* Top Floating Control Bar */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 p-2 rounded-2xl bg-slate-900/90 border border-slate-700 shadow-2xl backdrop-blur-xl text-white">
              <span className="font-mono font-bold text-cyan-300 text-xs px-2.5 py-1 bg-slate-800 rounded-xl">
                Page {currentPage} / {totalPages}
              </span>

              {/* Zoom Out */}
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer active:scale-95"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <button
                onClick={handleResetZoom}
                className="text-xs font-mono font-bold text-slate-300 hover:text-cyan-300 px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer"
                title="Reset Zoom"
              >
                {zoomLevel}%
              </button>

              {/* Zoom In */}
              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer active:scale-95"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {/* Exit Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 cursor-pointer"
                title="Exit Fullscreen (Double-tap anywhere or press Esc)"
              >
                <Minimize2 className="w-4 h-4" />
                <span>Exit Fullscreen</span>
              </button>
            </div>

            {/* Notification Toast for Double Tap Guide */}
            {showFullscreenHint && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/95 border border-cyan-500/40 text-cyan-200 text-xs font-bold shadow-2xl backdrop-blur-md animate-fade-in pointer-events-none">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>💡 Fullscreen Mode Active • Double-tap anywhere to return</span>
              </div>
            )}
          </>
        )}

        {/* ========================================================
            MAIN DOCUMENT VIEWING STAGE (CONTINUOUS VERTICAL SCROLL)
        ======================================================== */}
        <div
          ref={scrollContainerRef}
          className={`flex-1 bg-slate-950 overflow-y-auto overflow-x-hidden relative ${
            isFullscreen ? "p-2 sm:p-6 pb-32" : "p-3 sm:p-6 pb-28"
          }`}
          style={{ scrollBehavior: "smooth" }}
        >
          {/* Loading Spinner Screen */}
          {isLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 text-cyan-400 gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
              <p className="text-sm font-bold text-slate-300">{loadingStatusText}</p>
            </div>
          )}

          {/* Error Recovery Screen */}
          {hasError && (
            <div className="flex flex-col items-center justify-center p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl max-w-md mx-auto my-12 text-center shadow-2xl z-20">
              <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
              <h4 className="text-lg font-bold text-white mb-1">Could Not Load Document Directly</h4>
              <p className="text-xs sm:text-sm text-slate-400 mb-5 leading-relaxed">
                {errorMessage || "This PDF could not be rendered directly due to network or security permissions."}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={loadPdf}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-colors shadow-lg cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" /> Retry
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold text-xs hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </button>
                {sourceType === "DRIVE_LINK" && (
                  <button
                    onClick={() => {
                      setViewerMode("embed");
                      setHasError(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300 font-semibold text-xs hover:bg-purple-600/50 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" /> Google Drive Embed
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 
            NATIVE MULTI-PAGE CONTINUOUS VERTICAL STACK (UP & DOWN FLOW)
            Renders every page sequentially top-to-bottom without bottom cut-offs!
          */}
          {viewerMode === "native" && !hasError && pdfDocRef.current && (
            <div className="w-full flex flex-col items-center justify-start mx-auto max-w-4xl">
              {pageNumbers.map((pageNum) => (
                <PdfPageItem
                  key={`pdf-page-item-${pageNum}`}
                  pdfDoc={pdfDocRef.current}
                  pageNumber={pageNum}
                  totalPages={totalPages}
                  zoomLevel={zoomLevel}
                  containerWidth={containerWidth}
                  isFullscreen={isFullscreen}
                  onVisible={handlePageVisible}
                  onPageClick={() => {
                    // Single click on document in default view triggers Fullscreen!
                    if (!isFullscreen) {
                      setIsFullscreen(true);
                      setShowFullscreenHint(true);
                      setTimeout(() => setShowFullscreenHint(false), 3200);
                    }
                  }}
                  onPageDoubleClick={() => {
                    // Double click on document exits Fullscreen!
                    if (isFullscreen) {
                      setIsFullscreen(false);
                    } else {
                      setIsFullscreen(true);
                    }
                  }}
                  onPageTouchDoubleTap={() => {
                    // Mobile Touch Double-Tap toggles Fullscreen!
                    setIsFullscreen((prev) => !prev);
                  }}
                />
              ))}

              {/* End of Document Indicator */}
              <div className="py-8 flex flex-col items-center justify-center text-slate-500 text-xs font-semibold gap-2 select-none">
                <div className="w-16 h-1 bg-slate-800 rounded-full" />
                <span>End of Document ({totalPages} Pages)</span>
                <button
                  onClick={() => scrollToPage(1)}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-xs font-bold mt-1 cursor-pointer"
                >
                  <ChevronsUp className="w-4 h-4" />
                  <span>Back to Top</span>
                </button>
              </div>
            </div>
          )}

          {/* Embed Viewer Mode (Fallback for Google Drive if selected) */}
          {viewerMode === "embed" && !hasError && (
            <div className="w-full h-full min-h-[85vh] rounded-2xl overflow-hidden bg-white shadow-2xl">
              <iframe
                src={embedUrl}
                title={pdf.title}
                allow="autoplay"
                className="w-full h-full min-h-[85vh] border-none rounded-2xl"
              />
            </div>
          )}
        </div>

        {/* ========================================================
            FOOTER STATUS BAR (Hidden in Fullscreen Mode)
        ======================================================== */}
        {!isFullscreen && (
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                BSEB Class 10th Study Material • {pdf.fileSizeMb || 3.5} MB • {totalPages} Pages (Continuous Vertical Scroll)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                💡 Tip: Click on document for full screen • Double-tap to exit
              </span>
              {sourceType === "DRIVE_LINK" && (
                <a
                  href={pdf.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold text-xs"
                >
                  <span>Open in Google Drive</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
