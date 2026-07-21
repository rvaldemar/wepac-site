import { requirePageUser } from "@/lib/wepacker/page-guards";
import { getTrails } from "@/lib/wepacker/actions/trail";
import TrailsPageClient from "./page-client";

export default async function TrailsPage() {
  const user = await requirePageUser();
  const userId = user.id;
  const trails = await getTrails(userId);

  const serializedTrails = trails.map((t) => ({
    id: t.id,
    title: t.title,
    purpose: t.purpose,
    whyItMatters: t.whyItMatters,
    destination: t.destination,
    areas: t.areas,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  return <TrailsPageClient userId={userId} trails={serializedTrails} />;
}
