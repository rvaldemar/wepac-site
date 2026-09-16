import type { ReactNode } from "react";
import NextLink from "next/link";

export function BrandedStatusPage({
  eyebrow,
  title,
  body,
  homeHref,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  homeHref: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        fontFamily: "var(--font-inter), Inter, sans-serif",
      }}
    >
      <header
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.12)",
          padding: "20px clamp(24px, 5vw, 64px)",
        }}
      >
        <NextLink
          href={homeHref}
          style={{
            color: "#fff",
            fontFamily: "var(--font-barlow), Barlow, sans-serif",
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            textDecoration: "none",
          }}
        >
          wepac
        </NextLink>
      </header>
      <main
        style={{
          boxSizing: "border-box",
          display: "flex",
          minHeight: "calc(100vh - 66px)",
          alignItems: "center",
          padding: "64px clamp(24px, 8vw, 120px)",
        }}
      >
        <div style={{ maxWidth: 760 }}>
          <p
            style={{
              color: "rgba(255,255,255,0.48)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.18em",
              margin: "0 0 24px",
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </p>
          <h1
            style={{
              fontFamily: "var(--font-barlow), Barlow, sans-serif",
              fontSize: "clamp(42px, 8vw, 88px)",
              fontWeight: 900,
              letterSpacing: "-0.045em",
              lineHeight: 0.92,
              margin: 0,
            }}
          >
            {title}
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.68)",
              fontSize: 17,
              lineHeight: 1.65,
              margin: "28px 0 32px",
              maxWidth: 560,
            }}
          >
            {body}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>{children}</div>
        </div>
      </main>
    </div>
  );
}

export const statusPrimaryAction = {
  background: "#DEE0DB",
  border: "1px solid #DEE0DB",
  color: "#000",
  cursor: "pointer",
  display: "inline-block",
  fontFamily: "var(--font-barlow), Barlow, sans-serif",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.12em",
  padding: "14px 18px",
  textDecoration: "none",
  textTransform: "uppercase",
} as const;

export const statusSecondaryAction = {
  ...statusPrimaryAction,
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.35)",
  color: "#fff",
} as const;
