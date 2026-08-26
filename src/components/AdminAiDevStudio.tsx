import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Mic, 
  MicOff, 
  Send, 
  Terminal, 
  GitBranch, 
  Code, 
  Copy, 
  Check, 
  RefreshCw, 
  Sliders, 
  Play, 
  Trash2, 
  Zap, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  Cpu, 
  Database,
  ArrowRight,
  Palette,
  ShieldAlert,
  ShieldCheck,
  Image as ImageIcon,
  Video as VideoIcon,
  Upload,
  X,
  Stethoscope,
  Wrench,
  Activity,
  AlertTriangle,
  Info,
  FileCheck
} from "lucide-react";
import { StoreService } from "../services/storeService";
import { RemoteFeatureFlags, AnnouncementType, AppBranding, AppHealthScanResult, DiagnosticIssue } from "../types";

interface CodeSnippet {
  title: string;
  language: string;
  code: string;
  description: string;
}

interface DevopsAiResponse {
  reply: string;
  actionType: "UPDATE_BRANDING" | "UPDATE_FLAGS" | "MANAGE_CONTENT" | "CLEAR_CACHE" | "RENEW_RESOURCES" | "SELF_HEAL_FIX" | "CREATE_ANNOUNCEMENT" | "CODE_GENERATION" | "GIT_WORKFLOW" | "NONE";
  actionPayload?: {
    branding?: Partial<AppBranding>;
    flags?: Partial<RemoteFeatureFlags>;
    announcement?: any;
    [key: string]: any;
  };
  gitCommands?: string[];
  codeSnippets?: CodeSnippet[];
}

interface HistoryItem {
  id: string;
  prompt: string;
  timestamp: string;
  response: DevopsAiResponse;
  mediaPreview?: string;
}

interface AdminAiDevStudioProps {
  onRefreshData: () => void;
  featureFlags: RemoteFeatureFlags;
}

