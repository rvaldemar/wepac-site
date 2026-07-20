"use client";

import { AREA_KEYS, type AreaKey } from "@/lib/wepacker/types";

interface RadarChartProps {
  currentValues: Record<AreaKey, number>;
  areaLabels: Record<AreaKey, string>;
  previousValues?: Record<AreaKey, number>;
  onAreaClick?: (area: AreaKey) => void;
  size?: number;
  className?: string;
}

const AREAS: AreaKey[] = [...AREA_KEYS];

export function RadarChart({
  currentValues,
  areaLabels,
  previousValues,
  onAreaClick,
  size = 320,
  className = "",
}: RadarChartProps) {
  const center = size / 2;
  const radius = size * 0.34;
  const levels = 5;
  const angleStep = (2 * Math.PI) / AREAS.length;
  const startAngle = -Math.PI / 2;

  function getPoint(index: number, r: number) {
    const angle = startAngle + index * angleStep;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  }

  function polygonPoints(r: number) {
    return AREAS.map((_, i) => {
      const p = getPoint(i, r);
      return `${p.x},${p.y}`;
    }).join(" ");
  }

  function dataPolygon(values: Record<AreaKey, number>) {
    return AREAS.map((area, i) => {
      const r = (Math.min(values[area] ?? 0, 5) / 5) * radius;
      const p = getPoint(i, r);
      return `${p.x},${p.y}`;
    }).join(" ");
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{ overflow: "visible" }}
      role="img"
      aria-label="Mapa de Desenvolvimento"
    >
      {/* Grid levels */}
      {Array.from({ length: levels }, (_, i) => (
        <polygon
          key={i}
          points={polygonPoints(((i + 1) / levels) * radius)}
          fill="none"
          stroke="#333"
          strokeWidth="0.5"
        />
      ))}

      {/* Axis lines */}
      {AREAS.map((_, i) => {
        const p = getPoint(i, radius);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={p.x}
            y2={p.y}
            stroke="#333"
            strokeWidth="0.5"
          />
        );
      })}

      {/* Previous values (gray, line only) */}
      {previousValues && (
        <polygon
          points={dataPolygon(previousValues)}
          fill="none"
          stroke="#666"
          strokeWidth="1.5"
          strokeDasharray="4 2"
        />
      )}

      {/* Current values (white, filled) */}
      <polygon
        points={dataPolygon(currentValues)}
        fill="#FFFFFF"
        fillOpacity={0.1}
        stroke="#FFFFFF"
        strokeWidth="2"
      />

      {/* Data points - current */}
      {AREAS.map((area, i) => {
        const r = (Math.min(currentValues[area] ?? 0, 5) / 5) * radius;
        const p = getPoint(i, r);
        return <circle key={area} cx={p.x} cy={p.y} r="4" fill="#FFFFFF" />;
      })}

      {/* Labels + click targets. Label and score are stacked in one text
          block anchored per quadrant, so they never collide on the
          horizontal axes. */}
      {AREAS.map((area, i) => {
        const angle = startAngle + i * angleStep;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const p = getPoint(i, radius + (size > 280 ? 14 : 10));

        const anchor: "middle" | "start" | "end" =
          Math.abs(cos) < 0.5 ? "middle" : cos > 0 ? "start" : "end";

        const labelSize = size > 280 ? 11 : 9;
        const lineHeight = labelSize * 1.3;
        // Block of 2 lines: fully above the vertex on top, fully below on
        // the bottom, vertically centered on the sides.
        let firstLineY: number;
        if (sin < -0.35) {
          firstLineY = p.y - lineHeight;
        } else if (sin > 0.35) {
          firstLineY = p.y + lineHeight;
        } else {
          firstLineY = p.y - lineHeight / 4;
        }

        return (
          <g
            key={area}
            onClick={() => onAreaClick?.(area)}
            className={onAreaClick ? "cursor-pointer" : ""}
            role={onAreaClick ? "button" : undefined}
            tabIndex={onAreaClick ? 0 : undefined}
          >
            <text
              x={p.x}
              y={firstLineY}
              textAnchor={anchor}
              fill="#E5E5E5"
              fontSize={labelSize}
              fontFamily="Inter, sans-serif"
            >
              <tspan>{areaLabels[area]}</tspan>
              <tspan
                x={p.x}
                dy={lineHeight}
                fill="#FFFFFF"
                fontSize={size > 280 ? 10 : 8}
                fontWeight="bold"
              >
                {(currentValues[area] ?? 0).toFixed(1)}
              </tspan>
            </text>
          </g>
        );
      })}

      {/* Level labels on first axis */}
      {Array.from({ length: levels }, (_, i) => {
        const p = getPoint(0, ((i + 1) / levels) * radius);
        return (
          <text
            key={i}
            x={p.x + 8}
            y={p.y - 4}
            fill="#666"
            fontSize="7"
            fontFamily="Inter, sans-serif"
          >
            {i + 1}
          </text>
        );
      })}
    </svg>
  );
}
