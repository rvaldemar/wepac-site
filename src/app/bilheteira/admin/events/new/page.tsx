import { prisma } from "@/lib/db";
import { createEventAction } from "@/lib/bilheteira/event-actions";
import { styles } from "../../../ui";
import { EventFormClient } from "../event-form-client";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NewEventPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const [departments, brands] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <main style={styles.container}>
      <div style={styles.eyebrow}>Admin · Eventos</div>
      <h1 style={styles.h1}>Novo evento</h1>
      {error && <div style={styles.error}>{error}</div>}
      <div style={styles.card}>
        <EventFormClient
          action={createEventAction}
          departments={departments}
          brands={brands}
          defaults={null}
          submitLabel="Criar evento"
        />
      </div>
    </main>
  );
}
