import { requirePageUser } from "@/lib/wepacker/page-guards";
import { getLifePlan, getLifePlanVersions } from "@/lib/wepacker/actions/plan";
import LifePlanPageClient from "./page-client";

export default async function LifePlanPage() {
  const user = await requirePageUser();
  const userId = user.id;
  const [lifePlan, versions] = await Promise.all([
    getLifePlan(userId),
    getLifePlanVersions(userId),
  ]);

  const serializedLifePlan = lifePlan
    ? {
        whoIAm: lifePlan.whoIAm,
        whereIAm: lifePlan.whereIAm,
        whereIGo: lifePlan.whereIGo,
        whyIDo: lifePlan.whyIDo,
        commitments: lifePlan.commitments,
        updatedAt: lifePlan.updatedAt.toISOString(),
      }
    : null;

  const serializedVersions = versions.map((v) => ({
    id: v.id,
    whoIAm: v.whoIAm,
    whereIAm: v.whereIAm,
    whereIGo: v.whereIGo,
    whyIDo: v.whyIDo,
    commitments: v.commitments,
    createdAt: v.createdAt.toISOString(),
  }));

  return (
    <LifePlanPageClient
      userId={userId}
      lifePlan={serializedLifePlan}
      versions={serializedVersions}
    />
  );
}
