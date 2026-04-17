import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  updateEventAction,
  addTierAction,
  deleteTierAction,
  createManualTicketAction,
  checkInTicketAction,
  deleteTicketAction,
} from "@/lib/bilheteira/event-actions";
import {
  styles,
  formatPriceCents,
  formatEventDate,
  formatEventTime,
} from "../../../ui";
import { EventFormClient } from "../event-form-client";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function EventAdminPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error, saved } = await searchParams;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      department: true,
      brand: true,
      tiers: { orderBy: { sortOrder: "asc" } },
      tickets: {
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

  return (
    <main style={styles.container}>
      <div style={styles.eyebrow}>
        <Link href="/bilheteira/admin" style={{ color: "#666" }}>
          ← Eventos
        </Link>
      </div>
      <h1 style={styles.h1}>{event.title}</h1>
      <div style={{ ...styles.eyebrow, marginBottom: 0 }}>
        {event.department.name}
        {event.brand && ` · ${event.brand.name}`} ·{" "}
        {formatEventDate(event.startsAt)} · {formatEventTime(event.startsAt)}
      </div>
      <div style={{ marginTop: 12 }}>
        <span style={styles.pill}>{event.status}</span>{" "}
        <Link href={`/bilheteira/${event.slug}`} style={styles.buttonGhost}>
          Ver página pública ↗
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
          Alterações guardadas.
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
        <Stat label="Bilhetes" value={totalTickets} />
        <Stat label="Lugares" value={totalSeats} />
        <Stat label="Admitidos" value={checkedIn} color="#1b5e20" />
        <Stat label="Lug. in" value={checkedInSeats} color="#1b5e20" />
        <Stat label="Receita" value={formatPriceCents(revenueCents)} />
      </div>

      <h2 style={styles.h2}>Detalhes do evento</h2>
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
            status: event.status,
          }}
          submitLabel="Guardar alterações"
        />
      </div>

      <h2 style={styles.h2}>Tiers</h2>
      <div style={styles.card}>
        {event.tiers.length === 0 && (
          <p style={{ color: "#666" }}>Sem tiers configuradas.</p>
        )}
        {event.tiers.length > 0 && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nome</th>
                <th style={styles.th}>Descrição</th>
                <th style={styles.th}>Preço</th>
                <th style={styles.th}>Limite</th>
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
                  <td style={styles.td}>{formatPriceCents(t.priceCents)}</td>
                  <td style={styles.td}>{t.quantity ?? "—"}</td>
                  <td style={{ ...styles.td, textAlign: "right" }}>
                    <form action={deleteTierAction} style={{ margin: 0 }}>
                      <input type="hidden" name="id" value={t.id} />
                      <input
                        type="hidden"
                        name="eventId"
                        value={event.id}
                      />
                      <button type="submit" style={styles.buttonDanger}>
                        Apagar
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
          <div style={styles.labelText}>Adicionar tier</div>
          <div style={styles.grid2}>
            <input
              type="text"
              name="name"
              placeholder="Nome"
              required
              style={styles.input}
            />
            <input
              type="text"
              name="price"
              placeholder="Preço em €"
              inputMode="decimal"
              style={styles.input}
            />
          </div>
          <div style={styles.grid2}>
            <input
              type="text"
              name="description"
              placeholder="Descrição (opcional)"
              style={styles.input}
            />
            <input
              type="number"
              name="quantity"
              placeholder="Limite de unidades (opcional)"
              style={styles.input}
            />
          </div>
          <button type="submit" style={{ ...styles.buttonSecondary }}>
            Adicionar tier
          </button>
        </form>
      </div>

      <h2 style={styles.h2}>Bilhetes emitidos</h2>
      <div style={styles.card}>
        {event.tickets.length === 0 && (
          <p style={{ color: "#666" }}>Sem bilhetes ainda.</p>
        )}
        {event.tickets.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Serial</th>
                  <th style={styles.th}>Tier</th>
                  <th style={styles.th}>Comprador</th>
                  <th style={{ ...styles.th, textAlign: "center" }}>Lug.</th>
                  <th style={{ ...styles.th, textAlign: "center" }}>
                    Admitido
                  </th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {event.tickets.map((t) => (
                  <tr
                    key={t.id}
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
                        ? `✓ ${new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit" }).format(t.checkedInAt)}`
                        : "—"}
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
                          Ver
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
                            {t.checkedInAt ? "Anular" : "Admitir"}
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
            <div style={styles.labelText}>Emitir bilhete manual</div>
            <div style={styles.grid2}>
              <input
                type="text"
                name="buyerName"
                placeholder="Nome do comprador"
                required
                style={styles.input}
              />
              <input
                type="email"
                name="buyerEmail"
                placeholder="Email (opcional)"
                style={styles.input}
              />
            </div>
            <div style={styles.grid2}>
              <select name="tierId" required style={styles.select}>
                {event.tiers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {formatPriceCents(t.priceCents)}
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
            <button type="submit" style={styles.buttonSecondary}>
              Emitir bilhete
            </button>
          </form>
        )}
      </div>
    </main>
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
