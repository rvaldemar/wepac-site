import Link from "next/link";
import { requirePageUser } from "@/lib/wepacker/page-guards";
import { getMyContext } from "@/lib/wepacker/actions/user";
import { getLifePlan, getStrategicPlan } from "@/lib/wepacker/actions/plan";
import { getTrails } from "@/lib/wepacker/actions/trail";
import { TRAIL_STATUS_LABELS, type TrailStatus } from "@/lib/wepacker/types";

// Chronological display order for the Trails status breakdown — mirrors the
// tab order on the Trails page itself.
const TRAIL_STATUS_ORDER: TrailStatus[] = [
  "active",
  "paused",
  "completed",
  "abandoned",
];

export default async function BasecampPage() {
  await requirePageUser();
  const { user, membership } = await getMyContext();

  if (!membership) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="font-barlow text-2xl font-bold text-wepac-white">
          Basecamp
        </h1>
        <p className="mt-4 max-w-md text-sm text-wepac-text-tertiary">
          A tua conta ainda não está associada a uma Journey — contacta a
          equipa WEPAC.
        </p>
      </div>
    );
  }

  const userId = user.id;

  const [lifePlan, strategicPlan, trails] = await Promise.all([
    getLifePlan(userId),
    getStrategicPlan(userId),
    getTrails(userId),
  ]);

  const trailCounts = TRAIL_STATUS_ORDER.map((status) => ({
    status,
    label: TRAIL_STATUS_LABELS[status],
    count: trails.filter((t) => t.status === status).length,
  })).filter((entry) => entry.count > 0);

  const completedGoals =
    strategicPlan?.goals.filter((g) => g.status === "completed").length ?? 0;
  const totalGoals = strategicPlan?.goals.length ?? 0;

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-barlow text-2xl font-bold text-wepac-white">
        Basecamp
      </h1>
      <p className="mt-1 text-sm text-wepac-text-tertiary">
        O ponto de partida do teu desenvolvimento — plano de vida, plano
        estratégico e travessias em curso.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Life Plan */}
        <div className="flex flex-col border border-wepac-border bg-wepac-card p-6">
          <h2 className="font-barlow text-lg font-bold text-wepac-white">
            Life Plan
          </h2>
          <p className="mt-2 flex-1 text-sm text-wepac-text-tertiary">
            {lifePlan
              ? `Última atualização: ${new Date(
                  lifePlan.updatedAt
                ).toLocaleDateString("pt-PT")}`
              : "Ainda não começaste o teu Life Plan."}
          </p>
          <Link
            href="/wepacker/ppv"
            className="mt-4 inline-block bg-wepac-white px-4 py-2 text-center text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted"
          >
            {lifePlan ? "Ver Life Plan" : "Criar Life Plan"}
          </Link>
        </div>

        {/* Strategic Plan */}
        <div className="flex flex-col border border-wepac-border bg-wepac-card p-6">
          <h2 className="font-barlow text-lg font-bold text-wepac-white">
            Plano Estratégico
          </h2>
          <p className="mt-2 flex-1 text-sm text-wepac-text-tertiary">
            {strategicPlan
              ? `${strategicPlan.quarter} — ${completedGoals}/${totalGoals} objetivos concluídos`
              : "Ainda não tens um plano estratégico."}
          </p>
          <Link
            href="/wepacker/plan"
            className="mt-4 inline-block bg-wepac-white px-4 py-2 text-center text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted"
          >
            {strategicPlan ? "Ver Plano" : "Criar Plano"}
          </Link>
        </div>

        {/* Trails */}
        <div className="flex flex-col border border-wepac-border bg-wepac-card p-6">
          <h2 className="font-barlow text-lg font-bold text-wepac-white">
            Trails
          </h2>
          <p className="mt-2 flex-1 text-sm text-wepac-text-tertiary">
            {trailCounts.length > 0
              ? trailCounts
                  .map((entry) => `${entry.count} ${entry.label.toLowerCase()}`)
                  .join(" · ")
              : "Ainda não criaste nenhum Trail."}
          </p>
          <Link
            href="/wepacker/trails"
            className="mt-4 inline-block bg-wepac-white px-4 py-2 text-center text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted"
          >
            {trails.length > 0 ? "Ver Trails" : "Criar Trail"}
          </Link>
        </div>
      </div>
    </div>
  );
}
