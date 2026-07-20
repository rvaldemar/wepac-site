"use client";

interface StrategicRadarProps {
 current: { longTerm: number; annual: number; quarterly: number; monthly: number };
 previous?: { longTerm: number; annual: number; quarterly: number; monthly: number };
 size?: number;
 className?: string;
}

const AXES = [
 { key: "longTerm", label: "Longo prazo" },
 { key: "annual", label: "Anual" },
 { key: "quarterly", label: "Trimestral" },
 { key: "monthly", label: "Mensal" },
] as const;

export function StrategicRadar({
 current,
 previous,
 size = 280,
 className = "",
}: StrategicRadarProps) {
 const center = size / 2;
 const radius = size * 0.32;
 const levels = 5;
 const angleStep = (2 * Math.PI) / 4;
 const startAngle = -Math.PI / 2;

 function getPoint(index: number, r: number) {
  const angle = startAngle + index * angleStep;
  return {
   x: center + r * Math.cos(angle),
   y: center + r * Math.sin(angle),
  };
 }

 function polygonPoints(r: number) {
  return AXES.map((_, i) => {
   const p = getPoint(i, r);
   return `${p.x},${p.y}`;
  }).join(" ");
 }

 function dataPolygon(values: typeof current) {
  const vals = [values.longTerm, values.annual, values.quarterly, values.monthly];
  return vals
   .map((v, i) => {
    const r = (Math.min(v, 5) / 5) * radius;
    const p = getPoint(i, r);
    return `${p.x},${p.y}`;
   })
   .join(" ");
 }

 const currentVals = [current.longTerm, current.annual, current.quarterly, current.monthly];

 return (
  <svg viewBox={`0 0 ${size} ${size}`} className={className} role="img" aria-label="Mapa Estratégico">
   {/* Grid */}
   {Array.from({ length: levels }, (_, i) => (
    <polygon
     key={i}
     points={polygonPoints(((i + 1) / levels) * radius)}
     fill="none"
     stroke="#333"
     strokeWidth="0.5"
    />
   ))}

   {/* Axes */}
   {AXES.map((_, i) => {
    const p = getPoint(i, radius);
    return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#333" strokeWidth="0.5" />;
   })}

   {/* Previous */}
   {previous && (
    <polygon
     points={dataPolygon(previous)}
     fill="none"
     stroke="#666"
     strokeWidth="1.5"
     strokeDasharray="4 2"
    />
   )}

   {/* Current */}
   <polygon
    points={dataPolygon(current)}
    fill="#691515"
    fillOpacity={0.2}
    stroke="#691515"
    strokeWidth="2"
   />

   {/* Data points */}
   {currentVals.map((v, i) => {
    const r = (Math.min(v, 5) / 5) * radius;
    const p = getPoint(i, r);
    return <circle key={i} cx={p.x} cy={p.y} r="4" fill="#691515" />;
   })}

   {/* Labels */}
   {AXES.map((axis, i) => {
    const p = getPoint(i, radius + 24);
    return (
     <text
      key={axis.key}
      x={p.x}
      y={p.y}
      textAnchor="middle"
      dominantBaseline="middle"
      fill="#E5E5E5"
      fontSize="10"
      fontFamily="Inter, sans-serif"
     >
      {axis.label}
     </text>
    );
   })}
  </svg>
 );
}
