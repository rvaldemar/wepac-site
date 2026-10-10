"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PrizeKind } from "@prisma/client";
import type { GameCopy } from "@/i18n/copy/institutional-game";
import { WHEEL_SEGMENTS, segmentIndexesFor } from "@/lib/bilheteira/game/prizes";

const SEGMENTS = WHEEL_SEGMENTS.length;
const SEGMENT_ANGLE = (Math.PI * 2) / SEGMENTS;
const SPIN_MS = 9500;
const EXTRA_TURNS = 8;
// After the wheel stops, the winning segment pulses; it keeps pulsing until
// the step unmounts (the visitor taps "claim prize").
const HIGHLIGHT_MS = 1600;

// Arte à Capela brandbook palette only: beige, navy, red, black.
const FILLS: Record<PrizeKind, { bg: string; fg: string }> = {
  two_for_one_single_2026: { bg: "#DACFC5", fg: "#1C1B2F" },
  two_for_one_all_2026: { bg: "#1C1B2F", fg: "#DACFC5" },
  free_ticket_single_2026: { bg: "#C1110C", fg: "#DACFC5" },
  free_all_q4_2026: { bg: "#000000", fg: "#DACFC5" },
};

// Fast launch, long slow tail: the last two turns take almost half the time.
function easeOutSpin(t: number) {
  return 1 - Math.pow(1 - t, 6);
}

type Highlight = { index: number; phase: number } | null;

function resolveFont(el: HTMLElement): string {
  // next/font exposes a hashed family through the CSS variable; the canvas
  // needs the real family name, not the variable.
  const v = getComputedStyle(el).getPropertyValue("--font-rubik").trim();
  return v ? `${v}, Rubik, Inter, sans-serif` : "Rubik, Inter, sans-serif";
}

/**
 * Renders the static wheel face (bezel, segments, labels, vignette, studs)
 * once into an offscreen canvas. Per frame we only rotate and blit it, which
 * keeps the spin smooth on tablets; the highlight is drawn on top.
 */
function renderFace(size: number, dpr: number, labels: Record<PrizeKind, string>, font: string): HTMLCanvasElement {
  const face = document.createElement("canvas");
  face.width = Math.floor(size * dpr);
  face.height = Math.floor(size * dpr);
  const ctx = face.getContext("2d");
  if (!ctx) return face;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - size * 0.045;

  // Outer bezel: beige ring with a thin red filet, like a gilded frame.
  const bezel = ctx.createRadialGradient(cx, cy, r, cx, cy, r + size * 0.045);
  bezel.addColorStop(0, "#E6DED6");
  bezel.addColorStop(0.55, "#DACFC5");
  bezel.addColorStop(1, "#A99E93");
  ctx.beginPath();
  ctx.arc(cx, cy, r + size * 0.045, 0, Math.PI * 2);
  ctx.fillStyle = bezel;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r + size * 0.02, 0, Math.PI * 2);
  ctx.strokeStyle = "#C1110C";
  ctx.lineWidth = Math.max(1.5, size * 0.004);
  ctx.stroke();

  for (let i = 0; i < SEGMENTS; i++) {
    const kind = WHEEL_SEGMENTS[i];
    const start = i * SEGMENT_ANGLE - Math.PI / 2 - SEGMENT_ANGLE / 2;
    const end = start + SEGMENT_ANGLE;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    const base = FILLS[kind].bg;
    const g = ctx.createRadialGradient(cx, cy, r * 0.15, cx, cy, r);
    g.addColorStop(0, shade(base, 0.14));
    g.addColorStop(0.7, base);
    g.addColorStop(1, shade(base, -0.16));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "rgba(218,207,197,0.85)";
    ctx.lineWidth = Math.max(1.5, size * 0.003);
    ctx.stroke();

    // Label along the radius; left-half labels are flipped so they never
    // read upside down.
    const mid = start + SEGMENT_ANGLE / 2;
    const normalized = ((mid % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const flip = normalized > Math.PI / 2 && normalized < (3 * Math.PI) / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(mid + (flip ? Math.PI : 0));
    ctx.textAlign = flip ? "left" : "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = FILLS[kind].fg;
    const fontSize = Math.max(12, Math.round(size * 0.031));
    ctx.font = `500 ${fontSize}px ${font}`;
    const label = labels[kind].toUpperCase();
    ctx.fillText(label, (flip ? -1 : 1) * r * 0.9, 0, r * 0.6);
    ctx.restore();
  }

  const vignette = ctx.createRadialGradient(cx, cy, r * 0.55, cx, cy, r);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.22)");
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = vignette;
  ctx.fill();

  for (let i = 0; i < SEGMENTS; i++) {
    const a = i * SEGMENT_ANGLE - Math.PI / 2 - SEGMENT_ANGLE / 2;
    const sx = cx + Math.cos(a) * (r + size * 0.032);
    const sy = cy + Math.sin(a) * (r + size * 0.032);
    const stud = ctx.createRadialGradient(sx - 1, sy - 1, 0, sx, sy, size * 0.009);
    stud.addColorStop(0, "#E0453F");
    stud.addColorStop(1, "#8A0C08");
    ctx.beginPath();
    ctx.arc(sx, sy, size * 0.009, 0, Math.PI * 2);
    ctx.fillStyle = stud;
    ctx.fill();
  }
  return face;
}

