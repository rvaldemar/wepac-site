"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#DACFC5", "#C1110C", "#1C1B2F", "#DEE0DB", "#FFFFFF"];

type Piece = { x: number; y: number; vx: number; vy: number; w: number; h: number; rot: number; vr: number; c: string };

/** Lightweight confetti burst — no dependency, ~2s, respects reduced motion. */
export function Confetti({ burstKey }: { burstKey: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const makeBurst = (count: number, x: number, y: number): Piece[] =>
      Array.from({ length: count }, () => {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.7;
        const speed = 9 + Math.random() * 10;
        return {
          x: x + (Math.random() - 0.5) * 80,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          w: 6 + Math.random() * 8,
          h: 8 + Math.random() * 10,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.3,
          c: COLORS[Math.floor(Math.random() * COLORS.length)],
        };
      });
    // Three bursts: centre, then left and right, over ~6 s.
    const bursts: { at: number; pieces: Piece[]; fired: boolean }[] = [
      { at: 0, pieces: makeBurst(220, w / 2, h * 0.55), fired: false },
      { at: 1.4, pieces: makeBurst(140, w * 0.22, h * 0.6), fired: false },
      { at: 2.2, pieces: makeBurst(140, w * 0.78, h * 0.6), fired: false },
    ];
    const live: { p: Piece; born: number }[] = [];
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      for (const b of bursts) {
        if (!b.fired && t >= b.at) {
          b.fired = true;
          for (const p of b.pieces) live.push({ p, born: t });
        }
      }
      ctx.clearRect(0, 0, w, h);
      for (const { p, born } of live) {
        const age = t - born;
        p.vy += 0.32;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, 1 - Math.max(0, age - 2.4) / 1.2);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (t < 6.5) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, w, h);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [burstKey]);
  return <canvas ref={ref} className="confetti" aria-hidden />;
}
