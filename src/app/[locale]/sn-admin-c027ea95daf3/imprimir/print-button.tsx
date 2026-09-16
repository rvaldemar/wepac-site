"use client";

import { useLocale } from "next-intl";
import { getSemNomeCopy } from "@/i18n/copy/institutional-sn";
import type { AppLocale } from "@/i18n/routing";

export function PrintButton() {
  const locale = useLocale() as AppLocale;
  const copy = getSemNomeCopy(locale);

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
      {copy.admin.print}
    </button>
  );
}
