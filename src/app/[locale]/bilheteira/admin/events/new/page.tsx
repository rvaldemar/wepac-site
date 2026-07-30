import { prisma } from "@/lib/db";
import { createEventAction } from "@/lib/bilheteira/event-actions";
import { styles } from "../../../ui";
import { EventFormClient } from "../event-form-client";
import { getLocale } from "next-intl/server";
import { getTicketAdminCopy } from "@/i18n/copy/institutional-admin";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NewEventPage({ searchParams }: Props) {
  const copy = getTicketAdminCopy(await getLocale()).newEvent;
  const { error } = await searchParams;
  const [departments, brands] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <main style={styles.container}>
      <div style={styles.eyebrow}>{copy.eyebrow}</div>
      <h1 style={styles.h1}>{copy.title}</h1>
      {error && <div style={styles.error}>{error}</div>}
      <div style={styles.card}>
        <EventFormClient
          action={createEventAction}
          departments={departments}
          brands={brands}
          defaults={null}
          submitLabel={copy.submit}
        />
      </div>
    </main>
  );
}
