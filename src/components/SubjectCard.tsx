import React from "react";
import { SubjectInfo } from "../types";
import { 
  BookOpenText, 
  Languages, 
  Calculator, 
  Atom, 
  Globe, 
  Scroll, 
  ChevronRight, 
  Sparkles, 
  FileText, 
  Video 
} from "lucide-react";

interface SubjectCardProps {
  subject: SubjectInfo;
  pdfCount: number;
  videoCount: number;
  onClick: () => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = React.memo(({
  subject,
  pdfCount,
  videoCount,
  onClick
}) => {
  // Render high-glow vibrant subject icons
  const renderIcon = () => {
    const iconClass = "w-8 h-8 text-white";
    switch (subject.iconName) {
      case "BookOpenText":
        return <BookOpenText className={iconClass} />;
      case "Languages":
        return <Languages className={iconClass} />;
      case "Calculator":
        return <Calculator className={iconClass} />;
      case "Atom":
        return <Atom className={iconClass} />;
      case "Globe":
        return <Globe className={iconClass} />;
      case "Scroll":
        return <Scroll className={iconClass} />;
      default:
        return <BookOpenText className={iconClass} />;
    }
  };

  return (
    <div
      onClick={onClick}
      className="subject-card group relative cursor-pointer rounded-3xl p-[1px] transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] transform-gpu"
    >
      {/* Outer Gradient Border Layer */}
      <div 
        className="absolute -inset-0.5 rounded-3xl opacity-40 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ 
          background: `linear-gradient(135deg, ${subject.themeColor}, #38bdf8, #c084fc)` 
        }}
      />

      {/* Main Glass Card (70% Translucent) */}
      <div className="relative flex flex-col justify-between h-full rounded-3xl bg-slate-950/35 backdrop-blur-md p-6 border border-white/15 group-hover:bg-slate-900/45 group-hover:border-amber-400/40 shadow-xl overflow-hidden transition-all duration-300">
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between mb-4">
            {/* Glowing Translucent Icon Container */}
            <div 
              className="relative flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg border border-white/30 backdrop-blur-sm transition-transform duration-200 group-hover:scale-105"
              style={{ 
                background: `linear-gradient(135deg, ${subject.themeColor}55, ${subject.themeColor}33)` 
              }}
            >
              <div className="relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                {renderIcon()}
              </div>
            </div>

            {/* Subject Code Badge */}
            <span className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-mono font-black uppercase tracking-widest text-cyan-300 bg-slate-950/60 backdrop-blur-sm border border-slate-700/80 shadow-inner">
              {subject.code}
            </span>
          </div>

          {/* Hindi Name with English Subtitle */}
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-wide group-hover:text-amber-300 transition-colors flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <span>{subject.nameHindi}</span>
            {subject.id === "sanskrit" && <Sparkles className="w-5 h-5 text-amber-400 inline animate-pulse" />}
          </h3>

          <p className="text-base font-bold text-slate-100 mt-1.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            {subject.nameEnglish} • <span className="text-cyan-400 font-bold">{subject.totalChapters} Chapters</span>
          </p>

          <p className="text-sm text-slate-200 line-clamp-2 mt-3 leading-relaxed font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {subject.description}
          </p>
        </div>

        {/* Card Footer: Metrics & Action */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-sm font-bold">
          <div className="flex items-center gap-2.5 text-slate-100">
            <span className="flex items-center gap-1.5 text-pink-300 bg-pink-500/20 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-pink-500/30 shadow-sm">
              <FileText className="w-4 h-4 text-pink-300" />
              {pdfCount} PDFs
            </span>

            <span className="flex items-center gap-1.5 text-amber-300 bg-amber-500/20 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-amber-500/30 shadow-sm">
              <Video className="w-4 h-4 text-amber-300" />
              {videoCount} Videos
            </span>
          </div>

          <div className="flex items-center gap-1 text-slate-200 group-hover:text-amber-300 font-bold transition-colors drop-shadow">
            <span className="text-xs sm:text-sm uppercase tracking-wider">Explore</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
});
