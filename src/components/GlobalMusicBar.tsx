import React, { useEffect, useState } from "react";
import { MusicTrack } from "../types";
import { audioPlayer } from "../services/audioPlayer";
import { StoreService } from "../services/storeService";
import { Play, Pause, Volume2, VolumeX, Music, Volume1, X } from "lucide-react";

export const GlobalMusicBar: React.FC = () => {
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(audioPlayer.getCurrentTrack());
  const [isPlaying, setIsPlaying] = useState<boolean>(audioPlayer.getIsPlaying());
  const [volume, setVolume] = useState<number>(audioPlayer.getVolume());
  const [isMuted, setIsMuted] = useState<boolean>(audioPlayer.getIsMuted());
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(StoreService.getFeatureFlags().music !== false);

  useEffect(() => {
    const unsubscribeAudio = audioPlayer.subscribe(() => {
      setCurrentTrack(audioPlayer.getCurrentTrack());
      setIsPlaying(audioPlayer.getIsPlaying());
      setVolume(audioPlayer.getVolume());
      setIsMuted(audioPlayer.getIsMuted());
    });
    const unsubscribeStore = StoreService.subscribe(() => {
      setMusicEnabled(StoreService.getFeatureFlags().music !== false);
    });
    return () => {
      unsubscribeAudio();
      unsubscribeStore();
    };
  }, []);

  if (!musicEnabled || !currentTrack) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-22 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-xl animate-fade-in">
      <div className="relative rounded-2xl bg-slate-950/95 border border-cyan-500/40 shadow-[0_10px_30px_rgba(6,182,212,0.25)] p-3 sm:p-4 backdrop-blur-2xl flex items-center justify-between gap-3 text-white">
        
        {/* Left: Track Title & Pulse */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
            <Music className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                {isPlaying && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
                {isPlaying ? "Playing Study Music" : "Music Paused"}
              </span>
            </div>
            <h5 className="text-sm sm:text-base font-bold text-white truncate">
              {currentTrack.title}
            </h5>
          </div>
        </div>

        {/* Right: Controls (Play/Pause, Volume, Close) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => audioPlayer.togglePlay(currentTrack)}
            aria-label={isPlaying ? "Pause Music" : "Resume Music"}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold text-xs shadow-md hover:brightness-110 active:scale-95 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span className="hidden sm:inline">{isPlaying ? "Pause" : "Play"}</span>
          </button>

          {/* Mini Volume button */}
          <button
            onClick={() => audioPlayer.toggleMute()}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 hover:text-cyan-300 transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          {/* Stop / Dismiss */}
          <button
            onClick={() => audioPlayer.stopAudioAndSynth()}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 transition-colors"
            title="Stop & Close Player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
