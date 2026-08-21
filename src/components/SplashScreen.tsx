import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LogoHeader } from "./LogoHeader";
import { Sparkles, Shield, Cpu } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 300);
          return 100;
        }
        return prev + 5;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.6 } }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-slate-950/95 backdrop-blur-xl text-white select-none overflow-hidden"
      >
        {/* Futuristic Glowing Orbs in Background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

        {/* Top Tagline */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold tracking-wider uppercase mt-4 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
        >
          <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
          <span>BSEB Class 10 Official Mobile Engine</span>
        </motion.div>

        {/* Center Logo Area */}
        <div className="flex flex-col items-center justify-center my-auto">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.9, type: "spring", stiffness: 120 }}
          >
            <LogoHeader size="lg" showSubtitle={true} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex items-center gap-2 mt-6 text-sm font-medium text-amber-300/90"
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>लक्ष्य 450+ अंक — परीक्षा 2026</span>
          </motion.div>
        </div>

        {/* Bottom Loading Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="w-full max-w-xs flex flex-col items-center mb-8"
        >
          <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden shadow-inner p-0.5">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 via-blue-500 via-purple-500 to-amber-400 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
              style={{ width: `${progress}%` }}
              transition={{ ease: "easeOut" }}
            />
          </div>

          <div className="flex justify-between w-full mt-2 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1 text-slate-300">
              <Shield className="w-3 h-3 text-emerald-400" /> System Loading...
            </span>
            <span className="text-cyan-400 font-bold">{progress}%</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
