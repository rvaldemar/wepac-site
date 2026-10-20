import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { renderTicketEmail } from "@/lib/bilheteira/ticket-email";
import { SAMPLE_MERGE_VALUES } from "@/lib/bilheteira/email-merge";
import { sendTestTicketEmailAction } from "@/lib/bilheteira/landing-admin-actions";
import { toLisbonInput } from "@/lib/bilheteira/lisbon-time";
import { styles } from "../../../../../ui";
import { TierForm, type TierFormValues } from "./tier-form";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string; tierId: string }>;
  searchParams: Promise<{ error?: string; saved?: string; sentTest?: string }>;
};

function euros(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2).replace(/\.00$/, "").replace(".", ",");
}

export default async function TierEditPage({ params, searchParams }: Props) {
  const { id, tierId } = await params;
  const { error, saved, sentTest } = await searchParams;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) notFound();
  const isNew = tierId === "new";
  const tier = isNew ? null : await prisma.ticketTier.findFirst({ where: { id: tierId, eventId: id } });
  if (!isNew && !tier) notFound();

  const values: TierFormValues = {
    id: tier?.id ?? null,
    name: tier?.name ?? "",
    description: tier?.description ?? "",
    kind: tier?.kind ?? "single",
    price: euros(tier?.priceCents ?? null),
    quantity: tier?.quantity?.toString() ?? "",
    seatsPerUnit: tier?.seatsPerUnit?.toString() ?? "",
    minSeats: tier?.minSeats?.toString() ?? "",
    maxPerOrder: tier?.maxPerOrder?.toString() ?? "",
    phaseGroup: tier?.phaseGroup ?? "",
    phaseOrder: tier?.phaseOrder?.toString() ?? "",
    salesStartAt: toLisbonInput(tier?.salesStartAt),
    salesEndAt: toLisbonInput(tier?.salesEndAt),
    stateOverride: tier?.stateOverride ?? "auto",
    lockedNote: tier?.lockedNote ?? "",
    referencePrice: euros(tier?.referencePriceCents),
    ctaLabel: tier?.ctaLabel ?? "",
    ctaUrl: tier?.ctaUrl ?? "",
    waitlistEnabled: tier?.waitlistEnabled ?? false,
    section: tier?.section ?? "",
    featured: tier?.featured ?? false,
    hideUnitPrice: tier?.hideUnitPrice ?? false,
    emailNote: tier?.emailNote ?? "",
    emailCtaLabel: tier?.emailCtaLabel ?? "",
    emailCtaUrl: tier?.emailCtaUrl ?? "",
    stripePriceId: tier?.stripePriceId ?? "",
  };

  // Preview with sample buyer data: exactly what the buyer will receive,
  // including merge fields resolved and the event-wide note.
  const preview = tier
    ? renderTicketEmail({
        to: SAMPLE_MERGE_VALUES.email,
        buyerName: SAMPLE_MERGE_VALUES.nome,
        eventTitle: event.title,
        eventSubtitle: event.subtitle,
        startsAt: event.startsAt,
        venue: event.venue,
        tierName: tier.name,
        priceCents: tier.priceCents,
        totalCents: tier.priceCents * (tier.kind === "group" ? (tier.minSeats ?? 1) : 1),
        seats: tier.kind === "bundle" ? tier.seatsPerUnit : tier.kind === "group" ? (tier.minSeats ?? 1) : 1,
        ticketId: "exemplo",
        ticketSerial: Number(SAMPLE_MERGE_VALUES.bilhete),
        coverImage: event.coverImage,
        eventEmailNote: event.emailNote,
        tierEmailNote: tier.emailNote,
        emailCtaLabel: tier.emailCtaLabel,
        emailCtaUrl: tier.emailCtaUrl,
      })
    : null;

  return (
    <main style={styles.container}>
      <div style={styles.eyebrow}>
        <Link href={`/bilheteira/admin/events/${id}#bilhetes`} style={{ color: "#666" }}>
          ← {event.title}
        </Link>
      </div>
      <h1 style={styles.h1}>{isNew ? "Novo bilhete" : tier?.name}</h1>
      {error && <div style={{ ...styles.error, marginTop: 16 }}>{error}</div>}
      {saved && (
        <div style={{ marginTop: 16, padding: 12, background: "#e8f5e9", border: "1px solid #1b5e20", color: "#1b5e20", fontSize: 13 }}>
          Guardado.
        </div>
      )}
      {sentTest && (
        <div style={{ marginTop: 16, padding: 12, background: "#e8f5e9", border: "1px solid #1b5e20", color: "#1b5e20", fontSize: 13 }}>
          Email de teste enviado para o teu email.
        </div>
      )}

      <div style={{ ...styles.card, marginTop: 24 }}>
        <TierForm eventId={id} values={values} />
      </div>

      {preview && (
        <>
          <h2 style={styles.h2}>Pré-visualização do email de confirmação</h2>
          <p style={{ fontSize: 13, color: "#666", marginTop: -8 }}>
            Com dados de exemplo ({SAMPLE_MERGE_VALUES.nome}, bilhete n.º {SAMPLE_MERGE_VALUES.bilhete}). Guarda para
            atualizar. A nota geral do evento edita-se na página do evento.
          </p>
          <div style={{ ...styles.card, padding: 0 }}>
            <iframe
              title="Pré-visualização do email"
              srcDoc={preview.html}
              sandbox=""
              style={{ width: "100%", height: 820, border: 0, display: "block", background: "#fff" }}
            />
          </div>
          <form action={sendTestTicketEmailAction}>
            <input type="hidden" name="eventId" value={id} />
            <input type="hidden" name="tierId" value={tier!.id} />
            <button type="submit" style={styles.buttonSecondary}>
              Enviar email de teste para mim
            </button>
          </form>
        </>
      )}
    </main>
  );
}
