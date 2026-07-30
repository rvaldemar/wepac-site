import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getInstitutionalCopy } from "@/i18n/copy/institutional";
import { prisma } from "@/lib/db";
import {
  Shell,
  styles,
  formatEventDate,
  formatEventTime,
  formatPriceCents,
} from "./ui";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const copy = getInstitutionalCopy(await getLocale()).ticketing;
  return {
    title: `${copy.brand} — WEPAC`,
    description:
      copy.publishedProgramme,
  };
}

export default async function BilheteiraPublic() {
  const locale = await getLocale();
  const copy = getInstitutionalCopy(locale).ticketing;
  const events = await prisma.event.findMany({
    where: { status: "published", startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    include: {
      department: true,
      brand: true,
      tiers: { orderBy: { priceCents: "asc" } },
    },
  });

  return (
    <Shell
      rightSlot={
        <Link href="/bilheteira/login" style={styles.buttonGhost}>
          Admin
        </Link>
      }
    >
      <main style={styles.container}>
        <div style={styles.eyebrow}>WEPAC</div>
        <h1 style={styles.h1}>{copy.brand}</h1>
        <p style={{ color: "#666", maxWidth: 620, marginBottom: 40 }}>
          {copy.publishedProgramme}
        </p>

        {events.length === 0 ? (
          <div style={styles.card}>
            <p style={{ margin: 0 }}>
              {copy.noEvents}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {events.map((e) => {
              const minPrice = Math.min(...e.tiers.map((t) => t.priceCents));
              const brandName = e.brand?.name || e.department.name;
              return (
                <Link
                  key={e.id}
                  href={`/bilheteira/${e.slug}`}
                  style={{
                    ...styles.card,
                    textDecoration: "none",
                    color: "#000",
                    display: "block",
                    transition: "border-color 150ms",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      color: "#666",
                      marginBottom: 8,
                    }}
                  >
                    {brandName}
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Barlow', sans-serif",
                      fontWeight: 900,
                      fontSize: 24,
                      letterSpacing: -0.4,
                      margin: "0 0 6px",
                    }}
                  >
                    {e.title}
                  </h3>
                  {e.subtitle && (
                    <div style={{ fontSize: 14, color: "#444" }}>
                      {e.subtitle}
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 16,
                      marginTop: 12,
                      fontSize: 13,
                      color: "#333",
                    }}
                  >
                    <span>
                      <strong>{formatEventDate(e.startsAt, locale)}</strong> ·{" "}
                      {formatEventTime(e.startsAt, locale)}
                    </span>
                    <span>{e.venue}</span>
                    <span>
                      {e.tiers.length > 1
                        ? copy.fromPrice(formatPriceCents(minPrice, locale))
                        : formatPriceCents(minPrice, locale)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </Shell>
  );
}
