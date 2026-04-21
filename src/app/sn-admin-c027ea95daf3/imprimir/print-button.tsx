"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{
        padding: "10px 16px",
        background: "#000",
        color: "#fff",
        border: "none",
        fontFamily: "'Barlow', sans-serif",
        fontWeight: 700,
        fontSize: 12,
        letterSpacing: 2,
        textTransform: "uppercase",
        cursor: "pointer",
      }}
    >
      Imprimir / Guardar PDF
    </button>
  );
}
