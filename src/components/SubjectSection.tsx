import React from "react";
import { SubjectInfo, Chapter, PDFMaterial, YouTubeVideo } from "../types";
import { OFFICIAL_SUBJECTS } from "../data/bsebClass10Data";
import { SubjectCard } from "./SubjectCard";
import { BookOpen, Sparkles, GraduationCap } from "lucide-react";

interface SubjectSectionProps {
  chapters: Chapter[];
  pdfs: PDFMaterial[];
  videos: YouTubeVideo[];
  onSelectSubject: (subject: SubjectInfo) => void;
}

export const SubjectSection: React.FC<SubjectSectionProps> = ({
  chapters,
  pdfs,
  videos,
  onSelectSubject
}) => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner Heading */}
      <div className="text-center my-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-mono font-black uppercase tracking-widest mb-3 shadow-sm backdrop-blur-md">
          <GraduationCap className="w-4 h-4 text-amber-400" />
          <span>BIHAR BOARD CLASS 10TH (MATRIC 2026)</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-yellow-400 tracking-wider uppercase drop-shadow-[0_2px_15px_rgba(245,158,11,0.5)]">
          SUBJECTS
        </h1>

        <p className="text-sm sm:text-base md:text-lg font-semibold text-slate-300 mt-2 max-w-2xl mx-auto drop-shadow">
          सभी 6 अनिवार्य विषयों के अध्याय-वार हस्तलिखित नोट्स, महत्वपूर्ण प्रश्न एवं वीडियो कक्षाएं
        </p>
      </div>

      {/* Grid of 6 Subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {OFFICIAL_SUBJECTS.map((subject) => {
          const subPdfs = pdfs.filter((p) => p.subjectId === subject.id && p.isPublished !== false);
          const subVideos = videos.filter((v) => v.subjectId === subject.id && v.isPublished !== false);

          return (
            <SubjectCard
              key={subject.id}
              subject={subject}
              pdfCount={subPdfs.length}
              videoCount={subVideos.length}
              onClick={() => onSelectSubject(subject)}
            />
          );
        })}
      </div>
    </div>
  );
};
