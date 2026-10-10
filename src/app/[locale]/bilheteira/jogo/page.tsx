import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { getGameCopy } from "@/i18n/copy/institutional-game";
import { hasKioskAccess, kioskMode } from "@/lib/bilheteira/game/kiosk-access";
import { GameClient } from "./game-client";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const copy = getGameCopy(await getLocale());
  return {
    title: { absolute: copy.metadataTitle },
    description: copy.metadataDescription,
    // Kiosk surface: never index it.
    robots: { index: false, follow: false },
  };
}

type Props = { searchParams: Promise<{ unlock?: string }> };

export default async function GamePage({ searchParams }: Props) {
  const locale = await getLocale();
  const copy = getGameCopy(locale);
  const { unlock } = await searchParams;

  if (!(await hasKioskAccess())) {
    const gated = kioskMode() === "gated";
    return (
      <main className="game-locked">
        <p className="game-eyebrow">{copy.attract.eyebrow}</p>
        <h1 className="game-serif">{gated ? copy.unlock.title : copy.campaignName}</h1>
        <p>{gated ? copy.unlock.body : copy.errors.locked}</p>
        {gated && (
          <form method="post" action="/api/bilheteira/game/unlock" className="unlock">
            <input type="hidden" name="locale" value={locale} />
            <label className="field">
              <span>{copy.unlock.keyLabel}</span>
              <input type="password" name="key" autoComplete="off" required />
            </label>
            {unlock === "failed" && <p className="field__error">{copy.unlock.failed}</p>}
            <button type="submit" className="game-btn game-btn--primary">{copy.unlock.submit}</button>
          </form>
        )}
      </main>
    );
  }

  return <GameClient locale={locale} />;
}
