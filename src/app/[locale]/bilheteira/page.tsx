import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getInstitutionalCopy } from "@/i18n/copy/institutional";
import { prisma } from "@/lib/db";
import { buildSocialMetadata } from "@/lib/social-metadata";
import {
  Shell,
  styles,
  formatEventDate,
  formatEventTime,
  formatPriceCents,
} from "./ui";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = getInstitutionalCopy(locale).ticketing;
  return buildSocialMetadata({
    locale,
    path: "/bilheteira",
    title: `${copy.brand} | WEPAC`,
    description: copy.publishedProgramme,
  });
}

export default async function BilheteiraPublic() {
  const locale = await getLocale();
  const copy = getInstitutionalCopy(locale).ticketing;
  const now = new Date();
  const eventInclude = {
    department: true,
    brand: true,
    tiers: { orderBy: { priceCents: "asc" as const } },
  };
  const [events, pastEvents] = await Promise.all([
    prisma.event.findMany({
      where: { status: "published", startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      include: eventInclude,
    }),
    prisma.event.findMany({
      where: { status: "published", startsAt: { lt: now } },
      orderBy: { startsAt: "desc" },
      take: 6,
      include: eventInclude,
    }),
  ]);

  const renderEvents = (items: typeof events) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {items.map((e) => {
        const minPrice = e.tiers.length
          ? Math.min(...e.tiers.map((t) => t.priceCents))
          : null;
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
              <div style={{ fontSize: 14, color: "#444" }}>{e.subtitle}</div>
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
              {minPrice !== null && (
                <span>
                  {e.tiers.length > 1
                    ? copy.fromPrice(formatPriceCents(minPrice, locale))
                    : formatPriceCents(minPrice, locale)}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );

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
            <h2 style={{ ...styles.h2, marginTop: 0 }}>
              {copy.noUpcomingEvents}
            </h2>
            <p style={{ color: "#555", margin: "0 0 20px" }}>
              {copy.noUpcomingEventsBody}
            </p>
            <Link href="/programacao" style={styles.button}>
              {copy.viewProgrammeCta}
            </Link>
          </div>
        ) : (
          renderEvents(events)
        )}

        {pastEvents.length > 0 && (
          <section aria-labelledby="past-events-title">
            <h2 id="past-events-title" style={styles.h2}>
              {copy.pastEvents}
            </h2>
            {renderEvents(pastEvents)}
          </section>
        )}
      </main>
    </Shell>
  );
}
