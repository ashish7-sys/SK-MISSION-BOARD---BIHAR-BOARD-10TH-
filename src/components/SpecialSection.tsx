import React, { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import { 
  PDFMaterial, 
  YouTubeVideo, 
  SubjectId, 
  Chapter,
  Conversation,
  ChatMessage,
  AiDiscoveredResource,
  UserProfile
} from "../types";
import { AiStudyService } from "../services/aiStudyService";
import { UserService } from "../services/userService";
import { OFFICIAL_SUBJECTS } from "../data/bsebClass10Data";
import { DownloadService } from "../services/downloadService";
import { UserProfileModal } from "./UserProfileModal";
import { 
  Sparkles, 
  MessageSquare, 
  FileText, 
  Video, 
  Send, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Menu, 
  X, 
  Mic, 
  MicOff, 
  Check, 
  ExternalLink, 
  Download, 
  BookOpen, 
  Play, 
  Copy, 
  Image as ImageIcon,
  ArrowLeft,
  Calendar,
  Lock,
  Layers,
  HelpCircle,
  User,
  Settings
} from "lucide-react";

interface SpecialSectionProps {
  pdfs: PDFMaterial[];
  videos: YouTubeVideo[];
  chapters?: Chapter[];
  onOpenPdf: (pdf: PDFMaterial) => void;
  onOpenVideo: (video: YouTubeVideo) => void;
  onExit?: () => void;
}

const QUICK_PROMPT_CHIPS = [
  "✨ PDF नोट्स कहाँ मिलेंगे और कैसे डाउनलोड करें?",
  "✨ प्रकाश के परावर्तन एवं अपवर्तन के नियम (विज्ञान)",
  "✨ त्रिकोणमिति के सभी मुख्य सूत्र एवं सिद्ध करने के नियम (गणित)",
  "✨ रासायनिक अभिक्रिया एवं समीकरण के प्रकार",
  "✨ श्रम विभाजन और जाति प्रथा का सारांश (हिन्दी)",
  "✨ स्टडी फोकस म्यूजिक कैसे चलाएँ?",
  "✨ संस्कृत: मङ्गलम् पाठ का अर्थ एवं श्लोक",
  "✨ ऐप के सभी फीचर्स और इस्तेमाल की जानकारी दो"
];

// Helper to group conversations by date
function groupConversationsByDate(convs: Conversation[]) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  const last7DaysStart = todayStart - 7 * 24 * 60 * 60 * 1000;

  const groups: {
    today: Conversation[];
    yesterday: Conversation[];
    last7Days: Conversation[];
    older: Conversation[];
  } = {
    today: [],
    yesterday: [],
    last7Days: [],
    older: []
  };

  convs.forEach(c => {
    const time = new Date(c.updatedAt || c.createdAt).getTime();
    if (time >= todayStart) {
      groups.today.push(c);
    } else if (time >= yesterdayStart) {
      groups.yesterday.push(c);
    } else if (time >= last7DaysStart) {
      groups.last7Days.push(c);
    } else {
      groups.older.push(c);
    }
  });

  return groups;
}

