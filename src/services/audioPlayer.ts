import { MusicTrack } from "../types";
import { AnalyticsService } from "./analyticsService";

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

  public async playTrack(track: MusicTrack) {
    // Track music play event in privacy-friendly analytics
    AnalyticsService.trackMusicPlay(track.id, track.title);

    // 1. Stop any currently playing audio/synth
    this.stopAudioAndSynth();

    this.currentTrack = track;
    this.isPlaying = true;
    this.isUsingSynth = false;
    this.notify();

    // 2. Attempt HTML5 Audio Playback
    if (track.audioUrl && track.audioUrl.trim() !== "") {
      try {
        const audio = new Audio();
        audio.src = track.audioUrl;
        audio.loop = true;
        audio.volume = this.isMuted ? 0 : this.volume;
        audio.crossOrigin = "anonymous";

        audio.onplay = () => {
          this.isPlaying = true;
          this.notify();
        };

        audio.onpause = () => {
          if (!this.isUsingSynth) {
            this.isPlaying = false;
            this.notify();
          }
        };

        audio.onerror = () => {
          console.warn("External audio source blocked or failed. Switching to built-in study instrumental engine.");
          this.startStudySynth(track.title);
        };

        this.audio = audio;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("Audio autoplay blocked or format error, fallback to synth:", err);
            this.startStudySynth(track.title);
          });
        }
      } catch (err) {
        console.warn("Audio init failed, using built-in ambient engine:", err);
        this.startStudySynth(track.title);
      }
    } else {
      this.startStudySynth(track.title);
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
        this.startStudySynth(this.currentTrack?.title || "Focus");
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

  public stopAudioAndSynth() {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = "";
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
  }

  // High-fidelity generative study ambient/piano chords engine (100% offline & reliable)
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
