import React, { useState, useEffect, useMemo } from "react";
import { 
  AnalyticsSummary, 
  AnalyticsTimeframe, 
  Chapter, 
  PDFMaterial, 
  YouTubeVideo, 
  MusicTrack, 
  SubjectId,
  ResourceAnalyticsStat 
} from "../types";
import { AnalyticsService } from "../services/analyticsService";
import { OFFICIAL_SUBJECTS } from "../data/bsebClass10Data";
import { 
  Users, 
  FileText, 
  Video, 
  Music, 
  Download, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  RefreshCw, 
  Calendar, 
  Search, 
  Eye, 
  Play, 
  BarChart3, 
  Layers, 
  BookOpen, 
  HelpCircle, 
  Image as ImageIcon, 
  FileCheck, 
  CheckCircle2, 
  DownloadCloud, 
  RotateCcw,
  Activity,
  ArrowUpRight,
  Filter
} from "lucide-react";

interface AdminAnalyticsViewProps {
  chapters: Chapter[];
  pdfs: PDFMaterial[];
  videos: YouTubeVideo[];
  musicTracks: MusicTrack[];
}

export const AdminAnalyticsView: React.FC<AdminAnalyticsViewProps> = ({
  chapters,
  pdfs,
  videos,
  musicTracks
}) => {
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>("7days");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [resourceFilter, setResourceFilter] = useState<"all" | "pdf" | "video" | "music">("pdf");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("all");
  const [summary, setSummary] = useState<AnalyticsSummary>(() => 
    AnalyticsService.getSummary("7days", pdfs, videos, musicTracks, chapters)
  );

  const loadSummary = (tf: AnalyticsTimeframe) => {
    const data = AnalyticsService.getSummary(tf, pdfs, videos, musicTracks, chapters);
    setSummary(data);
  };

  useEffect(() => {
    loadSummary(timeframe);
    const unsub = AnalyticsService.subscribe(() => {
      loadSummary(timeframe);
    });
    return () => {
      unsub();
    };
  }, [timeframe, pdfs, videos, musicTracks, chapters]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      loadSummary(timeframe);
      setIsRefreshing(false);
    }, 400);
  };

  const handleExportJson = () => {
    const exportData = {
      app: "SK MISSION BOARD",
      generatedAt: new Date().toISOString(),
      timeframe,
      summary
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `skmb-analytics-${timeframe}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered resources table
  const filteredResources = useMemo(() => {
    let list: ResourceAnalyticsStat[] = [];

    if (resourceFilter === "pdf" || resourceFilter === "all") {
      list.push(...summary.resourceStats.pdfs);
    }
    if (resourceFilter === "video" || resourceFilter === "all") {
      list.push(...summary.resourceStats.videos);
    }
    if (resourceFilter === "music" || resourceFilter === "all") {
      list.push(...summary.resourceStats.music);
    }

    if (selectedSubjectFilter !== "all") {
      list = list.filter(item => item.subjectId === selectedSubjectFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => 
        item.title.toLowerCase().includes(q) || 
        (item.chapterTitle && item.chapterTitle.toLowerCase().includes(q))
      );
    }

    return list;
  }, [summary, resourceFilter, selectedSubjectFilter, searchQuery]);

  return (
    <div className="space-y-6 text-white pb-6">
      
      {/* Header & Controls Toolbar */}
      <div className="bg-slate-950/80 p-4 sm:p-5 rounded-3xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white">
                Admin Analytics & Learning Insights
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                Live Aggregates
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              Privacy-friendly platform telemetry — zero personal data or chat prompt retention
            </p>
          </div>
        </div>

        {/* Time Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-900 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setTimeframe("today")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                timeframe === "today" 
                  ? "bg-amber-500 text-slate-950 shadow-md font-black" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeframe("7days")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                timeframe === "7days" 
                  ? "bg-amber-500 text-slate-950 shadow-md font-black" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeframe("30days")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                timeframe === "30days" 
                  ? "bg-amber-500 text-slate-950 shadow-md font-black" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeframe("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                timeframe === "all" 
                  ? "bg-amber-500 text-slate-950 shadow-md font-black" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All Time
            </button>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all disabled:opacity-50 cursor-pointer active:scale-95"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
          </button>

          <button
            onClick={() => {
              if (window.confirm("क्या आप एनालिटिक्स डेटा को रीसेट करके 0 करना चाहते हैं?")) {
                AnalyticsService.resetLocalStats();
                loadSummary(timeframe);
              }
            }}
            className="px-2.5 py-2 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
            title="Reset telemetry counters to 0"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset to 0
          </button>

          <button
            onClick={handleExportJson}
            className="px-3 py-2 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
          >
            <DownloadCloud className="w-3.5 h-3.5" /> Export JSON
          </button>
        </div>
      </div>

      {/* Privacy Guarantee Banner */}
      <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-200">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Privacy Guarantee:</strong> Student passwords, contact details, private AI chat messages, and personal files are never tracked or stored.
          </span>
        </div>
        <span className="hidden sm:inline-block text-[11px] text-emerald-400 font-mono font-semibold">
          ANONYMOUS AGGREGATE ONLY
        </span>
      </div>

      {/* 1. KEY AGGREGATE METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Active Users */}
        <div className="bg-slate-950/70 p-4 rounded-3xl border border-slate-800/90 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Students</span>
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {summary.totalActiveUsers.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span className="text-emerald-400 font-bold">~{summary.dailyActiveUsers}</span>
            <span>Daily Active Users (DAU)</span>
          </div>
        </div>

        {/* Card 2: Resource Views */}
        <div className="bg-slate-950/70 p-4 rounded-3xl border border-slate-800/90 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resource Views</span>
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {summary.totalResourceViews.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-purple-300/80 flex items-center gap-1.5">
            <span>PDFs + Lectures + Study Audio</span>
          </div>
        </div>

        {/* Card 3: PDF Opens & Downloads */}
        <div className="bg-slate-950/70 p-4 rounded-3xl border border-slate-800/90 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">PDF Reads & Downloads</span>
            <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {summary.totalPdfOpens.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">Opens</span>
          </div>
          <div className="mt-2 text-[11px] text-pink-400 font-bold flex items-center gap-1">
            <Download className="w-3 h-3" />
            <span>{summary.totalPdfDownloads.toLocaleString()} Offline Saves</span>
          </div>
        </div>

        {/* Card 4: Video & Music Plays */}
        <div className="bg-slate-950/70 p-4 rounded-3xl border border-slate-800/90 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Video & Audio Plays</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Play className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {(summary.totalVideoPlays + summary.totalMusicPlays).toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">Plays</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-300/90 flex items-center gap-2">
            <span>🎥 {summary.totalVideoPlays.toLocaleString()} Videos</span>
            <span>•</span>
            <span>🎵 {summary.totalMusicPlays.toLocaleString()} Audio</span>
          </div>
        </div>

      </div>

      {/* 2. AI USAGE ANALYTICS (STRICT PRIVACY-FIRST AGGREGATES) */}
      <div className="bg-gradient-to-br from-cyan-950/30 via-slate-950/80 to-blue-950/30 p-5 rounded-3xl border border-cyan-500/30 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                AI Study Assistant Usage Analytics
              </h3>
              <p className="text-xs text-cyan-300/80">
                Aggregate question counts and learning resource recommendation metrics
              </p>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Chat contents remain confidential and are never exposed to admins</span>
          </div>
        </div>

        {/* AI Stats Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
          
          <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 block">Total AI Sessions</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-cyan-400">{summary.aiConversationsStarted.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500">Sessions</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Conversations Started</span>
          </div>

          <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 block">Questions Solved</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-white">{summary.aiQuestionsAsked.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500">Queries</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Total AI Questions</span>
          </div>

          <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 block">Image/Photo Queries</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-amber-400">{summary.aiImageQuestions.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500">Images</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Image-Input Questions</span>
          </div>

          <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 block">PDF Notes Suggested</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-pink-400">{summary.aiPdfRequests.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500">Matches</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">PDF Recommendation Matches</span>
          </div>

          <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 block">Video Recommendations</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-blue-400">{summary.aiVideoRequests.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500">Matches</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Video Recommendation Matches</span>
          </div>

        </div>

        {/* AI Query Modality Visual Distribution */}
        <div className="mt-4 pt-3 border-t border-cyan-500/20">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Query Modality Split:</span>
            <span className="text-cyan-300 font-bold">
              {summary.aiQuestionsAsked > 0 ? Math.round(((summary.aiQuestionsAsked - summary.aiImageQuestions) / summary.aiQuestionsAsked) * 100) : 88}% Text • {summary.aiQuestionsAsked > 0 ? Math.round((summary.aiImageQuestions / summary.aiQuestionsAsked) * 100) : 12}% Image
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
            <div 
              style={{ width: `${summary.aiQuestionsAsked > 0 ? Math.round(((summary.aiQuestionsAsked - summary.aiImageQuestions) / summary.aiQuestionsAsked) * 100) : 88}%` }} 
              className="bg-cyan-500 h-full" 
              title="Text Queries"
            />
            <div 
              style={{ width: `${summary.aiQuestionsAsked > 0 ? Math.round((summary.aiImageQuestions / summary.aiQuestionsAsked) * 100) : 12}%` }} 
              className="bg-amber-400 h-full" 
              title="Image Queries"
            />
          </div>
        </div>
      </div>

      {/* 3. MOST ACCESSED SUBJECTS & CHAPTERS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Most Accessed Subjects */}
        <div className="bg-slate-950/70 p-5 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-black text-white">Top Studied Subjects</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">6 BSEB Subjects</span>
            </div>

            <div className="space-y-3 mt-4">
              {summary.topSubjects.map((sub, idx) => (
                <div key={sub.subjectId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-bold flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-white">{sub.name}</span>
                      <span className="text-slate-400 text-[11px]">({sub.nameHindi})</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-amber-400">{sub.count.toLocaleString()} sessions</span>
                      <span className="text-slate-400 text-[11px] w-9 text-right">{sub.percentage}%</span>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0 ? "bg-gradient-to-r from-amber-500 to-yellow-400" :
                        idx === 1 ? "bg-gradient-to-r from-cyan-500 to-blue-500" :
                        idx === 2 ? "bg-gradient-to-r from-purple-500 to-pink-500" :
                        "bg-slate-700"
                      }`}
                      style={{ width: `${Math.max(5, sub.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Most Accessed Chapters */}
        <div className="bg-slate-950/70 p-5 rounded-3xl border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-black text-white">Top Studied Chapters</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Top 8</span>
          </div>

          <div className="space-y-2 mt-4 max-h-[310px] overflow-y-auto pr-1">
            {summary.topChapters.map((ch, idx) => {
              const subObj = OFFICIAL_SUBJECTS.find(s => s.id === ch.subjectId);
              return (
                <div 
                  key={ch.chapterId}
                  className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="w-5 h-5 rounded-lg bg-slate-800 text-amber-400 font-black text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">{ch.title}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <span className="text-cyan-400 font-semibold">{subObj?.nameEnglish || ch.subjectId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-cyan-300">{ch.count.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500 block">sessions</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 4. ACTIVITY TREND OVERVIEW */}
      <div className="bg-slate-950/70 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-black text-white">7-Day Study Activity Trend</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Daily Metrics</span>
        </div>

        <div className="grid grid-cols-7 gap-2 mt-4 pt-2">
          {summary.dailyActivityTrend.map((day) => (
            <div key={day.date} className="flex flex-col items-center bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 mb-2 truncate max-w-full">{day.label}</span>
              
              {/* Visual Bars Container */}
              <div className="w-full flex items-end justify-center gap-1 h-24 mb-2 bg-slate-950/60 rounded-xl p-1">
                {/* Users bar */}
                <div 
                  className="w-2 rounded-t bg-blue-500 transition-all"
                  style={{ height: `${Math.min(100, Math.max(15, (day.users / 250) * 100))}%` }}
                  title={`Users: ${day.users}`}
                />
                {/* PDF Opens bar */}
                <div 
                  className="w-2 rounded-t bg-pink-500 transition-all"
                  style={{ height: `${Math.min(100, Math.max(15, (day.pdfOpens / 180) * 100))}%` }}
                  title={`PDF Opens: ${day.pdfOpens}`}
                />
                {/* Video Plays bar */}
                <div 
                  className="w-2 rounded-t bg-amber-400 transition-all"
                  style={{ height: `${Math.min(100, Math.max(15, (day.videoPlays / 120) * 100))}%` }}
                  title={`Video Plays: ${day.videoPlays}`}
                />
              </div>

              <span className="text-[11px] font-bold text-white font-mono">{day.users}</span>
              <span className="text-[9px] text-slate-500">Students</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-3 pt-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Active Students
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block" /> PDF Study Notes
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Video Lectures
          </span>
        </div>
      </div>

      {/* 5. GRANULAR RESOURCE-LEVEL ANALYTICS TABLE */}
      <div className="bg-slate-950/70 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-pink-400" />
            <h3 className="text-sm font-black text-white">Resource Breakdown Table</h3>
          </div>

          {/* Sub Tab Buttons */}
          <div className="flex items-center bg-slate-900 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setResourceFilter("pdf")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                resourceFilter === "pdf" ? "bg-pink-500 text-white font-black" : "text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> PDF Notes ({summary.resourceStats.pdfs.length})
            </button>
            <button
              onClick={() => setResourceFilter("video")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                resourceFilter === "video" ? "bg-amber-500 text-slate-950 font-black" : "text-slate-400 hover:text-white"
              }`}
            >
              <Video className="w-3.5 h-3.5" /> Video Lectures ({summary.resourceStats.videos.length})
            </button>
            <button
              onClick={() => setResourceFilter("music")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                resourceFilter === "music" ? "bg-emerald-400 text-slate-950 font-black" : "text-slate-400 hover:text-white"
              }`}
            >
              <Music className="w-3.5 h-3.5" /> Study Music ({summary.resourceStats.music.length})
            </button>
          </div>
        </div>

        {/* Search & Subject Filter inside Resource Table */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resource title or chapter name..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Subjects</option>
            {OFFICIAL_SUBJECTS.map(s => (
              <option key={s.id} value={s.id}>{s.nameEnglish} ({s.nameHindi})</option>
            ))}
          </select>
        </div>

        {/* Resources Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Resource Title</th>
                <th className="p-3">Subject / Chapter</th>
                <th className="p-3 text-right">Opens</th>
                <th className="p-3 text-right">Total Views</th>
                <th className="p-3 text-right">
                  {resourceFilter === "pdf" ? "Downloads" : "Plays"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
              {filteredResources.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    No resources found matching filter.
                  </td>
                </tr>
              ) : (
                filteredResources.map((item, idx) => {
                  const subObj = OFFICIAL_SUBJECTS.find(s => s.id === item.subjectId);
                  return (
                    <tr key={item.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="p-3 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <span className="w-4 text-[10px] text-slate-500 font-mono">#{idx + 1}</span>
                          <span className="line-clamp-1">{item.title}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-slate-300 text-[11px] font-medium">{subObj?.nameEnglish || subObj?.nameHindi || "—"}</div>
                        <div className="text-slate-500 text-[10px] line-clamp-1">{item.chapterTitle || "—"}</div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-cyan-300">
                        {item.opens.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-400">
                        {item.views.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-amber-400">
                        {item.type === "pdf" 
                          ? item.downloads.toLocaleString() 
                          : item.plays.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
