"use client";

const AREAS = ["Físico", "Afetivo", "Caráter", "Espiritual", "Intelectual", "Social"];

export function StaticRadar({ className = "" }: { className?: string }) {
 const size = 280;
 const center = size / 2;
 const radius = 110;
 const levels = 5;

 const angleStep = (2 * Math.PI) / 6;
 const startAngle = -Math.PI / 2;

 function getPoint(index: number, r: number) {
  const angle = startAngle + index * angleStep;
  return {
   x: center + r * Math.cos(angle),
   y: center + r * Math.sin(angle),
  };
 }

 function polygonPoints(r: number) {
  return Array.from({ length: 6 }, (_, i) => {
   const p = getPoint(i, r);
   return `${p.x},${p.y}`;
  }).join(" ");
 }

 // Illustrative values
 const values = [3.8, 3.2, 4.1, 2.8, 3.5, 3.0];
 const dataPoints = values.map((v, i) => {
  const r = (v / 5) * radius;
  return getPoint(i, r);
 });
 const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

 return (
  <svg viewBox={`0 0 ${size} ${size}`} className={className} aria-label="Mapa de Desenvolvimento WEPAC">
   {/* Grid levels */}
   {Array.from({ length: levels }, (_, i) => (
    <polygon
     key={i}
     points={polygonPoints(((i + 1) / levels) * radius)}
     fill="none"
     stroke="#333"
     strokeWidth="0.5"
     opacity={0.5}
    />
   ))}

   {/* Axis lines */}
   {Array.from({ length: 6 }, (_, i) => {
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
      opacity={0.5}
     />
    );
   })}

   {/* Data polygon */}
   <polygon
    points={dataPolygon}
    fill="#DEE0DB"
    fillOpacity={0.15}
    stroke="#DEE0DB"
    strokeWidth="2"
   />

   {/* Data points */}
   {dataPoints.map((p, i) => (
    <circle key={i} cx={p.x} cy={p.y} r="3" fill="#DEE0DB" />
   ))}

   {/* Labels */}
   {AREAS.map((area, i) => {
    const p = getPoint(i, radius + 24);
    return (
     <text
      key={area}
      x={p.x}
      y={p.y}
      textAnchor="middle"
      dominantBaseline="middle"
      fill="#DEE0DB"
      fontSize="10"
      fontFamily="Inter, sans-serif"
     >
      {area}
     </text>
    );
   })}
  </svg>
 );
}
