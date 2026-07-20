import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CheckinScanner } from "./scanner";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CheckinPage({ params }: Props) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      tickets: {
        select: { checkedInAt: true },
      },
    },
  });
  if (!event) notFound();

  const totalTickets = event.tickets.length;
  const checkedInCount = event.tickets.filter((t) => t.checkedInAt).length;

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "#fafaf7",
        padding: "16px 16px 40px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <Link
            href={`/bilheteira/admin/events/${id}`}
            style={{
              fontSize: 13,
              color: "#555",
              textDecoration: "none",
              padding: "6px 10px",
              background: "#eee",
              borderRadius: 5,
            }}
          >
            ← Admin
          </Link>
          <div>
            <div
              style={{
                fontFamily: "'Barlow', sans-serif",
                fontWeight: 900,
                fontSize: 16,
                letterSpacing: 0.3,
                lineHeight: 1.2,
              }}
            >
              {event.title}
            </div>
            <div style={{ fontSize: 11, color: "#888", letterSpacing: 1, textTransform: "uppercase" }}>
              Modo Check-in
            </div>
          </div>
        </div>

        <CheckinScanner
          eventId={id}
          eventTitle={event.title}
          totalTickets={totalTickets}
          checkedInCount={checkedInCount}
        />
      </div>
    </main>
  );
}