export const AdminAiDevStudio: React.FC<AdminAiDevStudioProps> = ({
  onRefreshData,
  featureFlags
}) => {
  const [promptInput, setPromptInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentResponse, setCurrentResponse] = useState<DevopsAiResponse | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [statusNotification, setStatusNotification] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [branding, setBranding] = useState<AppBranding>(StoreService.getBranding());

  // Multimodal Media Attachment (Image or Video)
  const [attachedMedia, setAttachedMedia] = useState<{
    dataUrl: string;
    mimeType: string;
    fileName: string;
    fileType: "image" | "video";
    fileSizeMb: number;
  } | null>(null);

  // App Health Scan & Auto-Diagnostics
  const [healthScan, setHealthScan] = useState<AppHealthScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [fixingIssueId, setFixingIssueId] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const consoleBottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsub = StoreService.subscribe(() => {
      setBranding(StoreService.getBranding());
    });
    // Run initial proactive health scan on opening Admin AI Studio
    runSystemDiagnostics(false);
    return unsub;
  }, []);

  // Diagnostic Health Scanner
  const runSystemDiagnostics = (notify = true) => {
    setIsScanning(true);
    try {
      const result = StoreService.runHealthScan();
      setHealthScan(result);
      if (notify) {
        if (result.status === "healthy") {
          showStatus("✅ सिस्टम डायग्नोस्टिक्स: सभी कंपोनेंट्स और लिंक्स 100% सही कार्य कर रहे हैं!", "success");
        } else {
          showStatus(`⚠️ सिस्टम डायग्नोस्टिक्स: ${result.issues.length} संभावित समस्याएँ पाई गईं।`, "info");
        }
      }
    } catch (e) {
      console.warn("Diagnostics scan error:", e);
    } finally {
      setIsScanning(false);
    }
  };

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = false;
      recognizer.interimResults = true;
      recognizer.lang = "hi-IN"; // Hindi / Indian English recognition

      recognizer.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join("");
        setPromptInput(transcript);
      };

      recognizer.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognizer.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognizer;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      showStatus("आपका ब्राउज़र वॉइस इनपुट सपोर्ट नहीं करता। कृपया लिखकर निर्देश दें।", "error");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        showStatus("🎙️ बोलिए... AI सुन रहा है...", "info");
      } catch (err) {
        console.warn("Speech start error:", err);
      }
    }
  };

  const showStatus = (text: string, type: "success" | "error" | "info") => {
    setStatusNotification({ text, type });
    setTimeout(() => {
      setStatusNotification(null);
    }, 4500);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    showStatus("कमांड / कोड क्लिपबोर्ड पर कॉपी हो गया!", "success");
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  // Handle File Upload (Image / Video) for AI Multimodal Inspection & Direct Placement
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      showStatus("फाइल साइज 50MB से कम होना चाहिए!", "error");
      return;
    }

    const isVid = file.type.startsWith("video/");
    const isImg = file.type.startsWith("image/");

    if (!isVid && !isImg) {
      showStatus("केवल इमेज (PNG, JPG, SVG) या वीडियो (MP4, WebM) अपलोड करें!", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const result = loadEvt.target?.result as string;
      setAttachedMedia({
        dataUrl: result,
        mimeType: file.type || (isVid ? "video/mp4" : "image/jpeg"),
        fileName: file.name,
        fileType: isVid ? "video" : "image",
        fileSizeMb: Number((file.size / (1024 * 1024)).toFixed(2))
      });

      if (isImg && !promptInput.trim()) {
        setPromptInput(`Is uploaded image ko app ka naya logo bana do aur fit kar do.`);
      } else if (isVid && !promptInput.trim()) {
        setPromptInput(`Is uploaded video ko app ka background theme video bana do.`);
      }

      showStatus(`📎 ${file.name} लोड हो गई! अब AI को निर्देश दें।`, "info");
    };

    reader.readAsDataURL(file);
  };

  const handleExecuteDevops = async (customPrompt?: string) => {
    const query = (customPrompt || promptInput).trim();
    if ((!query && !attachedMedia) || isProcessing) return;

    setIsProcessing(true);
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    try {
      const res = await fetch("/api/admin/ai-devops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: query || (attachedMedia?.fileType === "image" ? "Inspect this image and apply to app" : "Inspect this video and apply as theme"),
          mediaBase64: attachedMedia?.dataUrl || null,
          mediaMimeType: attachedMedia?.mimeType || null,
          mediaType: attachedMedia?.fileType || null,
          context: {
            featureFlags,
            branding: StoreService.getBranding(),
            healthScan: healthScan,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: DevopsAiResponse = await res.json();
      setCurrentResponse(data);

      const newItem: HistoryItem = {
        id: `dev-${Date.now()}`,
        prompt: query || "Attached Media Action",
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        response: data,
        mediaPreview: attachedMedia?.dataUrl
      };
      setHistory(prev => [newItem, ...prev.slice(0, 10)]);
      setPromptInput("");

      // AUTO-APPLY ACTIONS WITH EXACT ADMIN SCOPE
      if (data.actionType === "UPDATE_BRANDING" && data.actionPayload?.branding) {
        await StoreService.saveBranding(data.actionPayload.branding);
        onRefreshData();
        showStatus("🎨 ऐप ब्रांडिंग (Logo / Title / Theme) तुरंत लाइव अपडेट हो गई!", "success");
      } else if (data.actionType === "UPDATE_FLAGS" && data.actionPayload?.flags) {
        await StoreService.saveFeatureFlags(data.actionPayload.flags);
        onRefreshData();
        showStatus("✨ रिमोट फ़ीचर फ्लैग्स तुरंत अपडेट व लागू कर दिए गए!", "success");
      } else if (data.actionType === "SELF_HEAL_FIX") {
        if (data.actionPayload?.flags) {
          await StoreService.saveFeatureFlags(data.actionPayload.flags);
        }
        onRefreshData();
        runSystemDiagnostics(false);
        showStatus("🩺 सेल्फ-हीलिंग सफल: ऐप की सभी समस्याएँ ठीक कर दी गईं!", "success");
      } else if (data.actionType === "RENEW_RESOURCES" || data.actionType === "CLEAR_CACHE") {
        onRefreshData();
        runSystemDiagnostics(false);
        showStatus("🔄 ऐप रिसोर्सेज एवं कैशे रीन्यू हो गए!", "success");
      } else if (data.actionType === "CREATE_ANNOUNCEMENT" && data.actionPayload?.announcement) {
        const ann = data.actionPayload.announcement;
        await StoreService.addAnnouncement({
          title: ann.title || "AI Notice",
          content: ann.content || ann.message || "New Announcement",
          message: ann.message || ann.content || "New Announcement",
          type: (ann.type as AnnouncementType) || "INFO",
          date: new Date().toISOString().split("T")[0],
          isImportant: Boolean(ann.isImportant),
          isActive: true,
          isPublished: true
        });
        onRefreshData();
        showStatus("📢 नई घोषणा प्रकाशित कर दी गई!", "success");
      }

      // Clear attached media once processed
      setAttachedMedia(null);

      // Re-scan health after any changes
      setTimeout(() => {
        runSystemDiagnostics(false);
      }, 500);

      // Scroll to view
      setTimeout(() => {
        consoleBottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

    } catch (err: any) {
      console.error("Devops AI Execution Error:", err);
      showStatus(`त्रुटि: ${err?.message || "AI DevOps सर्विस उपलब्ध नहीं है"}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // 1-Click Fix for Individual Diagnosed Issue
  const handleApplyIssueFix = async (issue: DiagnosticIssue) => {
    setFixingIssueId(issue.id);
    try {
      if (issue.autoFixPayload?.actionType === "UPDATE_FLAGS" && issue.autoFixPayload.payload?.flags) {
        await StoreService.saveFeatureFlags(issue.autoFixPayload.payload.flags);
        onRefreshData();
        showStatus(`🛠️ '${issue.title}' को ठीक कर दिया गया!`, "success");
      } else if (issue.autoFixPayload?.actionType === "UPDATE_BRANDING" && issue.autoFixPayload.payload?.branding) {
        await StoreService.saveBranding(issue.autoFixPayload.payload.branding);
        onRefreshData();
        showStatus(`🎨 ब्रांडिंग रीस्टोर कर दी गई!`, "success");
      } else if (issue.autoFixPayload?.actionType === "CREATE_ANNOUNCEMENT" && issue.autoFixPayload.payload?.announcement) {
        const ann = issue.autoFixPayload.payload.announcement;
        await StoreService.addAnnouncement({
          title: ann.title,
          content: ann.message,
          message: ann.message,
          type: (ann.type as AnnouncementType) || "IMPORTANT",
          date: new Date().toISOString().split("T")[0],
          isImportant: Boolean(ann.isImportant),
          isActive: true,
          isPublished: true
        });
        onRefreshData();
        showStatus(`📢 नई घोषणा बना दी गई!`, "success");
      } else if (issue.autoFixPayload?.actionType === "RENEW_RESOURCES") {
        onRefreshData();
        showStatus("🔄 कंटेंट सिंक रीस्टोर कर दिया गया!", "success");
      } else {
        // Run AI self heal instruction
        await handleExecuteDevops(`Is issue ko theek karo: ${issue.title} - ${issue.description}`);
      }
      runSystemDiagnostics(false);
    } catch (e: any) {
      showStatus(`त्रुटि: ${e?.message}`, "error");
    } finally {
      setFixingIssueId(null);
    }
  };

  const handleDownloadGitScript = (gitCommands: string[]) => {
    const scriptContent = `#!/bin/bash\n# SK MISSION BOARD - AI DevOps Auto Git Push Script\n# Generated at: ${new Date().toISOString()}\n\n` + 
      gitCommands.join("\n") + "\n\necho '🎉 Successfully pushed to GitHub!'\n";
    
    const blob = new Blob([scriptContent], { type: "text/x-sh" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "skmb_github_push.sh";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 500);
    showStatus("GitHub ऑटो-पुश स्क्रिप्ट (skmb_github_push.sh) डाउनलोड हो गई!", "success");
  };

  const quickPresets = [
    {
      title: "🩺 Scan & Self-Heal App",
      prompt: "App ko scan karo aur jo bhi problem hai (flags, missing links, branding) unhe scan report dekar theek karo"
    },
    {
      title: "🎨 Logo & Branding Change",
      prompt: "App ke branding, title aur logo ko customize karne ke instructions do ya change apply karo"
    },
    {
      title: "🚀 GitHub Push All Changes",
      prompt: "Generate complete GitHub commit and push commands for recent updates and features"
    },
    {
      title: "🎛️ Enable All Feature Flags",
      prompt: "Sabhi feature flags (ai, music, videos, pdfSearch, announcements, bookmarks) ko active/enable kar do"
    },
    {
      title: "🧩 Generate BSEB Quiz Component",
      prompt: "Write a complete production-ready React component in TypeScript for Class 10 BSEB Subject Quiz with timer and score calculation"
    },
    {
      title: "🔄 Renew & Sync App Cache",
      prompt: "Purane cached data ko renew karo aur sabhi resources ko refresh sync karo"
    }
  ];

  const agentPotentials = [
    { name: "Gemini 3.1 Pro", badge: "3+ Tier Deep Reasoning & Architecture", color: "from-blue-600 to-indigo-500" },
    { name: "Replit Agent", badge: "Direct Asset Placement & Full Autonomy", color: "from-orange-500 to-red-500" },
    { name: "Gemini 3.7 Flash", badge: "Ultra-Fast Multimodal & High Thinking", color: "from-purple-500 to-pink-500" },
    { name: "Cursor & Claude Code", badge: "Self-Healing & Clean Git", color: "from-emerald-500 to-teal-400" }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950/90 via-purple-950/90 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 shrink-0">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
                  SK AI Multimodal Admin Agent & DevOps Studio
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  Vision + Direct Asset Placement
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                इमेज/वीडियो सीधे अपलोड करें — AI उन्हें देखकर समझ सकता है और तुरंत लोगो/बैकग्राउंड में फिट कर सकता है।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => runSystemDiagnostics(true)}
              disabled={isScanning}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Stethoscope className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} />
              <span>ऐप हेल्थ स्कैन</span>
            </button>

            <button
              onClick={() => handleExecuteDevops("Renew resources and verify system integrity")}
              disabled={isProcessing}
              className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin text-indigo-400" : ""}`} />
              <span>सिस्टम सिंक</span>
            </button>
          </div>
        </div>

        {/* Integrated Super-Agent Potential Indicators */}
        <div className="mt-4 pt-3 border-t border-indigo-500/20 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            एकीकृत AI एजेंट्स क्षमता:
          </span>
          {agentPotentials.map((item, idx) => (
            <div 
              key={idx} 
              className="px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-700 text-[10px] font-semibold text-slate-200 flex items-center gap-1.5"
            >
              <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${item.color}`} />
              <span className="font-bold text-white">{item.name}</span>
              <span className="text-slate-400">({item.badge})</span>
            </div>
          ))}
        </div>

        {/* Guardrail Policy Pill */}
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-300 bg-emerald-950/40 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>सख्त सुरक्षा नियम:</strong> यह एजेंट केवल आपके दिए गए विशिष्ट आदेश पर काम करेगा और बिना आदेश के किसी अन्य भाग में स्वतः कोई बदलाव नहीं करेगा।
          </span>
        </div>

        {/* Status Notification */}
        {statusNotification && (
          <div className={`mt-4 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border animate-in fade-in slide-in-from-top-2 ${
            statusNotification.type === "success" 
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : statusNotification.type === "error"
              ? "bg-red-500/10 border-red-500/30 text-red-300"
              : "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
          }`}>
            {statusNotification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : statusNotification.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <Zap className="w-4 h-4 text-indigo-400 shrink-0" />
            )}
            <span>{statusNotification.text}</span>
          </div>
        )}
      </div>

      {/* AUTOMATED PROACTIVE APP HEALTH SCAN BAR / NOTIFICATION */}
      {healthScan && healthScan.issues.length > 0 && (
        <div className="bg-slate-950/90 border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
                <AlertTriangle className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h4 className="text-sm font-black text-amber-300 flex items-center gap-2">
                  <span>स्वचालित ऐप हेल्थ स्कैन रिपोर्ट (Health Score: {healthScan.score}%)</span>
                </h4>
                <p className="text-xs text-slate-400">
                  AI ने ऐप को स्कैन किया है और {healthScan.issues.length} सुधार योग्य बिंदु पाए हैं। आप 1-क्लिक में इन्हें ठीक कर सकते हैं:
                </p>
              </div>
            </div>

            <button
              onClick={() => handleExecuteDevops("Fix all scanned issues and restore optimal performance")}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer shrink-0"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>सभी समस्याएँ ठीक करें (Self-Heal All)</span>
            </button>
          </div>

          <div className="mt-3.5 space-y-2">
            {healthScan.issues.map((issue) => (
              <div
                key={issue.id}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      issue.severity === "critical" 
                        ? "bg-red-500/20 text-red-300 border border-red-500/40" 
                        : issue.severity === "warning"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                    }`}>
                      {issue.severity}
                    </span>
                    <h5 className="text-xs font-bold text-white">{issue.title}</h5>
                  </div>
                  <p className="text-[11px] text-slate-400">{issue.description}</p>
                </div>

                <button
                  onClick={() => handleApplyIssueFix(issue)}
                  disabled={fixingIssueId === issue.id || isProcessing}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto shrink-0"
                >
                  <Wrench className={`w-3.5 h-3.5 ${fixingIssueId === issue.id ? "animate-spin text-amber-300" : ""}`} />
                  <span>क्या मैं इसे ठीक कर दूँ? (1-Click Fix)</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Multimodal File Upload & Prompt Console */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-purple-400" />
            <span>एडमिन AI मल्टीमोडल कंसोल (इमेज, वीडियो, वॉइस या टेक्स्ट निर्देश):</span>
          </label>
          <div className="flex items-center gap-2">
            {isListening && (
              <span className="flex items-center gap-1.5 text-xs text-rose-400 font-bold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                माइक सक्रिय है...
              </span>
            )}
          </div>
        </div>

        {/* Attached Media Preview (If uploaded) */}
        {attachedMedia && (
          <div className="p-3 bg-slate-950 border border-indigo-500/40 rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              {attachedMedia.fileType === "image" ? (
                <img 
                  src={attachedMedia.dataUrl} 
                  alt="Uploaded Media" 
                  className="w-12 h-12 rounded-lg object-cover border border-slate-700" 
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-indigo-950 flex items-center justify-center border border-indigo-500/40 text-indigo-300">
                  <VideoIcon className="w-6 h-6" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">{attachedMedia.fileName}</span>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold uppercase">
                    {attachedMedia.fileType} ({attachedMedia.fileSizeMb} MB)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  AI इस फाइल को देखकर सीधे ऐप में फिट (Fit/Place) करने के लिए तैयार है।
                </p>
              </div>
            </div>

            <button
              onClick={() => setAttachedMedia(null)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-colors cursor-pointer"
              title="अटैचमेंट हटाएं"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="relative flex items-center gap-2">
          {/* Hidden File Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleMediaUpload} 
            accept="image/*,video/*" 
            className="hidden" 
          />

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="इमेज या वीडियो अपलोड करें (Direct AI Vision & Fitting)"
            className="p-3 rounded-xl bg-slate-800/90 hover:bg-indigo-950 border border-slate-700 hover:border-indigo-500 text-indigo-300 hover:text-white transition-all cursor-pointer shrink-0 flex items-center justify-center"
          >
            <Upload className="w-4 h-4" />
          </button>

          <div className="relative flex-1">
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleExecuteDevops();
                }
              }}
              placeholder={
                isListening 
                  ? "🎙️ सुन रहा हूँ... बोलिए..." 
                  : attachedMedia 
                  ? `उदा. 'Is ${attachedMedia.fileType === 'image' ? 'image ko app logo' : 'video ko background theme'} bana do'..."`
                  : "उदा. 'App ka logo change karo', 'App ko scan karo', 'GitHub push commands banao'..."
              }
              className={`w-full bg-slate-950/80 border rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                isListening 
                  ? "border-rose-500 shadow-lg shadow-rose-500/20 ring-1 ring-rose-500" 
                  : "border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              }`}
            />
            <button
              onClick={toggleListening}
              title={isListening ? "माइक बंद करें" : "बोलकर कमांड दें"}
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all cursor-pointer ${
                isListening 
                  ? "bg-rose-500 text-white animate-bounce shadow-md shadow-rose-500/50" 
                  : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={() => handleExecuteDevops()}
            disabled={(!promptInput.trim() && !attachedMedia) || isProcessing}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>प्रोसेसिंग...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>रन करें</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-thin">
          <span className="text-[11px] text-slate-500 font-semibold shrink-0">त्वरित सुझाव:</span>
          {quickPresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPromptInput(preset.prompt);
                handleExecuteDevops(preset.prompt);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-indigo-900/40 border border-slate-700/80 hover:border-indigo-500/50 text-[11px] text-slate-300 hover:text-indigo-200 transition-all shrink-0 cursor-pointer font-medium"
            >
              {preset.title}
            </button>
          ))}
        </div>
      </div>

      {/* Current AI Output / Execution Results */}
      {currentResponse && (
        <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-5 animate-in fade-in slide-in-from-bottom-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h4 className="text-sm font-black text-white">AI DevOps निष्पादन परिणाम (Execution Result)</h4>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              currentResponse.actionType === "UPDATE_BRANDING"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : currentResponse.actionType === "UPDATE_FLAGS"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                : currentResponse.actionType === "SELF_HEAL_FIX"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : currentResponse.actionType === "GIT_WORKFLOW"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-purple-500/20 text-purple-300 border border-purple-500/40"
            }`}>
              {currentResponse.actionType}
            </span>
          </div>

          {/* AI Explanation / Reply */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-200 leading-relaxed space-y-2 whitespace-pre-line">
            {currentResponse.reply}
          </div>

          {/* Action Payload Preview (Branding / Flags / Announcements) */}
          {currentResponse.actionPayload && (
            <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs space-y-2">
              <div className="flex items-center gap-2 text-indigo-300 font-bold">
                <Sliders className="w-4 h-4" />
                <span>लागू किए गए रिमोट बदलाव (Auto-Applied Changes):</span>
              </div>
              <pre className="p-2.5 bg-slate-950 rounded-lg text-emerald-400 overflow-x-auto text-[11px] font-mono">
                {JSON.stringify(currentResponse.actionPayload, null, 2)}
              </pre>
            </div>
          )}

          {/* Git Workflow Commands */}
          {currentResponse.gitCommands && currentResponse.gitCommands.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <GitBranch className="w-4 h-4" />
                  <span>GitHub पुश कमांड्स (1-Click Push Ready):</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadGitScript(currentResponse.gitCommands!)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>.sh स्क्रिप्ट डाउनलोड</span>
                  </button>
                  <button
                    onClick={() => copyToClipboard(currentResponse.gitCommands!.join("\n"), "git-cmds")}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    {copiedIndex === "git-cmds" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>कमांड्स कॉपी करें</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-emerald-400 overflow-x-auto space-y-1">
                {currentResponse.gitCommands.map((cmd, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-slate-600 select-none">$</span>
                    <span>{cmd}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generated Code Snippets */}
          {currentResponse.codeSnippets && currentResponse.codeSnippets.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                <Code className="w-4 h-4" />
                <span>जनरेट किए गए कोड कंपोनेंट्स ({currentResponse.codeSnippets.length}):</span>
              </div>

              {currentResponse.codeSnippets.map((snippet, idx) => (
                <div key={idx} className="bg-slate-950 border border-purple-500/30 rounded-xl overflow-hidden shadow-lg">
                  <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white">{snippet.title}</span>
                      <span className="ml-2 text-[10px] text-purple-400 uppercase font-mono">({snippet.language})</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(snippet.code, `code-${idx}`)}
                      className="px-3 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {copiedIndex === `code-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>कॉपी कोड</span>
                    </button>
                  </div>
                  {snippet.description && (
                    <div className="px-4 py-2 bg-slate-900/40 text-xs text-slate-400 border-b border-slate-800/60">
                      {snippet.description}
                    </div>
                  )}
                  <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-96 bg-black/50 leading-relaxed scrollbar-thin">
                    <code>{snippet.code}</code>
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Session Command History */}
      {history.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-400" />
              <span>सत्र इतिहास (Session Activity Log)</span>
            </h4>
            <button
              onClick={() => setHistory([])}
              className="text-[11px] text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              इतिहास साफ करें
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => setCurrentResponse(item.response)}
                className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-indigo-500/40 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-[10px] font-mono text-slate-500">{item.timestamp}</span>
                  <span className="text-slate-200 font-medium truncate">"{item.prompt}"</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-bold text-indigo-400 px-1.5 py-0.5 rounded bg-indigo-500/10">
                    {item.response.actionType}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div ref={consoleBottomRef} />
    </div>
  );
};
