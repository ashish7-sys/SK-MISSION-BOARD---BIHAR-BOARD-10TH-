import { MusicTrack } from "../types";
import { AnalyticsService } from "./analyticsService";
import { getLocalAudioBlobUrl, getLocalFileBlob } from "./uploadService";
import { DownloadService } from "./downloadService";

type AudioListener = () => void;

class AudioPlayerEngine {
  private audio: HTMLAudioElement | null = null;
  private currentTrack: MusicTrack | null = null;
  private isPlaying: boolean = false;
  private volume: number = 0.8;
  private isMuted: boolean = false;
  private listeners: Set<AudioListener> = new Set();
  private synthCtx: AudioContext | null = null;
  private synthOscillators: OscillatorNode[] = [];
  private synthGain: GainNode | null = null;
  private synthInterval: any = null;
  private isUsingSynth: boolean = false;

  constructor() {
    // Restore volume from localStorage if available
    try {
      const savedVol = localStorage.getItem("skmb_music_vol");
      if (savedVol !== null) {
        this.volume = parseFloat(savedVol);
      }
    } catch (_) {}
  }

  public subscribe(listener: AudioListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(cb => {
      try { cb(); } catch (e) { console.error(e); }
    });
  }

  public getCurrentTrack(): MusicTrack | null {
    return this.currentTrack;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.audio) {
      this.audio.volume = this.isMuted ? 0 : this.volume;
    }
    if (this.synthGain && this.synthCtx) {
      this.synthGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume * 0.25, this.synthCtx.currentTime);
    }
    try {
      localStorage.setItem("skmb_music_vol", this.volume.toString());
    } catch (_) {}
    this.notify();
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.audio) {
      this.audio.volume = this.isMuted ? 0 : this.volume;
    }
    if (this.synthGain && this.synthCtx) {
      this.synthGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume * 0.25, this.synthCtx.currentTime);
    }
    this.notify();
  }

  private async resolveAudioUrl(track: MusicTrack): Promise<string | null> {
    if (!track.audioUrl || track.audioUrl.trim() === "") {
      return null;
    }

    const rawUrl = track.audioUrl.trim();

    // 1. Direct Data URI or blob URL
    if (rawUrl.startsWith("data:") || rawUrl.startsWith("blob:")) {
      return rawUrl;
    }

    // 2. Check if offline/downloaded blob is available in IndexedDB
    try {
      const offlineBlobUrl = await DownloadService.getOfflineBlobUrl(track.id);
      if (offlineBlobUrl) return offlineBlobUrl;
    } catch (_) {}

    // 3. Check local files storage IndexedDB
    try {
      const localBlobUrl = await getLocalAudioBlobUrl(rawUrl) || await getLocalAudioBlobUrl(track.id);
      if (localBlobUrl) return localBlobUrl;
    } catch (_) {}

    return rawUrl;
  }

  public async playTrack(track: MusicTrack) {
    AnalyticsService.trackMusicPlay(track.id, track.title);

    // 1. Stop any currently playing audio/synth
    this.stopAudioAndSynth(false);

    this.currentTrack = track;
    this.isPlaying = true;
    this.isUsingSynth = false;
    this.notify();

    // 2. Check if track is explicitly synthetic (e.g. preset with no audio file)
    const isSyntheticPreset = track.id.startsWith("synth-") || !track.audioUrl || track.audioUrl.trim() === "";

    if (isSyntheticPreset) {
      this.startStudySynth(track.title);
      return;
    }

    // 3. Resolve genuine audio source URL
    const targetUrl = await this.resolveAudioUrl(track);

    if (targetUrl) {
      try {
        const audio = new Audio();
        audio.preload = "auto";
        audio.src = targetUrl;
        audio.loop = true;
        audio.volume = this.isMuted ? 0 : this.volume;

        audio.onplay = () => {
          this.isPlaying = true;
          this.notify();
        };

        audio.onpause = () => {
          if (!this.isUsingSynth && this.currentTrack?.id === track.id) {
            this.isPlaying = false;
            this.notify();
          }
        };

        audio.onerror = async () => {
          console.warn("Direct audio load failed, attempting IndexedDB fallback:", targetUrl);
          try {
            const fallbackBlob = await getLocalFileBlob(track.audioUrl) || await getLocalFileBlob(track.id) || await DownloadService.getOfflineBlob(track.id);
            if (fallbackBlob && this.audio) {
              const objUrl = URL.createObjectURL(fallbackBlob);
              this.audio.src = objUrl;
              await this.audio.play();
              return;
            }
          } catch (_) {}
          
          this.isPlaying = false;
          this.notify();
        };

        this.audio = audio;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(async (err) => {
            console.warn("Audio play rejected, trying fallback blob:", err);
            try {
              const fallbackBlob = await getLocalFileBlob(track.audioUrl) || await getLocalFileBlob(track.id);
              if (fallbackBlob && this.audio) {
                const objUrl = URL.createObjectURL(fallbackBlob);
                this.audio.src = objUrl;
                await this.audio.play();
                return;
              }
            } catch (_) {}
            
            this.isPlaying = false;
            this.notify();
          });
        }
      } catch (err) {
        console.warn("Audio init failed:", err);
        this.isPlaying = false;
        this.notify();
      }
    } else {
      console.warn("No playable audio source found for:", track.title);
      this.isPlaying = false;
      this.notify();
    }
  }

  public pauseTrack() {
    this.isPlaying = false;
    if (this.audio) {
      this.audio.pause();
    }
    if (this.synthGain && this.synthCtx) {
      this.synthGain.gain.setValueAtTime(0, this.synthCtx.currentTime);
    }
    this.notify();
  }

  public resumeTrack() {
    if (!this.currentTrack) return;
    this.isPlaying = true;

    if (this.isUsingSynth) {
      if (this.synthGain && this.synthCtx) {
        this.synthGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume * 0.25, this.synthCtx.currentTime);
      } else {
        this.startStudySynth(this.currentTrack.title);
      }
    } else if (this.audio) {
      this.audio.play().catch(() => {
        this.playTrack(this.currentTrack!);
      });
    } else {
      this.playTrack(this.currentTrack);
    }
    this.notify();
  }

  public togglePlay(track: MusicTrack) {
    if (this.currentTrack?.id === track.id) {
      if (this.isPlaying) {
        this.pauseTrack();
      } else {
        this.resumeTrack();
      }
    } else {
      this.playTrack(track);
    }
  }

  public stopAudioAndSynth(shouldNotify: boolean = true) {
    if (this.audio) {
      try {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.audio.src = "";
      } catch (_) {}
      this.audio = null;
    }
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    this.synthOscillators.forEach(osc => {
      try { osc.stop(); osc.disconnect(); } catch (_) {}
    });
    this.synthOscillators = [];
    if (this.synthCtx) {
      try { this.synthCtx.close(); } catch (_) {}
      this.synthCtx = null;
    }
    this.synthGain = null;
    this.isUsingSynth = false;

    if (shouldNotify) {
      this.isPlaying = false;
      this.currentTrack = null;
      this.notify();
    }
  }

  // High-fidelity generative study ambient/piano chords engine (100% offline & reliable for synthetic presets)
  private startStudySynth(seedName: string) {
    this.isUsingSynth = true;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      this.synthCtx = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume * 0.25, ctx.currentTime);
      masterGain.connect(ctx.destination);
      this.synthGain = masterGain;

      // Calming Pentatonic Chord Frequencies for Deep Concentration (Hz)
      const chordSets: { [key: string]: number[][] } = {
        piano: [
          [261.63, 329.63, 392.00, 523.25], // C Major
          [220.00, 261.63, 329.63, 440.00], // A Minor
          [174.61, 220.00, 261.63, 349.23], // F Major
          [196.00, 246.94, 293.66, 392.00]  // G Major
        ],
        ambient: [
          [130.81, 196.00, 261.63, 392.00], // C Drone
          [146.83, 220.00, 293.66, 440.00], // D Deep
          [164.81, 246.94, 329.63, 493.88], // E Ambient
          [174.61, 261.63, 349.23, 523.25]  // F Warmth
        ]
      };

      const lowerName = seedName.toLowerCase();
      const chords = lowerName.includes("piano") ? chordSets.piano : chordSets.ambient;
      let chordIndex = 0;

      // Play soft arpeggiated relaxing tones
      const playNextChord = () => {
        if (!this.isPlaying || !this.synthCtx || this.synthCtx.state === "closed") return;
        const currentChord = chords[chordIndex % chords.length];
        chordIndex++;

        currentChord.forEach((freq, i) => {
          try {
            const osc = ctx.createOscillator();
            const noteGain = ctx.createGain();

            osc.type = i % 2 === 0 ? "sine" : "triangle";
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.4);

            noteGain.gain.setValueAtTime(0.001, ctx.currentTime + i * 0.4);
            noteGain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + i * 0.4 + 0.5);
            noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.4 + 4.5);

            osc.connect(noteGain);
            noteGain.connect(masterGain);

            osc.start(ctx.currentTime + i * 0.4);
            osc.stop(ctx.currentTime + i * 0.4 + 4.8);
          } catch (_) {}
        });
      };

      playNextChord();
      this.synthInterval = setInterval(playNextChord, 4500);

      this.isPlaying = true;
      this.notify();
    } catch (e) {
      console.warn("Synth initialization warning:", e);
    }
  }
}

export const audioPlayer = new AudioPlayerEngine();
