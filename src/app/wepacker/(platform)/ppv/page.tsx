import { requirePageUser } from "@/lib/wepacker/page-guards";
import { getMyContext } from "@/lib/wepacker/actions/user";
import { getStrategicMapScores } from "@/lib/wepacker/actions/plan";
import PPVPageClient from "./page-client";

export default async function PPVPage() {
  await requirePageUser();
  const { membership } = await getMyContext();

  if (!membership) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="font-barlow text-2xl font-bold text-wepac-white">PPV</h1>
        <p className="mt-4 max-w-md text-sm text-wepac-text-tertiary">
          A tua conta ainda não está associada a uma cohort — contacta a
          equipa WEPAC.
        </p>
      </div>
    );
  }

  const scores = await getStrategicMapScores(membership.membershipId);

  const serializedScores = scores.map((s) => ({
    id: s.id,
    month: s.month,
    longTermScore: s.longTermScore,
    annualScore: s.annualScore,
    quarterlyScore: s.quarterlyScore,
    monthlyScore: s.monthlyScore,
    notes: s.notes,
  }));

  return <PPVPageClient scores={serializedScores} />;
}
