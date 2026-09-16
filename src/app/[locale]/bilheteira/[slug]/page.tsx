import { Link } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getInstitutionalCopy } from "@/i18n/copy/institutional";
import { prisma } from "@/lib/db";
import { reserveAction } from "@/lib/bilheteira/reserve-action";
import { isPastEvent } from "@/lib/bilheteira/event-time";
import { buildSocialMetadata } from "@/lib/social-metadata";
import {
  Shell,
  styles,
  formatEventDate,
  formatEventTime,
  formatPriceCents,
} from "../ui";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; cancelled?: string; tier?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const locale = await getLocale();
  const copy = getInstitutionalCopy(locale).ticketing;
  const { slug } = await params;
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) {
    return buildSocialMetadata({
      locale,
      path: `/bilheteira/${slug}`,
      title: copy.eventFallbackTitle,
      description: copy.publishedProgramme,
    });
  }
  return buildSocialMetadata({
    locale,
    path: `/bilheteira/${slug}`,
    title: `${event.title} | WEPAC`,
    description: event.description.slice(0, 160),
    image: event.coverImage,
    imageAlt: event.title,
  });
}

export default async function EventPublicPage({ params, searchParams }: Props) {
  const locale = await getLocale();
  const copy = getInstitutionalCopy(locale).ticketing;
  const { slug } = await params;
  const { error, cancelled, tier: tierParam } = await searchParams;

  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      department: true,
      brand: true,
      tiers: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!event) notFound();
  if (event.status !== "published") notFound();

  const brandName = event.brand?.name || event.department.name;
  const isPast = isPastEvent(event.startsAt);

  // A tier id can arrive as a deep-link from the landing page. Absent,
  // unknown or hostile input must never error the page — it just falls back
  // to preselecting the first tier, same as visiting the page directly.
  const preselectedTierId =
    event.tiers.find((t) => t.id === tierParam)?.id ?? event.tiers[0]?.id;

  return (
    <Shell
      rightSlot={
        <Link href="/bilheteira" style={styles.buttonGhost}>
          {copy.allEvents}
        </Link>
      }
    >
      <main style={styles.container}>
        {event.coverImage && (
          <div
            style={{
              margin: "0 0 24px",
              aspectRatio: "16 / 9",
              background: `#eee url(${event.coverImage}) center / cover no-repeat`,
            }}
            aria-label={copy.eventImage(event.title)}
          />
        )}
        <div style={styles.eyebrow}>{brandName}</div>
        <h1 style={styles.h1}>{event.title}</h1>
        {event.subtitle && (
          <p
            style={{
              fontSize: 18,
              color: "#444",
              marginTop: 0,
              marginBottom: 16,
            }}
          >
            {event.subtitle}
          </p>
        )}

        <div
          style={{
            display: "flex",
            gap: 24,
            flexWrap: "wrap",
            fontSize: 14,
            color: "#333",
            marginTop: 16,
            marginBottom: 32,
          }}
        >
          <div>
            <div style={{ fontSize: 10, letterSpacing: 2, color: "#666", textTransform: "uppercase" }}>
              {copy.date}
            </div>
            <div style={{ marginTop: 4, fontWeight: 600 }}>
              {formatEventDate(event.startsAt, locale)} ·{" "}
              {formatEventTime(event.startsAt, locale)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 2, color: "#666", textTransform: "uppercase" }}>
              {copy.venue}
            </div>
            <div style={{ marginTop: 4, fontWeight: 600 }}>{event.venue}</div>
            {event.address && (
              <div style={{ fontSize: 12, color: "#666" }}>{event.address}</div>
            )}
          </div>
          {event.doorsAt && (
            <div>
              <div style={{ fontSize: 10, letterSpacing: 2, color: "#666", textTransform: "uppercase" }}>
                {copy.doors}
              </div>
              <div style={{ marginTop: 4, fontWeight: 600 }}>
                {formatEventTime(event.doorsAt, locale)}
              </div>
            </div>
          )}
        </div>

        <div style={{ ...styles.card, whiteSpace: "pre-line", lineHeight: 1.6 }}>
          {event.description}
        </div>

        <h2 style={styles.h2}>{isPast ? copy.eventEnded : copy.reserveTicket}</h2>
        {!isPast && cancelled && (
          <div
            style={{
              padding: 12,
              background: "#fff3cd",
              border: "1px solid #856404",
              color: "#856404",
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            {copy.cancelledPayment}
          </div>
        )}
        {!isPast && error && <div style={styles.error}>{error}</div>}
        {isPast ? (
          <div style={styles.card}>
            <p style={{ margin: "0 0 20px", color: "#444", lineHeight: 1.6 }}>
              {copy.eventEndedBody}
            </p>
            <div style={styles.row}>
              <Link href="/bilheteira" style={styles.buttonSecondary}>
                {copy.backToTicketOffice}
              </Link>
              <Link href="/programacao" style={styles.buttonGhost}>
                {copy.viewProgramme}
              </Link>
            </div>
          </div>
        ) : (
          <div style={styles.card}>
            <form action={reserveAction} style={styles.form}>
            <input type="hidden" name="eventSlug" value={event.slug} />

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={styles.labelText}>{copy.tier}</div>
              {event.tiers.map((t) => (
                <label
                  key={t.id}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    padding: 14,
                    border: "1px solid #ccc",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="tierId"
                    value={t.id}
                    required
                    defaultChecked={t.id === preselectedTierId}
                    style={{ marginTop: 3 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <strong>{t.name}</strong>
                      <span style={{ fontWeight: 700 }}>
                        {formatPriceCents(t.priceCents, locale)}
                      </span>
                    </div>
                    {t.description && (
                      <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                        {t.description}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>

            <div style={styles.grid2}>
              <label style={styles.label}>
                <span style={styles.labelText}>{copy.name}</span>
                <input type="text" name="buyerName" autoComplete="name" required style={styles.input} />
              </label>
              <label style={styles.label}>
                <span style={styles.labelText}>Email</span>
                <input
                  type="email"
                  name="buyerEmail"
                  autoComplete="email"
                  required
                  style={styles.input}
                />
              </label>
            </div>
            <div style={styles.grid2}>
              <label style={styles.label}>
                <span style={styles.labelText}>{copy.phoneOptional}</span>
                <input type="tel" name="buyerPhone" autoComplete="tel" style={styles.input} />
              </label>
              <label style={styles.label}>
                <span style={styles.labelText}>{copy.seats}</span>
                <input
                  type="number"
                  name="seats"
                  autoComplete="off"
                  defaultValue={1}
                  min={1}
                  max={10}
                  required
                  style={styles.input}
                />
              </label>
            </div>

            <p style={{ fontSize: 12, color: "#666" }}>
              {copy.paymentTerms}
            </p>

            <p style={{ fontSize: 12, color: "#666" }}>
              {copy.privacyLead}{" "}
              <Link href="/privacidade" style={styles.link}>
                {copy.privacyLink}
              </Link>
              .
            </p>

            <button type="submit" style={styles.button}>
              {copy.continue}
            </button>
            </form>
          </div>
        )}
      </main>
    </Shell>
  );
}
