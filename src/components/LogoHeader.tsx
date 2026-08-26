import React, { useState, useEffect } from "react";
import { ShieldCheck, Sparkles } from "lucide-react";
import skLogoImg from "../assets/images/sk_logo.png";
import { StoreService } from "../services/storeService";
import { AppBranding } from "../types";

interface LogoHeaderProps {
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
  iconOnly?: boolean;
  className?: string;
  onClick?: () => void;
}

export const LogoHeader: React.FC<LogoHeaderProps> = ({
  size = "md",
  showSubtitle = true,
  iconOnly = false,
  className = "",
  onClick
}) => {
  const isLarge = size === "lg";
  const isSmall = size === "sm";
  const [imgError, setImgError] = useState(false);
  const [branding, setBranding] = useState<AppBranding>(StoreService.getBranding());

  useEffect(() => {
    const unsub = StoreService.subscribe(() => {
      setBranding(StoreService.getBranding());
    });
    return unsub;
  }, []);

  const logoSrc = (branding.logoUrl && branding.logoUrl.trim()) ? branding.logoUrl : skLogoImg;
  const appTitle = branding.appName || "SK MISSION BOARD";
  const appSubtitle = branding.appSubtitle || "Class 10 BSEB 2026";

  if (iconOnly || (isSmall && !showSubtitle && iconOnly)) {
    return (
      <div 
        onClick={onClick}
        className={`relative flex items-center justify-center cursor-pointer group select-none ${className}`}
        title="Admin Access / SK MISSION BOARD"
      >
        {/* Animated Multi-Color Neon Aura */}
        <div className="absolute rounded-full bg-gradient-to-r from-amber-400 via-cyan-400 to-pink-500 opacity-60 blur-xs w-10 h-10 sm:w-11 sm:h-11 animate-pulse group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
        
        {/* Crisp Crest Circular Logo Container */}
        <div className="relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-950 border border-amber-400/90 shadow-[0_0_14px_rgba(245,158,11,0.6)] group-hover:shadow-[0_0_20px_rgba(6,182,212,0.8)] overflow-hidden flex items-center justify-center p-0.5 transition-transform duration-200 group-hover:scale-105 active:scale-95">
          {!imgError ? (
            <img
              src={logoSrc}
              alt="SK Logo"
              className="w-full h-full object-contain rounded-full"
              onError={() => setImgError(true)}
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="font-black text-[10px] text-amber-300">SK</span>
          )}
        </div>
      </div>
    );
  }

  if (isSmall) {
    return (
      <div 
        onClick={onClick}
        className={`flex items-center gap-2.5 select-none ${className}`}
      >
        {/* Mini Circular Logo Icon */}
        <div className="relative flex-shrink-0 flex items-center justify-center">
          <div className="absolute rounded-full bg-gradient-to-r from-amber-400 via-cyan-400 to-pink-500 opacity-70 blur-sm w-10 h-10 animate-pulse" />
          <div className="relative z-10 w-9 h-9 rounded-full bg-slate-950 border border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.5)] overflow-hidden flex items-center justify-center">
            {!imgError ? (
              <img
                src={logoSrc}
                alt={appTitle}
                className="w-full h-full object-contain rounded-full"
                onError={() => setImgError(true)}
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="font-black text-[9px] text-amber-300">SK</span>
            )}
          </div>
        </div>

        {/* Text Title */}
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <h1 className="font-black tracking-wide uppercase bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent text-base sm:text-lg drop-shadow leading-tight">
              {appTitle}
            </h1>
            <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          </div>
          {showSubtitle && (
            <span className="text-xs text-cyan-300/90 font-semibold leading-none mt-0.5">
              {appSubtitle}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      {/* Official SK Mission Board Crest Logo */}
      <div className="relative flex items-center justify-center group mb-3 animate-glow-up-down">
        {/* Animated Multi-Color Neon Aura Ring */}
        <div 
          className={`absolute rounded-full animate-spin-slow bg-gradient-to-r from-emerald-500 via-cyan-400 via-blue-500 via-purple-500 via-pink-500 to-amber-400 opacity-80 blur-md group-hover:opacity-100 transition-opacity duration-500 ${
            isLarge ? "w-32 h-32 md:w-36 md:h-36" : "w-20 h-20"
          }`}
        />

        {/* Outer Metallic & Neon Ring with Official Image */}
        <div 
          className={`relative z-10 flex items-center justify-center rounded-full bg-slate-950 border-2 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.6)] overflow-hidden ${
            isLarge ? "w-28 h-28 md:w-32 md:h-32 p-0.5" : "w-16 h-16 p-0.5"
          }`}
        >
          {!imgError ? (
            <img 
              src={logoSrc} 
              alt={appTitle}
              className="w-full h-full object-contain rounded-full transition-transform duration-300 group-hover:scale-105"
              onError={() => setImgError(true)}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full bg-slate-900 text-amber-300 font-black">
              <span className={isLarge ? "text-2xl" : "text-base"}>SK</span>
              <span className="text-[10px] text-cyan-300 tracking-tighter">BOARD</span>
            </div>
          )}
        </div>

        {/* Small Verified Badge */}
        <div className="absolute -bottom-1 -right-1 z-20 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 rounded-full p-1 shadow-lg border border-amber-200">
          <ShieldCheck className={isLarge ? "w-5 h-5" : "w-4 h-4"} />
        </div>
      </div>

      {/* Brand Name Typography */}
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
          <h1 className={`font-black tracking-wider uppercase bg-gradient-to-r from-amber-300 via-yellow-200 via-cyan-300 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_2px_14px_rgba(245,158,11,0.6)] ${
            isLarge ? "text-3xl sm:text-4xl md:text-5xl" : "text-2xl sm:text-3xl"
          }`}>
            {appTitle}
          </h1>
          <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
        </div>

        {showSubtitle && (
          <p className={`font-semibold tracking-wide text-cyan-200/95 drop-shadow mt-2 ${
            isLarge ? "text-base sm:text-lg md:text-xl" : "text-sm sm:text-base"
          }`}>
            {appSubtitle}
          </p>
        )}
      </div>
    </div>
  );
};

