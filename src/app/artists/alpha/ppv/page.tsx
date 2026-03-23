import { getCurrentUser } from "@/lib/actions/user";
import { getLifePlan } from "@/lib/actions/strategic";
import PPVPageClient from "./page-client";

export default async function PPVPage() {
  const user = await getCurrentUser();
  const plan = await getLifePlan(user.id);

  const serializedPlan = plan
    ? {
        whoIAm: plan.whoIAm,
        whereIAm: plan.whereIAm,
        whereIGo: plan.whereIGo,
        whyIDo: plan.whyIDo,
        commitments: plan.commitments,
        updatedAt: plan.updatedAt.toISOString(),
      }
    : null;

  return <PPVPageClient userId={user.id} plan={serializedPlan} />;
}
