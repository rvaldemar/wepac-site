import { requireRole } from "@/lib/auth-helpers";
import { getUser } from "@/lib/actions/user";
import { computeAreaScores } from "@/lib/actions/evaluation";
import { getStrategicMapScores, getStrategicPlan, getLifePlan } from "@/lib/actions/strategic";
import { getUserTasks } from "@/lib/actions/task";
import { getUserSessions } from "@/lib/actions/session";
import { MentorArtistViewClient } from "./page-client";
import type { AreaKey } from "@/lib/types/artist";

export default async function MentorArtistViewPage({
 params,
}: {
 params: Promise<{ id: string }>;
}) {
 await requireRole(["mentor", "admin"]);
 const { id } = await params;

 const artist = await getUser(id);

 const empty = { selfAvg: 0, mentorAvg: 0, composite: 0 };
 const emptyScores = Object.fromEntries(
  ["physical", "emotional", "character", "spiritual", "intellectual", "social"].map((k) => [k, empty])
 ) as Record<AreaKey, typeof empty>;

 let currentScores: Record<string, { selfAvg: number; mentorAvg: number; composite: number }>;
 let previousScores: Record<string, { selfAvg: number; mentorAvg: number; composite: number }>;
 try {
  [currentScores, previousScores] = await Promise.all([
   computeAreaScores(id, "mid"),
   computeAreaScores(id, "entry"),
  ]);
 } catch {
  currentScores = emptyScores;
  previousScores = emptyScores;
 }

 const [strategicMapScores, tasks, sessions, lifePlan, strategicPlan] = await Promise.all([
  getStrategicMapScores(id),
  getUserTasks(id),
  getUserSessions(id),
  getLifePlan(id),
  getStrategicPlan(id),
 ]);

 return (
  <MentorArtistViewClient
   artist={artist as any}
   currentScores={currentScores}
   previousScores={previousScores}
   strategicMapScores={strategicMapScores as any}
   tasks={tasks as any}
   sessions={sessions as any}
   lifePlan={lifePlan as any}
   strategicPlan={strategicPlan as any}
  />
 );
}
