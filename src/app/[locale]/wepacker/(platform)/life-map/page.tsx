import { requirePageUser } from "@/lib/wepacker/page-guards";
import { getLifeMap, getLifeMapVersions } from "@/lib/wepacker/actions/plan";
import LifeMapPageClient from "./page-client";

export default async function LifeMapPage() {
  const user = await requirePageUser();
  const userId = user.id;
  const [lifeMap, versions] = await Promise.all([
    getLifeMap(userId),
    getLifeMapVersions(userId),
  ]);

  const serializedLifeMap = lifeMap
    ? {
        whoIAm: lifeMap.whoIAm,
        whereIAm: lifeMap.whereIAm,
        whereIGo: lifeMap.whereIGo,
        whyIDo: lifeMap.whyIDo,
        commitments: lifeMap.commitments,
        updatedAt: lifeMap.updatedAt.toISOString(),
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
    <LifeMapPageClient
      userId={userId}
      lifeMap={serializedLifeMap}
      versions={serializedVersions}
    />
  );
}
