import { requirePageUser } from "@/lib/wepacker/page-guards";
import { getMyContext } from "@/lib/wepacker/actions/user";
import { computeAreaScores, getIndicatorScores, getEvaluations } from "@/lib/wepacker/actions/evaluation";
import DiagnosisPageClient from "./page-client";

const MOMENTS = ["entry", "mid", "exit"] as const;

export default async function DiagnosisPage() {
  await requirePageUser();
  const { user, membership } = await getMyContext();

  if (!membership) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="font-barlow text-2xl font-bold text-wepac-white">
          Legacy Assessment
        </h1>
        <p className="mt-4 max-w-md text-sm text-wepac-text-tertiary">
          Este instrumento ainda depende de um legacy delivery record. My
          Journey continua disponível sem esse registo.
        </p>
      </div>
    );
  }

  const userId = user.id;

  const [areaScoresByMoment, indicatorScoresByMoment, evaluations] = await Promise.all([
    Promise.all(MOMENTS.map((m) => computeAreaScores(userId, m))),
    Promise.all(MOMENTS.map((m) => getIndicatorScores(userId, m))),
    getEvaluations(userId),
  ]);

  const scoresByMoment = Object.fromEntries(
    MOMENTS.map((m, i) => [m, areaScoresByMoment[i]])
  ) as Record<(typeof MOMENTS)[number], (typeof areaScoresByMoment)[number]>;

  const indicatorsByMoment = Object.fromEntries(
    MOMENTS.map((m, i) => [m, indicatorScoresByMoment[i]])
  ) as Record<(typeof MOMENTS)[number], (typeof indicatorScoresByMoment)[number]>;

  // Only offer moments where a self or mentor evaluation actually exists.
  const availableMoments = MOMENTS.filter((m) =>
    evaluations.some((e) => e.moment === m)
  );

  return (
    <DiagnosisPageClient
      scoresByMoment={scoresByMoment}
      indicatorsByMoment={indicatorsByMoment}
      availableMoments={availableMoments.length > 0 ? availableMoments : ["entry"]}
      packSlug={membership.packSlug}
    />
  );
}
