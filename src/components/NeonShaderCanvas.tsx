import React, { useEffect, useRef } from "react";

interface AnimeEnergyTrailCanvasProps {
  intensity?: number;
  interactive?: boolean;
  className?: string;
}

interface NeonColor {
  name: string;
  r: number;
  g: number;
  b: number;
}

const NEON_COLORS: NeonColor[] = [
  { name: "electric-blue", r: 56, g: 189, b: 248 },     // #38bdf8
  { name: "radiant-violet", r: 192, g: 132, b: 252 },  // #c084fc
  { name: "vivid-cyan", r: 34, g: 211, b: 238 },        // #22d3ee
  { name: "hot-magenta", r: 244, g: 114, b: 182 },     // #f472b6
  { name: "emerald-chakra", r: 52, g: 211, b: 153 },   // #34d399
  { name: "solar-amber", r: 251, g: 191, b: 36 },      // #fbbf24
  { name: "hyper-indigo", r: 129, g: 140, b: 248 }     // #818cf8
];

interface EnergyStreak {
  x: number;
  y: number;
  speed: number;
  angle: number;
  angularVel: number;
  frequency: number;
  amplitude: number;
  history: { x: number; y: number }[];
  life: number;
  maxLife: number;
  width: number;
}

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: NeonColor;
}

interface ActiveEnergyBurst {
  color: NeonColor;
  streaks: EnergyStreak[];
}

