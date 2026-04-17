import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Shell, styles } from "../../ui";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: Props) {
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
        <div style={styles.eyebrow}>Bilheteira</div>
        <h1 style={styles.h1}>A confirmar pagamento…</h1>
        <div style={styles.card}>
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            O pagamento foi recebido. Estamos a emitir o bilhete e a enviar
            para o teu email.
          </p>
          <p
            style={{
              marginTop: 12,
              color: "#666",
              fontSize: 13,
            }}
          >
            Esta página actualiza automaticamente a cada 3 segundos. Se demorar
            mais de um minuto, verifica a caixa de entrada.
          </p>
        </div>
        <p style={{ fontSize: 13 }}>
          <Link href="/bilheteira" style={styles.link}>
            ← Voltar à bilheteira
          </Link>
        </p>
      </main>
    </Shell>
  );
}
