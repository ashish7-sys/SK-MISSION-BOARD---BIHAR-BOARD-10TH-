import React, { useState, useEffect } from "react";
import { YouTubeVideo, SubjectId } from "../types";
import { OFFICIAL_SUBJECTS } from "../data/bsebClass10Data";
import { BookmarkService } from "../services/bookmarkService";
import { Video, Search, X, Play, ExternalLink, Bookmark } from "lucide-react";

interface VideoListModalProps {
  videos: YouTubeVideo[];
  onClose: () => void;
  onOpenVideo: (video: YouTubeVideo) => void;
}

export const VideoListModal: React.FC<VideoListModalProps> = ({ videos, onClose, onOpenVideo }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<SubjectId | "all">("all");
  const [, setBookmarkTick] = useState(0);

  useEffect(() => {
    const unsub = BookmarkService.subscribe(() => {
      setBookmarkTick((t) => t + 1);
    });
    return () => unsub();
  }, []);

  const publishedVideos = videos.filter(v => v.isPublished !== false);

  const filteredVideos = publishedVideos.filter(vid => {
    const matchesSubject = selectedSubjectFilter === "all" || vid.subjectId === selectedSubjectFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      vid.title.toLowerCase().includes(q) || 
      vid.chapterTitle.toLowerCase().includes(q) ||
      (vid.description && vid.description.toLowerCase().includes(q));
    return matchesSubject && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900/95 border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-5 sm:p-7 backdrop-blur-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                YouTube Video Lectures
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Official Video Classes by @skmissionboard ({publishedVideos.length} Videos)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            aria-label="Close Video Modal"
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
              placeholder="Search video lecture or chapter title..."
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

          {/* Subject Pills Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedSubjectFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedSubjectFilter === "all"
                  ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              All Subjects ({publishedVideos.length})
            </button>
            {OFFICIAL_SUBJECTS.map(subj => {
              const count = publishedVideos.filter(v => v.subjectId === subj.id).length;
              return (
                <button
                  key={subj.id}
                  onClick={() => setSelectedSubjectFilter(subj.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedSubjectFilter === subj.id
                      ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {subj.nameHindi} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Video Items List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
          {filteredVideos.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No video classes found matching your query.
            </div>
          ) : (
            filteredVideos.map(vid => (
              <div
                key={vid.id}
                onClick={() => {
                  onOpenVideo(vid);
                }}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all flex items-center justify-between group shadow-sm"
              >
                <div className="min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider truncate">
                      {vid.chapterTitle}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                      {vid.subjectId}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-100 group-hover:text-amber-300 transition-colors mt-0.5 truncate">
                    {vid.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Duration: {vid.durationText || "45:00"} • Class 10th BSEB
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
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
                    className={`p-2 sm:p-2.5 rounded-xl transition-all cursor-pointer ${
                      BookmarkService.isBookmarked(vid.id)
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400"
                    }`}
                    title={BookmarkService.isBookmarked(vid.id) ? "Remove Bookmark" : "Save Bookmark"}
                  >
                    <Bookmark className={`w-4 h-4 ${BookmarkService.isBookmarked(vid.id) ? "fill-amber-400" : ""}`} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenVideo(vid);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500/20 group-hover:bg-amber-500 text-amber-300 group-hover:text-slate-950 font-black text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>WATCH</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
