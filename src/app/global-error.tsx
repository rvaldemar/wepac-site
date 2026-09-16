"use client";

import Link from "next/link";
import { BrandedStatusPage, statusPrimaryAction, statusSecondaryAction } from "@/components/BrandedStatusPage";

export default function GlobalError({ reset }: { reset: () => void }) {
  const english =
    typeof window !== "undefined" && /^\/en(?:\/|$)/.test(window.location.pathname);
  return (
    <html lang={english ? "en" : "pt"} suppressHydrationWarning>
      <body style={{ margin: 0 }}>
        <BrandedStatusPage
          eyebrow={english ? "Error" : "Erro"}
          title={english ? "Something went wrong" : "Algo correu mal"}
          body={
            english
              ? "The page could not be loaded. Please try again."
              : "Não foi possível carregar a página. Tenta novamente."
          }
          homeHref="/"
        >
          <button type="button" onClick={reset} style={statusPrimaryAction}>
            {english ? "Try again" : "Tentar novamente"}
          </button>
          <Link href="/" style={statusSecondaryAction}>
            {english ? "Homepage" : "Página inicial"}
          </Link>
        </BrandedStatusPage>
      </body>
    </html>
  );
}
