import React, { useEffect, useState } from "react";
import { MusicTrack } from "../types";
import { audioPlayer } from "../services/audioPlayer";
import { Play, Pause, Volume2, VolumeX, Music, Sparkles, Volume1 } from "lucide-react";

interface MusicSectionProps {
  tracks: MusicTrack[];
  id?: string;
}

export const MusicSection: React.FC<MusicSectionProps> = ({ tracks, id = "music-section" }) => {
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(audioPlayer.getCurrentTrack());
  const [isPlaying, setIsPlaying] = useState<boolean>(audioPlayer.getIsPlaying());
  const [volume, setVolume] = useState<number>(audioPlayer.getVolume());
  const [isMuted, setIsMuted] = useState<boolean>(audioPlayer.getIsMuted());

  useEffect(() => {
    const unsubscribe = audioPlayer.subscribe(() => {
      setCurrentTrack(audioPlayer.getCurrentTrack());
      setIsPlaying(audioPlayer.getIsPlaying());
      setVolume(audioPlayer.getVolume());
      setIsMuted(audioPlayer.getIsMuted());
    });
    return unsubscribe;
  }, []);

  const publishedTracks = tracks.filter(t => t.isPublished !== false);

  const handleTogglePlay = (track: MusicTrack) => {
    audioPlayer.togglePlay(track);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    audioPlayer.setVolume(val);
  };

  return (
    <section id={id} className="w-full my-8">
      <div className="relative rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl p-5 sm:p-7 backdrop-blur-xl overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs sm:text-sm font-bold uppercase tracking-widest mb-2">
            <Music className="w-4 h-4 text-cyan-400" />
            <span>STUDY AMBIENT & FOCUS SOUNDS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
            MUSIC
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
            बिहार बोर्ड परीक्षा 2026 की एकाग्रता व तीव्र अध्ययन के लिए शांत वाद्य संगीत
          </p>
        </div>

        {/* Music Table Header */}
        <div className="border-b border-slate-700/80 pb-2.5 mb-2 flex items-center justify-between text-xs sm:text-sm font-black text-slate-400 uppercase tracking-wider px-3 sm:px-4">
          <span>MUSIC NAME</span>
          <span className="text-right">PLAY</span>
        </div>

        {/* Music List — STRICT Horizontal Row Format */}
        <div className="divide-y divide-slate-800/80">
          {publishedTracks.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              कोई म्यूजिक उपलब्ध नहीं है।
            </div>
          ) : (
            publishedTracks.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              const isCurrentPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={track.id}
                  id={`track-row-${track.id}`}
                  className={`flex items-center justify-between py-3.5 px-3 sm:px-4 rounded-xl transition-all ${
                    isCurrent 
                      ? "bg-cyan-500/10 border border-cyan-500/30 text-white shadow-inner" 
                      : "hover:bg-slate-800/50 text-slate-200"
                  }`}
                >
                  {/* Left: Music Name */}
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    <div className="flex items-center gap-2.5">
                      {isCurrentPlaying ? (
                        <div className="flex items-end gap-0.5 h-4 w-3.5 shrink-0">
                          <span className="w-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s] h-full" />
                          <span className="w-1 bg-cyan-300 rounded-full animate-bounce [animation-delay:-0.15s] h-3/4" />
                          <span className="w-1 bg-cyan-400 rounded-full animate-bounce h-1/2" />
                        </div>
                      ) : (
                        <Music className={`w-4 h-4 shrink-0 ${isCurrent ? "text-cyan-400" : "text-slate-500"}`} />
                      )}
                      
                      <span className={`text-sm sm:text-base font-bold truncate ${isCurrent ? "text-cyan-300" : "text-slate-100"}`}>
                        {track.title}
                      </span>
                    </div>

                    {track.durationText && (
                      <span className="text-[11px] sm:text-xs font-mono text-slate-400 hidden sm:inline shrink-0">
                        ({track.durationText})
                      </span>
                    )}
                  </div>

                  {/* Right: PLAY Button (SAME HORIZONTAL ROW) */}
                  <div className="shrink-0">
                    <button
                      id={`play-btn-${track.id}`}
                      onClick={() => handleTogglePlay(track)}
                      aria-label={isCurrentPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
                      className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
                        isCurrentPlaying
                          ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-amber-500/20"
                          : isCurrent
                          ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                          : "bg-slate-800 hover:bg-cyan-500/20 text-cyan-400 border border-slate-700 hover:border-cyan-500/40"
                      }`}
                    >
                      {isCurrentPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>PAUSE</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>PLAY</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700/80 my-4" />

        {/* Bottom Status & Playback Controller */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Playing Status Display */}
          <div className="text-center sm:text-left flex-1 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center justify-center sm:justify-start gap-1.5">
              {isPlaying && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
              {isPlaying ? "Playing..." : currentTrack ? "Paused" : "Ready to Play"}
            </span>
            <h4 className="text-base sm:text-lg font-black text-white truncate mt-0.5">
              {currentTrack ? currentTrack.title : "Select any music above to play"}
            </h4>
          </div>

          {/* Controls: Play/Pause and Volume */}
          {currentTrack && (
            <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-center sm:justify-end">
              {/* Play / Pause Toggle Button */}
              <button
                onClick={() => audioPlayer.togglePlay(currentTrack)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg hover:brightness-110 transition-all cursor-pointer active:scale-95"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isPlaying ? "Pause" : "Resume"}</span>
              </button>

              {/* Volume Controller */}
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
                <button
                  onClick={() => audioPlayer.toggleMute()}
                  className="text-slate-400 hover:text-cyan-300 transition-colors"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : volume < 0.5 ? (
                    <Volume1 className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 sm:w-20 accent-cyan-400 cursor-pointer h-1.5 rounded-lg bg-slate-800"
                  title={`Volume: ${Math.round(volume * 100)}%`}
                />
                <span className="text-[11px] font-mono text-slate-400 w-8 text-right">
                  {isMuted ? "0%" : `${Math.round(volume * 100)}%`}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
