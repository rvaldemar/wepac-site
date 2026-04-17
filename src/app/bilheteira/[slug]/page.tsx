import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { reserveAction } from "@/lib/bilheteira/reserve-action";
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
  searchParams: Promise<{ error?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) return { title: "Evento — WEPAC" };
  return {
    title: `${event.title} — WEPAC`,
    description: event.subtitle || event.description.slice(0, 160),
  };
}

export default async function EventPublicPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { error } = await searchParams;

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

  return (
    <Shell
      rightSlot={
        <Link href="/bilheteira" style={styles.buttonGhost}>
          ← Todos os eventos
        </Link>
      }
    >
      <main style={styles.container}>
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
              Data
            </div>
            <div style={{ marginTop: 4, fontWeight: 600 }}>
              {formatEventDate(event.startsAt)} · {formatEventTime(event.startsAt)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 2, color: "#666", textTransform: "uppercase" }}>
              Local
            </div>
            <div style={{ marginTop: 4, fontWeight: 600 }}>{event.venue}</div>
            {event.address && (
              <div style={{ fontSize: 12, color: "#666" }}>{event.address}</div>
            )}
          </div>
          {event.doorsAt && (
            <div>
              <div style={{ fontSize: 10, letterSpacing: 2, color: "#666", textTransform: "uppercase" }}>
                Portas
              </div>
              <div style={{ marginTop: 4, fontWeight: 600 }}>
                {formatEventTime(event.doorsAt)}
              </div>
            </div>
          )}
        </div>

        <div style={{ ...styles.card, whiteSpace: "pre-line", lineHeight: 1.6 }}>
          {event.description}
        </div>

        <h2 style={styles.h2}>Reservar bilhete</h2>
        {error && <div style={styles.error}>{error}</div>}
        <div style={styles.card}>
          <form action={reserveAction} style={styles.form}>
            <input type="hidden" name="eventSlug" value={event.slug} />

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={styles.labelText}>Tier</div>
              {event.tiers.map((t, i) => (
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
                    defaultChecked={i === 0}
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
                        {formatPriceCents(t.priceCents)}
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
                <span style={styles.labelText}>Nome</span>
                <input type="text" name="buyerName" required style={styles.input} />
              </label>
              <label style={styles.label}>
                <span style={styles.labelText}>Email</span>
                <input
                  type="email"
                  name="buyerEmail"
                  required
                  style={styles.input}
                />
              </label>
            </div>
            <div style={styles.grid2}>
              <label style={styles.label}>
                <span style={styles.labelText}>Telefone (opcional)</span>
                <input type="tel" name="buyerPhone" style={styles.input} />
              </label>
              <label style={styles.label}>
                <span style={styles.labelText}>Lugares</span>
                <input
                  type="number"
                  name="seats"
                  defaultValue={1}
                  min={1}
                  max={10}
                  required
                  style={styles.input}
                />
              </label>
            </div>

            <p style={{ fontSize: 12, color: "#666" }}>
              As reservas pagas são liquidadas à entrada do evento. O bilhete é
              enviado por email e pode ser apresentado no telemóvel ou impresso.
            </p>

            <button type="submit" style={styles.button}>
              Confirmar reserva
            </button>
          </form>
        </div>
      </main>
    </Shell>
  );
}