export const NeonShaderCanvas: React.FC<AnimeEnergyTrailCanvasProps> = ({
  intensity = 1.0,
  interactive = true,
  className = "fixed inset-0 pointer-events-none z-30"
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeBurstsRef = useRef<ActiveEnergyBurst[]>([]);
  const sparkParticlesRef = useRef<SparkParticle[]>([]);
  const touchCounterRef = useRef<number>(0);
  const isAnimatingRef = useRef<boolean>(false);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const resizeCanvas = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas, { passive: true });

    const startAnimationLoop = () => {
      if (isAnimatingRef.current) return;
      isAnimatingRef.current = true;
      render();
    };

    const render = () => {
      const activeBursts = activeBurstsRef.current;
      const sparks = sparkParticlesRef.current;

      // If nothing is active, stop the animation loop immediately to save 100% CPU & battery
      if (activeBursts.length === 0 && sparks.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        isAnimatingRef.current = false;
        animFrameIdRef.current = null;
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Update & Render Anime Energy Bursts
      for (let bIndex = activeBursts.length - 1; bIndex >= 0; bIndex--) {
        const burst = activeBursts[bIndex];
        const { r, g, b } = burst.color;
        let activeStreakCount = 0;

        for (let sIndex = burst.streaks.length - 1; sIndex >= 0; sIndex--) {
          const streak = burst.streaks[sIndex];

          if (streak.life <= 0) continue;

          activeStreakCount++;
          streak.life--;

          streak.angle += streak.angularVel;
          streak.angularVel *= 0.95;

          const perpAngle = streak.angle + Math.PI / 2;
          const flutter = Math.sin((streak.maxLife - streak.life) * streak.frequency) * streak.amplitude;

          streak.x += Math.cos(streak.angle) * streak.speed + Math.cos(perpAngle) * flutter;
          streak.y += Math.sin(streak.angle) * streak.speed + Math.sin(perpAngle) * flutter;
          streak.speed *= 0.96;

          streak.history.unshift({ x: streak.x, y: streak.y });
          if (streak.history.length > 12) {
            streak.history.pop();
          }

          // Draw trail
          if (streak.history.length >= 2) {
            const lifeRatio = streak.life / streak.maxLife;
            const streakAlpha = Math.min(1.0, lifeRatio * 1.3) * intensity;

            if (streakAlpha > 0.02) {
              ctx.lineCap = "round";
              ctx.lineJoin = "round";

              // Neon glow aura
              ctx.beginPath();
              ctx.moveTo(streak.history[0].x, streak.history[0].y);
              for (let h = 1; h < streak.history.length; h++) {
                ctx.lineTo(streak.history[h].x, streak.history[h].y);
              }
              ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${streakAlpha * 0.6})`;
              ctx.lineWidth = streak.width * 2;
              ctx.stroke();

              // High-energy white core
              ctx.strokeStyle = `rgba(255, 255, 255, ${streakAlpha * 0.9})`;
              ctx.lineWidth = streak.width * 0.8;
              ctx.stroke();
            }
          }
        }

        if (activeStreakCount === 0) {
          activeBursts.splice(bIndex, 1);
        }
      }

      // 2. Update & Render Sparks
      for (let pIndex = sparks.length - 1; pIndex >= 0; pIndex--) {
        const spark = sparks[pIndex];
        spark.life--;

        if (spark.life <= 0) {
          sparks.splice(pIndex, 1);
          continue;
        }

        spark.x += spark.vx;
        spark.y += spark.vy;
        spark.vx *= 0.94;
        spark.vy *= 0.94;

        const sparkAlpha = (spark.life / spark.maxLife) * intensity;
        const { r, g, b } = spark.color;

        ctx.fillStyle = `rgba(255, 255, 255, ${sparkAlpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${sparkAlpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(spark.x, spark.y, spark.size * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    const handleTouchOrPointer = (e: MouseEvent | TouchEvent | PointerEvent) => {
      if (!interactive) return;

      let clientX = 0;
      let clientY = 0;

      if ("touches" in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ("clientX" in e) {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }

      if (clientX === 0 && clientY === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const startX = clientX * dpr;
      const startY = clientY * dpr;

      const colorIndex = touchCounterRef.current % NEON_COLORS.length;
      const selectedColor = NEON_COLORS[colorIndex];
      touchCounterRef.current += 1;

      // 6 snappy streaks per touch for instant anime feel
      const numStreaks = 6;
      const streaks: EnergyStreak[] = [];

      for (let i = 0; i < numStreaks; i++) {
        const baseAngle = (i / numStreaks) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
        const speed = (7.0 + Math.random() * 6.0) * dpr;
        const life = 14 + Math.floor(Math.random() * 8);

        streaks.push({
          x: startX,
          y: startY,
          speed,
          angle: baseAngle,
          angularVel: (Math.random() - 0.5) * 0.12,
          frequency: 0.25,
          amplitude: (2.0 + Math.random() * 2.0) * dpr,
          history: [{ x: startX, y: startY }],
          life,
          maxLife: life,
          width: 1.5 * dpr
        });
      }

      // 4 tiny spark particles
      for (let s = 0; s < 4; s++) {
        const sparkAngle = Math.random() * Math.PI * 2;
        const sparkSpeed = (2.5 + Math.random() * 4.0) * dpr;
        sparkParticlesRef.current.push({
          x: startX,
          y: startY,
          vx: Math.cos(sparkAngle) * sparkSpeed,
          vy: Math.sin(sparkAngle) * sparkSpeed,
          life: 14 + Math.floor(Math.random() * 6),
          maxLife: 20,
          size: 1.2 * dpr,
          color: selectedColor
        });
      }

      activeBurstsRef.current.push({
        color: selectedColor,
        streaks
      });

      if (activeBurstsRef.current.length > 4) {
        activeBurstsRef.current.shift();
      }

      // Wake up the rendering loop only when triggered
      startAnimationLoop();
    };

    window.addEventListener("pointerdown", handleTouchOrPointer, { capture: true, passive: true });
    window.addEventListener("touchstart", handleTouchOrPointer, { capture: true, passive: true });

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("pointerdown", handleTouchOrPointer);
      window.removeEventListener("touchstart", handleTouchOrPointer);
    };
  }, [intensity, interactive]);

  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none z-30 ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  );
};
