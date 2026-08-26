import React from "react";
import { NavTab, RemoteFeatureFlags } from "../types";
import { Home, BookOpen, Sparkles, Music, Download } from "lucide-react";

interface BottomNavBarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  downloadCount?: number;
  featureFlags?: RemoteFeatureFlags;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab,
  downloadCount = 0,
  featureFlags
}) => {
  const allTabs = [
    {
      id: "home" as NavTab,
      label: "HOME",
      icon: Home,
      glowColor: "from-cyan-500 to-blue-500",
      activeText: "text-cyan-300",
      activeBg: "bg-cyan-500/20 border-cyan-500/40 text-cyan-200",
      indicatorColor: "bg-cyan-400",
      visible: true
    },
    {
      id: "subject" as NavTab,
      label: "SUBJECT",
      icon: BookOpen,
      glowColor: "from-amber-500 to-yellow-400",
      activeText: "text-amber-300",
      activeBg: "bg-amber-500/20 border-amber-500/40 text-amber-200",
      indicatorColor: "bg-amber-400",
      visible: true
    },
    {
      id: "ai" as NavTab,
      label: "AI",
      icon: Sparkles,
      glowColor: "from-cyan-400 to-indigo-500",
      activeText: "text-cyan-300",
      activeBg: "bg-cyan-500/25 border-cyan-400/50 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]",
      indicatorColor: "bg-cyan-400",
      visible: featureFlags?.ai !== false
    },
    {
      id: "music" as NavTab,
      label: "MUSIC",
      icon: Music,
      glowColor: "from-purple-500 to-pink-500",
      activeText: "text-purple-300",
      activeBg: "bg-purple-500/20 border-purple-500/40 text-purple-200",
      indicatorColor: "bg-purple-400",
      visible: featureFlags?.music !== false
    },
    {
      id: "download" as NavTab,
      label: "DOWNLOAD",
      icon: Download,
      glowColor: "from-emerald-500 to-teal-400",
      activeText: "text-emerald-300",
      activeBg: "bg-emerald-500/20 border-emerald-500/40 text-emerald-200",
      indicatorColor: "bg-emerald-400",
      badge: downloadCount > 0 ? downloadCount : undefined,
      visible: true
    }
  ];

  const tabs = allTabs.filter(tab => tab.visible);

  return (
    <nav
      id="bottom-navigation-bar"
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/85 backdrop-blur-2xl border-t border-white/15 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] transition-all"
    >
      <div className="max-w-xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 sm:px-5 rounded-2xl transition-all duration-200 cursor-pointer active:scale-95 group ${
                isActive
                  ? `${tab.activeBg} border shadow-lg`
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent"
              }`}
            >
              {/* Active Top Glow Pill Indicator */}
              {isActive && (
                <div
                  className={`absolute -top-2 w-8 h-1 rounded-full ${tab.indicatorColor} shadow-[0_0_12px_currentColor] animate-pulse`}
                />
              )}

              {/* Icon Container with Badge */}
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200 ${
                    isActive
                      ? `scale-110 ${tab.activeText} drop-shadow-[0_0_8px_currentColor]`
                      : "group-hover:scale-105"
                  }`}
                />

                {/* Counter Badge (e.g. for Downloads) */}
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black bg-emerald-500 text-slate-950 shadow-md">
                    {tab.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[11px] sm:text-xs font-black uppercase tracking-wider mt-1 transition-colors ${
                  isActive
                    ? `${tab.activeText} drop-shadow`
                    : "text-slate-400 group-hover:text-slate-200"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
