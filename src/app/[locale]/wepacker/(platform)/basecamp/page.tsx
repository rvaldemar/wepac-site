import { Link } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { wp } from "@/i18n/copy/wepacker";
import { requirePageUser } from "@/lib/wepacker/page-guards";
import { getLifeMap, getStrategicPlan } from "@/lib/wepacker/actions/plan";
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
  const locale = await getLocale();
  const user = await requirePageUser();
  const userId = user.id;

  const [lifeMap, strategicPlan, trails] = await Promise.all([
    getLifeMap(userId),
    getStrategicPlan(userId),
    getTrails(userId),
  ]);

  const trailCounts = TRAIL_STATUS_ORDER.map((status) => ({
    status,
    label: wp(
      locale,
      TRAIL_STATUS_LABELS[status],
      {
        active: "Active",
        paused: "Paused",
        completed: "Completed",
        abandoned: "Abandoned",
      }[status],
    ),
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
        {wp(
          locale,
          "O ponto de partida do teu desenvolvimento — Life Map, Goals e Trails em curso.",
          "The starting point for your development — Life Map, Goals, and active Trails.",
        )}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Life Map */}
        <div className="flex flex-col border border-wepac-border bg-wepac-card p-6">
          <h2 className="font-barlow text-lg font-bold text-wepac-white">
            Life Map
          </h2>
          <p className="mt-2 flex-1 text-sm text-wepac-text-tertiary">
            {lifeMap
              ? `${wp(locale, "Última atualização", "Last updated")}: ${new Date(
                  lifeMap.updatedAt
                ).toLocaleDateString(locale)}`
              : wp(
                  locale,
                  "Ainda não começaste o teu Life Map.",
                  "You have not started your Life Map yet.",
                )}
          </p>
          <Link
            href="/wepacker/life-map"
            className="mt-4 inline-block bg-wepac-white px-4 py-2 text-center text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted"
          >
            {lifeMap
              ? wp(locale, "Ver Life Map", "View Life Map")
              : wp(locale, "Criar Life Map", "Create Life Map")}
          </Link>
        </div>

        {/* Goals */}
        <div className="flex flex-col border border-wepac-border bg-wepac-card p-6">
          <h2 className="font-barlow text-lg font-bold text-wepac-white">
            Goals
          </h2>
          <p className="mt-2 flex-1 text-sm text-wepac-text-tertiary">
            {strategicPlan
              ? `${strategicPlan.quarter} — ${completedGoals}/${totalGoals} ${wp(
                  locale,
                  "objetivos concluídos",
                  "goals completed",
                )}`
              : wp(
                  locale,
                  "Ainda não definiste Goals.",
                  "You have not defined Goals yet.",
                )}
          </p>
          <Link
            href="/wepacker/goals"
            className="mt-4 inline-block bg-wepac-white px-4 py-2 text-center text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted"
          >
            {strategicPlan
              ? wp(locale, "Ver Goals", "View Goals")
              : wp(locale, "Criar Goals", "Create Goals")}
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
              : wp(
                  locale,
                  "Ainda não criaste nenhum Trail.",
                  "You have not created any Trails yet.",
                )}
          </p>
          <Link
            href="/wepacker/trails"
            className="mt-4 inline-block bg-wepac-white px-4 py-2 text-center text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted"
          >
            {trails.length > 0
              ? wp(locale, "Ver Trails", "View Trails")
              : wp(locale, "Criar Trail", "Create Trail")}
          </Link>
        </div>
      </div>
    </div>
  );
}
