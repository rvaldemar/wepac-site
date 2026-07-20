import { requirePageRole } from "@/lib/wepacker/page-guards";
import { getMembershipDetail } from "@/lib/wepacker/actions/admin";
import { computeAreaScores, getEvaluations } from "@/lib/wepacker/actions/evaluation";
import {
  getLifePlan,
  getStrategicPlan,
  getStrategicMapScores,
} from "@/lib/wepacker/actions/plan";
import { getTasksForMembership } from "@/lib/wepacker/actions/task";
import { AREA_KEYS, AREA_LABELS, type AreaKey } from "@/lib/wepacker/types";
import { MentorMemberDetailClient } from "./page-client";

// Dates coming out of Prisma need to cross the server/client boundary as
// plain JSON — this round-trip turns every Date into an ISO string. The
// client-side props are typed with `string` dates, so the return type is
// intentionally loose here.
function serialize(data: unknown): any {
  return JSON.parse(JSON.stringify(data));
}

type AreaScoreAvg = { selfAvg: number; mentorAvg: number; composite: number };

export default async function MentorMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageRole(["mentor", "admin"]);
  const { id } = await params;

  const detail = await getMembershipDetail(id);
  // Evaluations/plans/Life Plan hang on the person, not the membership — one
  // diagnosis/Life Plan history per person across every pack. Tasks stay
  // membership-scoped (`id`), the rest keys off `detail.user.id`.
  const userId = detail.user.id;

  const empty: AreaScoreAvg = { selfAvg: 0, mentorAvg: 0, composite: 0 };
  const emptyScores = Object.fromEntries(
    AREA_KEYS.map((k) => [k, empty])
  ) as Record<AreaKey, AreaScoreAvg>;

  let currentScores: Record<AreaKey, AreaScoreAvg> = emptyScores;
  let previousScores: Record<AreaKey, AreaScoreAvg> = emptyScores;
  try {
    const [current, previous] = await Promise.all([
      computeAreaScores(userId, "mid"),
      computeAreaScores(userId, "entry"),
    ]);
    currentScores = current as Record<AreaKey, AreaScoreAvg>;
    previousScores = previous as Record<AreaKey, AreaScoreAvg>;
  } catch {
    // keep defaults
  }

  const [evaluations, lifePlan, strategicPlan, strategicMapScores, tasks] =
    await Promise.all([
      getEvaluations(userId),
      getLifePlan(userId),
      getStrategicPlan(userId),
      getStrategicMapScores(userId),
      getTasksForMembership(id),
    ]);

  const areaLabels = AREA_LABELS;

  return (
    <MentorMemberDetailClient
      membership={serialize(detail)}
      currentScores={currentScores}
      previousScores={previousScores}
      areaLabels={areaLabels}
      evaluations={serialize(evaluations)}
      lifePlan={serialize(lifePlan)}
      strategicPlan={serialize(strategicPlan)}
      strategicMapScores={serialize(strategicMapScores)}
      tasks={serialize(tasks)}
    />
  );
}
