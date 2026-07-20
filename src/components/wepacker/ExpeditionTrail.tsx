"use client";

// "Trilho da Expedição" — a horizontal mountain-profile trail that plots a
// member's sessions chronologically, so the dashboard finally SHOWS the
// mountain imaginary instead of only describing it in copy elsewhere.
//
// Deliberately monochrome: black background, white line/waypoints, the
// #DEE0DB accent used sparingly (only for "you are here" and the next
// scheduled session). No illustration, no gradients, no emoji.

export type ExpeditionSessionStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "no_show";

export type ExpeditionSessionType = "individual" | "group";

export interface ExpeditionSession {
  id: string;
  scheduledAt: string; // ISO date string
  status: ExpeditionSessionStatus;
  sessionType: ExpeditionSessionType;
}

interface ExpeditionTrailProps {
  sessions: ExpeditionSession[];
  className?: string;
}

type WaypointKind = "completed" | "missed" | "here" | "next" | "start" | "summit";

interface Waypoint {
  kind: WaypointKind;
  session?: ExpeditionSession;
  x: number;
  y: number;
}

// --- Seam ------------------------------------------------------------
// There is no `Session.kind` (semantic session kind) in the schema yet —
// it's being built in a parallel worktree. Once it lands, this is the
// only function that should need to change: branch on `kind` first and
// fall back to sessionType/status. Everything below only ever reads the
// `WaypointKind` this returns, so the rest of the component stays put.
function deriveWaypointKind(
  session: ExpeditionSession
): "completed" | "missed" {
  return session.status === "completed" ? "completed" : "missed";
}
// -----------------------------------------------------------------------

// Deterministic pseudo-irregularity so the ascent reads as a mountain
// profile rather than a ruler-straight ramp — seeded by index, so it's
// stable across re-renders instead of jittering on every paint.
function jitter(seed: number, amplitude: number) {
  return (Math.sin(seed * 12.9898) * 0.6 + Math.sin(seed * 7.233) * 0.4) * amplitude;
}

const TRACK_TOP = 42;
const TRACK_BOTTOM = 128;
const PAD_LEFT = 36;
const STEP = 96;
const HEIGHT = 176;

function formatDateLabel(iso: string) {
  return new Date(iso).toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "short",
  });
}

export function ExpeditionTrail({ sessions, className = "" }: ExpeditionTrailProps) {
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );
  const past = sorted.filter((s) => s.status !== "scheduled");
  const upcoming = sorted.filter((s) => s.status === "scheduled");
  const nextSession = upcoming[0];

  const isEmpty = sessions.length === 0;

  // Ordered, left-to-right sequence of everything except the summit. The
  // "here" marker sits between the last past waypoint and the next
  // scheduled one simply by being the item between them in this array —
  // uniform spacing does the rest.
  const items: Array<{ kind: WaypointKind; session?: ExpeditionSession }> = isEmpty
    ? [{ kind: "start" }]
    : [
        ...past.map((session) => ({ kind: deriveWaypointKind(session), session })),
        { kind: "here" as const },
        ...(nextSession ? [{ kind: "next" as const, session: nextSession }] : []),
      ];

  const n = items.length;
  const waypoints: Waypoint[] = items.map((item, i) => {
    const frac = n <= 1 ? 1 : i / (n - 1);
    const x = PAD_LEFT + i * STEP;
    const y = TRACK_BOTTOM - frac * (TRACK_BOTTOM - TRACK_TOP) + jitter(i + 1, 8);
    return { ...item, x, y };
  });

  const lastItem = waypoints[waypoints.length - 1];
  const summitX = lastItem.x + STEP * 1.4;
  const summitBaseY = TRACK_TOP - 8;
  const summit: Waypoint = { kind: "summit", x: summitX, y: summitBaseY };

  const width = summitX + 56;

  const linePoints = [...waypoints, summit].map((w) => `${w.x},${w.y}`).join(" ");

  return (
    <div className={`border border-wepac-border bg-wepac-card p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="font-barlow text-lg font-bold text-wepac-white">
          Trilho da Expedição
        </h2>
      </div>
      <div className="mt-4 overflow-x-auto bg-wepac-black">
        <svg
          viewBox={`0 0 ${width} ${HEIGHT}`}
          width={width}
          height={HEIGHT}
          className="block"
          style={{ minWidth: width }}
          role="img"
          aria-label="Trilho da expedição: sessões passadas, posição atual e próxima sessão"
        >
          {/* The trail line itself — thin, irregular, rising. */}
          <polyline
            points={linePoints}
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity={0.5}
            strokeWidth={1}
          />

          {/* Summit — the Journey's end, aspirational and unlabeled. */}
          <path
            d={`M ${summit.x - 14} ${summit.y + 22} L ${summit.x} ${summit.y - 20} L ${summit.x + 14} ${summit.y + 22} Z`}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.25}
            strokeLinejoin="round"
          />

          {waypoints.map((w, i) => {
            if (w.kind === "completed") {
              return <circle key={i} cx={w.x} cy={w.y} r={4.5} fill="#FFFFFF" />;
            }
            if (w.kind === "missed") {
              return (
                <g key={i} opacity={0.5}>
                  <circle cx={w.x} cy={w.y} r={4} fill="none" stroke="#999999" strokeWidth={1} />
                  <line
                    x1={w.x - 3}
                    y1={w.y - 3}
                    x2={w.x + 3}
                    y2={w.y + 3}
                    stroke="#999999"
                    strokeWidth={1}
                  />
                  <line
                    x1={w.x - 3}
                    y1={w.y + 3}
                    x2={w.x + 3}
                    y2={w.y - 3}
                    stroke="#999999"
                    strokeWidth={1}
                  />
                </g>
              );
            }
            if (w.kind === "here") {
              return (
                <g key={i}>
                  <circle cx={w.x} cy={w.y} r={5} fill="#000000" stroke="#DEE0DB" strokeWidth={2} />
                  <text
                    x={w.x}
                    y={w.y + 22}
                    textAnchor="middle"
                    fill="#DEE0DB"
                    fontSize={10}
                    fontFamily="Barlow, sans-serif"
                    fontWeight={700}
                  >
                    Estás aqui
                  </text>
                </g>
              );
            }
            if (w.kind === "next") {
              return (
                <g key={i}>
                  <circle cx={w.x} cy={w.y} r={9} fill="none" stroke="#DEE0DB" strokeWidth={1.25} />
                  <circle cx={w.x} cy={w.y} r={4} fill="#DEE0DB" />
                  <text
                    x={w.x}
                    y={w.y - 16}
                    textAnchor="middle"
                    fill="#DEE0DB"
                    fontSize={10}
                    fontFamily="Barlow, sans-serif"
                    fontWeight={700}
                  >
                    {w.session ? formatDateLabel(w.session.scheduledAt) : ""}
                  </text>
                </g>
              );
            }
            if (w.kind === "start") {
              return (
                <g key={i}>
                  <circle cx={w.x} cy={w.y} r={5} fill="none" stroke="#DEE0DB" strokeWidth={1.5} />
                  <text
                    x={w.x}
                    y={w.y + 22}
                    textAnchor="middle"
                    fill="#DEE0DB"
                    fontSize={10}
                    fontFamily="Barlow, sans-serif"
                    fontWeight={700}
                  >
                    Início
                  </text>
                </g>
              );
            }
            return null;
          })}
        </svg>
      </div>
      {isEmpty && (
        <p className="mt-3 text-xs text-wepac-text-tertiary">
          A tua expedição começa em breve.
        </p>
      )}
    </div>
  );
}
