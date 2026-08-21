import { PDFMaterial, YouTubeVideo, Announcement, AppVersionInfo, Chapter, SubjectId, MusicTrack, RemoteFeatureFlags } from "../types";
import { INITIAL_PDFS, INITIAL_YOUTUBE_VIDEOS, INITIAL_ANNOUNCEMENTS, CURRENT_APP_VERSION, INITIAL_CHAPTERS, INITIAL_MUSIC_TRACKS } from "../data/bsebClass10Data";
import { db } from "../lib/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  deleteDoc, 
  onSnapshot, 
  getDocs,
  writeBatch
} from "firebase/firestore";

export const DEFAULT_FEATURE_FLAGS: RemoteFeatureFlags = {
  ai: true,
  music: true,
  videos: true,
  pdfSearch: true,
  announcements: true,
  globalSearch: true,
  bookmarks: true
};

const STORAGE_KEYS = {
  PDFS: "skmb_pdfs_v2",
  VIDEOS: "skmb_videos_v2",
  ANNOUNCEMENTS: "skmb_announcements_v2",
  VERSION: "skmb_version_v2",
  CHAPTERS: "skmb_chapters_v2",
  MUSIC: "skmb_music_v2",
  THEME_VIDEO: "skmb_theme_video_v2",
  FEATURE_FLAGS: "skmb_feature_flags_v2",
  DISMISSED_ANNOUNCEMENTS: "skmb_dismissed_announcements_v1",
  SEEN_WHATS_NEW_VERSION: "skmb_seen_whats_new_version_v1",
  ADMIN_PIN: "skmb_admin_pin_v1"
};

type DataChangeCallback = () => void;
const subscribers: Set<DataChangeCallback> = new Set();

function notifySubscribers() {
  subscribers.forEach(cb => {
    try { cb(); } catch (e) { console.error(e); }
  });
}

// In-memory runtime cache for 0ms access
let cachedChapters: Chapter[] = INITIAL_CHAPTERS;
let cachedPdfs: PDFMaterial[] = INITIAL_PDFS;
let cachedVideos: YouTubeVideo[] = INITIAL_YOUTUBE_VIDEOS;
let cachedAnnouncements: Announcement[] = INITIAL_ANNOUNCEMENTS;
let cachedVersion: AppVersionInfo = CURRENT_APP_VERSION;
let cachedMusic: MusicTrack[] = INITIAL_MUSIC_TRACKS;
let cachedThemeVideo: string = "/bg_theme.mp4";
let cachedFeatureFlags: RemoteFeatureFlags = { ...DEFAULT_FEATURE_FLAGS };
let cachedDismissedAnnouncements: string[] = [];

// Initialize cache from localStorage
try {
  const localChapters = localStorage.getItem(STORAGE_KEYS.CHAPTERS);
  if (localChapters) cachedChapters = JSON.parse(localChapters);
  const localPdfs = localStorage.getItem(STORAGE_KEYS.PDFS);
  if (localPdfs) cachedPdfs = JSON.parse(localPdfs);
  const localVideos = localStorage.getItem(STORAGE_KEYS.VIDEOS);
  if (localVideos) cachedVideos = JSON.parse(localVideos);
  const localAnn = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
  if (localAnn) cachedAnnouncements = JSON.parse(localAnn);
  const localVer = localStorage.getItem(STORAGE_KEYS.VERSION);
  if (localVer) cachedVersion = JSON.parse(localVer);
  const localMusic = localStorage.getItem(STORAGE_KEYS.MUSIC);
  if (localMusic) cachedMusic = JSON.parse(localMusic);
  const localThemeVideo = localStorage.getItem(STORAGE_KEYS.THEME_VIDEO);
  if (localThemeVideo && localThemeVideo.trim()) cachedThemeVideo = localThemeVideo.trim();
  const localFlags = localStorage.getItem(STORAGE_KEYS.FEATURE_FLAGS);
  if (localFlags) {
    const parsed = JSON.parse(localFlags);
    cachedFeatureFlags = { ...DEFAULT_FEATURE_FLAGS, ...parsed };
  }
  const localDismissed = localStorage.getItem(STORAGE_KEYS.DISMISSED_ANNOUNCEMENTS);
  if (localDismissed) cachedDismissedAnnouncements = JSON.parse(localDismissed);
} catch (e) {
  console.warn("Local storage parse error:", e);
}

