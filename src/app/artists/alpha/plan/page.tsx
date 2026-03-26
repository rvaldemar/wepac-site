import { getCurrentUser } from "@/lib/actions/user";
import { getStrategicPlan } from "@/lib/actions/strategic";
import PlanPageClient from "./page-client";

export default async function PlanPage() {
 const user = await getCurrentUser();
 const plan = await getStrategicPlan(user.id);

 const serializedPlan = plan
  ? {
    quarter: plan.quarter,
    longTermVision: plan.longTermVision,
    positioning: plan.positioning,
    focusAreas: plan.focusAreas as import("@/lib/types/artist").AreaKey[],
    quarterlyReflection: plan.quarterlyReflection,
    goals: plan.goals.map((g) => ({
     id: g.id,
     title: g.title,
     description: g.description,
     scope: g.scope,
     status: g.status,
     successCriteria: g.successCriteria,
     deadline: g.deadline,
    })),
    monthlyActions: plan.monthlyActions.map((a) => ({
     id: a.id,
     title: a.title,
     month: a.month,
     deadline: a.deadline,
     status: a.status,
     goalId: a.goalId,
    })),
   }
  : null;

 return <PlanPageClient plan={serializedPlan} />;
}
