import { BookmarkItem, BookmarkType, SubjectId } from "../types";
import { getPrivateUserId } from "./userService";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const STORAGE_PREFIX = "skmb_bookmarks_v1_";

type BookmarkListener = () => void;
const listeners: Set<BookmarkListener> = new Set();

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error("Bookmark listener error:", e);
    }
  });
}

// In-memory cache per user
let cachedBookmarks: BookmarkItem[] = [];
let currentLoadedUserId: string = "";

function loadUserBookmarks(): BookmarkItem[] {
  const uid = getPrivateUserId();
  currentLoadedUserId = uid;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${uid}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Error reading bookmarks from storage:", e);
  }
  return [];
}

// Initialize
cachedBookmarks = loadUserBookmarks();

function saveToStorage() {
  const uid = getPrivateUserId();
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${uid}`, JSON.stringify(cachedBookmarks));
  } catch (e) {
    console.warn("Error saving bookmarks to storage:", e);
  }

  // Optional background cloud sync
  if (db && uid && !uid.startsWith("sk_usr_")) {
    try {
      const userRef = doc(db, "user_bookmarks", uid);
      setDoc(userRef, { bookmarks: cachedBookmarks, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
    } catch {
      // safe fallback
    }
  }
}

export const BookmarkService = {
  subscribe: (listener: BookmarkListener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  // Ensure user cache is aligned with current user
  refreshForCurrentUser: () => {
    const uid = getPrivateUserId();
    if (currentLoadedUserId !== uid) {
      cachedBookmarks = loadUserBookmarks();
      notifyListeners();
    }
  },

  getBookmarks: (): BookmarkItem[] => {
    const uid = getPrivateUserId();
    if (currentLoadedUserId !== uid) {
      cachedBookmarks = loadUserBookmarks();
    }
    return [...cachedBookmarks];
  },

  isBookmarked: (targetId: string): boolean => {
    const uid = getPrivateUserId();
    if (currentLoadedUserId !== uid) {
      cachedBookmarks = loadUserBookmarks();
    }
    return cachedBookmarks.some((b) => b.targetId === targetId || b.id === targetId);
  },

  toggleBookmark: (item: {
    targetId: string;
    type: BookmarkType;
    title: string;
    subjectId?: SubjectId;
    subjectName?: string;
    chapterTitle?: string;
    chapterNumber?: number;
    fileUrl?: string;
    youtubeUrl?: string;
    youtubeVideoId?: string;
    description?: string;
  }): boolean => {
    const uid = getPrivateUserId();
    if (currentLoadedUserId !== uid) {
      cachedBookmarks = loadUserBookmarks();
    }

    const existingIdx = cachedBookmarks.findIndex((b) => b.targetId === item.targetId || b.id === item.targetId);

    if (existingIdx >= 0) {
      // Remove
      cachedBookmarks.splice(existingIdx, 1);
      saveToStorage();
      notifyListeners();
      return false;
    } else {
      // Add
      const newBookmark: BookmarkItem = {
        id: `bm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        targetId: item.targetId,
        type: item.type,
        title: item.title,
        subjectId: item.subjectId,
        subjectName: item.subjectName,
        chapterTitle: item.chapterTitle,
        chapterNumber: item.chapterNumber,
        fileUrl: item.fileUrl,
        youtubeUrl: item.youtubeUrl,
        youtubeVideoId: item.youtubeVideoId,
        description: item.description,
        addedAt: new Date().toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        })
      };

      cachedBookmarks.unshift(newBookmark);
      saveToStorage();
      notifyListeners();
      return true;
    }
  },

  removeBookmark: (targetId: string) => {
    const uid = getPrivateUserId();
    if (currentLoadedUserId !== uid) {
      cachedBookmarks = loadUserBookmarks();
    }
    cachedBookmarks = cachedBookmarks.filter((b) => b.targetId !== targetId && b.id !== targetId);
    saveToStorage();
    notifyListeners();
  },

  clearBookmarks: () => {
    const uid = getPrivateUserId();
    cachedBookmarks = [];
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${uid}`);
    } catch (e) {
      console.warn("Error clearing bookmarks:", e);
    }
    notifyListeners();
  }
};
