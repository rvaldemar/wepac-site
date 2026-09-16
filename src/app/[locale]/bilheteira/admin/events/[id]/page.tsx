import { Fragment } from "react";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import {
  updateEventAction,
  addTierAction,
  deleteTierAction,
  updateTierStripePriceAction,
  createManualTicketAction,
  checkInTicketAction,
  deleteTicketAction,
} from "@/lib/bilheteira/event-actions";
import {
  uploadEventCoverAction,
  removeEventCoverAction,
} from "@/lib/bilheteira/upload-actions";
import {
  styles,
  formatPriceCents,
  formatEventDate,
  formatEventTime,
} from "../../../ui";
import { EventFormClient } from "../event-form-client";
import { TicketView } from "../../../ticket/[id]/ticket-view";
import { CapelaVivaTicketView } from "../../../ticket/[id]/capela-viva-view";
import { getLocale } from "next-intl/server";
import { getTicketAdminCopy } from "@/i18n/copy/institutional-admin";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function EventAdminPage({ params, searchParams }: Props) {
  const locale = await getLocale();
  const adminCopy = getTicketAdminCopy(locale);
  const copy = adminCopy.detail;
  const { id } = await params;
  const { error, saved } = await searchParams;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      department: true,
      brand: true,
      tiers: { orderBy: { sortOrder: "asc" } },
      tickets: {
        include: {
          tier: true,
          checkLogs: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      },
      payments: {
        include: { tier: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!event) notFound();

  const [departments, brands] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  const totalTickets = event.tickets.length;
  const totalSeats = event.tickets.reduce((a, t) => a + t.seats, 0);
  const checkedIn = event.tickets.filter((t) => t.checkedInAt).length;
  const checkedInSeats = event.tickets
    .filter((t) => t.checkedInAt)
    .reduce((a, t) => a + t.seats, 0);
  const revenueCents = event.tickets.reduce(
    (a, t) => a + t.priceCents * t.seats,
    0
  );
  const paidRevenueCents = event.payments
    .filter((p) => p.status === "completed")
    .reduce((a, p) => a + p.amountCents, 0);
  const pendingPayments = event.payments.filter(
    (p) => p.status === "pending"
  ).length;

  // Pre-generate QR codes for each ticket (for client-side download)
  const base = process.env.APP_URL || "https://wepac.pt";
  const ticketQRs: Record<string, string> = {};
  await Promise.all(
    event.tickets.map(async (t) => {
      const url = `${base}/bilheteira/ticket/${t.id}`;
      ticketQRs[t.id] = await QRCode.toString(url, {
        type: "svg",
        margin: 0,
        width: 80,
        color: { dark: "#000000", light: "#00000000" },
      });
    })
  );

  return (
    <main style={styles.container}>
      <div style={styles.eyebrow}>
        <Link href="/bilheteira/admin" style={{ color: "#666" }}>
          {copy.back}
        </Link>
      </div>
      <h1 style={styles.h1}>{event.title}</h1>
      <div style={{ ...styles.eyebrow, marginBottom: 0 }}>
        {event.department.name}
        {event.brand && ` · ${event.brand.name}`} ·{" "}
        {formatEventDate(event.startsAt, locale)} ·{" "}
        {formatEventTime(event.startsAt, locale)}
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={styles.pill}>
          {adminCopy.dashboard.statusLabels[event.status] ?? event.status}
        </span>{" "}
        <Link href={`/bilheteira/${event.slug}`} style={styles.buttonGhost}>
          {copy.publicPage}
        </Link>
        <Link
          href={`/bilheteira/admin/events/${id}/checkin`}
          style={{
            ...styles.buttonSecondary,
            background: "#1b5e20",
            color: "#fff",
            padding: "6px 14px",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {copy.checkinMode}
        </Link>
      </div>

      {error && <div style={{ ...styles.error, marginTop: 16 }}>{error}</div>}
      {saved && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: "#e8f5e9",
            border: "1px solid #1b5e20",
            color: "#1b5e20",
            fontSize: 13,
          }}
        >
          {copy.saved}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 12,
          marginTop: 24,
          padding: "20px 16px",
          background: "#fafaf7",
          border: "1px solid #e5e3de",
        }}
      >
        <Stat label={copy.tickets} value={totalTickets} />
        <Stat label={copy.seats} value={totalSeats} />
        <Stat label={copy.admitted} value={checkedIn} color="#1b5e20" />
        <Stat label={copy.admittedSeats} value={checkedInSeats} color="#1b5e20" />
        <Stat
          label={copy.revenue}
          value={formatPriceCents(revenueCents, locale)}
        />
      </div>

      <h2 style={styles.h2}>{copy.eventDetails}</h2>
      <div style={styles.card}>
        <EventFormClient
          action={updateEventAction}
          departments={departments}
          brands={brands}
          defaults={{
            id: event.id,
            title: event.title,
            subtitle: event.subtitle,
            description: event.description,
            departmentId: event.departmentId,
            brandId: event.brandId,
            venue: event.venue,
            address: event.address,
            startsAt: event.startsAt,
            doorsAt: event.doorsAt,
            durationMinutes: event.durationMinutes,
            capacity: event.capacity,
            coverImage: event.coverImage,
            ticketNote: event.ticketNote,
            status: event.status,
          }}
          submitLabel={copy.saveChanges}
        />
      </div>

      <h2 style={styles.h2}>{copy.ticketPreview}</h2>
      <div style={styles.card}>
        <p style={{ fontSize: 12, color: "#666", marginBottom: 16 }}>
          {copy.previewBody}
        </p>
        <TicketPreview event={event} />
      </div>

      <h2 style={styles.h2}>{copy.coverImage}</h2>
      <div style={styles.card}>
        {event.coverImage ? (
          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "flex-start",
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.coverImage}
              alt={copy.currentImageAlt}
              style={{
                maxWidth: 260,
                maxHeight: 180,
                objectFit: "cover",
                border: "1px solid #ccc",
              }}
            />
            <div style={{ flex: 1, minWidth: 220 }}>
              <div
                style={{ fontSize: 12, color: "#666", wordBreak: "break-all" }}
              >
                {event.coverImage}
              </div>
              <form
                action={removeEventCoverAction}
                style={{ margin: "12px 0 0 0" }}
              >
                <input type="hidden" name="eventId" value={event.id} />
                <button type="submit" style={styles.buttonDanger}>
                  {copy.removeImage}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <p style={{ color: "#666", marginBottom: 16 }}>
            {copy.noCover}
          </p>
        )}
        <form
          action={uploadEventCoverAction}
          style={{ ...styles.form, gap: 10 }}
        >
          <input type="hidden" name="eventId" value={event.id} />
          <label style={styles.label}>
            <span style={styles.labelText}>
              {copy.uploadImage}
            </span>
            <input
              type="file"
              name="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              required
              style={{ ...styles.input, padding: 8 }}
            />
          </label>
          <button type="submit" style={styles.buttonSecondary}>
            {copy.sendImage}
          </button>
        </form>
      </div>

      <h2 style={styles.h2}>{copy.tiers}</h2>
      <div style={styles.card}>
        {event.tiers.length === 0 && (
          <p style={{ color: "#666" }}>{copy.noTiers}</p>
        )}
        {event.tiers.length > 0 && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>{copy.name}</th>
                <th style={styles.th}>{copy.description}</th>
                <th style={styles.th}>{copy.price}</th>
                <th style={styles.th}>{copy.limit}</th>
                <th style={styles.th}>Stripe Price ID</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {event.tiers.map((t) => (
                <tr key={t.id}>
                  <td style={styles.td}>
                    <strong>{t.name}</strong>
                  </td>
                  <td style={{ ...styles.td, color: "#666" }}>
                    {t.description || "—"}
                  </td>
                  <td style={styles.td}>
                    {formatPriceCents(t.priceCents, locale)}
                  </td>
                  <td style={styles.td}>{t.quantity ?? "—"}</td>
                  <td style={styles.td}>
                    <form
                      action={updateTierStripePriceAction}
                      style={{
                        display: "flex",
                        gap: 4,
                        alignItems: "center",
                      }}
                    >
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="eventId" value={event.id} />
                      <input
                        type="text"
                        name="stripePriceId"
                        defaultValue={t.stripePriceId || ""}
                        placeholder="price_..."
                        style={{
                          ...styles.input,
                          fontFamily: "ui-monospace, Menlo, monospace",
                          fontSize: 12,
                          padding: "6px 8px",
                          minWidth: 180,
                        }}
                      />
                      <button
                        type="submit"
                        style={{
                          ...styles.buttonGhost,
                          padding: "6px 10px",
                          fontSize: 10,
                        }}
                      >
                        {copy.save}
                      </button>
                    </form>
                  </td>
                  <td style={{ ...styles.td, textAlign: "right" }}>
                    <form action={deleteTierAction} style={{ margin: 0 }}>
                      <input type="hidden" name="id" value={t.id} />
                      <input
                        type="hidden"
                        name="eventId"
                        value={event.id}
                      />
                      <button type="submit" style={styles.buttonDanger}>
                        {copy.delete}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <form
          action={addTierAction}
          style={{ ...styles.form, marginTop: 20, gap: 10 }}
        >
          <input type="hidden" name="eventId" value={event.id} />
          <div style={styles.labelText}>{copy.addTier}</div>
          <div style={styles.grid2}>
            <input
              type="text"
              name="name"
              placeholder={copy.tierNamePlaceholder}
              required
              style={styles.input}
            />
            <input
              type="text"
              name="price"
              placeholder={copy.tierPricePlaceholder}
              inputMode="decimal"
              style={styles.input}
            />
          </div>
          <div style={styles.grid2}>
            <input
              type="text"
              name="description"
              placeholder={copy.tierDescriptionPlaceholder}
              style={styles.input}
            />
            <input
              type="number"
              name="quantity"
              placeholder={copy.tierQuantityPlaceholder}
              style={styles.input}
            />
          </div>
          <input
            type="text"
            name="stripePriceId"
            placeholder={copy.stripePricePlaceholder}
            style={{
              ...styles.input,
              fontFamily: "ui-monospace, Menlo, monospace",
              fontSize: 13,
            }}
          />
          <button type="submit" style={{ ...styles.buttonSecondary }}>
            {copy.addTier}
          </button>
        </form>
      </div>

      <h2 style={styles.h2}>{copy.payments}</h2>
      <div style={styles.card}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <Stat
            label={copy.receivedStripe}
            value={formatPriceCents(paidRevenueCents, locale)}
            color="#1b5e20"
          />
          <Stat
            label={copy.pendingPayments}
            value={pendingPayments}
            color={pendingPayments > 0 ? "#b26a00" : undefined}
          />
          <Stat
            label={copy.totalPayments}
            value={event.payments.length}
          />
        </div>

        {event.payments.length === 0 ? (
          <p style={{ color: "#666" }}>{copy.noPayments}</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>{copy.date}</th>
                  <th style={styles.th}>{copy.buyer}</th>
                  <th style={styles.th}>{copy.tier}</th>
                  <th style={{ ...styles.th, textAlign: "center" }}>{copy.shortSeats}</th>
                  <th style={styles.th}>{copy.amount}</th>
                  <th style={styles.th}>{copy.status}</th>
                </tr>
              </thead>
              <tbody>
                {event.payments.map((p) => (
                  <tr key={p.id}>
                    <td
                      style={{ ...styles.td, fontSize: 12, color: "#666" }}
                    >
                      {new Intl.DateTimeFormat(locale, {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(p.createdAt)}
                    </td>
                    <td style={styles.td}>
                      {p.buyerName}
                      <div style={{ fontSize: 11, color: "#666" }}>
                        {p.buyerEmail}
                      </div>
                    </td>
                    <td style={styles.td}>{p.tier.name}</td>
                    <td style={{ ...styles.td, textAlign: "center" }}>
                      {p.seats}
                    </td>
                    <td style={styles.td}>
                      {formatPriceCents(p.amountCents, locale)}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.pill,
                          background:
                            p.status === "completed"
                              ? "#c8e6c9"
                              : p.status === "pending"
                                ? "#fff3cd"
                                : p.status === "expired" ||
                                    p.status === "failed"
                                  ? "#ffcdd2"
                                  : "#DEE0DB",
                        }}
                      >
                        {adminCopy.dashboard.paymentStatusLabels[p.status] ??
                          p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <h2 style={styles.h2}>{copy.issuedTickets}</h2>
      <div style={styles.card}>
        {event.tickets.length === 0 && (
          <p style={{ color: "#666" }}>{copy.noTickets}</p>
        )}
        {event.tickets.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>{copy.serial}</th>
                  <th style={styles.th}>{copy.tier}</th>
                  <th style={styles.th}>{copy.buyer}</th>
                  <th style={{ ...styles.th, textAlign: "center" }}>{copy.shortSeats}</th>
                  <th style={{ ...styles.th, textAlign: "center" }}>
                    {copy.admitted}
                  </th>
                  <th style={{ ...styles.th, textAlign: "center" }}>{copy.qr}</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {event.tickets.map((t) => (
                  <Fragment key={t.id}>
                    <tr
                      style={{
                        background: t.checkedInAt ? "#f1f8e9" : "transparent",
                      }}
                    >
                      <td
                        style={{
                          ...styles.td,
                          fontFamily: "'Barlow', sans-serif",
                          fontWeight: 700,
                          letterSpacing: 1,
                        }}
                      >
                        BT-{String(t.serial).padStart(3, "0")}
                      </td>
                      <td style={styles.td}>{t.tier.name}</td>
                      <td style={styles.td}>
                        <div>{t.buyerName}</div>
                        <div style={{ fontSize: 11, color: "#666" }}>
                          {t.buyerEmail}
                        </div>
                        {t.buyerPhone && (
                          <div style={{ fontSize: 11, color: "#666" }}>
                            {t.buyerPhone}
                          </div>
                        )}
                      </td>
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        {t.seats}
                      </td>
                      <td
                        style={{
                          ...styles.td,
                          textAlign: "center",
                          color: t.checkedInAt ? "#1b5e20" : "#999",
                          fontWeight: t.checkedInAt ? 700 : 400,
                        }}
                      >
                        {t.checkedInAt
                          ? `✓ ${new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Lisbon" }).format(t.checkedInAt)}`
                          : "—"}
                      </td>
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        <div
                          style={{ width: 48, height: 48, display: "inline-block" }}
                          dangerouslySetInnerHTML={{ __html: ticketQRs[t.id] || "" }}
                          title={copy.qrTitle(t.buyerName)}
                        />
                      </td>
                      <td
                        style={{
                          ...styles.td,
                          textAlign: "right",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <div
                          style={{
                            display: "inline-flex",
                            gap: 6,
                            flexWrap: "wrap",
                            justifyContent: "flex-end",
                          }}
                        >
                          <a
                            href={`/bilheteira/ticket/${t.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.buttonGhost}
                          >
                            {copy.view}
                          </a>
                          <a
                            href={`/bilheteira/ticket/${t.id}/qr`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.buttonGhost}
                          >
                            QR
                          </a>
                          <form
                            action={checkInTicketAction}
                            style={{ margin: 0 }}
                          >
                            <input type="hidden" name="id" value={t.id} />
                            <input
                              type="hidden"
                              name="eventId"
                              value={event.id}
                            />
                            <button type="submit" style={styles.buttonGhost}>
                              {t.checkedInAt ? copy.undo : copy.admit}
                            </button>
                          </form>
                          <form
                            action={deleteTicketAction}
                            style={{ margin: 0 }}
                          >
                            <input type="hidden" name="id" value={t.id} />
                            <input
                              type="hidden"
                              name="eventId"
                              value={event.id}
                            />
                            <button type="submit" style={styles.buttonDanger}>
                              ✕
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                    {t.checkLogs.length > 0 && (
                      <tr
                        key={`${t.id}-log`}
                        style={{ background: t.checkedInAt ? "#f1f8e9" : "#fafaf7" }}
                      >
                        <td
                          colSpan={7}
                          style={{
                            ...styles.td,
                            paddingTop: 2,
                            paddingBottom: 6,
                            fontSize: 11,
                            color: "#666",
                          }}
                        >
                          {t.checkLogs.map((log, i) => (
                            <span key={i} style={{ marginRight: 12 }}>
                              <span
                                style={{
                                  fontWeight: 700,
                                  color: log.action === "checkin" ? "#1b5e20" : "#c62828",
                                }}
                              >
                                {log.action === "checkin" ? "✓ check-in" : "↩ check-out"}
                              </span>{" "}
                              {new Intl.DateTimeFormat(locale, {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                                timeZone: "Europe/Lisbon",
                              }).format(log.createdAt)}
                            </span>
                          ))}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {event.tiers.length > 0 && (
          <form
            action={createManualTicketAction}
            style={{ ...styles.form, marginTop: 20, gap: 10 }}
          >
            <input type="hidden" name="eventId" value={event.id} />
            <div style={styles.labelText}>{copy.issueManual}</div>
            <div style={styles.grid2}>
              <input
                type="text"
                name="buyerName"
                placeholder={copy.buyerName}
                required
                style={styles.input}
              />
              <input
                type="email"
                name="buyerEmail"
                placeholder={copy.emailOptional}
                style={styles.input}
              />
            </div>
            <div style={styles.grid2}>
              <input
                type="tel"
                name="buyerPhone"
                placeholder={copy.phoneOptional}
                style={styles.input}
              />
              <div />
            </div>
            <div style={styles.grid2}>
              <select name="tierId" required style={styles.select}>
                {event.tiers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {formatPriceCents(t.priceCents, locale)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                name="seats"
                defaultValue={1}
                min={1}
                max={20}
                style={styles.input}
              />
            </div>
            <label
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                fontSize: 13,
                color: "#444",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                name="marketingConsent"
                style={{ marginTop: 2, flexShrink: 0 }}
              />
              <span>
                {copy.marketingConsent}
              </span>
            </label>
            <button type="submit" style={styles.buttonSecondary}>
              {copy.issueTicket}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

type PreviewEvent = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  startsAt: Date;
  doorsAt: Date | null;
  venue: string;
  address: string | null;
  coverImage: string | null;
  ticketNote: string | null;
  department: { name: string };
  brand: { name: string; slug: string } | null;
  tiers: { name: string; priceCents: number }[];
};

async function TicketPreview({ event }: { event: PreviewEvent }) {
  const copy = getTicketAdminCopy(await getLocale()).detail;
  const base = process.env.APP_URL || "https://wepac.pt";
  const previewUrl = `${base}/bilheteira/${event.slug}`;
  const qrSvg = await QRCode.toString(previewUrl, {
    type: "svg",
    margin: 0,
    color: { dark: "#000000", light: "#00000000" },
  });
  const firstTier = event.tiers[0];
  const tierName = firstTier?.name || copy.fallbackTier;
  const priceCents = firstTier?.priceCents ?? 0;
  const brandName = event.brand?.name || event.department.name;

  const common = {
    tierName,
    buyerName: copy.previewBuyer,
    seats: 1,
    priceCents,
    serialCode: "BT-001",
    qrSvg,
    startsAt: event.startsAt,
    doorsAt: event.doorsAt,
    venue: event.venue,
    address: event.address,
    checkedInAt: null,
    welcome: false,
    coverImage: event.coverImage,
  };

  if (event.brand?.slug === "capela-viva") {
    return (
      <CapelaVivaTicketView
        {...common}
        eventTitle={event.title}
        eventSubtitle={event.subtitle}
        ticketNote={event.ticketNote}
      />
    );
  }
  return (
    <TicketView
      {...common}
      eventTitle={event.title}
      eventSubtitle={event.subtitle}
      brandName={brandName}
    />
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontFamily: "'Barlow', sans-serif",
          fontWeight: 900,
          fontSize: 24,
          letterSpacing: "-0.5px",
          lineHeight: 1,
          color: color || "#000",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 9,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: "#666",
          marginTop: 6,
        }}
      >
        {label}
      </div>
    </div>
  );
}
