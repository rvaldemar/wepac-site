"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PrizeKind } from "@prisma/client";
import type { GameCopy } from "@/i18n/copy/institutional-game";
import { WHEEL_SEGMENTS, segmentIndexesFor } from "@/lib/bilheteira/game/prizes";

const SEGMENTS = WHEEL_SEGMENTS.length;
const SEGMENT_ANGLE = (Math.PI * 2) / SEGMENTS;
const SPIN_MS = 5200;
const EXTRA_TURNS = 5;

const FILLS: Record<PrizeKind, { bg: string; fg: string }> = {
  two_for_one_single_2026: { bg: "#F0EDE6", fg: "#0B0A09" },
  two_for_one_all_2026: { bg: "#1A1816", fg: "#F0EDE6" },
  free_ticket_single_2026: { bg: "#C2301F", fg: "#F0EDE6" },
  free_all_q4_2026: { bg: "#2E5944", fg: "#F0EDE6" },
};

function easeOutQuint(t: number) {
  return 1 - Math.pow(1 - t, 5);
}

function drawWheel(
  canvas: HTMLCanvasElement,
  rotation: number,
  labels: Record<PrizeKind, string>,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const size = canvas.clientWidth;
  if (canvas.width !== Math.floor(size * dpr)) {
    canvas.width = Math.floor(size * dpr);
    canvas.height = Math.floor(size * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 6;

  // Outer ring
  ctx.beginPath();
  ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
  ctx.fillStyle = "#F0EDE6";
  ctx.fill();

  for (let i = 0; i < SEGMENTS; i++) {
    const kind = WHEEL_SEGMENTS[i];
    const start = rotation + i * SEGMENT_ANGLE - Math.PI / 2 - SEGMENT_ANGLE / 2;
    const end = start + SEGMENT_ANGLE;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = FILLS[kind].bg;
    ctx.fill();
    ctx.strokeStyle = "rgba(240,237,230,0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label along the radius. Segments on the left half are flipped so the
    // text never reads upside down.
    const mid = start + SEGMENT_ANGLE / 2;
    const normalized = ((mid % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const flip = normalized > Math.PI / 2 && normalized < (3 * Math.PI) / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(mid + (flip ? Math.PI : 0));
    ctx.textAlign = flip ? "left" : "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = FILLS[kind].fg;
    const fontSize = Math.max(12, Math.round(size * 0.032));
    ctx.font = `700 ${fontSize}px Barlow, Inter, sans-serif`;
    const label = labels[kind].toUpperCase();
    ctx.fillText(label, (flip ? -1 : 1) * r * 0.9, 0, r * 0.62);
    ctx.restore();
  }

  // Hairline rim dots
  for (let i = 0; i < SEGMENTS; i++) {
    const a = rotation + i * SEGMENT_ANGLE - Math.PI / 2 - SEGMENT_ANGLE / 2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * (r + 1), cy + Math.sin(a) * (r + 1), 3, 0, Math.PI * 2);
    ctx.fillStyle = "#DC4A32";
    ctx.fill();
  }
}

export type WheelHandle = { spinTo: (kind: PrizeKind) => Promise<void> };

export function PrizeWheel({
  copy,
  onTap,
  disabled,
  handleRef,
}: {
  copy: GameCopy;
  onTap: () => void;
  disabled: boolean;
  handleRef: React.MutableRefObject<WheelHandle | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const [spinning, setSpinning] = useState(false);
  const labels = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(copy.prizes).map(([k, v]) => [k, v.short]),
      ) as Record<PrizeKind, string>,
    [copy.prizes],
  );

  const redraw = useCallback(() => {
    if (canvasRef.current) drawWheel(canvasRef.current, rotationRef.current, labels);
  }, [labels]);

  useEffect(() => {
    redraw();
    window.addEventListener("resize", redraw);
    return () => window.removeEventListener("resize", redraw);
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
          const frame = (now: number) => {
            const t = Math.min(1, (now - startedAt) / SPIN_MS);
            rotationRef.current = from + total * easeOutQuint(t);
            redraw();
            if (t < 1) requestAnimationFrame(frame);
            else {
              setSpinning(false);
              resolve();
            }
          };
          requestAnimationFrame(frame);
        }),
    };
  }, [handleRef, redraw]);

  return (
    <div
      className={`wheel ${spinning || disabled ? "" : "wheel--idle"}`}
      role="button"
      tabIndex={0}
      aria-label={copy.wheel.tapToSpin}
      onPointerDown={() => { if (!spinning && !disabled) onTap(); }}
      onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !spinning && !disabled) onTap(); }}
    >
      <canvas ref={canvasRef} />
      <svg className="wheel__pointer" viewBox="0 0 40 52" aria-hidden>
        <path d="M20 52 L2 14 A18 18 0 1 1 38 14 Z" fill="#DC4A32" />
        <circle cx="20" cy="16" r="6" fill="#0B0A09" />
      </svg>
      <div className="wheel__hub" aria-hidden>WEPAC</div>
    </div>
  );
}
