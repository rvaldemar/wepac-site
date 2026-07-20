import { requirePageUser } from "@/lib/wepacker/page-guards";
import { getMyContext } from "@/lib/wepacker/actions/user";
import { getLifePlan, getStrategicPlan } from "@/lib/wepacker/actions/plan";
import PlanPageClient from "./page-client";

export default async function PlanPage() {
  await requirePageUser();
  const { membership } = await getMyContext();

  if (!membership) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="font-barlow text-2xl font-bold text-wepac-white">Plano</h1>
        <p className="mt-4 max-w-md text-sm text-wepac-text-tertiary">
          A tua conta ainda não está associada a uma Journey — contacta a
          equipa WEPAC.
        </p>
      </div>
    );
  }

  const membershipId = membership.membershipId;

  const [lifePlan, strategicPlan] = await Promise.all([
    getLifePlan(membershipId),
    getStrategicPlan(membershipId),
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

  const serializedStrategicPlan = strategicPlan
    ? {
        id: strategicPlan.id,
        quarter: strategicPlan.quarter,
        longTermVision: strategicPlan.longTermVision,
        positioning: strategicPlan.positioning,
        focusAreas: strategicPlan.focusAreas,
        quarterlyReflection: strategicPlan.quarterlyReflection,
        goals: strategicPlan.goals.map((g) => ({
          id: g.id,
          title: g.title,
          description: g.description,
          scope: g.scope,
          status: g.status,
          successCriteria: g.successCriteria,
          deadline: g.deadline,
        })),
        monthlyActions: strategicPlan.monthlyActions.map((a) => ({
          id: a.id,
          title: a.title,
          month: a.month,
          deadline: a.deadline,
          status: a.status,
          goalId: a.goalId,
        })),
      }
    : null;

  return (
    <PlanPageClient
      membershipId={membershipId}
      domainLabel={membership.domainLabel}
      lifePlan={serializedLifePlan}
      strategicPlan={serializedStrategicPlan}
    />
  );
}
