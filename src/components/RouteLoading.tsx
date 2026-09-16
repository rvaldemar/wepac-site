"use client";

import { useLocale } from "next-intl";
import { wp } from "@/i18n/copy/wepacker";

export function RouteLoading({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const locale = useLocale();
  const dark = tone === "dark";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`min-h-[50vh] p-6 sm:p-10 ${dark ? "bg-wepac-dark" : "bg-[#f5f4f0]"}`}
    >
      <span className="sr-only">{wp(locale, "A carregar conteúdo", "Loading content")}</span>
      <div
        aria-hidden="true"
        className="mx-auto max-w-4xl animate-pulse space-y-6 motion-reduce:animate-none"
      >
        <div className={`h-8 w-48 ${dark ? "bg-white/15" : "bg-black/10"}`} />
        <div className={`h-4 w-72 max-w-full ${dark ? "bg-white/10" : "bg-black/5"}`} />
        <div className={`grid gap-4 pt-4 sm:grid-cols-2 ${dark ? "text-white" : "text-black"}`}>
          <div className={`h-40 border ${dark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`} />
          <div className={`h-40 border ${dark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`} />
        </div>
      </div>
    </div>
  );
}
