import { 
  Conversation, 
  ChatMessage, 
  AiDiscoveredResource, 
  PDFMaterial, 
  YouTubeVideo, 
  Chapter,
  SubjectId 
} from "../types";
import { StoreService } from "./storeService";
import { UserService } from "./userService";
import { AnalyticsService } from "./analyticsService";
import { AiIntelligentEngine } from "./aiIntelligentEngine";
import { db, auth } from "../lib/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from "firebase/firestore";

const STORAGE_KEYS = {
  USER_ID: "skmb_ai_private_uid_v1",
  CONVERSATIONS: "skmb_ai_conversations_v2",
  CURRENT_CONVERSATION_ID: "skmb_ai_active_conv_v2",
  DISCOVERED_RESOURCES: "skmb_ai_discovered_res_v2"
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

type AiChangeCallback = () => void;
const subscribers: Set<AiChangeCallback> = new Set();

function notifySubscribers() {
  subscribers.forEach(cb => {
    try { cb(); } catch (e) { console.error(e); }
  });
}

// In-memory runtime caches
let allConversations: Conversation[] = [];
let activeConversationId: string = "";
let cachedDiscoveredResources: AiDiscoveredResource[] = [];

// Helper to create a clean fresh conversation for the current user
function createInitialBlankConversation(userId: string): Conversation {
  return {
    id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId,
    title: "नयी चर्चा (New Chat)",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: []
  };
}

// Load initial state from localStorage
try {
  const currentUid = getPrivateUserId();
  const localConvs = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
  if (localConvs) {
    allConversations = JSON.parse(localConvs);
  }

  // Ensure current user has at least one conversation
  const userConvs = allConversations.filter(c => c.userId === currentUid);
  if (userConvs.length === 0) {
    const fresh = createInitialBlankConversation(currentUid);
    allConversations.unshift(fresh);
    activeConversationId = fresh.id;
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(allConversations));
    localStorage.setItem(STORAGE_KEYS.CURRENT_CONVERSATION_ID, fresh.id);
  } else {
    const localActiveId = localStorage.getItem(STORAGE_KEYS.CURRENT_CONVERSATION_ID);
    if (localActiveId && userConvs.some(c => c.id === localActiveId)) {
      activeConversationId = localActiveId;
    } else {
      activeConversationId = userConvs[0].id;
    }
  }

  const localRes = localStorage.getItem(STORAGE_KEYS.DISCOVERED_RESOURCES);
  if (localRes) {
    cachedDiscoveredResources = JSON.parse(localRes);
  }
} catch (e) {
  console.warn("AI Storage initialization error:", e);
  const currentUid = getPrivateUserId();
  const fallback = createInitialBlankConversation(currentUid);
  allConversations = [fallback];
  activeConversationId = fallback.id;
}

let isFirestoreSynced = false;

