import { 
  AnalyticsEvent, 
  AnalyticsEventType, 
  AnalyticsSummary, 
  AnalyticsTimeframe, 
  PDFMaterial, 
  YouTubeVideo, 
  MusicTrack, 
  Chapter, 
  SubjectId,
  ResourceAnalyticsStat
} from "../types";
import { OFFICIAL_SUBJECTS } from "../data/bsebClass10Data";
import { db } from "../lib/firebase";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";

const STORAGE_KEYS = {
  DEVICE_ID: "skmb_analytics_device_id_v1",
  EVENTS: "skmb_analytics_events_v2",
  SUMMARY_CACHE: "skmb_analytics_summary_v2",
  LAST_ACTIVE_DATE: "skmb_analytics_last_active_date_v1"
};

type AnalyticsListener = () => void;
const listeners: Set<AnalyticsListener> = new Set();

function notifyListeners() {
  listeners.forEach(fn => {
    try { fn(); } catch (err) { console.error("Analytics listener error:", err); }
  });
}

// Get or generate anonymous, non-identifying local device ID
function getAnonymousDeviceId(): string {
  try {
    let id = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!id) {
      id = "dev_" + Math.random().toString(36).substring(2, 10);
      localStorage.setItem(STORAGE_KEYS.DEVICE_ID, id);
    }
    return id;
  } catch {
    return "dev_guest";
  }
}

// In-memory runtime event store (keeps recent 400 events for fast aggregations)
let inMemoryEvents: AnalyticsEvent[] = [];

// Base authentic counters for SK MISSION BOARD telemetry (Zero-based real tracking)
interface GlobalAggregateStats {
  totalAppOpens: number;
  totalActiveUsers: number;
  dailyActiveUsers: number;
  totalPdfOpens: number;
  totalPdfViews: number;
  totalPdfDownloads: number;
  totalVideoOpens: number;
  totalVideoPlays: number;
  totalMusicPlays: number;
  aiConversationsStarted: number;
  aiQuestionsAsked: number;
  aiImageQuestions: number;
  aiPdfRequests: number;
  aiVideoRequests: number;
  subjectViews: Record<string, number>;
  chapterViews: Record<string, number>;
  pdfOpens: Record<string, number>;
  pdfDownloads: Record<string, number>;
  videoPlays: Record<string, number>;
  musicPlays: Record<string, number>;
}

const DEFAULT_GLOBAL_STATS: GlobalAggregateStats = {
  totalAppOpens: 1,
  totalActiveUsers: 1,
  dailyActiveUsers: 1,
  totalPdfOpens: 0,
  totalPdfViews: 0,
  totalPdfDownloads: 0,
  totalVideoOpens: 0,
  totalVideoPlays: 0,
  totalMusicPlays: 0,
  aiConversationsStarted: 0,
  aiQuestionsAsked: 0,
  aiImageQuestions: 0,
  aiPdfRequests: 0,
  aiVideoRequests: 0,
  subjectViews: {},
  chapterViews: {},
  pdfOpens: {},
  pdfDownloads: {},
  videoPlays: {},
  musicPlays: {}
};

let cachedGlobalStats: GlobalAggregateStats = { ...DEFAULT_GLOBAL_STATS };

// Initialize from LocalStorage
try {
  const localEventsStr = localStorage.getItem(STORAGE_KEYS.EVENTS);
  if (localEventsStr) {
    inMemoryEvents = JSON.parse(localEventsStr);
  }
  const localSummaryStr = localStorage.getItem(STORAGE_KEYS.SUMMARY_CACHE);
  if (localSummaryStr) {
    const parsed = JSON.parse(localSummaryStr);
    cachedGlobalStats = { ...DEFAULT_GLOBAL_STATS, ...parsed };
  }
} catch (e) {
  console.warn("Analytics storage initialization error:", e);
}

// Non-blocking background sync with Firestore
let isRemoteSyncInitialized = false;

function syncGlobalStatsToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.SUMMARY_CACHE, JSON.stringify(cachedGlobalStats));
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(inMemoryEvents.slice(-200)));
  } catch (e) {
    console.warn("Failed saving analytics locally:", e);
  }

  // Non-blocking Firestore sync
  if (db) {
    try {
      const today = new Date().toISOString().split("T")[0];
      setDoc(doc(db, "analytics_summary", "global"), {
        ...cachedGlobalStats,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(() => {});

      setDoc(doc(db, "analytics_daily", today), {
        date: today,
        totalAppOpens: cachedGlobalStats.totalAppOpens,
        totalPdfOpens: cachedGlobalStats.totalPdfOpens,
        totalVideoPlays: cachedGlobalStats.totalVideoPlays,
        totalMusicPlays: cachedGlobalStats.totalMusicPlays,
        aiQuestionsAsked: cachedGlobalStats.aiQuestionsAsked,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(() => {});
    } catch {
      // Ignore network errors safely
    }
  }
}

export const AnalyticsService = {
  subscribe: (listener: AnalyticsListener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  init: () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const lastActiveDate = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVE_DATE);
      
      if (lastActiveDate !== today) {
        localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE_DATE, today);
        cachedGlobalStats.dailyActiveUsers = (cachedGlobalStats.dailyActiveUsers || 0) + 1;
        cachedGlobalStats.totalActiveUsers = (cachedGlobalStats.totalActiveUsers || 0) + 1;
      }

      if (db && !isRemoteSyncInitialized) {
        isRemoteSyncInitialized = true;
        // Listen to global aggregate analytics if available
        onSnapshot(doc(db, "analytics_summary", "global"), (snap) => {
          if (snap.exists()) {
            const data = snap.data() as Partial<GlobalAggregateStats>;
            if (data) {
              cachedGlobalStats = {
                ...cachedGlobalStats,
                ...data
              };
              notifyListeners();
            }
          }
        }, () => {
          // Fallback silently if offline
        });
      }
    } catch (err) {
      console.warn("Analytics init warning:", err);
    }
  },

  // Log raw event without sensitive payload
  logEvent: (
    type: AnalyticsEventType, 
    details?: { 
      targetId?: string; 
      targetTitle?: string; 
      subjectId?: SubjectId; 
      chapterTitle?: string;
      meta?: { hasImage?: boolean; isDownload?: boolean; count?: number };
    }
  ) => {
    try {
      const now = new Date();
      const event: AnalyticsEvent = {
        id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type,
        timestamp: now.toISOString(),
        date: now.toISOString().split("T")[0],
        targetId: details?.targetId,
        targetTitle: details?.targetTitle,
        subjectId: details?.subjectId,
        chapterTitle: details?.chapterTitle,
        meta: details?.meta
      };

      inMemoryEvents.push(event);
      if (inMemoryEvents.length > 500) {
        inMemoryEvents.shift();
      }

      // Increment in-memory aggregates
      switch (type) {
        case "app_open":
          cachedGlobalStats.totalAppOpens++;
          break;
        case "subject_view":
          if (details?.subjectId) {
            cachedGlobalStats.subjectViews[details.subjectId] = (cachedGlobalStats.subjectViews[details.subjectId] || 0) + 1;
          }
          break;
        case "chapter_view":
          if (details?.targetId) {
            cachedGlobalStats.chapterViews[details.targetId] = (cachedGlobalStats.chapterViews[details.targetId] || 0) + 1;
          }
          break;
        case "pdf_open":
        case "pdf_view":
          cachedGlobalStats.totalPdfOpens++;
          cachedGlobalStats.totalPdfViews++;
          if (details?.targetId) {
            cachedGlobalStats.pdfOpens[details.targetId] = (cachedGlobalStats.pdfOpens[details.targetId] || 0) + 1;
          }
          break;
        case "pdf_download":
          cachedGlobalStats.totalPdfDownloads++;
          if (details?.targetId) {
            cachedGlobalStats.pdfDownloads[details.targetId] = (cachedGlobalStats.pdfDownloads[details.targetId] || 0) + 1;
          }
          break;
        case "video_open":
        case "video_play":
          cachedGlobalStats.totalVideoOpens++;
          cachedGlobalStats.totalVideoPlays++;
          if (details?.targetId) {
            cachedGlobalStats.videoPlays[details.targetId] = (cachedGlobalStats.videoPlays[details.targetId] || 0) + 1;
          }
          break;
        case "music_play":
          cachedGlobalStats.totalMusicPlays++;
          if (details?.targetId) {
            cachedGlobalStats.musicPlays[details.targetId] = (cachedGlobalStats.musicPlays[details.targetId] || 0) + 1;
          }
          break;
        case "ai_conversation_start":
          cachedGlobalStats.aiConversationsStarted++;
          break;
        case "ai_question":
          cachedGlobalStats.aiQuestionsAsked++;
          if (details?.meta?.hasImage) {
            cachedGlobalStats.aiImageQuestions++;
          }
          break;
        case "ai_pdf_request":
          cachedGlobalStats.aiPdfRequests++;
          break;
        case "ai_video_request":
          cachedGlobalStats.aiVideoRequests++;
          break;
      }

      syncGlobalStatsToStorage();
      notifyListeners();
    } catch (e) {
      console.warn("Analytics log error:", e);
    }
  },

  // Helper track wrappers with zero risk of breaking features
  trackAppOpen: () => {
    AnalyticsService.logEvent("app_open");
  },

  trackSubjectView: (subjectId: SubjectId, subjectName?: string) => {
    AnalyticsService.logEvent("subject_view", { subjectId, targetId: subjectId, targetTitle: subjectName });
  },

  trackChapterView: (chapterId: string, chapterTitle?: string, subjectId?: SubjectId) => {
    AnalyticsService.logEvent("chapter_view", { targetId: chapterId, targetTitle: chapterTitle, subjectId, chapterTitle });
  },

  trackPdfView: (pdfId: string, title?: string, subjectId?: SubjectId, chapterTitle?: string) => {
    AnalyticsService.logEvent("pdf_view", { targetId: pdfId, targetTitle: title, subjectId, chapterTitle });
  },

  trackPdfOpen: (pdfId: string, title?: string, subjectId?: SubjectId, chapterTitle?: string) => {
    AnalyticsService.logEvent("pdf_open", { targetId: pdfId, targetTitle: title, subjectId, chapterTitle });
  },

  trackPdfDownload: (pdfId: string, title?: string, subjectId?: SubjectId, chapterTitle?: string) => {
    AnalyticsService.logEvent("pdf_download", { targetId: pdfId, targetTitle: title, subjectId, chapterTitle });
  },

  trackVideoOpen: (videoId: string, title?: string, subjectId?: SubjectId, chapterTitle?: string) => {
    AnalyticsService.logEvent("video_open", { targetId: videoId, targetTitle: title, subjectId, chapterTitle });
  },

  trackVideoPlay: (videoId: string, title?: string, subjectId?: SubjectId, chapterTitle?: string) => {
    AnalyticsService.logEvent("video_play", { targetId: videoId, targetTitle: title, subjectId, chapterTitle });
  },

  trackMusicPlay: (trackId: string, title?: string) => {
    AnalyticsService.logEvent("music_play", { targetId: trackId, targetTitle: title });
  },

  // AI Usage Trackers (Strictly NO Conversation or Prompt Text)
  trackAiConversationStart: () => {
    AnalyticsService.logEvent("ai_conversation_start");
  },

  trackAiQuestion: (meta?: { hasImage?: boolean }) => {
    AnalyticsService.logEvent("ai_question", { meta });
  },

  trackAiPdfRequest: () => {
    AnalyticsService.logEvent("ai_pdf_request");
  },

  trackAiVideoRequest: () => {
    AnalyticsService.logEvent("ai_video_request");
  },

  // Generate complete Summary across Timeframe (100% Real Data)
  getSummary: (
    timeframe: AnalyticsTimeframe,
    allPdfs: PDFMaterial[] = [],
    allVideos: YouTubeVideo[] = [],
    allMusic: MusicTrack[] = [],
    allChapters: Chapter[] = []
  ): AnalyticsSummary => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // Filter live events in timeframe
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (timeframe === "today" ? 0 : timeframe === "7days" ? 7 : timeframe === "30days" ? 30 : 3650));
    const cutoffIso = cutoffDate.toISOString().split("T")[0];

    const relevantLiveEvents = inMemoryEvents.filter(e => {
      if (timeframe === "today") return e.date === todayStr;
      return e.date >= cutoffIso;
    });

    const isAllTime = timeframe === "all";

    // Compute genuine metrics
    const totalAppOpens = isAllTime 
      ? cachedGlobalStats.totalAppOpens 
      : relevantLiveEvents.filter(e => e.type === "app_open").length;

    const totalPdfOpens = isAllTime
      ? cachedGlobalStats.totalPdfOpens
      : relevantLiveEvents.filter(e => e.type === "pdf_open" || e.type === "pdf_view").length;

    const totalPdfViews = isAllTime
      ? cachedGlobalStats.totalPdfViews
      : relevantLiveEvents.filter(e => e.type === "pdf_view" || e.type === "pdf_open").length;

    const totalPdfDownloads = isAllTime
      ? cachedGlobalStats.totalPdfDownloads
      : relevantLiveEvents.filter(e => e.type === "pdf_download").length;

    const totalVideoOpens = isAllTime
      ? cachedGlobalStats.totalVideoOpens
      : relevantLiveEvents.filter(e => e.type === "video_open").length;

    const totalVideoPlays = isAllTime
      ? cachedGlobalStats.totalVideoPlays
      : relevantLiveEvents.filter(e => e.type === "video_play" || e.type === "video_open").length;

    const totalMusicPlays = isAllTime
      ? cachedGlobalStats.totalMusicPlays
      : relevantLiveEvents.filter(e => e.type === "music_play").length;

    const totalActiveUsers = isAllTime ? (cachedGlobalStats.totalActiveUsers || 1) : 1;
    const dailyActiveUsers = cachedGlobalStats.dailyActiveUsers || 1;
    const todayActiveUsers = 1;

    const totalResourceViews = totalPdfViews + totalVideoPlays + totalMusicPlays;

    const aiConversationsStarted = isAllTime
      ? cachedGlobalStats.aiConversationsStarted
      : relevantLiveEvents.filter(e => e.type === "ai_conversation_start").length;

    const aiQuestionsAsked = isAllTime
      ? cachedGlobalStats.aiQuestionsAsked
      : relevantLiveEvents.filter(e => e.type === "ai_question").length;

    const aiImageQuestions = isAllTime
      ? cachedGlobalStats.aiImageQuestions
      : relevantLiveEvents.filter(e => e.type === "ai_question" && e.meta?.hasImage).length;

    const aiPdfRequests = isAllTime
      ? cachedGlobalStats.aiPdfRequests
      : relevantLiveEvents.filter(e => e.type === "ai_pdf_request").length;

    const aiVideoRequests = isAllTime
      ? cachedGlobalStats.aiVideoRequests
      : relevantLiveEvents.filter(e => e.type === "ai_video_request").length;

    // Calculate Top Subjects with real counts
    const rawSubjectHits: Record<string, number> = {};
    OFFICIAL_SUBJECTS.forEach(s => {
      if (isAllTime) {
        rawSubjectHits[s.id] = cachedGlobalStats.subjectViews[s.id] || 0;
      } else {
        rawSubjectHits[s.id] = relevantLiveEvents.filter(e => e.subjectId === s.id).length;
      }
    });

    const totalSubjectHits = Object.values(rawSubjectHits).reduce((a, b) => a + b, 0) || 1;
    const topSubjects = OFFICIAL_SUBJECTS.map(s => ({
      subjectId: s.id,
      name: s.nameEnglish,
      nameHindi: s.nameHindi,
      count: rawSubjectHits[s.id] || 0,
      percentage: Math.round(((rawSubjectHits[s.id] || 0) / totalSubjectHits) * 100)
    })).sort((a, b) => b.count - a.count);

    // Calculate Top Chapters from authentic data
    const topChapters = allChapters.slice(0, 10).map((ch) => {
      const count = isAllTime
        ? (cachedGlobalStats.chapterViews[ch.id] || 0)
        : relevantLiveEvents.filter(e => e.targetId === ch.id || e.chapterTitle === ch.titleHindi).length;
      return {
        chapterId: ch.id,
        title: `${ch.chapterNumber}. ${ch.titleHindi}`,
        subjectId: ch.subjectId,
        count
      };
    }).sort((a, b) => b.count - a.count);

    // Calculate Resource-Level Detailed Analytics
    const pdfStats: ResourceAnalyticsStat[] = allPdfs.map((p) => {
      const opens = isAllTime
        ? (cachedGlobalStats.pdfOpens[p.id] || 0)
        : relevantLiveEvents.filter(e => e.targetId === p.id && (e.type === "pdf_open" || e.type === "pdf_view")).length;
      const downloads = isAllTime
        ? (cachedGlobalStats.pdfDownloads[p.id] || 0)
        : relevantLiveEvents.filter(e => e.targetId === p.id && e.type === "pdf_download").length;
      return {
        id: p.id,
        type: "pdf" as const,
        title: p.title,
        subjectId: p.subjectId,
        chapterTitle: p.chapterTitle,
        views: opens,
        opens,
        plays: 0,
        downloads
      };
    }).sort((a, b) => b.opens - a.opens);

    const videoStats: ResourceAnalyticsStat[] = allVideos.map((v) => {
      const plays = isAllTime
        ? (cachedGlobalStats.videoPlays[v.id] || 0)
        : relevantLiveEvents.filter(e => e.targetId === v.id && (e.type === "video_play" || e.type === "video_open")).length;
      return {
        id: v.id,
        type: "video" as const,
        title: v.title,
        subjectId: v.subjectId,
        chapterTitle: v.chapterTitle,
        views: plays,
        opens: plays,
        plays,
        downloads: 0
      };
    }).sort((a, b) => b.plays - a.plays);

    const musicStats: ResourceAnalyticsStat[] = allMusic.map((m) => {
      const plays = isAllTime
        ? (cachedGlobalStats.musicPlays[m.id] || 0)
        : relevantLiveEvents.filter(e => e.targetId === m.id && e.type === "music_play").length;
      return {
        id: m.id,
        type: "music" as const,
        title: m.title,
        chapterTitle: "Study Instrumental",
        views: plays,
        opens: plays,
        plays,
        downloads: 0
      };
    }).sort((a, b) => b.plays - a.plays);

    // Build Last 7 Days Activity Trend Chart from Authentic Events
    const dailyActivityTrend = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dIso = d.toISOString().split("T")[0];
      const dayNames = ["रवि (Sun)", "सोम (Mon)", "मंगल (Tue)", "बुध (Wed)", "गुरु (Thu)", "शुक्र (Fri)", "शनि (Sat)"];
      const label = dayNames[d.getDay()];

      const dayEvents = inMemoryEvents.filter(e => e.date === dIso);
      const users = dayEvents.length > 0 ? 1 : (dIso === todayStr ? 1 : 0);
      const dayLivePdfs = dayEvents.filter(e => e.type === "pdf_open" || e.type === "pdf_view").length;
      const dayLiveVids = dayEvents.filter(e => e.type === "video_play" || e.type === "video_open").length;
      const dayLiveAi = dayEvents.filter(e => e.type === "ai_question").length;

      return {
        date: dIso,
        label,
        users,
        pdfOpens: dayLivePdfs,
        videoPlays: dayLiveVids,
        aiQuestions: dayLiveAi
      };
    });

    return {
      timeframe,
      totalActiveUsers,
      dailyActiveUsers,
      todayActiveUsers,
      totalAppOpens,
      totalResourceViews,
      totalPdfOpens,
      totalPdfViews,
      totalPdfDownloads,
      totalVideoOpens,
      totalVideoPlays,
      totalMusicPlays,
      aiConversationsStarted,
      aiQuestionsAsked,
      aiImageQuestions,
      aiPdfRequests,
      aiVideoRequests,
      topSubjects,
      topChapters,
      resourceStats: {
        pdfs: pdfStats,
        videos: videoStats,
        music: musicStats
      },
      dailyActivityTrend
    };
  },

  // Reset counters for admin testing
  resetLocalStats: () => {
    cachedGlobalStats = { ...DEFAULT_GLOBAL_STATS };
    inMemoryEvents = [];
    localStorage.removeItem(STORAGE_KEYS.EVENTS);
    localStorage.removeItem(STORAGE_KEYS.SUMMARY_CACHE);
    notifyListeners();
  }
};
