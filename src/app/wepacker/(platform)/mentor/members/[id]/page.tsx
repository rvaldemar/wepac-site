import { requirePageRole } from "@/lib/wepacker/page-guards";
import { getMembershipDetail } from "@/lib/wepacker/actions/admin";
import { computeAreaScores, getEvaluations } from "@/lib/wepacker/actions/evaluation";
import {
  getLifePlan,
  getStrategicPlan,
  getStrategicMapScores,
} from "@/lib/wepacker/actions/plan";
import { getTasksForMembership } from "@/lib/wepacker/actions/task";
import { getTrails } from "@/lib/wepacker/actions/trail";
import { AREA_LABELS, type AreaKey } from "@/lib/wepacker/types";
import { MentorMemberDetailClient } from "./page-client";

// Dates coming out of Prisma need to cross the server/client boundary as
// plain JSON — this round-trip turns every Date into an ISO string. The
// client-side props are typed with `string` dates, so the return type
// mirrors the input shape with every `Date` swapped for `string`.
type Serialized<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? Serialized<U>[]
    : T extends object
      ? { [K in keyof T]: Serialized<T[K]> }
      : T;

function serialize<T>(data: T): Serialized<T> {
  return JSON.parse(JSON.stringify(data));
}

type AreaScoreAvg = { selfAvg: number; mentorAvg: number; composite: number };

// Chronological order — mirrors the member dashboard's moment handling.
const MOMENTS = ["entry", "mid", "exit"] as const;

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

  const evaluations = await getEvaluations(userId);
  // "Actual" = the most recent moment that actually has a self or mentor
  // evaluation; "Anterior" = the one before it, if any. Was previously
  // hardcoded to mid/entry, which showed an all-zero "Actual" radar for
  // every member who has only completed the entry self-assessment (the
  // common case — mid only exists after a mentor's mid-point evaluation
  // session). Mirrors the fix applied to the member's own dashboard.
  const availableMoments = MOMENTS.filter((m) =>
    evaluations.some((e) => e.moment === m)
  );
  const currentMoment = availableMoments[availableMoments.length - 1] ?? "entry";
  const previousMoment =
    availableMoments.length > 1
      ? availableMoments[availableMoments.length - 2]
      : null;

  const [currentScores, previousScores, lifePlan, strategicPlan, strategicMapScores, tasks, trails] =
    await Promise.all([
      computeAreaScores(userId, currentMoment),
      previousMoment ? computeAreaScores(userId, previousMoment) : null,
      getLifePlan(userId),
      getStrategicPlan(userId),
      getStrategicMapScores(userId),
      getTasksForMembership(id),
      getTrails(userId),
    ]);

  const areaLabels = AREA_LABELS;

  return (
    <MentorMemberDetailClient
      membership={serialize(detail)}
      currentScores={currentScores as Record<AreaKey, AreaScoreAvg>}
      previousScores={previousScores as Record<AreaKey, AreaScoreAvg> | null}
      areaLabels={areaLabels}
      // `EvaluationType` at the DB level allows more variants than the
      // client's narrower `"self" | "mentor"` union — a pre-existing gap
      // unrelated to this serialization helper.
      evaluations={
        serialize(evaluations) as Parameters<
          typeof MentorMemberDetailClient
        >[0]["evaluations"]
      }
      lifePlan={serialize(lifePlan)}
      strategicPlan={serialize(strategicPlan)}
      strategicMapScores={serialize(strategicMapScores)}
      tasks={serialize(tasks)}
      trails={serialize(trails)}
    />
  );
}
