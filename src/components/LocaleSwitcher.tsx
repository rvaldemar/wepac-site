"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { isAppLocale, locales, type AppLocale } from "@/i18n/routing";

type LocaleSwitcherProps = {
  className?: string;
  tone?: "dark" | "light";
};

export function LocaleSwitcher({
  className = "",
  tone = "dark",
}: LocaleSwitcherProps) {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Common");
  const [isPending, startTransition] = useTransition();

  return (
    <label className={`inline-flex items-center ${className}`}>
      <span className="sr-only">{t("language")}</span>
      <select
        aria-label={t("language")}
        value={locale}
        disabled={isPending}
        onChange={(event) => {
          const nextLocale = event.target.value;
          if (!isAppLocale(nextLocale) || nextLocale === locale) return;

          const search = typeof window === "undefined" ? "" : window.location.search;
          const hash = typeof window === "undefined" ? "" : window.location.hash;
          const href = `${pathname}${search}${hash}`;

          startTransition(() => {
            router.replace(href, { locale: nextLocale, scroll: false });
          });
        }}
        className={`max-w-[13rem] cursor-pointer border bg-transparent px-2.5 py-2 text-[10px] font-bold tracking-[0.08em] outline-none transition-colors disabled:cursor-wait disabled:opacity-50 ${
          tone === "light"
            ? "border-black/20 text-black hover:border-black/50"
            : "border-white/20 text-white/70 hover:border-white/50 hover:text-white"
        }`}
      >
        {locales.map((option) => (
          <option key={option} value={option} className="bg-white text-black">
            {t(`languages.${option}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