let isFirestoreInitialized = false;

export const StoreService = {
  // Subscribe to real-time updates across the app
  subscribe: (callback: DataChangeCallback) => {
    subscribers.add(callback);
    return () => {
      subscribers.delete(callback);
    };
  },

  // Theme Video API
  getThemeVideoUrl: (): string => {
    return cachedThemeVideo;
  },

  setThemeVideoUrl: async (url: string) => {
    cachedThemeVideo = url.trim();
    localStorage.setItem(STORAGE_KEYS.THEME_VIDEO, cachedThemeVideo);
    notifySubscribers();

    if (db) {
      try {
        await setDoc(doc(db, "meta", "theme_video"), { url: cachedThemeVideo, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (e) {
        console.warn("Firestore save theme video error:", e);
      }
    }
  },

  // Initialize Firestore listeners for multi-device realtime sync
  initRealtimeSync: async () => {
    if (isFirestoreInitialized || !db) return;
    isFirestoreInitialized = true;

    try {
      // Check if initial seeding is needed (only once in database lifecycle)
      const initRef = doc(db, "meta", "init");
      getDoc(initRef).then(snap => {
        if (!snap.exists()) {
          StoreService.seedInitialDataToFirestore().then(() => {
            if (db) setDoc(initRef, { initializedAt: new Date().toISOString(), app: "SK MISSION BOARD" }).catch(console.warn);
          });
        }
      }).catch(e => {
        console.warn("Firestore meta init check warning:", e);
      });

      // 0. Theme Video Listener
      const themeVideoRef = doc(db, "meta", "theme_video");
      onSnapshot(themeVideoRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data && typeof data.url === "string") {
            cachedThemeVideo = data.url;
            localStorage.setItem(STORAGE_KEYS.THEME_VIDEO, data.url);
            notifySubscribers();
          }
        }
      }, (err) => {
        console.warn("Firestore Theme Video sync warning:", err);
      });

      // 1. PDFs Listener
      const pdfsCol = collection(db, "pdfs");
      onSnapshot(pdfsCol, (snapshot) => {
        const list: PDFMaterial[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as PDFMaterial);
        });
        list.sort((a, b) => (b.orderIndex ?? 0) - (a.orderIndex ?? 0));
        cachedPdfs = list;
        localStorage.setItem(STORAGE_KEYS.PDFS, JSON.stringify(list));
        notifySubscribers();
      }, (err) => {
        console.warn("Firestore PDFs sync warning:", err);
      });

      // 2. Videos Listener
      const videosCol = collection(db, "videos");
      onSnapshot(videosCol, (snapshot) => {
        const list: YouTubeVideo[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as YouTubeVideo);
        });
        list.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
        cachedVideos = list;
        localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(list));
        notifySubscribers();
      }, (err) => {
        console.warn("Firestore Videos sync warning:", err);
      });

      // 3. Announcements Listener
      const annCol = collection(db, "announcements");
      onSnapshot(annCol, (snapshot) => {
        const list: Announcement[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as Announcement);
        });
        cachedAnnouncements = list;
        localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(list));
        notifySubscribers();
      }, (err) => {
        console.warn("Firestore Announcements sync warning:", err);
      });

      // 4. Chapters Listener
      const chapCol = collection(db, "chapters");
      onSnapshot(chapCol, (snapshot) => {
        const list: Chapter[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as Chapter);
        });
        list.sort((a, b) => a.chapterNumber - b.chapterNumber);
        cachedChapters = list;
        localStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(list));
        notifySubscribers();
      }, (err) => {
        console.warn("Firestore Chapters sync warning:", err);
      });

      // 5. Version Info Listener
      const verCol = collection(db, "app_version");
      onSnapshot(verCol, (snapshot) => {
        snapshot.forEach(docSnap => {
          if (docSnap.id === "current") {
            cachedVersion = docSnap.data() as AppVersionInfo;
            localStorage.setItem(STORAGE_KEYS.VERSION, JSON.stringify(cachedVersion));
            notifySubscribers();
          }
        });
      }, (err) => {
        console.warn("Firestore Version sync warning:", err);
      });

      // 6. Music Tracks Listener
      const musicCol = collection(db, "music");
      onSnapshot(musicCol, (snapshot) => {
        const list: MusicTrack[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as MusicTrack);
        });
        list.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
        cachedMusic = list;
        localStorage.setItem(STORAGE_KEYS.MUSIC, JSON.stringify(list));
        notifySubscribers();
      }, (err) => {
        console.warn("Firestore Music sync warning:", err);
      });

      // 7. Remote Feature Flags Listener
      const flagDoc = doc(db, "app_config", "feature_flags");
      onSnapshot(flagDoc, (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Partial<RemoteFeatureFlags>;
          cachedFeatureFlags = { ...DEFAULT_FEATURE_FLAGS, ...data };
          localStorage.setItem(STORAGE_KEYS.FEATURE_FLAGS, JSON.stringify(cachedFeatureFlags));
          notifySubscribers();
        }
      }, (err) => {
        console.warn("Firestore Feature Flags sync warning:", err);
      });

    } catch (e) {
      console.warn("Error establishing Firestore sync:", e);
    }
  },

  seedMusicToFirestore: async () => {
    if (!db) return;
    try {
      const batch = writeBatch(db);
      INITIAL_MUSIC_TRACKS.forEach(track => {
        const ref = doc(db, "music", track.id);
        batch.set(ref, track);
      });
      await batch.commit();
      console.log("Initial Study Music dataset seeded to Firestore!");
    } catch (e) {
      console.warn("Seed Music error:", e);
    }
  },

  // Seed default dataset to Firestore so all users immediately see content
  seedInitialDataToFirestore: async () => {
    if (!db) return;
    try {
      const batch = writeBatch(db);

      INITIAL_PDFS.forEach(pdf => {
        const ref = doc(db, "pdfs", pdf.id);
        batch.set(ref, pdf);
      });

      INITIAL_YOUTUBE_VIDEOS.forEach(video => {
        const ref = doc(db, "videos", video.id);
        batch.set(ref, video);
      });

      INITIAL_ANNOUNCEMENTS.forEach(ann => {
        const ref = doc(db, "announcements", ann.id);
        batch.set(ref, ann);
      });

      INITIAL_CHAPTERS.forEach(chap => {
        const ref = doc(db, "chapters", chap.id);
        batch.set(ref, chap);
      });

      INITIAL_MUSIC_TRACKS.forEach(track => {
        const ref = doc(db, "music", track.id);
        batch.set(ref, track);
      });

      const verRef = doc(db, "app_version", "current");
      batch.set(verRef, CURRENT_APP_VERSION);

      await batch.commit();
      console.log("Initial BSEB dataset successfully seeded to Firestore!");
    } catch (e) {
      console.warn("Seed Firestore error:", e);
    }
  },

  // Chapters API
  getChapters: (): Chapter[] => {
    return cachedChapters;
  },

  saveChapters: async (chapters: Chapter[]) => {
    cachedChapters = chapters;
    localStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(chapters));
    notifySubscribers();

    if (db) {
      try {
        const batch = writeBatch(db);
        chapters.forEach(c => {
          batch.set(doc(db, "chapters", c.id), c);
        });
        await batch.commit();
      } catch (e) {
        console.error("Firestore save chapters error:", e);
      }
    }
  },

  // PDFs API
  getPdfs: (): PDFMaterial[] => {
    return cachedPdfs;
  },

  addPdf: async (pdf: Omit<PDFMaterial, "id">): Promise<PDFMaterial> => {
    const newId = `pdf-${Date.now()}`;
    const newPdf: PDFMaterial = {
      ...pdf,
      id: newId
    };

    cachedPdfs = [newPdf, ...cachedPdfs];
    localStorage.setItem(STORAGE_KEYS.PDFS, JSON.stringify(cachedPdfs));
    notifySubscribers();

    // Cloud Firestore Sync (accessible to all students instantly)
    if (db) {
      try {
        await setDoc(doc(db, "pdfs", newId), newPdf);
      } catch (e) {
        console.error("Firestore addPdf error:", e);
      }
    }
    return newPdf;
  },

  deletePdf: async (id: string) => {
    cachedPdfs = cachedPdfs.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PDFS, JSON.stringify(cachedPdfs));
    notifySubscribers();

    if (db) {
      try {
        await deleteDoc(doc(db, "pdfs", id));
      } catch (e) {
        console.error("Firestore deletePdf error:", e);
      }
    }
  },

  updatePdf: async (id: string, updatedFields: Partial<PDFMaterial>) => {
    cachedPdfs = cachedPdfs.map(p => p.id === id ? { ...p, ...updatedFields } : p);
    localStorage.setItem(STORAGE_KEYS.PDFS, JSON.stringify(cachedPdfs));
    notifySubscribers();

    if (db) {
      try {
        const updated = cachedPdfs.find(p => p.id === id);
        if (updated) {
          await setDoc(doc(db, "pdfs", id), updated, { merge: true });
        }
      } catch (e) {
        console.error("Firestore updatePdf error:", e);
      }
    }
  },

  // YouTube Videos API
  getVideos: (): YouTubeVideo[] => {
    return cachedVideos;
  },

  addVideo: async (video: Omit<YouTubeVideo, "id">): Promise<YouTubeVideo> => {
    const newId = `yt-${Date.now()}`;
    const newVideo: YouTubeVideo = {
      ...video,
      id: newId
    };

    cachedVideos = [newVideo, ...cachedVideos];
    localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(cachedVideos));
    notifySubscribers();

    if (db) {
      try {
        await setDoc(doc(db, "videos", newId), newVideo);
      } catch (e) {
        console.error("Firestore addVideo error:", e);
      }
    }
    return newVideo;
  },

  deleteVideo: async (id: string) => {
    cachedVideos = cachedVideos.filter(v => v.id !== id);
    localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(cachedVideos));
    notifySubscribers();

    if (db) {
      try {
        await deleteDoc(doc(db, "videos", id));
      } catch (e) {
        console.error("Firestore deleteVideo error:", e);
      }
    }
  },

  updateVideo: async (id: string, updatedFields: Partial<YouTubeVideo>) => {
    cachedVideos = cachedVideos.map(v => v.id === id ? { ...v, ...updatedFields } : v);
    localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(cachedVideos));
    notifySubscribers();

    if (db) {
      try {
        const updated = cachedVideos.find(v => v.id === id);
        if (updated) {
          await setDoc(doc(db, "videos", id), updated, { merge: true });
        }
      } catch (e) {
        console.error("Firestore updateVideo error:", e);
      }
    }
  },

  // Announcements API
  getAnnouncements: (): Announcement[] => {
    return cachedAnnouncements;
  },

  getActiveAnnouncements: (): Announcement[] => {
    const now = Date.now();
    return cachedAnnouncements.filter((ann) => {
      // 1. Must be published & active
      const isPub = ann.isPublished !== false;
      const isAct = ann.isActive !== false;
      if (!isPub || !isAct) return false;

      // 2. Check if dismissed by user on this client
      if (cachedDismissedAnnouncements.includes(ann.id)) {
        return false;
      }

      // 3. Check Start Time (if set)
      if (ann.startTime) {
        const startTimestamp = new Date(ann.startTime).getTime();
        if (!isNaN(startTimestamp) && startTimestamp > now) {
          return false;
        }
      }

      // 4. Check End Time (if set)
      if (ann.endTime) {
        const endTimestamp = new Date(ann.endTime).getTime();
        if (!isNaN(endTimestamp) && endTimestamp < now) {
          return false;
        }
      }

      return true;
    });
  },

  dismissAnnouncement: (id: string) => {
    if (!cachedDismissedAnnouncements.includes(id)) {
      cachedDismissedAnnouncements = [...cachedDismissedAnnouncements, id];
      localStorage.setItem(STORAGE_KEYS.DISMISSED_ANNOUNCEMENTS, JSON.stringify(cachedDismissedAnnouncements));
      notifySubscribers();
    }
  },

  isAnnouncementDismissed: (id: string): boolean => {
    return cachedDismissedAnnouncements.includes(id);
  },

  resetDismissedAnnouncements: () => {
    cachedDismissedAnnouncements = [];
    localStorage.removeItem(STORAGE_KEYS.DISMISSED_ANNOUNCEMENTS);
    notifySubscribers();
  },

  addAnnouncement: async (ann: Omit<Announcement, "id">): Promise<Announcement> => {
    const newId = `ann-${Date.now()}`;
    const newItem: Announcement = {
      ...ann,
      id: newId,
      content: ann.content || ann.message || "",
      message: ann.message || ann.content || "",
      isActive: ann.isActive !== undefined ? ann.isActive : true,
      isPublished: ann.isPublished !== undefined ? ann.isPublished : true,
      type: ann.type || "INFO"
    };

    cachedAnnouncements = [newItem, ...cachedAnnouncements];
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(cachedAnnouncements));
    notifySubscribers();

    if (db) {
      try {
        await setDoc(doc(db, "announcements", newId), newItem);
      } catch (e) {
        console.error("Firestore addAnnouncement error:", e);
      }
    }
    return newItem;
  },

  updateAnnouncement: async (id: string, updatedFields: Partial<Announcement>) => {
    cachedAnnouncements = cachedAnnouncements.map(a => a.id === id ? { ...a, ...updatedFields } : a);
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(cachedAnnouncements));
    notifySubscribers();

    if (db) {
      try {
        const updated = cachedAnnouncements.find(a => a.id === id);
        if (updated) {
          await setDoc(doc(db, "announcements", id), updated, { merge: true });
        }
      } catch (e) {
        console.error("Firestore updateAnnouncement error:", e);
      }
    }
  },

  deleteAnnouncement: async (id: string) => {
    cachedAnnouncements = cachedAnnouncements.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(cachedAnnouncements));
    notifySubscribers();

    if (db) {
      try {
        await deleteDoc(doc(db, "announcements", id));
      } catch (e) {
        console.error("Firestore deleteAnnouncement error:", e);
      }
    }
  },

  // Remote Feature Flags API
  getFeatureFlags: (): RemoteFeatureFlags => {
    return { ...cachedFeatureFlags };
  },

  saveFeatureFlags: async (flags: RemoteFeatureFlags) => {
    cachedFeatureFlags = { ...DEFAULT_FEATURE_FLAGS, ...flags };
    localStorage.setItem(STORAGE_KEYS.FEATURE_FLAGS, JSON.stringify(cachedFeatureFlags));
    notifySubscribers();

    if (db) {
      try {
        await setDoc(doc(db, "app_config", "feature_flags"), cachedFeatureFlags, { merge: true });
      } catch (e) {
        console.error("Firestore saveFeatureFlags error:", e);
      }
    }
  },

  updateFeatureFlag: async (key: keyof RemoteFeatureFlags, value: boolean) => {
    cachedFeatureFlags = {
      ...cachedFeatureFlags,
      [key]: value
    };
    localStorage.setItem(STORAGE_KEYS.FEATURE_FLAGS, JSON.stringify(cachedFeatureFlags));
    notifySubscribers();

    if (db) {
      try {
        await setDoc(doc(db, "app_config", "feature_flags"), { [key]: value }, { merge: true });
      } catch (e) {
        console.error("Firestore updateFeatureFlag error:", e);
      }
    }
  },

  // What's New & Version Changelog Helpers
  getLastSeenWhatsNewVersion: (): string | null => {
    try {
      return localStorage.getItem(STORAGE_KEYS.SEEN_WHATS_NEW_VERSION);
    } catch {
      return null;
    }
  },

  markWhatsNewAsSeen: (versionName: string) => {
    try {
      localStorage.setItem(STORAGE_KEYS.SEEN_WHATS_NEW_VERSION, versionName);
    } catch (e) {
      console.warn("Error marking whats new as seen:", e);
    }
  },

  // Version Info API
  getVersionInfo: (): AppVersionInfo => {
    return cachedVersion;
  },

  saveVersionInfo: async (version: AppVersionInfo) => {
    cachedVersion = version;
    localStorage.setItem(STORAGE_KEYS.VERSION, JSON.stringify(version));
    notifySubscribers();

    if (db) {
      try {
        await setDoc(doc(db, "app_version", "current"), version);
      } catch (e) {
        console.error("Firestore saveVersion error:", e);
      }
    }
  },

  // Music Tracks API
  getMusicTracks: (): MusicTrack[] => {
    return cachedMusic;
  },

  addMusicTrack: async (track: Omit<MusicTrack, "id">): Promise<MusicTrack> => {
    const newId = `music-${Date.now()}`;
    const newTrack: MusicTrack = {
      ...track,
      id: newId
    };

    cachedMusic = [...cachedMusic, newTrack];
    localStorage.setItem(STORAGE_KEYS.MUSIC, JSON.stringify(cachedMusic));
    notifySubscribers();

    if (db) {
      try {
        await setDoc(doc(db, "music", newId), newTrack);
      } catch (e) {
        console.error("Firestore addMusicTrack error:", e);
      }
    }
    return newTrack;
  },

  deleteMusicTrack: async (id: string) => {
    cachedMusic = cachedMusic.filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MUSIC, JSON.stringify(cachedMusic));
    notifySubscribers();

    if (db) {
      try {
        await deleteDoc(doc(db, "music", id));
      } catch (e) {
        console.error("Firestore deleteMusicTrack error:", e);
      }
    }
  },

  updateMusicTrack: async (id: string, updatedFields: Partial<MusicTrack>) => {
    cachedMusic = cachedMusic.map(m => m.id === id ? { ...m, ...updatedFields } : m);
    localStorage.setItem(STORAGE_KEYS.MUSIC, JSON.stringify(cachedMusic));
    notifySubscribers();

    if (db) {
      try {
        const updated = cachedMusic.find(m => m.id === id);
        if (updated) {
          await setDoc(doc(db, "music", id), updated, { merge: true });
        }
      } catch (e) {
        console.error("Firestore updateMusicTrack error:", e);
      }
    }
  },

  // Reset to default
  resetToDefault: () => {
    localStorage.removeItem(STORAGE_KEYS.PDFS);
    localStorage.removeItem(STORAGE_KEYS.VIDEOS);
    localStorage.removeItem(STORAGE_KEYS.ANNOUNCEMENTS);
    localStorage.removeItem(STORAGE_KEYS.VERSION);
    localStorage.removeItem(STORAGE_KEYS.CHAPTERS);
    localStorage.removeItem(STORAGE_KEYS.MUSIC);
    cachedChapters = INITIAL_CHAPTERS;
    cachedPdfs = INITIAL_PDFS;
    cachedVideos = INITIAL_YOUTUBE_VIDEOS;
    cachedAnnouncements = INITIAL_ANNOUNCEMENTS;
    cachedVersion = CURRENT_APP_VERSION;
    cachedMusic = INITIAL_MUSIC_TRACKS;
    notifySubscribers();
  }
};