export const AiStudyService = {
  subscribe: (callback: AiChangeCallback) => {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  },

  // Returns ONLY current user's private conversations
  getConversations: (): Conversation[] => {
    const uid = getPrivateUserId();
    return allConversations.filter(c => c.userId === uid);
  },

  getActiveConversationId: (): string => {
    return activeConversationId;
  },

  getActiveConversation: (): Conversation => {
    const uid = getPrivateUserId();
    const userConvs = allConversations.filter(c => c.userId === uid);
    const found = userConvs.find(c => c.id === activeConversationId);
    if (found) return found;
    if (userConvs.length > 0) {
      activeConversationId = userConvs[0].id;
      return userConvs[0];
    }
    const fresh = AiStudyService.createConversation();
    return fresh;
  },

  setActiveConversationId: (id: string) => {
    const uid = getPrivateUserId();
    if (allConversations.some(c => c.id === id && c.userId === uid)) {
      activeConversationId = id;
      localStorage.setItem(STORAGE_KEYS.CURRENT_CONVERSATION_ID, id);
      notifySubscribers();
    }
  },

  // Creates a clean, empty new chat with ZERO assumed topic
  createConversation: (initialTopic?: string, initialSubject?: SubjectId): Conversation => {
    const uid = getPrivateUserId();
    const newId = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newConv: Conversation = {
      id: newId,
      userId: uid,
      title: initialTopic ? initialTopic.substring(0, 30) : "नयी चर्चा (New Chat)",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentTopic: initialTopic || undefined,
      subjectId: initialSubject || undefined,
      messages: []
    };

    allConversations.unshift(newConv);
    activeConversationId = newId;
    AiStudyService.saveConversations();

    // Log privacy-safe aggregate analytics (no conversation text)
    AnalyticsService.trackAiConversationStart();

    return newConv;
  },

  updateConversationTitle: (id: string, newTitle: string) => {
    const uid = getPrivateUserId();
    const conv = allConversations.find(c => c.id === id && c.userId === uid);
    if (conv) {
      conv.title = newTitle.trim() || "Untitled Chat";
      conv.updatedAt = new Date().toISOString();
      AiStudyService.saveConversations();
    }
  },

  deleteConversation: (id: string) => {
    const uid = getPrivateUserId();
    allConversations = allConversations.filter(c => !(c.id === id && c.userId === uid));
    const remainingUserConvs = allConversations.filter(c => c.userId === uid);
    
    if (remainingUserConvs.length === 0) {
      const fresh = AiStudyService.createConversation();
      activeConversationId = fresh.id;
    } else if (activeConversationId === id) {
      activeConversationId = remainingUserConvs[0].id;
    }
    AiStudyService.saveConversations();
  },

  clearAllConversations: () => {
    const uid = getPrivateUserId();
    allConversations = allConversations.filter(c => c.userId !== uid);
    const fresh = AiStudyService.createConversation();
    activeConversationId = fresh.id;
    AiStudyService.saveConversations();
  },

  saveConversations: () => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(allConversations));
      localStorage.setItem(STORAGE_KEYS.CURRENT_CONVERSATION_ID, activeConversationId);
      notifySubscribers();
    } catch (e) {
      console.warn("Error saving conversations locally:", e);
    }
  },

  // Multi-turn message execution with server-side AI (supporting text + images)
  sendMessage: async (
    userText: string,
    imageBase64: string | undefined,
    imageMimeType: string | undefined,
    internalPdfs: PDFMaterial[],
    internalVideos: YouTubeVideo[],
    chapters: Chapter[]
  ): Promise<ChatMessage> => {
    const conv = AiStudyService.getActiveConversation();
    const userMsgId = `msg-u-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      text: userText,
      imageUrl: imageBase64,
      imageBase64: imageBase64,
      timestamp: new Date().toISOString()
    };

    // Append user message immediately
    conv.messages.push(userMsg);
    conv.updatedAt = new Date().toISOString();

    // Auto-update conversation title if it's the default name
    if (conv.title === "नयी चर्चा (New Chat)" || conv.title.startsWith("New Study Chat")) {
      const displayText = userText || (imageBase64 ? "चित्र अध्ययन प्रश्न" : "Study Chat");
      conv.title = displayText.length > 28 ? displayText.substring(0, 26) + "..." : displayText;
    }

    AiStudyService.saveConversations();

    // Log privacy-safe aggregate AI question stat (no prompt text is stored)
    AnalyticsService.trackAiQuestion({ hasImage: !!imageBase64 });

    try {
      // Call server-side AI study assistant endpoint with multimodal data and continuous context
      const userProfile = UserService.getProfile();
      const recentHistory = conv.messages.slice(-14).map(m => ({
        sender: m.sender,
        text: m.text,
        topic: m.topic,
        imageBase64: m.imageBase64
      }));

      const response = await fetch("/api/ai/study-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: recentHistory,
          currentQuery: userText,
          imageBase64,
          imageMimeType,
          internalPdfs: internalPdfs.filter(p => p.isPublished !== false),
          internalVideos: internalVideos.filter(v => v.isPublished !== false),
          chapters,
          userProfile
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();

      // Track aggregate PDF/video request stats if resources were returned
      if (data.suggestedPdfs && data.suggestedPdfs.length > 0) {
        AnalyticsService.trackAiPdfRequest();
      }
      if (data.suggestedVideos && data.suggestedVideos.length > 0) {
        AnalyticsService.trackAiVideoRequest();
      }

      // Detect topic from matching resources or user text
      let detectedTopic = conv.currentTopic || userText;
      let matchedSubject = conv.subjectId || "science";

      if (data.suggestedPdfs && data.suggestedPdfs.length > 0) {
        const first = data.suggestedPdfs[0];
        detectedTopic = first.chapterTitle || first.title;
        matchedSubject = first.subjectId || matchedSubject;
      }

      const assistantMsg: ChatMessage = {
        id: `msg-a-${Date.now()}`,
        sender: "assistant",
        text: data.text || "यहाँ आपकी अध्ययन व्याख्या है।",
        timestamp: new Date().toISOString(),
        topic: detectedTopic,
        subjectId: matchedSubject,
        matchedPdfIds: data.matchedPdfIds || [],
        matchedVideoIds: data.matchedVideoIds || [],
        suggestedPdfs: data.suggestedPdfs || [],
        suggestedVideos: data.suggestedVideos || [],
        isPdfUnavailable: data.isPdfUnavailable,
        isVideoUnavailable: data.isVideoUnavailable
      };

      conv.currentTopic = detectedTopic;
      conv.subjectId = matchedSubject;
      conv.messages.push(assistantMsg);
      conv.updatedAt = new Date().toISOString();

      AiStudyService.saveConversations();
      return assistantMsg;

    } catch (err: any) {
      console.warn("AI remote API unreachable, using local intelligent engine:", err?.message || err);

      // Offline / fallback answer with internal resource matching and continuous context resolution
      const queryLower = (userText || "").toLowerCase();
      const matchedPdfs = internalPdfs.filter(p => 
        queryLower && (
          p.title.toLowerCase().includes(queryLower) || 
          p.chapterTitle.toLowerCase().includes(queryLower) ||
          (p.tags && p.tags.some(t => queryLower.includes(t.toLowerCase())))
        )
      );
      const matchedVideos = internalVideos.filter(v => 
        queryLower && (
          v.title.toLowerCase().includes(queryLower) || 
          v.chapterTitle.toLowerCase().includes(queryLower) ||
          (v.tags && v.tags.some(t => queryLower.includes(t.toLowerCase())))
        )
      );

      const currentProfile = UserService.getProfile();
      const historyContext = conv.messages.slice(-14).map(m => ({ sender: m.sender, text: m.text }));
      const analysis = AiIntelligentEngine.analyzeConversationContext(userText, historyContext, conv.currentTopic, conv.subjectId);
      const smartText = AiIntelligentEngine.generateSmartOfflineResponse(
        userText,
        currentProfile,
        matchedPdfs,
        matchedVideos,
        chapters,
        historyContext,
        conv.currentTopic,
        conv.subjectId
      );

      let topicName = conv.currentTopic;
      if (analysis.activeTopic) {
        topicName = analysis.activeTopic;
      } else if (matchedPdfs.length > 0) {
        topicName = matchedPdfs[0].chapterTitle || matchedPdfs[0].title;
      } else if (userText && userText.length < 30) {
        topicName = userText;
      }

      const fallbackMsg: ChatMessage = {
        id: `msg-a-${Date.now()}`,
        sender: "assistant",
        text: smartText,
        timestamp: new Date().toISOString(),
        topic: topicName,
        subjectId: analysis.activeSubject || conv.subjectId,
        matchedPdfIds: matchedPdfs.map(p => p.id),
        matchedVideoIds: matchedVideos.map(v => v.id),
        suggestedPdfs: matchedPdfs.map(p => ({
          id: p.id,
          title: p.title,
          chapterTitle: p.chapterTitle,
          subjectId: p.subjectId,
          fileUrl: p.fileUrl,
          isInternal: true
        })),
        suggestedVideos: matchedVideos.map(v => ({
          id: v.id,
          title: v.title,
          youtubeUrl: v.youtubeUrl,
          youtubeVideoId: v.youtubeVideoId
        }))
      };

      conv.messages.push(fallbackMsg);
      conv.updatedAt = new Date().toISOString();
      AiStudyService.saveConversations();
      return fallbackMsg;
    }
  },

  // EXTERNAL PDF SEARCH & DISCOVERY
  searchExternalPdfs: async (topic: string, subjectId: SubjectId = "science", chapterTitle = ""): Promise<AiDiscoveredResource[]> => {
    try {
      const response = await fetch("/api/ai/search-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, subjectId, chapterTitle })
      });

      if (!response.ok) {
        throw new Error("Search endpoint error");
      }

      const data = await response.json();
      const results: any[] = data.results || [];

      const newResources: AiDiscoveredResource[] = results.map((r: any, idx: number) => ({
        id: `dis-${Date.now()}-${idx}`,
        topic: r.topic || topic,
        title: r.title || `${topic} Study Notes`,
        source: r.source || "Educational Open Portal",
        url: r.url || "https://ncert.nic.in/textbook.php",
        subjectId: (r.subjectId as SubjectId) || subjectId,
        chapterTitle: r.chapterTitle || chapterTitle || topic,
        classLevel: r.classLevel || 10,
        relevanceScore: r.relevanceScore || 92,
        qualityNotes: r.qualityNotes || "BSEB Class 10 examination reference material.",
        discoveredAt: new Date().toISOString(),
        status: "pending"
      }));

      // Store in local discovered cache
      newResources.forEach(res => {
        if (!cachedDiscoveredResources.some(existing => existing.url === res.url && existing.title === res.title)) {
          cachedDiscoveredResources.unshift(res);
        }
      });

      AiStudyService.saveDiscoveredResources();

      // Sync discovered to Firestore for Admin Panel review if db available
      if (db) {
        newResources.forEach(async (res) => {
          try {
            await setDoc(doc(db, "ai_discovered_resources", res.id), res, { merge: true });
          } catch (e) {
            console.warn("Firestore save discovered resource error:", e);
          }
        });
      }

      return newResources;
    } catch (err) {
      console.error("External PDF search error, returning fallback:", err);
      const fallbackResource: AiDiscoveredResource = {
        id: `dis-${Date.now()}`,
        topic,
        title: `${topic} - बिहार बोर्ड 10वीं मुख्य अध्ययन सामग्री`,
        source: "NCERT Official Curriculum",
        url: "https://ncert.nic.in/textbook.php",
        subjectId,
        chapterTitle: chapterTitle || topic,
        classLevel: 10,
        relevanceScore: 90,
        qualityNotes: "BSEB Class 10 Syllabus Based Reference Notes.",
        discoveredAt: new Date().toISOString(),
        status: "pending"
      };
      cachedDiscoveredResources.unshift(fallbackResource);
      AiStudyService.saveDiscoveredResources();
      return [fallbackResource];
    }
  },

  getDiscoveredResources: (): AiDiscoveredResource[] => {
    return [...cachedDiscoveredResources];
  },

  saveDiscoveredResources: () => {
    try {
      localStorage.setItem(STORAGE_KEYS.DISCOVERED_RESOURCES, JSON.stringify(cachedDiscoveredResources));
      notifySubscribers();
    } catch (e) {
      console.warn("Error saving discovered resources locally:", e);
    }
  },

  // Admin approves resource -> adds directly to official StoreService PDF library
  approveDiscoveredResource: async (
    resourceId: string, 
    chapterId: string, 
    customTitle?: string
  ): Promise<PDFMaterial | null> => {
    const res = cachedDiscoveredResources.find(r => r.id === resourceId);
    if (!res) return null;

    res.status = "approved";
    res.reviewedAt = new Date().toISOString();
    res.reviewedBy = "Admin";
    AiStudyService.saveDiscoveredResources();

    if (db) {
      try {
        await setDoc(doc(db, "ai_discovered_resources", resourceId), res, { merge: true });
      } catch (e) {
        console.warn("Firestore update approved resource error:", e);
      }
    }

    // Add to official StoreService PDFs
    const newPdf: PDFMaterial = {
      id: `pdf-ai-${Date.now()}`,
      subjectId: res.subjectId,
      chapterId: chapterId,
      chapterTitle: res.chapterTitle || res.topic,
      title: customTitle || res.title,
      description: `[AI Verified Study Resource] Source: ${res.source}. ${res.qualityNotes || ""}`,
      fileUrl: res.url,
      fileSizeMb: 2.5,
      pageCount: 12,
      uploadDate: new Date().toISOString().split("T")[0],
      isPublished: true,
      orderIndex: 99,
      tags: [res.topic, res.subjectId, "AI Approved", "Class 10"],
      topic: res.topic,
      classLevel: 10,
      language: "hindi",
      isAiDiscovered: true,
      sourceName: res.source
    };

    await StoreService.addPdf(newPdf);
    return newPdf;
  },

  // Admin rejects resource
  rejectDiscoveredResource: async (resourceId: string) => {
    const res = cachedDiscoveredResources.find(r => r.id === resourceId);
    if (res) {
      res.status = "rejected";
      res.reviewedAt = new Date().toISOString();
      res.reviewedBy = "Admin";
      AiStudyService.saveDiscoveredResources();

      if (db) {
        try {
          await setDoc(doc(db, "ai_discovered_resources", resourceId), res, { merge: true });
        } catch (e) {
          console.warn("Firestore reject resource error:", e);
        }
      }
    }
  },

  deleteDiscoveredResource: async (resourceId: string) => {
    cachedDiscoveredResources = cachedDiscoveredResources.filter(r => r.id !== resourceId);
    AiStudyService.saveDiscoveredResources();

    if (db) {
      try {
        await deleteDoc(doc(db, "ai_discovered_resources", resourceId));
      } catch (e) {
        console.warn("Firestore delete resource error:", e);
      }
    }
  },

  // Real-time Firestore sync for AI discovered resources
  initRealtimeSync: () => {
    if (isFirestoreSynced || !db) return;
    isFirestoreSynced = true;

    try {
      const resCol = collection(db, "ai_discovered_resources");
      onSnapshot(resCol, (snapshot) => {
        if (!snapshot.empty) {
          const remoteList: AiDiscoveredResource[] = [];
          snapshot.forEach((docSnap) => {
            remoteList.push({ id: docSnap.id, ...docSnap.data() } as AiDiscoveredResource);
          });
          if (remoteList.length > 0) {
            cachedDiscoveredResources = remoteList;
            AiStudyService.saveDiscoveredResources();
          }
        }
      }, (err) => {
        console.warn("Firestore AI resources sync listener warning:", err);
      });
    } catch (e) {
      console.warn("Firestore initRealtimeSync AI error:", e);
    }
  }
};
