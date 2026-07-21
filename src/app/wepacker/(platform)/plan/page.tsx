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
    <PlanPageClient userId={userId} strategicPlan={serializedStrategicPlan} />
  );
}
