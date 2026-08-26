import React, { useState, useEffect, useMemo } from "react";
import { 
  SubjectInfo, 
  Chapter, 
  PDFMaterial, 
  YouTubeVideo, 
  MusicTrack, 
  Announcement,
  Conversation,
  BookmarkItem 
} from "../types";
import { OFFICIAL_SUBJECTS } from "../data/bsebClass10Data";
import { AiStudyService } from "../services/aiStudyService";
import { BookmarkService } from "../services/bookmarkService";
import { audioPlayer } from "../services/audioPlayer";
import { DownloadService } from "../services/downloadService";
import { 
  Search, 
  X, 
  FileText, 
  Video, 
  BookOpen, 
  ChevronRight, 
  Layers,
  Music,
  Megaphone,
  Sparkles,
  Bookmark,
  Download,
  Play,
  MessageSquare,
  Clock,
  Check
} from "lucide-react";

interface GlobalSearchModalProps {
  chapters: Chapter[];
  pdfs: PDFMaterial[];
  videos: YouTubeVideo[];
  musicTracks?: MusicTrack[];
  announcements?: Announcement[];
  onClose: () => void;
  onOpenPdf: (pdf: PDFMaterial) => void;
  onOpenVideo: (video: YouTubeVideo) => void;
  onSelectSubject: (subject: SubjectInfo) => void;
  onOpenAiConversation?: (conversationId: string) => void;
}

// Multilingual Synonym / Transliteration Dictionary for BSEB Class 10
const SYNONYM_MAP: Record<string, string[]> = {
  "manav netra": ["मानव नेत्र", "human eye", "रंगबिरंगा संसार", "netra", "eye"],
  "human eye": ["मानव नेत्र", "manav netra", "रंगबिरंगा संसार", "netra"],
  "मानव नेत्र": ["human eye", "manav netra", "रंगबिरंगा संसार", "netra"],
  "prakash": ["प्रकाश", "light", "reflection", "refraction", "परावर्तन", "अपवर्तन"],
  "light": ["प्रकाश", "prakash", "reflection", "refraction", "परावर्तन"],
  "प्रकाश": ["light", "prakash", "reflection", "refraction", "परावर्तन", "अपवर्तन"],
  "vidyut": ["विद्युत", "electricity", "electric current", "धारा", "dhara"],
  "electricity": ["विद्युत", "vidyut", "electric", "current"],
  "विद्युत": ["electricity", "vidyut", "current", "electric"],
  "amla": ["अम्ल", "acid", "acid base", "क्षारक", "lavan", "salt"],
  "acid": ["अम्ल", "amla", "kshar", "acid base"],
  "अम्ल": ["acid", "amla", "kshar", "लवण"],
  "kshar": ["क्षारक", "base", "alkali", "kshar"],
  "dhatu": ["धातु", "metal", "non metal", "अधातु"],
  "metal": ["धातु", "dhatu", "non metal"],
  "jaiv prakram": ["जैव प्रक्रम", "life processes", "nutrition", "respiration"],
  "life processes": ["जैव प्रक्रम", "jaiv prakram"],
  "vastavik": ["वास्तविक", "real numbers", "real number", "संख्याएं", "vastavik sankhya"],
  "real numbers": ["वास्तविक संख्याएं", "vastavik", "संख्याएं"],
  "वास्तविक": ["real numbers", "vastavik", "real number"],
  "trikonmiti": ["त्रिकोणमिति", "trigonometry", "trigo", "sin", "cos", "tan"],
  "trigonometry": ["त्रिकोणमिति", "trikonmiti", "trigo"],
  "त्रिकोणमिति": ["trigonometry", "trikonmiti", "trigo"],
  "samantar": ["समांतर", "ap", "arithmetic progression", "shreni"],
  "ap": ["समांतर श्रेणियाँ", "arithmetic progression", "samantar"],
  "bahupad": ["बहुपद", "polynomials", "polynomial"],
  "polynomial": ["बहुपद", "bahupad"],
  "dvighat": ["द्विघात", "quadratic equation", "quadratic"],
  "quadratic": ["द्विघात", "dvighat"],
  "vrit": ["वृत्त", "circle", "circles"],
  "circle": ["वृत्त", "vrit"],
  "sankhyiki": ["सांख्यिकी", "statistics", "mean", "median", "mode"],
  "statistics": ["सांख्यिकी", "sankhyiki"],
  "prayikta": ["प्रायिकता", "probability"],
  "probability": ["प्रायिकता", "prayikta"],
  "godhuli": ["गोधूलि", "hindi", "हिंदी"],
  "varnika": ["वर्णिका", "hindi", "हिंदी"],
  "mangalam": ["मंगलम्", "sanskrit", "संस्कृत"],
  "itihas": ["इतिहास", "history"],
  "history": ["इतिहास", "itihas"],
  "bhugol": ["भूगोल", "geography"],
  "geography": ["भूगोल", "bhugol"],
  "arthashastra": ["अर्थशास्त्र", "economics"],
  "economics": ["अर्थशास्त्र", "arthashastra"],
  "rajniti": ["राजनीति", "civics", "political science", "लोकतंत्र"],
  "civics": ["राजनीति विज्ञान", "rajniti", "लोकतंत्र"],
  "aapda": ["आपदा", "disaster", "disaster management", "प्रबंधन"],
  "disaster": ["आपदा प्रबंधन", "aapda"]
};

