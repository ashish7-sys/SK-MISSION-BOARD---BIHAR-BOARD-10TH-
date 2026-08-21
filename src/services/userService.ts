import { UserProfile, UserGender } from "../types";
import { db, auth } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const STORAGE_KEYS = {
  USER_ID: "skmb_ai_private_uid_v1",
  USER_PROFILE_PREFIX: "skmb_user_profile_"
};

export function getPrivateUserId(): string {
  try {
    if (auth && auth.currentUser && auth.currentUser.uid) {
      return auth.currentUser.uid;
    }
    let localUid = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!localUid) {
      localUid = `sk_usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(STORAGE_KEYS.USER_ID, localUid);
    }
    return localUid;
  } catch {
    return "sk_default_user";
  }
}

type UserChangeCallback = () => void;
const subscribers: Set<UserChangeCallback> = new Set();

function notifySubscribers() {
  subscribers.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error(e);
    }
  });
}

// In-memory cache of current user's profile
let cachedProfile: UserProfile | null = null;
let isLoaded = false;

function loadProfileFromStorage(): UserProfile | null {
  const uid = getPrivateUserId();
  const storageKey = `${STORAGE_KEYS.USER_PROFILE_PREFIX}${uid}`;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.name === "string" && parsed.name.trim().length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Error reading local user profile:", e);
  }
  return null;
}

export const UserService = {
  subscribe: (callback: UserChangeCallback) => {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  },

  getProfile: (): UserProfile | null => {
    const loaded = loadProfileFromStorage();
    if (loaded) {
      cachedProfile = loaded;
      isLoaded = true;
      return loaded;
    }
    return cachedProfile;
  },

  hasCompletedProfile: (): boolean => {
    const profile = UserService.getProfile();
    return Boolean(profile && profile.isProfileCompleted && profile.name && profile.name.trim().length > 0);
  },

  saveProfile: async (data: {
    name: string;
    gender?: UserGender;
    villageOrTown?: string;
  }): Promise<UserProfile> => {
    const uid = getPrivateUserId();
    const cleanName = data.name.trim().substring(0, 50);
    const cleanVillage = data.villageOrTown ? data.villageOrTown.trim().substring(0, 60) : undefined;
    
    // Ensure gender is strictly one of the allowed options
    let cleanGender: UserGender | undefined = undefined;
    if (data.gender === "male" || data.gender === "female" || data.gender === "prefer_not_to_say") {
      cleanGender = data.gender;
    }

    const now = new Date().toISOString();
    const existing = UserService.getProfile();

    const newProfile: UserProfile = {
      userId: uid,
      name: cleanName,
      gender: cleanGender,
      villageOrTown: cleanVillage || undefined,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      isProfileCompleted: true
    };

    cachedProfile = newProfile;
    isLoaded = true;

    // Save locally (works 100% offline)
    try {
      const storageKey = `${STORAGE_KEYS.USER_PROFILE_PREFIX}${uid}`;
      localStorage.setItem(storageKey, JSON.stringify(newProfile));
    } catch (e) {
      console.warn("Failed to persist user profile in localStorage:", e);
    }

    notifySubscribers();

    // Async sync to private Firestore document (users/{userId}/profile)
    if (db) {
      try {
        const userDocRef = doc(db, "users", uid);
        await setDoc(userDocRef, { profile: newProfile, updatedAt: now }, { merge: true });
      } catch (err) {
        console.warn("Firestore user profile sync warning (offline or permission):", err);
      }
    }

    return newProfile;
  },

  fetchRemoteProfileIfAvailable: async () => {
    if (!db) return;
    const uid = getPrivateUserId();
    try {
      const userDocRef = doc(db, "users", uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.profile && data.profile.name) {
          const remoteProfile: UserProfile = data.profile;
          cachedProfile = remoteProfile;
          isLoaded = true;
          const storageKey = `${STORAGE_KEYS.USER_PROFILE_PREFIX}${uid}`;
          localStorage.setItem(storageKey, JSON.stringify(remoteProfile));
          notifySubscribers();
        }
      }
    } catch (e) {
      // offline or silent catch
    }
  },

  getGreetingText: (isNewChat = false): string => {
    const profile = UserService.getProfile();
    const name = profile?.name?.trim() || "छात्र";
    const gender = profile?.gender;

    if (isNewChat) {
      return `Welcome back, ${name}! 👋\nAaj kis topic se start karein?`;
    }

    if (gender === "male") {
      return `Hi ${name}! 👋\nMain tumhara SK AI Study Assistant hoon.\nAaj kya padhna hai?`;
    } else if (gender === "female") {
      return `Hi ${name}! 👋\nMain tumhari SK AI Study Assistant hoon.\nAaj kya padhna hai?`;
    } else {
      return `Hi ${name}! 👋\nMain SK AI Study Assistant hoon.\nAaj kya padhna hai?`;
    }
  }
};
