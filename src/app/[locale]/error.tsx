"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { BrandedStatusPage, statusPrimaryAction, statusSecondaryAction } from "@/components/BrandedStatusPage";
import { getErrorCopy } from "@/i18n/copy/errors";
import { Link } from "@/i18n/navigation";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();
  const copy = getErrorCopy(locale).error;

  useEffect(() => {
    console.error("[ui] route_error", {
      kind: error.name,
      digest: error.digest ?? null,
    });
  }, [error]);

  return (
    <BrandedStatusPage
      eyebrow={copy.eyebrow}
      title={copy.title}
      body={copy.body}
      homeHref={locale === "en-US" ? "/en" : "/"}
    >
      <button type="button" onClick={reset} style={statusPrimaryAction}>
        {copy.retry}
      </button>
      <Link href="/" style={statusSecondaryAction}>
        {copy.home}
      </Link>
    </BrandedStatusPage>
  );
}
