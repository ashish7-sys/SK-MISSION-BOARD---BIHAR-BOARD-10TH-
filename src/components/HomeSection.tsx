import React from "react";
import { Announcement, RemoteFeatureFlags } from "../types";
import { LogoHeader } from "./LogoHeader";
import { AnnouncementsSection } from "./AnnouncementsSection";
import { 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  BookOpen, 
  ChevronRight, 
  Youtube, 
  ArrowRight,
  GraduationCap,
  PlayCircle
} from "lucide-react";

interface HomeSectionProps {
  announcements: Announcement[];
  onNavigateToSubjects: () => void;
  onNavigateToSpecial?: () => void;
  featureFlags?: RemoteFeatureFlags;
}

export const HomeSection: React.FC<HomeSectionProps> = ({
  announcements,
  onNavigateToSubjects,
  onNavigateToSpecial,
  featureFlags
}) => {
  const YOUTUBE_CHANNEL_URL = "https://youtube.com/@skmissionboard?si=wckj0D5alOeUnVW8";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Branding Section */}
      <div className="my-6 text-center">
        <LogoHeader size="lg" showSubtitle={true} />

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-sm sm:text-base font-bold">
          <span className="px-4 py-2 rounded-full bg-cyan-500/20 backdrop-blur-md border border-cyan-500/30 text-cyan-200 flex items-center gap-2 shadow-sm drop-shadow">
            <ShieldCheck className="w-5 h-5 text-cyan-400" /> BSEB Class 10th (2026)
          </span>
          <span className="px-4 py-2 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-500/30 text-amber-200 flex items-center gap-2 shadow-sm drop-shadow">
            <Sparkles className="w-5 h-5 text-amber-400" /> 6 Official Subjects
          </span>
          <span className="px-4 py-2 rounded-full bg-pink-500/20 backdrop-blur-md border border-pink-500/30 text-pink-200 flex items-center gap-2 shadow-sm drop-shadow">
            <FileText className="w-5 h-5 text-pink-400" /> Free PDF Notes & Videos
          </span>
        </div>
      </div>

      {/* Official Announcements & Board Updates */}
      {featureFlags?.announcements !== false && (
        <AnnouncementsSection announcements={announcements} />
      )}

      {/* 0. PROMINENT HERO CARD: SK AI STUDY ASSISTANT → */}
      {onNavigateToSpecial && featureFlags?.ai !== false && (
        <div className="my-8">
          <div
            id="home-ai-study-assistant-card"
            onClick={onNavigateToSpecial}
            className="relative group rounded-3xl p-[2px] bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-purple-500 hover:to-pink-500 shadow-2xl hover:shadow-cyan-500/30 transition-all duration-300 cursor-pointer active:scale-[0.99] overflow-hidden"
          >
            <div className="relative rounded-[22px] bg-slate-950/85 backdrop-blur-xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 overflow-hidden">
              {/* Ambient Background Glow */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/25 transition-all duration-500" />
              <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />

              {/* Left Content */}
              <div className="relative z-10 flex items-center gap-5">
                <div className="p-4 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 shadow-xl shadow-cyan-500/30 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shrink-0">
                  <Sparkles className="w-9 h-9 sm:w-10 sm:h-10 text-slate-950 stroke-[2.5]" />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-3 py-0.5 rounded-full text-xs font-mono font-black tracking-widest text-cyan-300 bg-cyan-500/15 border border-cyan-500/30">
                      ✨ SPECIAL • NEW FEATURE
                    </span>
                    <span className="text-xs text-slate-400 font-bold hidden sm:inline">
                      • 24/7 Smart Study Help
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-200 to-white tracking-wider uppercase drop-shadow-[0_2px_10px_rgba(6,182,212,0.4)] flex items-center gap-3">
                    <span>SK AI STUDY ASSISTANT</span>
                    <ArrowRight className="w-7 h-7 sm:w-9 sm:h-9 text-cyan-400 inline-block group-hover:translate-x-3 transition-transform duration-300" />
                  </h3>

                  <p className="text-sm sm:text-base font-semibold text-slate-300 mt-1 max-w-xl">
                    कक्षा 10वीं के किसी भी प्रश्न का सरल हिंदी में हल, 5 अंक के उत्तर, सूत्र, संबंधित PDF व वीडियो तुरंत प्राप्त करें
                  </p>
                </div>
              </div>

              {/* Right Action Indicator */}
              <div className="relative z-10 flex items-center justify-end sm:justify-center">
                <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-cyan-500 text-slate-950 group-hover:bg-cyan-400 font-black text-sm sm:text-base transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                  <span>Open AI Assistant</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform stroke-[3]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. PREMIUM NAVIGATION CARD: SUBJECTS → */}
      <div className="my-8">
        <div
          id="home-subjects-nav-card"
          onClick={onNavigateToSubjects}
          className="relative group rounded-3xl p-[2px] bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-cyan-400 hover:via-amber-300 hover:to-pink-500 shadow-2xl hover:shadow-amber-500/20 transition-all duration-300 cursor-pointer active:scale-[0.99] overflow-hidden"
        >
          <div className="relative rounded-[22px] bg-slate-950/80 backdrop-blur-xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/20 transition-all duration-500" />
            <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Left Content */}
            <div className="relative z-10 flex items-center gap-5">
              <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-xl shadow-amber-500/30 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shrink-0">
                <BookOpen className="w-9 h-9 sm:w-10 sm:h-10" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-3 py-0.5 rounded-full text-xs font-mono font-black tracking-widest text-amber-300 bg-amber-500/15 border border-amber-500/30">
                    BSEB 2026 MATRIC
                  </span>
                  <span className="text-xs text-slate-400 font-bold hidden sm:inline">
                    • 6 Core Subjects
                  </span>
                </div>

                <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-white tracking-wider uppercase drop-shadow-[0_2px_10px_rgba(245,158,11,0.4)] flex items-center gap-3">
                  <span>SUBJECTS</span>
                  <ArrowRight className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 inline-block group-hover:translate-x-3 transition-transform duration-300" />
                </h3>

                <p className="text-sm sm:text-base font-semibold text-slate-300 mt-1 max-w-xl">
                  विज्ञान, गणित, संस्कृत, हिन्दी, सामाजिक विज्ञान व अंग्रेजी के सभी चैप्टर-वाइज नोट्स व कक्षाएं
                </p>
              </div>
            </div>

            {/* Right Action Indicator */}
            <div className="relative z-10 flex items-center justify-end sm:justify-center">
              <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-amber-500/20 group-hover:bg-amber-400 text-amber-300 group-hover:text-slate-950 font-black text-sm sm:text-base border border-amber-500/30 transition-all duration-300 shadow-lg">
                <span>Explore Subjects</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. OFFICIAL YOUTUBE CHANNEL BUTTON/CARD */}
      {featureFlags?.videos !== false && (
        <div className="my-8">
          <a
            id="official-youtube-channel-btn"
            href={YOUTUBE_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="relative block group rounded-3xl p-[2px] bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:via-red-500 hover:to-orange-400 shadow-2xl hover:shadow-red-500/20 transition-all duration-300 cursor-pointer active:scale-[0.99] overflow-hidden"
          >
            <div className="relative rounded-[22px] bg-slate-950/80 backdrop-blur-xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5 overflow-hidden">
              {/* Red Glow */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/15 rounded-full blur-3xl pointer-events-none group-hover:bg-red-500/25 transition-all" />

              {/* Left Content */}
              <div className="relative z-10 flex items-center gap-4 sm:gap-5">
                <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-xl shadow-red-600/40 group-hover:scale-110 transition-transform duration-300 shrink-0">
                  <Youtube className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-3 py-0.5 rounded-full text-xs font-mono font-black tracking-widest text-red-300 bg-red-500/15 border border-red-500/30">
                      LIVE CLASSES & SOLUTIONS
                    </span>
                    <span className="text-xs text-slate-400 font-bold hidden sm:inline">
                      • @skmissionboard
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-rose-200 to-red-400 tracking-wide uppercase drop-shadow flex items-center gap-2">
                    <PlayCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 inline shrink-0" />
                    <span>OFFICIAL YOUTUBE CHANNEL</span>
                  </h3>

                  <p className="text-xs sm:text-sm font-medium text-slate-300 mt-1 max-w-xl">
                    प्रतिदिन महत्वपूर्ण प्रश्नों के लाइव वीडियो लेक्चर्स व परीक्षा टिप्स प्राप्त करें
                  </p>
                </div>
              </div>

              {/* Right Action Button */}
              <div className="relative z-10 flex items-center justify-end sm:justify-center shrink-0">
                <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-600 text-white group-hover:bg-red-500 font-black text-xs sm:text-sm shadow-xl shadow-red-600/30 transition-all group-hover:scale-105">
                  <span>Subscribe & Watch</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </a>
        </div>
      )}

      {/* Quick Matric Highlights Bar */}
      <div className="my-6 p-5 rounded-3xl bg-slate-950/40 backdrop-blur-md border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div className="p-3 rounded-2xl bg-slate-900/40 border border-white/5">
          <p className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">6</p>
          <p className="text-xs sm:text-sm text-slate-300 font-bold mt-0.5">Core Subjects</p>
        </div>
        <div className="p-3 rounded-2xl bg-slate-900/40 border border-white/5">
          <p className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">100%</p>
          <p className="text-xs sm:text-sm text-slate-300 font-bold mt-0.5">Free Materials</p>
        </div>
        <div className="p-3 rounded-2xl bg-slate-900/40 border border-white/5">
          <p className="text-2xl sm:text-3xl font-black text-pink-400 font-mono">2026</p>
          <p className="text-xs sm:text-sm text-slate-300 font-bold mt-0.5">BSEB Target</p>
        </div>
        <div className="p-3 rounded-2xl bg-slate-900/40 border border-white/5">
          <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">HD</p>
          <p className="text-xs sm:text-sm text-slate-300 font-bold mt-0.5">Video Lectures</p>
        </div>
      </div>
    </div>
  );
};
