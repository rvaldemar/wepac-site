import { requirePageUser } from "@/lib/wepacker/page-guards";
import { getMyContext } from "@/lib/wepacker/actions/user";
import { getLifePlan } from "@/lib/wepacker/actions/plan";
import LifePlanPageClient from "./page-client";

export default async function LifePlanPage() {
  await requirePageUser();
  const { user, membership } = await getMyContext();

  if (!membership) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="font-barlow text-2xl font-bold text-wepac-white">
          Life Plan
        </h1>
        <p className="mt-4 max-w-md text-sm text-wepac-text-tertiary">
          A tua conta ainda não está associada a uma Journey — contacta a
          equipa WEPAC.
        </p>
      </div>
    );
  }

  const userId = user.id;
  const lifePlan = await getLifePlan(userId);

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

  return <LifePlanPageClient userId={userId} lifePlan={serializedLifePlan} />;
}
