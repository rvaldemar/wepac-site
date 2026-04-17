import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";

export const palette = {
  bg: "#f5f4f0",
  card: "#ffffff",
  ink: "#000000",
  muted: "#666666",
  line: "#e5e3de",
  accent: "#DEE0DB",
  danger: "#c00",
  success: "#1b5e20",
};

export const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: palette.bg,
    fontFamily: "'Inter', system-ui, sans-serif",
    color: palette.ink,
  },
  header: {
    borderBottom: `1px solid ${palette.line}`,
    background: "#fff",
    padding: "16px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 900,
    fontSize: 18,
    letterSpacing: -0.5,
    textDecoration: "none",
    color: palette.ink,
  },
  brandSub: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: palette.muted,
    marginLeft: 10,
  },
  container: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "40px 24px",
  },
  narrow: {
    maxWidth: 520,
    margin: "0 auto",
    padding: "40px 24px",
  },
  h1: {
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 900,
    fontSize: 32,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  h2: {
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 700,
    fontSize: 20,
    letterSpacing: -0.3,
    marginBottom: 16,
    marginTop: 32,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: palette.muted,
    marginBottom: 24,
  },
  card: {
    background: palette.card,
    border: `1px solid ${palette.line}`,
    padding: 24,
    marginBottom: 16,
  },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  label: { display: "flex", flexDirection: "column", gap: 6 },
  labelText: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#333",
  },
  input: {
    padding: "12px 14px",
    border: "1px solid #ccc",
    borderRadius: 0,
    fontSize: 15,
    fontFamily: "inherit",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    background: "#fff",
  },
  textarea: {
    padding: "12px 14px",
    border: "1px solid #ccc",
    borderRadius: 0,
    fontSize: 15,
    fontFamily: "inherit",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    background: "#fff",
    minHeight: 120,
    resize: "vertical",
  },
  select: {
    padding: "12px 14px",
    border: "1px solid #ccc",
    borderRadius: 0,
    fontSize: 15,
    fontFamily: "inherit",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    background: "#fff",
  },
  button: {
    padding: "14px 20px",
    background: "#000",
    color: "#fff",
    border: "none",
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: 2,
    textTransform: "uppercase",
    cursor: "pointer",
    marginTop: 8,
  },
  buttonSecondary: {
    padding: "12px 16px",
    background: "#fff",
    color: "#000",
    border: "1px solid #000",
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 700,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
  },
  buttonGhost: {
    padding: "10px 14px",
    background: "transparent",
    color: "#333",
    border: "1px solid #ccc",
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
  },
  buttonDanger: {
    padding: "10px 14px",
    background: "#fff",
    color: palette.danger,
    border: `1px solid ${palette.danger}`,
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    cursor: "pointer",
  },
  error: {
    padding: 14,
    background: "#fee",
    border: "1px solid #c00",
    color: "#900",
    fontSize: 14,
    marginBottom: 12,
  },
  pill: {
    display: "inline-block",
    padding: "4px 10px",
    background: palette.accent,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: 700,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  row: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: 14,
  },
  th: {
    textAlign: "left" as const,
    padding: "10px 8px",
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
    color: palette.muted,
    borderBottom: "1px solid #ddd",
    fontWeight: 400,
  },
  td: { padding: "12px 8px", verticalAlign: "middle" as const, borderBottom: "1px solid #eee" },
  link: { color: "#000", textDecoration: "underline" },
};

export function Shell({
  children,
  rightSlot,
}: {
  children: ReactNode;
  rightSlot?: ReactNode;
}) {
  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <Link href="/bilheteira" style={styles.brand}>
            WEPAC
          </Link>
          <span style={styles.brandSub}>Bilheteira</span>
        </div>
        <div style={styles.row}>{rightSlot}</div>
      </header>
      {children}
    </div>
  );
}

export function formatPriceCents(cents: number): string {
  if (cents === 0) return "Grátis";
  const euros = cents / 100;
  return euros % 1 === 0
    ? `${euros.toFixed(0)} €`
    : `${euros.toFixed(2).replace(".", ",")} €`;
}

export function formatEventDate(d: Date): string {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatEventTime(d: Date): string {
  return new Intl.DateTimeFormat("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
