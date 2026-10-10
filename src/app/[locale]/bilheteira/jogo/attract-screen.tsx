"use client";

import { useEffect, useRef } from "react";
import type { GameCopy } from "@/i18n/copy/institutional-game";

const SLIDES = [
  "/images/arte-a-capela/hero.jpg",
  "/images/arte-a-capela/vitral.jpg",
  "/images/arte-a-capela/claustro.jpg",
  "/images/arte-a-capela/talha.jpg",
];
const SLIDE_SECONDS = 24; // must match attract-kenburns duration in game.css

type Mote = { x: number; y: number; r: number; vx: number; vy: number; a: number; da: number };

/** Floating dust motes (like light in a chapel) drawn on a canvas overlay. */
function useMotes(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let motes: Mote[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = reduced ? 0 : Math.round((canvas.clientWidth * canvas.clientHeight) / 14000);
      motes = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.clientWidth,
        y: Math.random() * canvas.clientHeight,
        r: 0.6 + Math.random() * 2.2,
        vx: (Math.random() - 0.5) * 0.18,
        vy: -0.08 - Math.random() * 0.22,
        a: Math.random(),
        da: 0.002 + Math.random() * 0.006,
      }));
    };

    const tick = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      for (const m of motes) {
        m.x += m.vx;
        m.y += m.vy;
        m.a += m.da;
        if (m.y < -4) { m.y = h + 4; m.x = Math.random() * w; }
        if (m.x < -4) m.x = w + 4;
        if (m.x > w + 4) m.x = -4;
        const alpha = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(m.a * Math.PI * 2));
        const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 4);
        g.addColorStop(0, `rgba(240, 225, 190, ${alpha})`);
        g.addColorStop(1, "rgba(240, 225, 190, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    if (!reduced) raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, [canvasRef]);
}

export function AttractScreen({ copy, onStart }: { copy: GameCopy; onStart: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useMotes(canvasRef);

  return (
    <div
      className="attract"
      role="button"
      tabIndex={0}
      aria-label={copy.attract.cta}
      onPointerDown={onStart}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onStart(); }}
    >
      {SLIDES.map((src, i) => (
        <div
          key={src}
          className="attract__slide"
          style={{
            backgroundImage: `url(${src})`,
            animationDelay: `${(i * SLIDE_SECONDS) / SLIDES.length}s`,
          }}
        />
      ))}
      <div className="attract__shade" />
      <canvas ref={canvasRef} className="attract__particles" aria-hidden />
      <div className="attract__content">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="attract__logo" src="/images/arte-a-capela/logo.png" alt="Arte à Capela" />
        <p className="game-eyebrow">{copy.attract.eyebrow}</p>
        <h1 className="game-serif attract__headline">
          {copy.attract.headline.map((line, i) => (
            <span key={line}>{i === 1 ? <em>{line}</em> : line}</span>
          ))}
        </h1>
        <p className="attract__sub">{copy.attract.sub}</p>
        <p className="attract__prizes">{copy.attract.prizesHint}</p>
        <div className="attract__cta">
          <div className="attract__ring" aria-hidden>
            <svg viewBox="0 0 24 24"><path d="M9 11.2V5a2 2 0 1 1 4 0v5.6l.1-.1a2 2 0 0 1 3.4 1.4l.1-.2a2 2 0 0 1 3.4 1.5v3.6c0 3.5-2.9 6.2-6.4 6.2h-1.1c-1.9 0-3.7-.8-4.9-2.3l-3.4-4.2a1.8 1.8 0 0 1 2.7-2.4L9 15.8z"/></svg>
          </div>
          <span className="attract__cta-label">{copy.attract.cta}</span>
        </div>
      </div>
    </div>
  );
}
