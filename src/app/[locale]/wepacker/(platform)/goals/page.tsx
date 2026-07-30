import { requirePageUser } from "@/lib/wepacker/page-guards";
import { getStrategicPlan } from "@/lib/wepacker/actions/plan";
import PlanPageClient from "./page-client";

export default async function PlanPage() {
  const user = await requirePageUser();
  const userId = user.id;

  const strategicPlan = await getStrategicPlan(userId);

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
        actions: strategicPlan.actions.map((a) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          dueAt: a.dueAt?.toISOString() ?? null,
          status: a.status,
          goalId: a.goalId,
          goal: a.goal,
        })),
      }
    : null;

  return (
    <PlanPageClient userId={userId} strategicPlan={serializedStrategicPlan} />
  );
}
