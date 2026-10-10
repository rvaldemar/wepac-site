import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { getGameCopy } from "@/i18n/copy/institutional-game";
import { authorizeKiosk } from "@/lib/bilheteira/game/kiosk-access";
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

type Props = { searchParams: Promise<{ k?: string }> };

export default async function GamePage({ searchParams }: Props) {
  const locale = await getLocale();
  const copy = getGameCopy(locale);
  const { k } = await searchParams;
  const allowed = await authorizeKiosk(k);

  if (!allowed) {
    return (
      <main className="game-locked">
        <p className="game-eyebrow">{copy.attract.eyebrow}</p>
        <h1 className="game-serif">{copy.campaignName}</h1>
        <p>{copy.errors.locked}</p>
      </main>
    );
  }

  return <GameClient locale={locale} />;
}
