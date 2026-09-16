import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/wepacker/page-guards";
import { getTrails } from "@/lib/wepacker/actions/trail";
import { getMyContext } from "@/lib/wepacker/actions/user";
import TrailDetailPageClient from "./page-client";

export default async function TrailDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageUser();
  const { id } = await params;
  const { user } = await getMyContext();

  // getTrails already scopes to the actor's own trails via assertUserAccess;
  // find the one matching this id, or 404.
  const trails = await getTrails(user.id);
  const trail = trails.find((t) => t.id === id);
  if (!trail) notFound();

  const serializedTrail = {
    id: trail.id,
    title: trail.title,
    purpose: trail.purpose,
    whyItMatters: trail.whyItMatters,
    destination: trail.destination,
    areas: trail.areas,
    status: trail.status,
    createdAt: trail.createdAt.toISOString(),
    updatedAt: trail.updatedAt.toISOString(),
  };

  return <TrailDetailPageClient trail={serializedTrail} />;
}
