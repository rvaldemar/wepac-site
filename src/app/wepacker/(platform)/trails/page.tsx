import { requirePageUser } from "@/lib/wepacker/page-guards";
import { getMyContext } from "@/lib/wepacker/actions/user";
import { getTrails } from "@/lib/wepacker/actions/trail";
import TrailsPageClient from "./page-client";

export default async function TrailsPage() {
  await requirePageUser();
  const { user, membership } = await getMyContext();

  if (!membership) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="font-barlow text-2xl font-bold text-wepac-white">Trails</h1>
        <p className="mt-4 max-w-md text-sm text-wepac-text-tertiary">
          A tua conta ainda não está associada a uma Journey — contacta a
          equipa WEPAC.
        </p>
      </div>
    );
  }

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