export const SpecialSection: React.FC<SpecialSectionProps> = ({
  pdfs,
  videos,
  chapters = [],
  onOpenPdf,
  onOpenVideo,
  onExit
}) => {
  // State subscriptions from AiStudyService
  const [conversations, setConversations] = useState<Conversation[]>(AiStudyService.getConversations());
  const [activeConv, setActiveConv] = useState<Conversation>(AiStudyService.getActiveConversation());
  const [activeTab, setActiveTab] = useState<"chat" | "pdf" | "video">("chat");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(UserService.getProfile());
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  
  // Drawer & Search
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState("");
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editConvTitle, setEditConvTitle] = useState("");

  // Chat Input State
  const [inputQuery, setInputQuery] = useState("");
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [selectedImageMime, setSelectedImageMime] = useState<string>("image/jpeg");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // PDF Search / Filter
  const [pdfFilterSubject, setPdfFilterSubject] = useState<string>("all");
  const [pdfSearchText, setPdfSearchText] = useState("");
  const [isSearchingExternalPdf, setIsSearchingExternalPdf] = useState(false);
  const [discoveredPdfs, setDiscoveredPdfs] = useState<AiDiscoveredResource[]>(AiStudyService.getDiscoveredResources());

  // Video Search
  const [videoSearchText, setVideoSearchText] = useState("");

  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-adjust textarea height dynamically as content grows (ChatGPT style)
  const adjustTextareaHeight = () => {
    const textarea = chatInputRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const minHeight = 40;
    const maxHeight = 150;
    const targetHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${targetHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputQuery]);

  // Subscribe to AiStudyService and UserService
  useEffect(() => {
    const unsub = AiStudyService.subscribe(() => {
      setConversations(AiStudyService.getConversations());
      setActiveConv(AiStudyService.getActiveConversation());
      setDiscoveredPdfs(AiStudyService.getDiscoveredResources());
    });
    const unsubUser = UserService.subscribe(() => {
      setUserProfile(UserService.getProfile());
    });
    return () => {
      unsub();
      unsubUser();
    };
  }, []);

  // Auto-scroll on new message
  useEffect(() => {
    if (activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeConv?.messages, isLoading, activeTab]);

  // Handle Speech Recognition setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "hi-IN";

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputQuery(prev => (prev ? `${prev} ${transcript}` : transcript));
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("आपके ब्राउज़र में वॉइस इनपुट समर्थित नहीं है।");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn("Speech recognition error:", e);
      }
    }
  };

  // Image Upload Handling
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("कृपया केवल फोटो (JPG, PNG, WebP) चुनें।");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSelectedImageBase64(result);
      setSelectedImageMime(file.type || "image/jpeg");
    };
    reader.readAsDataURL(file);
    // Reset file input value so same file can be chosen again if needed
    e.target.value = "";
  };

  const removeSelectedImage = () => {
    setSelectedImageBase64(null);
  };

  // Send Chat Message
  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = (textOverride !== undefined ? textOverride : inputQuery).trim();
    if ((!textToSend && !selectedImageBase64) || isLoading) return;

    const currentImg = selectedImageBase64 || undefined;
    const currentMime = selectedImageMime || undefined;

    // Reset input state & textarea height
    setInputQuery("");
    setSelectedImageBase64(null);
    if (chatInputRef.current) {
      chatInputRef.current.style.height = "40px";
      chatInputRef.current.style.overflowY = "hidden";
      // Explicitly blur input to dismiss mobile keyboard on message send
      chatInputRef.current.blur();
    }

    setIsLoading(true);

    try {
      await AiStudyService.sendMessage(
        textToSend,
        currentImg,
        currentMime,
        pdfs,
        videos,
        chapters
      );
    } catch (err) {
      console.error("Message send error:", err);
    } finally {
      setIsLoading(false);
      // NOTE: Do not auto-focus the input here to ensure mobile keyboard never opens unprompted
    }
  };

  // New Chat
  const handleNewChat = () => {
    const newConv = AiStudyService.createConversation();
    setIsDrawerOpen(false);
    setActiveTab("chat");
    // NOTE: Do not auto-focus the input here so keyboard stays closed until user taps
  };

  // Select Conversation from drawer
  const handleSelectConv = (id: string) => {
    AiStudyService.setActiveConversationId(id);
    setIsDrawerOpen(false);
    setActiveTab("chat");
  };

  // Delete Conversation
  const handleDeleteConv = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("क्या आप इस चर्चा को हटाना चाहते हैं?")) {
      AiStudyService.deleteConversation(id);
    }
  };

  // Start Rename
  const handleStartRename = (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    setEditingConvId(conv.id);
    setEditConvTitle(conv.title);
  };

  // Save Rename
  const handleSaveRename = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editConvTitle.trim()) {
      AiStudyService.updateConversationTitle(id, editConvTitle.trim());
    }
    setEditingConvId(null);
  };

  // Copy Message Text
  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // Trigger External PDF Search
  const handleSearchForPdf = async (topic: string, subjectId: SubjectId = "science") => {
    setIsSearchingExternalPdf(true);
    setActiveTab("pdf");
    try {
      await AiStudyService.searchExternalPdfs(topic, subjectId);
    } catch (err) {
      console.error("Search PDF error:", err);
    } finally {
      setIsSearchingExternalPdf(false);
    }
  };

  // Filtered conversations in drawer
  const filteredConvs = conversations.filter(c => 
    !drawerSearch.trim() || c.title.toLowerCase().includes(drawerSearch.toLowerCase().trim())
  );
  const groupedConvs = groupConversationsByDate(filteredConvs);

  // Active topic for PDF / Video tabs
  const currentTopic = activeConv?.currentTopic || "";
  const currentSubjectId = activeConv?.subjectId;

  // Filter PDFs for PDF Tab
  const displayPdfs = pdfs.filter(p => {
    if (pdfFilterSubject !== "all" && p.subjectId !== pdfFilterSubject) return false;
    if (pdfSearchText.trim()) {
      const q = pdfSearchText.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchChapter = p.chapterTitle && p.chapterTitle.toLowerCase().includes(q);
      const matchTopic = p.topic && p.topic.toLowerCase().includes(q);
      return matchTitle || matchChapter || matchTopic;
    }
    // If current topic is present and no manual search, highlight topic PDFs first
    return true;
  });

  // Filter Videos for Videos Tab
  const displayVideos = videos.filter(v => {
    if (videoSearchText.trim()) {
      const q = videoSearchText.toLowerCase();
      const matchTitle = v.title.toLowerCase().includes(q);
      const matchChapter = v.chapterTitle && v.chapterTitle.toLowerCase().includes(q);
      return matchTitle || matchChapter;
    }
    return true;
  });

  return (
    <div 
      id="skmb-ai-dedicated-app" 
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden text-slate-100 font-sans"
    >
      {/* 1. TOP BAR: [☰ Drawer]   [✨ SK AI STUDY ASSISTANT]   [← Exit AI] */}
      <header 
        id="ai-top-bar"
        className="h-14 sm:h-16 px-3 sm:px-6 bg-slate-900/90 backdrop-blur-2xl border-b border-cyan-500/20 flex items-center justify-between shadow-[0_4px_25px_rgba(0,0,0,0.6)] shrink-0 z-40"
      >
        {/* Left: Drawer Toggle Button */}
        <div className="flex items-center gap-2">
          <button
            id="ai-drawer-toggle-btn"
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-800/80 hover:bg-cyan-950/60 border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-all cursor-pointer shadow-sm active:scale-95"
            aria-label="चर्चा इतिहास खोलें (Open Chat History)"
            title="इतिहास (Chat History)"
          >
            <Menu className="w-5 h-5 text-cyan-400" />
          </button>

          <button
            id="ai-new-chat-top-btn"
            onClick={handleNewChat}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Center: Title Branding with Bihar Board Matric badge */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.6)]">
              <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
            </div>
            <h1 className="text-sm sm:text-base md:text-lg font-black tracking-wide bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
              SK AI STUDY ASSISTANT
            </h1>
          </div>
          <span className="text-[10px] sm:text-xs font-medium text-slate-400">
            बिहार बोर्ड कक्षा 10वीं • 24x7 स्मार्ट ट्यूटर
          </span>
        </div>

        {/* Right: User Profile & Exit AI Buttons */}
        <div className="flex items-center gap-2">
          {/* Student Profile Pill */}
          <button
            id="ai-user-profile-btn"
            onClick={() => setShowEditProfileModal(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            title="विद्यार्थी प्रोफाइल (Edit Student Profile)"
          >
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0" />
            <span className="max-w-[70px] sm:max-w-[110px] truncate">
              {userProfile?.name ? userProfile.name : "Profile"}
            </span>
          </button>

          <button
            id="ai-exit-btn"
            onClick={() => {
              if (onExit) {
                onExit();
              }
            }}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300 hover:text-red-200 text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
            title="AI से बाहर निकलें (Return to App)"
          >
            <ArrowLeft className="w-4 h-4 text-red-400" />
            <span>Exit AI</span>
          </button>
        </div>
      </header>

      {/* 2. STICKY TABS: [ 💬 CHAT ]  [ 📄 PDF ]  [ 🎬 VIDEOS ] */}
      <div 
        id="ai-sticky-tab-bar"
        className="sticky top-0 z-30 px-3 sm:px-6 py-2 bg-slate-950/95 backdrop-blur-xl border-b border-white/10 flex items-center justify-center shrink-0"
      >
        <div className="flex items-center gap-2 p-1 bg-slate-900/90 rounded-2xl border border-white/10 shadow-inner max-w-md w-full justify-around">
          {/* CHAT TAB */}
          <button
            id="tab-btn-chat"
            onClick={() => setActiveTab("chat")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === "chat"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>CHAT</span>
          </button>

          {/* PDF TAB */}
          <button
            id="tab-btn-pdf"
            onClick={() => setActiveTab("pdf")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === "pdf"
                ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>PDF</span>
            {currentTopic && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping ml-0.5" />
            )}
          </button>

          {/* VIDEOS TAB */}
          <button
            id="tab-btn-videos"
            onClick={() => setActiveTab("video")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === "video"
                ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Video className="w-4 h-4" />
            <span>VIDEOS</span>
          </button>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE CONTAINER (CHAT / PDF / VIDEOS) */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* TAB 1: CHATGPT-STYLE CHAT INTERFACE */}
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 relative">
            
            {/* Conversation Messages Scroll Container */}
            <div 
              id="ai-chat-messages-container"
              className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 py-4 space-y-4 max-w-4xl w-full mx-auto"
            >
              {/* Empty State / Welcome Screen when no messages */}
              {(!activeConv?.messages || activeConv.messages.length === 0) && (
                <div className="my-auto py-6 sm:py-10 flex flex-col items-center justify-center text-center max-w-2xl mx-auto animate-fade-in">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.3)] mb-4">
                    <Sparkles className="w-8 h-8 text-cyan-300 animate-pulse" />
                  </div>

                  {/* Personalized Greeting Card */}
                  <div className="mb-4 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500/15 via-blue-600/15 to-purple-600/15 border border-cyan-400/30 text-center shadow-[0_0_25px_rgba(6,182,212,0.15)] max-w-md mx-auto">
                    <p className="text-base sm:text-lg font-bold text-cyan-200 whitespace-pre-line leading-relaxed">
                      {UserService.getGreetingText(conversations.length > 1)}
                    </p>
                  </div>
                  
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 max-w-md">
                    बिहार बोर्ड कक्षा 10वीं के किसी भी विषय (गणित, विज्ञान, सामाजिक विज्ञान, हिंदी, संस्कृत या अंग्रेजी) का कोई भी सवाल पूछें या फोटो भेजें।
                  </p>

                  {/* Suggestion Prompt Chips */}
                  <div className="w-full flex flex-col sm:flex-row flex-wrap gap-2 justify-center">
                    {QUICK_PROMPT_CHIPS.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(prompt.replace(/^✨\s*/, ""))}
                        className="text-left px-3.5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-cyan-950/50 border border-white/10 hover:border-cyan-500/50 text-xs sm:text-sm text-slate-300 hover:text-cyan-200 transition-all cursor-pointer shadow-sm active:scale-95 group flex items-center gap-2"
                      >
                        <span className="text-cyan-400 group-hover:scale-110 transition-transform">💬</span>
                        <span>{prompt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Render Messages */}
              {activeConv?.messages?.map((msg) => {
                const isUser = msg.sender === "user";

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"} w-full group animate-fade-in`}
                  >
                    {/* Role Label / Header */}
                    <div className="flex items-center gap-2 mb-1 px-1 text-[11px] font-bold text-slate-400">
                      {isUser ? (
                        <span>आप (Student)</span>
                      ) : (
                        <div className="flex items-center gap-1.5 text-cyan-400">
                          <Sparkles className="w-3 h-3" />
                          <span>SK AI Study Assistant</span>
                          {msg.topic && (
                            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px]">
                              {msg.topic}
                            </span>
                          )}
                        </div>
                      )}
                      <span className="text-slate-500 font-normal">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {/* Message Bubble Card */}
                    <div
                      className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-4 sm:p-5 shadow-lg relative ${
                        isUser
                          ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-sm border border-cyan-400/30"
                          : "bg-slate-900/90 text-slate-100 rounded-tl-sm border border-cyan-500/25 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                      }`}
                    >
                      {/* Attached Image (if provided by user) */}
                      {msg.imageUrl && (
                        <div className="mb-3 overflow-hidden rounded-xl border border-white/20 shadow-md">
                          <img
                            src={msg.imageUrl}
                            alt="Uploaded Study Material"
                            referrerPolicy="no-referrer"
                            className="max-h-64 sm:max-h-80 w-auto rounded-lg object-contain bg-black/40"
                          />
                        </div>
                      )}

                      {/* Text / Markdown Content */}
                      {isUser ? (
                        <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                          {msg.text}
                        </p>
                      ) : (
                        <div className="prose prose-invert max-w-none text-sm sm:text-base leading-relaxed space-y-2">
                          <Markdown>{msg.text}</Markdown>
                        </div>
                      )}

                      {/* Action attachments on AI response */}
                      {!isUser && (
                        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
                          {/* Copy Button */}
                          <button
                            onClick={() => handleCopyMessage(msg.id, msg.text)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-all cursor-pointer"
                            title="उत्तर कॉपी करें"
                          >
                            {copiedMsgId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">कॉपी हुआ!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          {/* Matched PDF Action Button */}
                          {msg.suggestedPdfs && msg.suggestedPdfs.length > 0 && (
                            <button
                              onClick={() => {
                                const matched = pdfs.find(p => p.id === msg.suggestedPdfs?.[0].id);
                                if (matched) {
                                  onOpenPdf(matched);
                                } else {
                                  setActiveTab("pdf");
                                }
                              }}
                              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>📄 Open PDF Notes ({msg.suggestedPdfs[0].title})</span>
                            </button>
                          )}

                          {/* Matched Video Action Button */}
                          {msg.suggestedVideos && msg.suggestedVideos.length > 0 && (
                            <button
                              onClick={() => {
                                const matched = videos.find(v => v.id === msg.suggestedVideos?.[0].id);
                                if (matched) {
                                  onOpenVideo(matched);
                                } else {
                                  setActiveTab("video");
                                }
                              }}
                              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-bold transition-all cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>🎬 Watch Video Lecture</span>
                            </button>
                          )}

                          {/* PDF Unavailable -> Search for PDF Action */}
                          {msg.isPdfUnavailable && (
                            <div className="w-full mt-2 p-2.5 rounded-xl bg-slate-800/80 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                              <span className="text-amber-200">
                                📄 इस topic का PDF अभी SK MISSION BOARD library में उपलब्ध नहीं है।
                              </span>
                              <button
                                onClick={() => handleSearchForPdf(msg.topic || activeConv.currentTopic || "Class 10 Science", msg.subjectId)}
                                className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold shadow-sm hover:brightness-110 transition-all cursor-pointer whitespace-nowrap"
                              >
                                <Search className="w-3.5 h-3.5" />
                                <span>Search for PDF</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Loading Typing Indicator */}
              {isLoading && (
                <div className="flex items-center gap-2 p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 w-fit max-w-xs shadow-lg animate-pulse">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span className="text-xs sm:text-sm text-cyan-300 font-medium">
                    SK AI उत्तर तैयार कर रहा है...
                  </span>
                  <div className="flex gap-1 ml-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Fixed Bottom Message Composer */}
            <div 
              id="ai-message-composer"
              className="p-3 sm:p-4 bg-slate-900/95 backdrop-blur-2xl border-t border-cyan-500/20 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] shrink-0 z-30"
            >
              <div className="max-w-4xl mx-auto flex flex-col gap-2">
                {/* Image Preview Thumbnail (if attached) */}
                {selectedImageBase64 && (
                  <div className="flex items-center gap-2 p-2 bg-slate-800/90 rounded-xl border border-cyan-500/40 w-fit animate-fade-in">
                    <img 
                      src={selectedImageBase64} 
                      alt="Selected preview" 
                      className="w-12 h-12 object-cover rounded-lg border border-white/20"
                    />
                    <div className="flex flex-col text-xs pr-2">
                      <span className="font-bold text-cyan-300">चित्र संलग्न (Image attached)</span>
                      <span className="text-[10px] text-slate-400">AI चित्र को स्कैन करके हल करेगा</span>
                    </div>
                    <button
                      onClick={removeSelectedImage}
                      className="p-1 rounded-full bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white transition-all cursor-pointer ml-1"
                      title="चित्र हटाएं (Remove Image)"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Input Bar with Upload + Text + Mic + Send */}
                <div className="flex items-end gap-2 bg-slate-950/80 rounded-2xl p-2 border border-white/15 focus-within:border-cyan-400 focus-within:shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all">
                  {/* Hidden File Input for Image Upload / Camera */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageFileChange}
                    accept="image/*"
                    className="hidden"
                    id="ai-image-upload-input"
                  />

                  {/* Image Attachment Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-2.5 rounded-xl transition-all cursor-pointer shrink-0 mb-0.5 ${
                      selectedImageBase64
                        ? "bg-cyan-500 text-slate-950 font-bold"
                        : "bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-white/10"
                    }`}
                    title="फोटो / सवाल की तस्वीर अपलोड करें (Upload Question Image)"
                    aria-label="Upload Question Image"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>

                  {/* Dynamic Multiline Textarea / Message Input */}
                  <textarea
                    ref={chatInputRef}
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="अपना सवाल पूछें या फोटो भेजें... (Enter दबाएं)"
                    rows={1}
                    className="flex-1 bg-transparent text-sm sm:text-base text-slate-100 placeholder-slate-400 focus:outline-none resize-none py-2 px-2.5 min-h-[40px] max-h-[150px] leading-relaxed transition-[height] duration-75 ease-out overflow-hidden"
                    style={{ height: "40px" }}
                  />

                  {/* Voice Microphone Button */}
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    className={`p-2.5 rounded-xl transition-all cursor-pointer shrink-0 mb-0.5 ${
                      isListening
                        ? "bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)]"
                        : "bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-white/10"
                    }`}
                    title={isListening ? "सुनना बंद करें" : "बोलकर सवाल पूछें (Voice Input)"}
                    aria-label="Voice Input"
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  {/* Send Button */}
                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={(!inputQuery.trim() && !selectedImageBase64) || isLoading}
                    className={`p-2.5 rounded-xl transition-all cursor-pointer shrink-0 mb-0.5 ${
                      (inputQuery.trim() || selectedImageBase64) && !isLoading
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:brightness-110 active:scale-95"
                        : "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
                    }`}
                    title="भेजें (Send)"
                    aria-label="Send Message"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: DEDICATED PDF NOTES WORKSPACE */}
        {activeTab === "pdf" && (
          <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 sm:p-6 md:p-8 max-w-6xl w-full mx-auto space-y-6">
            
            {/* PDF Header with active topic indicator */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base sm:text-lg font-black text-amber-200">
                    {currentTopic ? `अध्ययन विषय: ${currentTopic}` : "बिहार बोर्ड 10वीं आधिकारिक PDF नोट्स"}
                  </h2>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  ऑफिशियल SK MISSION BOARD बोर्ड नोट्स, फॉर्मूला शीट्स एवं महत्वपूर्ण प्रश्नोत्तर
                </p>
              </div>

              {/* Search Online Discovery Button */}
              <button
                onClick={() => handleSearchForPdf(currentTopic || "बिहार बोर्ड 10वीं नोट्स", currentSubjectId || "science")}
                disabled={isSearchingExternalPdf}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs sm:text-sm shadow-md hover:brightness-110 transition-all cursor-pointer shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>{isSearchingExternalPdf ? "खोजा जा रहा है..." : "Search for PDF"}</span>
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Subject Filter Chips */}
              <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                <button
                  onClick={() => setPdfFilterSubject("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    pdfFilterSubject === "all"
                      ? "bg-amber-500 text-slate-950 shadow-md"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10"
                  }`}
                >
                  सभी विषय (All)
                </button>
                {OFFICIAL_SUBJECTS.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setPdfFilterSubject(sub.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      pdfFilterSubject === sub.id
                        ? "bg-amber-500 text-slate-950 shadow-md"
                        : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10"
                    }`}
                  >
                    {sub.nameHindi}
                  </button>
                ))}
              </div>

              {/* PDF Search Input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={pdfSearchText}
                  onChange={(e) => setPdfSearchText(e.target.value)}
                  placeholder="PDF नोट्स खोजें..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* PDF Notes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayPdfs.map((pdf) => (
                <div
                  key={pdf.id}
                  className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 hover:border-amber-500/40 transition-all flex flex-col justify-between shadow-md group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {pdf.subjectId}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {pdf.pageCount ? `${pdf.pageCount} पृष्ठ` : "PDF"}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors line-clamp-2">
                      {pdf.title}
                    </h3>
                    {pdf.chapterTitle && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                        अध्याय: {pdf.chapterTitle}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onOpenPdf(pdf)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>पढ़ें (Read)</span>
                    </button>
                    <button
                      onClick={() => {
                        DownloadService.addDownload({
                          id: pdf.id,
                          title: pdf.title,
                          fileType: "pdf",
                          fileUrl: pdf.fileUrl,
                          subjectId: pdf.subjectId,
                          chapterTitle: pdf.chapterTitle
                        });
                        DownloadService.triggerDeviceDownload(pdf.fileUrl, `${pdf.title}.pdf`);
                      }}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State for PDFs */}
            {displayPdfs.length === 0 && (
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-white/10 text-center flex flex-col items-center justify-center">
                <FileText className="w-12 h-12 text-slate-500 mb-3" />
                <h3 className="text-base font-bold text-slate-200">
                  📄 इस topic का PDF अभी SK MISSION BOARD library में उपलब्ध नहीं है।
                </h3>
                <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">
                  आप ऑनलाइन सत्यापित शैक्षिक स्रोतों से संबंधित PDF नोट्स खोजने के लिए सर्च बटन का उपयोग कर सकते हैं।
                </p>
                <button
                  onClick={() => handleSearchForPdf(currentTopic || "BSEB 10th Study Material", (currentSubjectId as SubjectId) || "science")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-xs shadow-md hover:brightness-110 transition-all cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Search for PDF</span>
                </button>
              </div>
            )}

            {/* Discovered External Online PDFs Section */}
            {discoveredPdfs.length > 0 && (
              <div className="mt-8 pt-6 border-t border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <ExternalLink className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-cyan-200">
                    ऑनलाइन खोजे गए अध्ययन संसाधन (AI Verified Study Resources)
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {discoveredPdfs.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/20 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300">
                            {item.source}
                          </span>
                          <span className="text-[10px] text-slate-400">Class {item.classLevel}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-200 truncate">{item.title}</h4>
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                      >
                        <span>खोलें</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 3: DEDICATED VIDEOS WORKSPACE */}
        {activeTab === "video" && (
          <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 sm:p-6 md:p-8 max-w-6xl w-full mx-auto space-y-6">
            
            {/* Video Header */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-500/15 via-slate-900 to-slate-900 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div>
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-purple-400" />
                  <h2 className="text-base sm:text-lg font-black text-purple-200">
                    आधिकारिक वीडियो लेक्चर्स (SK MISSION BOARD)
                  </h2>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  बिहार बोर्ड कक्षा 10वीं के सभी अध्यायों के व्याख्यात्मक वीडियो क्लासेस
                </p>
              </div>

              {/* YouTube Channel Button */}
              <a
                href="https://youtube.com/@skmissionboard?si=wckj0D5alOeUnVW8"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs sm:text-sm shadow-md hover:brightness-110 transition-all cursor-pointer shrink-0"
              >
                <Play className="w-4 h-4" />
                <span>YouTube Channel</span>
              </a>
            </div>

            {/* Video Search Bar */}
            <div className="flex items-center justify-end">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={videoSearchText}
                  onChange={(e) => setVideoSearchText(e.target.value)}
                  placeholder="वीडियो क्लास खोजें..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            {/* Videos Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayVideos.map((vid) => {
                const thumb = vid.youtubeVideoId
                  ? `https://img.youtube.com/vi/${vid.youtubeVideoId}/hqdefault.jpg`
                  : "";

                return (
                  <div
                    key={vid.id}
                    onClick={() => onOpenVideo(vid)}
                    className="p-3 rounded-2xl bg-slate-900/90 border border-white/10 hover:border-purple-500/40 transition-all cursor-pointer shadow-md group flex flex-col justify-between"
                  >
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 mb-3">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={vid.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-purple-400">
                          <Video className="w-10 h-10 opacity-50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-all">
                        <div className="w-10 h-10 rounded-full bg-purple-500/90 flex items-center justify-center shadow-lg text-white group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">
                        {vid.subjectId}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-purple-300 transition-colors line-clamp-2 mt-1.5">
                        {vid.title}
                      </h3>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty State for Videos */}
            {displayVideos.length === 0 && (
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-white/10 text-center flex flex-col items-center justify-center">
                <Video className="w-12 h-12 text-slate-500 mb-3" />
                <h3 className="text-base font-bold text-slate-200">
                  कोई वीडियो नहीं मिला
                </h3>
                <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">
                  आप आधिकारिक यूट्यूब चैनल पर सभी व्याख्यान सीधे देख सकते हैं।
                </p>
                <a
                  href="https://youtube.com/@skmissionboard?si=wckj0D5alOeUnVW8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-xs shadow-md hover:brightness-110 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>Open YouTube Channel</span>
                </a>
              </div>
            )}

          </div>
        )}

      </div>

      {/* 4. CHATGPT-STYLE LEFT DRAWER (PRIVATE CHAT HISTORY) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Sidebar */}
          <div 
            id="ai-history-drawer"
            className="relative w-80 max-w-[85vw] h-full bg-slate-900/98 backdrop-blur-2xl border-r border-cyan-500/25 shadow-2xl p-4 flex flex-col z-10 animate-slide-in"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
                <h2 className="text-sm font-bold text-white">
                  चर्चा इतिहास (Chat History)
                </h2>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Top Action: New Chat Button */}
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer mb-3 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </button>

            {/* Search History Input */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={drawerSearch}
                onChange={(e) => setDrawerSearch(e.target.value)}
                placeholder="इतिहास में खोजें..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Grouped History List */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              
              {/* Group 1: TODAY */}
              {groupedConvs.today.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-1 py-1 text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                    <Calendar className="w-3 h-3" />
                    <span>आज (Today)</span>
                  </div>
                  <div className="space-y-1 mt-1">
                    {groupedConvs.today.map((c) => renderConversationItem(c))}
                  </div>
                </div>
              )}

              {/* Group 2: YESTERDAY */}
              {groupedConvs.yesterday.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-1 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <Calendar className="w-3 h-3" />
                    <span>कल (Yesterday)</span>
                  </div>
                  <div className="space-y-1 mt-1">
                    {groupedConvs.yesterday.map((c) => renderConversationItem(c))}
                  </div>
                </div>
              )}

              {/* Group 3: LAST 7 DAYS */}
              {groupedConvs.last7Days.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-1 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <Calendar className="w-3 h-3" />
                    <span>पिछले 7 दिन (Previous 7 Days)</span>
                  </div>
                  <div className="space-y-1 mt-1">
                    {groupedConvs.last7Days.map((c) => renderConversationItem(c))}
                  </div>
                </div>
              )}

              {/* Group 4: OLDER */}
              {groupedConvs.older.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-1 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <Calendar className="w-3 h-3" />
                    <span>पुराने (Older)</span>
                  </div>
                  <div className="space-y-1 mt-1">
                    {groupedConvs.older.map((c) => renderConversationItem(c))}
                  </div>
                </div>
              )}

              {filteredConvs.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">
                  कोई चर्चा नहीं मिली।
                </div>
              )}
            </div>

            {/* Drawer Footer: User Profile Badge, Privacy Badge & Clear All */}
            <div className="pt-3 border-t border-white/10 mt-auto flex flex-col gap-2.5">
              {/* Student Profile Card */}
              <div 
                onClick={() => {
                  setIsDrawerOpen(false);
                  setShowEditProfileModal(true);
                }}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-cyan-500/20 hover:border-cyan-400/50 transition-all cursor-pointer flex items-center justify-between group shadow-sm"
                title="Click to edit profile"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-bold text-white truncate">
                      {userProfile?.name || "Student Profile"}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {userProfile?.villageOrTown ? `${userProfile.villageOrTown} • ` : ""}
                      {userProfile?.gender === "male" ? "Male (छात्र)" : userProfile?.gender === "female" ? "Female (छात्रा)" : "Personalized"}
                    </p>
                  </div>
                </div>
                <div className="p-1 rounded-lg bg-slate-700/50 text-slate-400 group-hover:text-cyan-300 group-hover:bg-cyan-500/15 transition-all shrink-0">
                  <Edit3 className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>सुरक्षित निजी प्रोफाइल एवं सत्र</span>
              </div>
              <button
                onClick={() => {
                  if (confirm("क्या आप सभी चर्चाओं का इतिहास मिटाना चाहते हैं?")) {
                    AiStudyService.clearAllConversations();
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-[11px] font-medium transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>सभी चर्चाएं साफ़ करें (Clear All)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* User Profile Edit Modal */}
      <UserProfileModal
        isOpen={showEditProfileModal}
        mode="edit"
        onClose={() => setShowEditProfileModal(false)}
        onProfileSaved={(updated) => {
          setUserProfile(updated);
          setShowEditProfileModal(false);
        }}
      />

    </div>
  );

  // Helper to render individual conversation item in the drawer
  function renderConversationItem(conv: Conversation) {
    const isActive = activeConv?.id === conv.id;
    const isEditing = editingConvId === conv.id;

    return (
      <div
        key={conv.id}
        onClick={() => !isEditing && handleSelectConv(conv.id)}
        className={`group relative flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer ${
          isActive
            ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 shadow-sm"
            : "hover:bg-slate-800/80 text-slate-300 hover:text-white border border-transparent"
        }`}
      >
        {isEditing ? (
          <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={editConvTitle}
              onChange={(e) => setEditConvTitle(e.target.value)}
              className="flex-1 px-2 py-1 rounded bg-slate-950 border border-cyan-400 text-xs text-white focus:outline-none"
              autoFocus
            />
            <button
              onClick={(e) => handleSaveRename(e, conv.id)}
              className="p-1 rounded hover:bg-slate-700 text-emerald-400"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setEditingConvId(null)}
              className="p-1 rounded hover:bg-slate-700 text-slate-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
              <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
              <span className="text-xs truncate font-medium">{conv.title}</span>
            </div>

            {/* Quick Action Icons: Rename & Delete */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => handleStartRename(e, conv)}
                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-cyan-300 transition-all"
                title="नाम बदलें (Rename)"
              >
                <Edit3 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => handleDeleteConv(e, conv.id)}
                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-all"
                title="हटाएं (Delete)"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </>
        )}
      </div>
    );
  }
};