function drawWheel(
  canvas: HTMLCanvasElement,
  face: HTMLCanvasElement,
  rotation: number,
  highlight: Highlight = null,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const size = canvas.clientWidth;
  const dpr = canvas.width / Math.max(1, size);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);
  const cx = size / 2;
  const cy = size / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.drawImage(face, -cx, -cy, size, size);
  ctx.restore();

  if (!highlight) return;
  const r = size / 2 - size * 0.045;
  for (let i = 0; i < SEGMENTS; i++) {
    const start = rotation + i * SEGMENT_ANGLE - Math.PI / 2 - SEGMENT_ANGLE / 2;
    const end = start + SEGMENT_ANGLE;
    const lit = highlight.index === i;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = lit
      ? `rgba(255,240,220,${0.18 + 0.32 * highlight.phase})`
      : `rgba(0,0,0,${0.55 + 0.1 * highlight.phase})`;
    ctx.fill();
    if (lit) {
      ctx.strokeStyle = "#C1110C";
      ctx.lineWidth = Math.max(4, size * 0.008);
      ctx.stroke();
    }
  }
}

/** Lightens (amount > 0) or darkens (amount < 0) a hex colour. */
function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v + (amount > 0 ? (255 - v) * amount : v * amount))));
  const rr = ch((n >> 16) & 255);
  const gg = ch((n >> 8) & 255);
  const bb = ch(n & 255);
  return `rgb(${rr},${gg},${bb})`;
}

export type WheelHandle = { spinTo: (kind: PrizeKind) => Promise<void> };

export function PrizeWheel({
  copy,
  onTap,
  disabled,
  won = false,
  handleRef,
}: {
  copy: GameCopy;
  onTap: () => void;
  disabled: boolean;
  won?: boolean;
  handleRef: React.MutableRefObject<WheelHandle | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceRef = useRef<{ size: number; dpr: number; canvas: HTMLCanvasElement } | null>(null);
  const rotationRef = useRef(0);
  const [spinning, setSpinning] = useState(false);
  const labels = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(copy.prizes).map(([k, v]) => [k, v.short]),
      ) as Record<PrizeKind, string>,
    [copy.prizes],
  );

  const highlightRef = useRef<Highlight>(null);
  const aliveRef = useRef(true);
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = canvas.clientWidth;
    if (size === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.floor(size * dpr)) {
      canvas.width = Math.floor(size * dpr);
      canvas.height = Math.floor(size * dpr);
    }
    let cached = faceRef.current;
    if (!cached || cached.size !== size || cached.dpr !== dpr) {
      cached = { size, dpr, canvas: renderFace(size, dpr, labels, resolveFont(canvas)) };
      faceRef.current = cached;
    }
    drawWheel(canvas, cached.canvas, rotationRef.current, highlightRef.current);
  }, [labels]);

  useEffect(() => {
    aliveRef.current = true;
    faceRef.current = null;
    redraw();
    // Re-render the face once the brand font has loaded so labels use it.
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(() => {
        if (!aliveRef.current) return;
        faceRef.current = null;
        redraw();
      });
    }
    window.addEventListener("resize", redraw);
    return () => {
      aliveRef.current = false;
      window.removeEventListener("resize", redraw);
    };
  }, [redraw]);

  useEffect(() => {
    handleRef.current = {
      spinTo: (kind) =>
        new Promise<void>((resolve) => {
          const candidates = segmentIndexesFor(kind);
          const target = candidates[Math.floor(Math.random() * candidates.length)];
          // Pointer is at the top; segment `i` is centred at rotation + i*angle.
          // We want segment `target` under the pointer, with a little jitter
          // so the needle does not always land dead-centre.
          const jitter = (Math.random() - 0.5) * SEGMENT_ANGLE * 0.6;
          const current = rotationRef.current % (Math.PI * 2);
          const desired = -target * SEGMENT_ANGLE + jitter;
          let delta = desired - current;
          while (delta < 0) delta += Math.PI * 2;
          const total = delta + EXTRA_TURNS * Math.PI * 2;
          const from = rotationRef.current;
          const startedAt = performance.now();
          setSpinning(true);
          highlightRef.current = null;
          const frame = (now: number) => {
            const t = Math.min(1, (now - startedAt) / SPIN_MS);
            rotationRef.current = from + total * easeOutSpin(t);
            redraw();
            if (t < 1) {
              requestAnimationFrame(frame);
              return;
            }
            // Winner pulse: hold the suspense before the result screen.
            const litAt = performance.now();
            let resolved = false;
            const pulse = (n: number) => {
              if (!aliveRef.current) return;
              const elapsed = n - litAt;
              const phase = 0.5 + 0.5 * Math.sin((elapsed / 420) * Math.PI);
              highlightRef.current = { index: target, phase };
              redraw();
              if (!resolved && elapsed >= HIGHLIGHT_MS) {
                resolved = true;
                setSpinning(false);
                resolve();
              }
              requestAnimationFrame(pulse);
            };
            requestAnimationFrame(pulse);
          };
          requestAnimationFrame(frame);
        }),
    };
  }, [handleRef, redraw]);

  return (
    <div
      className={`wheel ${won ? "wheel--won" : spinning || disabled ? "" : "wheel--idle"}`}
      role="button"
      tabIndex={0}
      aria-label={copy.wheel.tapToSpin}
      onPointerDown={() => { if (!spinning && !disabled) onTap(); }}
      onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !spinning && !disabled) onTap(); }}
    >
      <canvas ref={canvasRef} />
      <svg className="wheel__pointer" viewBox="0 0 40 52" aria-hidden>
        <defs>
          <linearGradient id="ptr" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#D8302A" />
            <stop offset="1" stopColor="#8A0C08" />
          </linearGradient>
        </defs>
        <path d="M20 52 L2 14 A18 18 0 1 1 38 14 Z" fill="url(#ptr)" stroke="#DACFC5" strokeWidth="1.5" />
        <circle cx="20" cy="16" r="6" fill="#000" stroke="#DACFC5" strokeWidth="1" />
      </svg>
      <div className="wheel__hub" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/wepac/wordmark-white.png" alt="" />
      </div>
    </div>
  );
}
