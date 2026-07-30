import { Link } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { getInstitutionalCopy } from "@/i18n/copy/institutional";
import { prisma } from "@/lib/db";
import { Shell, styles } from "../../ui";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const copy = getInstitutionalCopy(await getLocale()).ticketing;
  const { session_id } = await searchParams;

  if (!session_id) {
    redirect("/bilheteira");
  }

  const payment = await prisma.payment.findUnique({
    where: { providerRef: session_id },
    include: { ticket: true },
  });

  if (payment?.ticket) {
    redirect(`/bilheteira/ticket/${payment.ticket.id}?welcome=1`);
  }

  return (
    <Shell>
      <head>
        <meta httpEquiv="refresh" content="3" />
      </head>
      <main style={styles.narrow}>
        <div style={styles.eyebrow}>{copy.brand}</div>
        <h1 style={styles.h1}>{copy.processingPayment}</h1>
        <div style={styles.card}>
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            {copy.processingPaymentBody}
          </p>
          <p
            style={{
              marginTop: 12,
              color: "#666",
              fontSize: 13,
            }}
          >
            {copy.loading}
          </p>
        </div>
        <p style={{ fontSize: 13 }}>
          <Link href="/bilheteira" style={styles.link}>
            {copy.back}
          </Link>
        </p>
      </main>
    </Shell>
  );
}