function matchesSmartQuery(text: string, query: string, extraTerms: string[] = []): boolean {
  if (!text && extraTerms.length === 0) return false;
  const q = query.toLowerCase().trim();
  if (!q) return false;

  const target = (text + " " + extraTerms.join(" ")).toLowerCase();

  // 1. Direct substring match
  if (target.includes(q)) return true;

  // 2. Multi-word individual tokens match
  const qWords = q.split(/\s+/).filter(Boolean);
  if (qWords.length > 1 && qWords.every((word) => target.includes(word))) {
    return true;
  }

  // 3. Synonym / Transliteration match
  for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
    if (q.includes(key.toLowerCase()) || key.toLowerCase().includes(q)) {
      if (synonyms.some((syn) => target.includes(syn.toLowerCase()))) {
        return true;
      }
    }
    if (synonyms.some((syn) => q.includes(syn.toLowerCase()))) {
      if (target.includes(key.toLowerCase()) || synonyms.some((syn) => target.includes(syn.toLowerCase()))) {
        return true;
      }
    }
  }

  return false;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  chapters,
  pdfs,
  videos,
  musicTracks = [],
  announcements = [],
  onClose,
  onOpenPdf,
  onOpenVideo,
  onSelectSubject,
  onOpenAiConversation
}) => {
  const [query, setQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "subjects" | "pdfs" | "videos" | "music" | "announcements" | "ai" | "bookmarks"
  >("all");

  // Private user data (AI conversations & Bookmarks)
  const [userConversations, setUserConversations] = useState<Conversation[]>(AiStudyService.getConversations());
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(BookmarkService.getBookmarks());

  useEffect(() => {
    setUserConversations(AiStudyService.getConversations());
    setBookmarks(BookmarkService.getBookmarks());
    const unsubAi = AiStudyService.subscribe(() => {
      setUserConversations(AiStudyService.getConversations());
    });
    const unsubBm = BookmarkService.subscribe(() => {
      setBookmarks(BookmarkService.getBookmarks());
    });
    return () => {
      unsubAi();
      unsubBm();
    };
  }, []);

  const q = query.trim();

  // Matching Subjects
  const matchingSubjects = useMemo(() => {
    if (!q) return [];
    return OFFICIAL_SUBJECTS.filter((s) =>
      matchesSmartQuery(`${s.nameHindi} ${s.nameEnglish} ${s.code} ${s.description}`, q, s.bookNames)
    );
  }, [q]);

  // Matching Chapters
  const matchingChapters = useMemo(() => {
    if (!q) return [];
    return chapters.filter((c) => {
      const parentSub = OFFICIAL_SUBJECTS.find((s) => s.id === c.subjectId);
      const extra = [parentSub?.nameEnglish || "", parentSub?.nameHindi || "", `Chapter ${c.chapterNumber}`];
      return matchesSmartQuery(`${c.titleHindi} ${c.titleEnglish || ""} ${c.subtitle || ""}`, q, extra);
    });
  }, [q, chapters]);

  // Matching PDFs
  const matchingPdfs = useMemo(() => {
    if (!q) return [];
    return pdfs.filter((p) => {
      if (p.isPublished === false) return false;
      const extra = [p.chapterTitle, p.topic || "", ...(p.tags || [])];
      return matchesSmartQuery(`${p.title} ${p.description}`, q, extra);
    });
  }, [q, pdfs]);

  // Matching Videos
  const matchingVideos = useMemo(() => {
    if (!q) return [];
    return videos.filter((v) => {
      if (v.isPublished === false) return false;
      const extra = [v.chapterTitle, v.topic || "", ...(v.tags || [])];
      return matchesSmartQuery(`${v.title} ${v.description}`, q, extra);
    });
  }, [q, videos]);

  // Matching Music
  const matchingMusic = useMemo(() => {
    if (!q) return [];
    return musicTracks.filter((m) => {
      if (m.isPublished === false) return false;
      return matchesSmartQuery(`${m.title} study music background ambient binaural`, q);
    });
  }, [q, musicTracks]);

  // Matching Announcements
  const matchingAnnouncements = useMemo(() => {
    if (!q) return [];
    return announcements.filter((a) => {
      if (a.isPublished === false) return false;
      return matchesSmartQuery(`${a.title} ${a.content} ${a.message || ""}`, q, [a.type || ""]);
    });
  }, [q, announcements]);

  // Matching AI Conversations (Strictly current user private conversations)
  const matchingAiConvs = useMemo(() => {
    if (!q) return [];
    return userConversations.filter((conv) => {
      const messageTexts = conv.messages.map((m) => m.text).join(" ");
      return matchesSmartQuery(`${conv.title} ${conv.currentTopic || ""}`, q, [messageTexts]);
    });
  }, [q, userConversations]);

  // Matching Bookmarks
  const matchingBookmarks = useMemo(() => {
    if (!q) return [];
    return bookmarks.filter((bm) => {
      return matchesSmartQuery(`${bm.title} ${bm.chapterTitle || ""} ${bm.subjectName || ""}`, q, [bm.type]);
    });
  }, [q, bookmarks]);

  const totalResults =
    matchingSubjects.length +
    matchingChapters.length +
    matchingPdfs.length +
    matchingVideos.length +
    matchingMusic.length +
    matchingAnnouncements.length +
    matchingAiConvs.length +
    matchingBookmarks.length;

  const handleToggleBookmark = (
    e: React.MouseEvent,
    item: {
      targetId: string;
      type: "pdf" | "video" | "chapter" | "resource";
      title: string;
      chapterTitle?: string;
      chapterNumber?: number;
      subjectId?: any;
      subjectName?: string;
      fileUrl?: string;
      youtubeUrl?: string;
      youtubeVideoId?: string;
      description?: string;
    }
  ) => {
    e.stopPropagation();
    BookmarkService.toggleBookmark(item);
  };

  const handleOpenBookmark = (bm: BookmarkItem) => {
    if (bm.type === "pdf") {
      const existing = pdfs.find((p) => p.id === bm.targetId);
      if (existing) {
        onOpenPdf(existing);
      } else {
        onOpenPdf({
          id: bm.targetId,
          title: bm.title,
          fileUrl: bm.fileUrl || "",
          chapterTitle: bm.chapterTitle || "Saved PDF",
          subjectId: bm.subjectId || "science",
          chapterId: "bm-ch",
          description: bm.description || "Bookmark note",
          uploadDate: bm.addedAt,
          isPublished: true,
          orderIndex: 0
        });
      }
      onClose();
    } else if (bm.type === "video") {
      const existing = videos.find((v) => v.id === bm.targetId);
      if (existing) {
        onOpenVideo(existing);
      } else {
        onOpenVideo({
          id: bm.targetId,
          title: bm.title,
          youtubeUrl: bm.youtubeUrl || "",
          youtubeVideoId: bm.youtubeVideoId || "",
          chapterTitle: bm.chapterTitle || "Saved Video",
          subjectId: bm.subjectId || "science",
          chapterId: "bm-ch",
          description: bm.description || "Bookmark video",
          uploadDate: bm.addedAt,
          isPublished: true,
          orderIndex: 0
        });
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

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-12 p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900/95 border border-slate-800 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[88vh]">
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center gap-3 shrink-0">
          <Search className="w-6 h-6 text-cyan-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search subjects, chapters, PDFs, videos, music, announcements..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-white text-base sm:text-xl font-semibold focus:outline-none placeholder-slate-500"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0 cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Filter Tabs Header (When Search Active) */}
        {q && totalResults > 0 && (
          <div className="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <button
              onClick={() => setSelectedFilter("all")}
              className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedFilter === "all"
                  ? "bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20"
                  : "bg-slate-800/80 text-slate-400 hover:bg-slate-800"
              }`}
            >
              All Results ({totalResults})
            </button>

            {(matchingSubjects.length > 0 || matchingChapters.length > 0) && (
              <button
                onClick={() => setSelectedFilter("subjects")}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedFilter === "subjects"
                    ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                    : "bg-slate-800/80 text-slate-400 hover:bg-slate-800"
                }`}
              >
                📚 Chapters ({matchingSubjects.length + matchingChapters.length})
              </button>
            )}

            {matchingPdfs.length > 0 && (
              <button
                onClick={() => setSelectedFilter("pdfs")}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedFilter === "pdfs"
                    ? "bg-pink-500 text-white font-black shadow-md shadow-pink-500/20"
                    : "bg-slate-800/80 text-slate-400 hover:bg-slate-800"
                }`}
              >
                📄 PDFs ({matchingPdfs.length})
              </button>
            )}

            {matchingVideos.length > 0 && (
              <button
                onClick={() => setSelectedFilter("videos")}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedFilter === "videos"
                    ? "bg-rose-500 text-white font-black shadow-md shadow-rose-500/20"
                    : "bg-slate-800/80 text-slate-400 hover:bg-slate-800"
                }`}
              >
                🎬 Videos ({matchingVideos.length})
              </button>
            )}

            {matchingMusic.length > 0 && (
              <button
                onClick={() => setSelectedFilter("music")}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedFilter === "music"
                    ? "bg-purple-500 text-white font-black shadow-md shadow-purple-500/20"
                    : "bg-slate-800/80 text-slate-400 hover:bg-slate-800"
                }`}
              >
                🎵 Music ({matchingMusic.length})
              </button>
            )}

            {matchingAnnouncements.length > 0 && (
              <button
                onClick={() => setSelectedFilter("announcements")}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedFilter === "announcements"
                    ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                    : "bg-slate-800/80 text-slate-400 hover:bg-slate-800"
                }`}
              >
                📢 Announcements ({matchingAnnouncements.length})
              </button>
            )}

            {matchingAiConvs.length > 0 && (
              <button
                onClick={() => setSelectedFilter("ai")}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedFilter === "ai"
                    ? "bg-cyan-400 text-slate-950 font-black shadow-md shadow-cyan-400/20"
                    : "bg-slate-800/80 text-slate-400 hover:bg-slate-800"
                }`}
              >
                🤖 My AI Chats ({matchingAiConvs.length})
              </button>
            )}

            {matchingBookmarks.length > 0 && (
              <button
                onClick={() => setSelectedFilter("bookmarks")}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedFilter === "bookmarks"
                    ? "bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20"
                    : "bg-slate-800/80 text-slate-400 hover:bg-slate-800"
                }`}
              >
                ⭐️ Bookmarks ({matchingBookmarks.length})
              </button>
            )}
          </div>
        )}

        {/* Results Container */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 bg-slate-950/50">
          {!q ? (
            <div className="text-center py-12 text-slate-400 space-y-3">
              <Search className="w-12 h-12 mx-auto text-slate-600 mb-1" />
              <p className="text-lg font-bold text-slate-300">Smart Multilingual Global Search</p>
              <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
                विषय, अध्याय, PDF नोट्स, वीडियो क्लासेस, बोर्ड सूचनाएं या निजी AI चर्चाएं खोजें। (उदा. "मानव नेत्र", "Human Eye", "manav netra", "प्रकाश", "Maths", "Science")
              </p>
              {/* Quick Suggestion Chips */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
                {["मानव नेत्र", "प्रकाश", "विद्युत", "वास्तविक संख्याएँ", "त्रिकोणमिति", "गोधूलि", "मंगलम्"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-3 py-1 rounded-full bg-slate-800 hover:bg-cyan-500/20 border border-slate-700 hover:border-cyan-500/40 text-xs font-semibold text-slate-300 hover:text-cyan-300 transition-all cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : totalResults === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <Layers className="w-12 h-12 mx-auto text-slate-600 mb-2" />
              <p className="text-lg font-bold text-slate-300">No matching study resources found</p>
              <p className="text-xs sm:text-sm text-slate-500">
                "{q}" के लिए कोई परिणाम नहीं मिला। कृपया वर्तनी या अन्य कीवर्ड्स जांचें।
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 1. Subjects & Chapters */}
              {(selectedFilter === "all" || selectedFilter === "subjects") && (
                <>
                  {matchingSubjects.length > 0 && (
                    <div>
                      <h4 className="text-xs font-mono font-black text-amber-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4" />
                        <span>Subjects ({matchingSubjects.length})</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {matchingSubjects.map((sub) => (
                          <div
                            key={sub.id}
                            onClick={() => {
                              onSelectSubject(sub);
                              onClose();
                            }}
                            className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-400 cursor-pointer flex items-center justify-between text-white transition-colors"
                          >
                            <div>
                              <span className="text-xs font-mono text-amber-400 font-bold">{sub.code}</span>
                              <p className="font-bold text-base sm:text-lg">{sub.nameHindi} ({sub.nameEnglish})</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-amber-400" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {matchingChapters.length > 0 && (
                    <div>
                      <h4 className="text-xs font-mono font-black text-cyan-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Layers className="w-4 h-4" />
                        <span>Chapters ({matchingChapters.length})</span>
                      </h4>
                      <div className="space-y-2.5">
                        {matchingChapters.map((ch) => {
                          const parentSub = OFFICIAL_SUBJECTS.find((s) => s.id === ch.subjectId);
                          const isBookmarked = BookmarkService.isBookmarked(ch.id);
                          return (
                            <div
                              key={ch.id}
                              onClick={() => {
                                if (parentSub) {
                                  onSelectSubject(parentSub);
                                  onClose();
                                }
                              }}
                              className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-400 cursor-pointer flex items-center justify-between text-white transition-colors gap-3"
                            >
                              <div className="min-w-0">
                                <span className="text-xs text-amber-400 font-bold">
                                  {parentSub?.nameHindi} • Chapter {ch.chapterNumber}
                                </span>
                                <p className="font-bold text-base text-slate-100 mt-0.5 truncate">{ch.titleHindi}</p>
                                {ch.subtitle && <p className="text-xs text-slate-400 truncate">{ch.subtitle}</p>}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={(e) =>
                                    handleToggleBookmark(e, {
                                      targetId: ch.id,
                                      type: "chapter",
                                      title: ch.titleHindi,
                                      chapterTitle: `Chapter ${ch.chapterNumber}: ${ch.titleHindi}`,
                                      chapterNumber: ch.chapterNumber,
                                      subjectId: ch.subjectId,
                                      subjectName: parentSub?.nameHindi
                                    })
                                  }
                                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                                    isBookmarked
                                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                      : "bg-slate-800 text-slate-400 hover:text-amber-400"
                                  }`}
                                  title={isBookmarked ? "Remove Bookmark" : "Save Bookmark"}
                                >
                                  <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-amber-400" : ""}`} />
                                </button>
                                <ChevronRight className="w-5 h-5 text-cyan-400" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* 2. PDF Study Materials */}
              {(selectedFilter === "all" || selectedFilter === "pdfs") && matchingPdfs.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono font-black text-pink-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    <span>PDF Study Materials ({matchingPdfs.length})</span>
                  </h4>
                  <div className="space-y-2.5">
                    {matchingPdfs.map((pdf) => {
                      const isBookmarked = BookmarkService.isBookmarked(pdf.id);
                      return (
                        <div
                          key={pdf.id}
                          onClick={() => {
                            onOpenPdf(pdf);
                            onClose();
                          }}
                          className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-pink-400 cursor-pointer flex items-center justify-between text-white transition-colors gap-3"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="p-2.5 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30 shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs text-pink-300 font-bold truncate block">{pdf.chapterTitle}</span>
                              <p className="font-bold text-sm sm:text-base truncate text-white">{pdf.title}</p>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                {pdf.fileSizeMb || "2.4"} MB • {pdf.pageCount || 10} Pages
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                DownloadService.triggerDeviceDownload(pdf.fileUrl, `${pdf.title}.pdf`, {
                                  id: pdf.id,
                                  title: pdf.title,
                                  fileType: "pdf",
                                  subjectId: pdf.subjectId,
                                  chapterTitle: pdf.chapterTitle,
                                  fileSize: `${pdf.fileSizeMb || 2.4} MB`
                                });
                              }}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            <button
                              onClick={(e) =>
                                handleToggleBookmark(e, {
                                  targetId: pdf.id,
                                  type: "pdf",
                                  title: pdf.title,
                                  chapterTitle: pdf.chapterTitle,
                                  subjectId: pdf.subjectId,
                                  fileUrl: pdf.fileUrl
                                })
                              }
                              className={`p-2 rounded-xl transition-all cursor-pointer ${
                                isBookmarked
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : "bg-slate-800 text-slate-400 hover:text-amber-400"
                              }`}
                              title={isBookmarked ? "Remove Bookmark" : "Save Bookmark"}
                            >
                              <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-amber-400" : ""}`} />
                            </button>

                            <ChevronRight className="w-5 h-5 text-pink-400" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Video Lectures */}
              {(selectedFilter === "all" || selectedFilter === "videos") && matchingVideos.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono font-black text-rose-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Video className="w-4 h-4" />
                    <span>Video Lectures ({matchingVideos.length})</span>
                  </h4>
                  <div className="space-y-2.5">
                    {matchingVideos.map((vid) => {
                      const isBookmarked = BookmarkService.isBookmarked(vid.id);
                      return (
                        <div
                          key={vid.id}
                          onClick={() => {
                            onOpenVideo(vid);
                            onClose();
                          }}
                          className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-400 cursor-pointer flex items-center justify-between text-white transition-colors gap-3"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                              <Video className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs text-rose-300 font-bold truncate block">{vid.chapterTitle}</span>
                              <p className="font-bold text-sm sm:text-base truncate text-white">{vid.title}</p>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                {vid.durationText || "Class Lecture"} • YouTube Live
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={(e) =>
                                handleToggleBookmark(e, {
                                  targetId: vid.id,
                                  type: "video",
                                  title: vid.title,
                                  chapterTitle: vid.chapterTitle,
                                  subjectId: vid.subjectId,
                                  youtubeUrl: vid.youtubeUrl,
                                  youtubeVideoId: vid.youtubeVideoId
                                })
                              }
                              className={`p-2 rounded-xl transition-all cursor-pointer ${
                                isBookmarked
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : "bg-slate-800 text-slate-400 hover:text-amber-400"
                              }`}
                              title={isBookmarked ? "Remove Bookmark" : "Save Bookmark"}
                            >
                              <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-amber-400" : ""}`} />
                            </button>
                            <ChevronRight className="w-5 h-5 text-rose-400" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. Study Music Tracks */}
              {(selectedFilter === "all" || selectedFilter === "music") && matchingMusic.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono font-black text-purple-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Music className="w-4 h-4" />
                    <span>Focus & Study Music ({matchingMusic.length})</span>
                  </h4>
                  <div className="space-y-2.5">
                    {matchingMusic.map((track) => (
                      <div
                        key={track.id}
                        onClick={() => {
                          audioPlayer.togglePlay(track);
                          onClose();
                        }}
                        className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-400 cursor-pointer flex items-center justify-between text-white transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shrink-0">
                            <Play className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm sm:text-base truncate text-white">{track.title}</p>
                            <p className="text-[11px] text-purple-300 font-mono">
                              {track.durationText || "Calm Ambient Loop"}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-purple-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Board Announcements & Updates */}
              {(selectedFilter === "all" || selectedFilter === "announcements") && matchingAnnouncements.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono font-black text-emerald-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Megaphone className="w-4 h-4" />
                    <span>Official Announcements ({matchingAnnouncements.length})</span>
                  </h4>
                  <div className="space-y-2.5">
                    {matchingAnnouncements.map((ann) => (
                      <div
                        key={ann.id}
                        onClick={() => {
                          if (ann.actionUrl) {
                            window.open(ann.actionUrl, "_blank");
                          }
                        }}
                        className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-400 text-white transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                            {ann.type || "OFFICIAL UPDATE"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{ann.date}</span>
                        </div>
                        <h5 className="font-bold text-base text-slate-100">{ann.title}</h5>
                        <p className="text-xs text-slate-300 mt-1 line-clamp-2">{ann.content || ann.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Private AI Study Assistant Chats */}
              {(selectedFilter === "all" || selectedFilter === "ai") && matchingAiConvs.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono font-black text-cyan-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>My AI Study Conversations ({matchingAiConvs.length})</span>
                  </h4>
                  <div className="space-y-2.5">
                    {matchingAiConvs.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => {
                          AiStudyService.setActiveConversationId(conv.id);
                          if (onOpenAiConversation) {
                            onOpenAiConversation(conv.id);
                          }
                          onClose();
                        }}
                        className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-400 cursor-pointer flex items-center justify-between text-white transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                            <MessageSquare className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm sm:text-base truncate text-white">{conv.title}</p>
                            <p className="text-[11px] text-cyan-300 font-mono">
                              {conv.messages.length} messages • Updated {new Date(conv.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-cyan-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. Bookmarks / Saved Resources */}
              {(selectedFilter === "all" || selectedFilter === "bookmarks") && matchingBookmarks.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono font-black text-amber-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Bookmark className="w-4 h-4 fill-amber-400" />
                    <span>Saved Bookmarks ({matchingBookmarks.length})</span>
                  </h4>
                  <div className="space-y-2.5">
                    {matchingBookmarks.map((bm) => (
                      <div
                        key={bm.id}
                        onClick={() => handleOpenBookmark(bm)}
                        className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-400 cursor-pointer flex items-center justify-between text-white transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                            <Bookmark className="w-5 h-5 fill-amber-400" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs text-amber-300 font-bold uppercase tracking-wider truncate block">
                              {bm.type.toUpperCase()} • {bm.chapterTitle || "SAVED"}
                            </span>
                            <p className="font-bold text-sm sm:text-base truncate text-white">{bm.title}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-amber-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Smart Hindi & English Search enabled</span>
          <span>{totalResults} items found</span>
        </div>
      </div>
    </div>
  );
};
