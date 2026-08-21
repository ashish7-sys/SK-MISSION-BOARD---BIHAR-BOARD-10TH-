import React from "react";
import { Announcement, AnnouncementType, NavTab } from "../types";
import { StoreService } from "../services/storeService";
import { 
  Megaphone, 
  Sparkles, 
  Calendar, 
  AlertCircle, 
  FilePlus2, 
  Smartphone, 
  Info, 
  X, 
  ExternalLink, 
  ArrowRight,
  ShieldAlert
} from "lucide-react";

interface AnnouncementsSectionProps {
  announcements?: Announcement[];
  onNavigateToTab?: (tab: NavTab) => void;
  onOpenUpdates?: () => void;
}

export const AnnouncementsSection: React.FC<AnnouncementsSectionProps> = ({ 
  announcements: propAnnouncements,
  onNavigateToTab,
  onOpenUpdates
}) => {
  // Use StoreService active filtering if prop not provided or filter prop
  const now = Date.now();
  const allAnnouncements = propAnnouncements || StoreService.getAnnouncements();

  const activeAnnouncements = allAnnouncements.filter((ann) => {
    // 1. Must be published & active
    const isPub = ann.isPublished !== false;
    const isAct = ann.isActive !== false;
    if (!isPub || !isAct) return false;

    // 2. Check if dismissed locally
    if (StoreService.isAnnouncementDismissed(ann.id)) {
      return false;
    }

    // 3. Start time check
    if (ann.startTime) {
      const startTimestamp = new Date(ann.startTime).getTime();
      if (!isNaN(startTimestamp) && startTimestamp > now) return false;
    }

    // 4. End time check
    if (ann.endTime) {
      const endTimestamp = new Date(ann.endTime).getTime();
      if (!isNaN(endTimestamp) && endTimestamp < now) return false;
    }

    return true;
  });

  if (activeAnnouncements.length === 0) return null;

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    StoreService.dismissAnnouncement(id);
  };

  const handleAction = (ann: Announcement) => {
    if (!ann.actionUrl) return;
    const url = ann.actionUrl.trim();

    if (url.startsWith("nav:")) {
      const target = url.replace("nav:", "").trim();
      if (target === "updates" && onOpenUpdates) {
        onOpenUpdates();
      } else if (onNavigateToTab) {
        onNavigateToTab(target as NavTab);
      }
    } else if (url.startsWith("http://") || url.startsWith("https://")) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const getTypeStyle = (type?: AnnouncementType, isImportant?: boolean) => {
    if (isImportant || type === "IMPORTANT") {
      return {
        badgeBg: "bg-red-500/25 text-red-300 border-red-500/40",
        cardBorder: "hover:border-red-500/40 border-red-500/20 bg-red-950/20",
        icon: ShieldAlert,
        iconColor: "text-red-400",
        label: "IMPORTANT",
        accentText: "text-red-300"
      };
    }

    switch (type) {
      case "NEW_CONTENT":
        return {
          badgeBg: "bg-emerald-500/25 text-emerald-300 border-emerald-500/40",
          cardBorder: "hover:border-emerald-500/40 border-emerald-500/20 bg-emerald-950/20",
          icon: FilePlus2,
          iconColor: "text-emerald-400",
          label: "NEW CONTENT",
          accentText: "text-emerald-300"
        };
      case "UPDATE":
        return {
          badgeBg: "bg-cyan-500/25 text-cyan-300 border-cyan-500/40",
          cardBorder: "hover:border-cyan-500/40 border-cyan-500/20 bg-cyan-950/20",
          icon: Smartphone,
          iconColor: "text-cyan-400",
          label: "APP UPDATE",
          accentText: "text-cyan-300"
        };
      case "NOTICE":
        return {
          badgeBg: "bg-amber-500/25 text-amber-300 border-amber-500/40",
          cardBorder: "hover:border-amber-500/40 border-amber-500/20 bg-amber-950/20",
          icon: AlertCircle,
          iconColor: "text-amber-400",
          label: "BOARD NOTICE",
          accentText: "text-amber-300"
        };
      case "INFO":
      default:
        return {
          badgeBg: "bg-purple-500/25 text-purple-300 border-purple-500/40",
          cardBorder: "hover:border-purple-500/40 border-purple-500/20 bg-purple-950/20",
          icon: Info,
          iconColor: "text-purple-400",
          label: "INFORMATION",
          accentText: "text-purple-300"
        };
    }
  };

  return (
    <div id="remote-announcements-container" className="w-full my-6 animate-fade-in">
      <div className="relative rounded-3xl p-[1px] bg-gradient-to-r from-amber-500/30 via-cyan-500/30 to-purple-500/30 shadow-2xl overflow-hidden">
        <div className="relative rounded-3xl bg-slate-950/60 backdrop-blur-xl p-5 sm:p-6 border border-white/10">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/25 text-amber-300 border border-amber-500/30 animate-pulse backdrop-blur-sm">
                <Megaphone className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-2xl font-black text-white tracking-wide flex items-center gap-2 drop-shadow">
                  Official Announcements & Board Updates
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-bounce" />
                </h3>
              </div>
            </div>

            <span className="text-xs sm:text-sm font-mono font-black text-cyan-300 bg-slate-950/80 backdrop-blur-sm px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-white/15 shrink-0">
              BSEB 2026
            </span>
          </div>

          {/* Announcements List */}
          <div className="space-y-3.5">
            {activeAnnouncements.map((ann) => {
              const typeStyle = getTypeStyle(ann.type, ann.isImportant);
              const TypeIcon = typeStyle.icon;
              const displayMessage = ann.message || ann.content;

              return (
                <div
                  key={ann.id}
                  id={`announcement-card-${ann.id}`}
                  className={`p-4 sm:p-5 rounded-2xl backdrop-blur-md border transition-all duration-200 shadow-md ${typeStyle.cardBorder}`}
                >
                  {/* Top Line: Badge, Title & Dismiss */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider border flex items-center gap-1 shrink-0 ${typeStyle.badgeBg}`}>
                        <TypeIcon className={`w-3 h-3 ${typeStyle.iconColor}`} />
                        {typeStyle.label}
                      </span>

                      <h4 className={`text-base sm:text-lg font-bold tracking-wide drop-shadow ${typeStyle.accentText}`}>
                        {ann.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {ann.date && (
                        <span className="text-xs text-slate-400 font-mono hidden sm:flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {ann.date}
                        </span>
                      )}

                      {/* User Dismiss Button */}
                      <button
                        id={`btn-dismiss-ann-${ann.id}`}
                        onClick={(e) => handleDismiss(ann.id, e)}
                        className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
                        title="Dismiss announcement"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Announcement Body Content */}
                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal mt-1 whitespace-pre-line">
                    {displayMessage}
                  </p>

                  {/* Optional Action Button */}
                  {ann.actionButton && ann.actionUrl && (
                    <div className="mt-3.5 pt-2.5 border-t border-white/5 flex items-center justify-between">
                      <button
                        id={`btn-ann-action-${ann.id}`}
                        onClick={() => handleAction(ann)}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
                      >
                        <span>{ann.actionButton}</span>
                        {ann.actionUrl.startsWith("http") ? (
                          <ExternalLink className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {ann.date && (
                        <span className="text-[11px] text-slate-400 font-mono sm:hidden flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {ann.date}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
