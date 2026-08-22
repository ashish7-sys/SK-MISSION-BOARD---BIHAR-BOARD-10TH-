import React, { useEffect, useRef, useState, useMemo } from "react";
import { StoreService } from "../services/storeService";

interface ShootingStar {
  x: number;
  y: number;
  speed: number;
  angle: number;
  opacity: number;
  trail: { x: number; y: number }[];
  color: string;
}

interface TwinkleStar {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
}

interface CosmicBackgroundProps {
  customVideoUrl?: string;
}

export const CosmicBackground: React.FC<CosmicBackgroundProps> = ({ customVideoUrl }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [themeVideo, setThemeVideo] = useState<string>(customVideoUrl || StoreService.getThemeVideoUrl());
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    if (customVideoUrl) {
      setThemeVideo(customVideoUrl);
    } else {
      const updateVideo = () => {
        setThemeVideo(StoreService.getThemeVideoUrl());
        setVideoError(false);
      };
      updateVideo();
      const unsub = StoreService.subscribe(updateVideo);
      return () => {
        unsub();
      };
    }
  }, [customVideoUrl]);

  // Convert Google Drive or standard video link to direct embeddable/playable video
  const resolvedVideoUrl = useMemo(() => {
    const raw = themeVideo?.trim() || "/bg_theme.mp4";
    if (!raw) return "/bg_theme.mp4";

    // Direct local / blob / data URLs
    if (raw.startsWith("/") || raw.startsWith("blob:") || raw.startsWith("data:")) {
      return raw;
    }

    // If Google Drive link:
    const driveMatch = raw.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/) || raw.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      const driveId = driveMatch[1];
      if (driveId === "1J9z95DhiQunJBJzsNfraeznSwvHT2wNm" || driveId === "1NitBnZBvFe_BKFrkbj3ZrsKcwyMXxuCF") {
        return "/bg_theme.mp4";
      }
      return `https://drive.usercontent.google.com/download?id=${driveId}&export=download`;
    }

    return raw;
  }, [themeVideo]);

  const isGoogleDriveIframe = useMemo(() => {
    const raw = themeVideo?.trim() || "";
    const driveMatch = raw.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/) || raw.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }
    return null;
  }, [themeVideo]);

  // Bulletproof video autoplay & continuous looping engine
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Strict DOM properties needed by Chrome, Safari & Android WebViews
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.loop = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.setAttribute("autoplay", "");
    video.setAttribute("loop", "");

    const playVideo = () => {
      const promise = video.play();
      if (promise !== undefined) {
        promise.catch((err) => {
          console.log("Background video awaiting user gesture:", err);
        });
      }
    };

    playVideo();

    // In case browser policy halts autoplay until first user gesture
    const handleGesture = () => {
      if (video.paused) {
        video.play().catch(() => {});
      }
      window.removeEventListener("click", handleGesture);
      window.removeEventListener("touchstart", handleGesture);
      window.removeEventListener("pointerdown", handleGesture);
    };

    window.addEventListener("click", handleGesture, { passive: true });
    window.addEventListener("touchstart", handleGesture, { passive: true });
    window.addEventListener("pointerdown", handleGesture, { passive: true });

    return () => {
      window.removeEventListener("click", handleGesture);
      window.removeEventListener("touchstart", handleGesture);
      window.removeEventListener("pointerdown", handleGesture);
    };
  }, [resolvedVideoUrl]);

  // Animated star particles overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize, { passive: true });

    // Twinkling Stars
    const twinkleStars: TwinkleStar[] = [];
    const starColors = ["#ffffff", "#38bdf8", "#c084fc", "#fef08a", "#f472b6"];
    for (let i = 0; i < 40; i++) {
      twinkleStars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.2 + 0.6,
        alpha: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.025 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2,
        color: starColors[Math.floor(Math.random() * starColors.length)]
      });
    }

    // Shooting Stars
    const shootingStars: ShootingStar[] = [];

    const createShootingStar = (): ShootingStar => {
      const angle = (Math.PI / 4) + (Math.random() * 0.2 - 0.1);
      return {
        x: Math.random() * width * 1.2 - width * 0.2,
        y: Math.random() * (height * 0.35) - 30,
        speed: Math.random() * 6 + 5,
        angle: angle,
        opacity: 1,
        trail: [],
        color: Math.random() > 0.4 ? "#38bdf8" : "#fef08a"
      };
    };

    let lastSpawnTime = performance.now();

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // Render Twinkling Stars
      for (let i = 0; i < twinkleStars.length; i++) {
        const star = twinkleStars[i];
        star.twinklePhase += star.twinkleSpeed;
        const currentAlpha = 0.2 + Math.abs(Math.sin(star.twinklePhase)) * 0.7;
        
        ctx.globalAlpha = currentAlpha;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // Spawn Shooting Stars periodically
      if (time - lastSpawnTime > 3000 + Math.random() * 2000) {
        if (shootingStars.length < 2) {
          shootingStars.push(createShootingStar());
        }
        lastSpawnTime = time;
      }

      // Render & Update Shooting Stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const star = shootingStars[i];
        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;

        star.trail.unshift({ x: star.x, y: star.y });
        if (star.trail.length > 15) {
          star.trail.pop();
        }

        // Draw Star Trail
        if (star.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(star.trail[0].x, star.trail[0].y);
          for (let j = 1; j < star.trail.length; j++) {
            ctx.lineTo(star.trail[j].x, star.trail[j].y);
          }
          ctx.strokeStyle = star.color;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = Math.max(0, star.opacity * 0.7);
          ctx.stroke();
        }

        // Draw Star Head
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = Math.max(0, star.opacity);
        ctx.beginPath();
        ctx.arc(star.x, star.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Fade out
        star.opacity -= 0.018;
        if (star.opacity <= 0 || star.x > width + 100 || star.y > height + 100) {
          shootingStars.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const isImageTheme = useMemo(() => {
    const raw = (themeVideo || "").toLowerCase().trim();
    return (
      raw.endsWith(".jpg") ||
      raw.endsWith(".jpeg") ||
      raw.endsWith(".png") ||
      raw.endsWith(".webp") ||
      raw.endsWith(".gif") ||
      raw.endsWith(".svg") ||
      raw.includes("image/") ||
      raw.startsWith("data:image/")
    );
  }, [themeVideo]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-slate-950 select-none">
      {/* LAYER 1: Permanent stable fallback background (Deep Space Cyber Theme) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#060919] via-[#090d24] to-[#050714] -z-20" />
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat -z-10 opacity-70"
        style={{ backgroundImage: "url('/cyber_purple_bg.jpg')" }}
      />

      {/* LAYER 2: Main Background Theme Layer (Seamless Looping Video or Image) */}
      {isImageTheme ? (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <img
            src={resolvedVideoUrl}
            alt="Theme Background"
            className="w-full h-full object-cover scale-105 opacity-90 transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-slate-950/40 backdrop-brightness-90 pointer-events-none" />
        </div>
      ) : resolvedVideoUrl && !videoError ? (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <video
            ref={videoRef}
            key={resolvedVideoUrl}
            data-decorative="true"
            autoPlay
            loop
            muted
            playsInline
            controls={false}
            disablePictureInPicture
            controlsList="nodownload nofullscreen noremoteplayback"
            tabIndex={-1}
            aria-hidden="true"
            preload="auto"
            onCanPlay={(e) => {
              e.currentTarget.play().catch(() => {});
            }}
            onEnded={(e) => {
              e.currentTarget.currentTime = 0;
              e.currentTarget.play().catch(() => {});
            }}
            onError={() => {
              if (resolvedVideoUrl !== "/bg_theme.mp4") {
                setThemeVideo("/bg_theme.mp4");
              } else {
                setVideoError(true);
              }
            }}
            className="bg-decorative-video pointer-events-none w-full h-full object-cover scale-105 opacity-95 transition-opacity duration-700"
          >
            <source src={resolvedVideoUrl} type="video/mp4" />
            <source src="/bg_theme.mp4" type="video/mp4" />
          </video>
          {/* Light Scrim for optimal contrast and readability */}
          <div className="absolute inset-0 bg-slate-950/30 backdrop-brightness-95 pointer-events-none" />
        </div>
      ) : isGoogleDriveIframe ? (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <iframe
            src={`${isGoogleDriveIframe}?autoplay=1&mute=1`}
            className="w-full h-full object-cover pointer-events-none scale-125 opacity-80"
            allow="autoplay; fullscreen"
          />
          <div className="absolute inset-0 bg-slate-950/35 pointer-events-none" />
        </div>
      ) : (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <video
            ref={videoRef}
            src="/bg_theme.mp4"
            data-decorative="true"
            autoPlay
            loop
            muted
            playsInline
            controls={false}
            disablePictureInPicture
            controlsList="nodownload nofullscreen noremoteplayback"
            tabIndex={-1}
            aria-hidden="true"
            preload="auto"
            onCanPlay={(e) => {
              e.currentTarget.play().catch(() => {});
            }}
            onEnded={(e) => {
              e.currentTarget.currentTime = 0;
              e.currentTarget.play().catch(() => {});
            }}
            className="bg-decorative-video pointer-events-none w-full h-full object-cover scale-105 opacity-95 transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-slate-950/30 backdrop-brightness-95 pointer-events-none" />
        </div>
      )}

      {/* LAYER 3: Subtle Ambient Light-Wave Shimmer & Cosmic Stars */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-600/10 blur-[120px] pointer-events-none transform-gpu" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none transform-gpu" />
      
      {/* Dynamic Animated Cosmic Stars Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60 pointer-events-none" />
    </div>
  );
};


