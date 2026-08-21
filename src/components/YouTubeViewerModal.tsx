import React, { useState, useEffect } from "react";
import { YouTubeVideo } from "../types";
import { BookmarkService } from "../services/bookmarkService";
import { AnalyticsService } from "../services/analyticsService";
import { X, Play, Youtube, ExternalLink, ShieldCheck, Sparkles, Bookmark } from "lucide-react";

interface YouTubeViewerModalProps {
  video: YouTubeVideo;
  onClose: () => void;
}

export const YouTubeViewerModal: React.FC<YouTubeViewerModalProps> = ({ video, onClose }) => {
  const [isBookmarked, setIsBookmarked] = useState(BookmarkService.isBookmarked(video.id));

  useEffect(() => {
    AnalyticsService.trackVideoPlay(video.id, video.title, video.subjectId, video.chapterTitle);
    setIsBookmarked(BookmarkService.isBookmarked(video.id));
    const unsub = BookmarkService.subscribe(() => {
      setIsBookmarked(BookmarkService.isBookmarked(video.id));
    });
    return () => unsub();
  }, [video.id, video.title, video.subjectId, video.chapterTitle]);

  const handleToggleBookmark = () => {
    BookmarkService.toggleBookmark({
      targetId: video.id,
      type: "video",
      title: video.title,
      chapterTitle: video.chapterTitle,
      subjectId: video.subjectId,
      youtubeUrl: video.youtubeUrl,
      youtubeVideoId: video.youtubeVideoId,
      description: video.description
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="p-2.5 rounded-xl bg-red-500/20 text-red-500 border border-red-500/30 shrink-0">
              <Youtube className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm text-amber-400 font-semibold truncate block">{video.chapterTitle}</span>
              <h3 className="text-lg sm:text-xl font-bold text-white line-clamp-1">{video.title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Bookmark Button */}
            <button
              onClick={handleToggleBookmark}
              className={`p-2.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                isBookmarked
                  ? "bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400"
              }`}
              title={isBookmarked ? "Remove Bookmark" : "Save Bookmark"}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-amber-400 text-amber-400" : ""}`} />
              <span className="hidden sm:inline">{isBookmarked ? "Saved" : "Bookmark"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player Area */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center">
          <iframe
            src={`https://www.youtube.com/embed/${video.youtubeVideoId}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>

        {/* Info Footer */}
        <div className="p-5 sm:p-6 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base font-bold text-white">SK MISSION BOARD</span>
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-sm text-slate-300 line-clamp-2">
              {video.description || "बिहार बोर्ड कक्षा 10 परीक्षा 2026 की सर्वोत्तम तैयारी के लिए संपूर्ण वीडियो लेक्चर।"}
            </p>
          </div>

          <a
            href={video.youtubeUrl || "https://youtube.com/@skmissionboard?si=wckj0D5alOeUnVW8"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg transition-all shrink-0"
          >
            <Youtube className="w-5 h-5" />
            <span>YouTube पर खोलें</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
