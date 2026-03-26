import { getCurrentUser } from "@/lib/actions/user";
import { computeAreaScores, getIndicatorScores } from "@/lib/actions/evaluation";
import { getStrategicMapScores } from "@/lib/actions/strategic";
import { getUserTasks } from "@/lib/actions/task";
import { getNextSession } from "@/lib/actions/session";
import { getLatestMessage } from "@/lib/actions/message";
import DashboardPageClient from "./page-client";

export default async function DashboardPage() {
 const user = await getCurrentUser();

 const [currentScores, previousScores, indicatorScores, strategicMapScores, allTasks, nextSession, latestMessage] =
  await Promise.all([
   computeAreaScores(user.id, "mid"),
   computeAreaScores(user.id, "entry"),
   getIndicatorScores(user.id, "mid"),
   getStrategicMapScores(user.id),
   getUserTasks(user.id),
   getNextSession(user.id),
   getLatestMessage(user.id),
  ]);

 // Calculate current quarter week
 const now = new Date();
 const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
 const quarterStart = new Date(now.getFullYear(), quarterMonth, 1);
 const quarterWeek = Math.min(12, Math.max(1, Math.ceil((now.getTime() - quarterStart.getTime()) / (7 * 24 * 60 * 60 * 1000))));

 const pendingTasks = allTasks
  .filter((t) => t.status !== "done")
  .map((t) => ({
   id: t.id,
   title: t.title,
   deadline: t.deadline,
   origin: t.origin,
   status: t.status,
  }));

 const serializedNextSession = nextSession
  ? {
    id: nextSession.id,
    scheduledAt: nextSession.scheduledAt.toISOString(),
    sessionType: nextSession.sessionType,
    durationMinutes: nextSession.durationMinutes,
   }
  : null;

 const serializedStrategicMapScores = strategicMapScores.map((s) => ({
  longTermScore: s.longTermScore,
  annualScore: s.annualScore,
  quarterlyScore: s.quarterlyScore,
  monthlyScore: s.monthlyScore,
 }));

 return (
  <DashboardPageClient
   user={user}
   currentScores={currentScores}
   previousScores={previousScores}
   indicatorScores={indicatorScores}
   strategicMapScores={serializedStrategicMapScores}
   pendingTasks={pendingTasks}
   nextSession={serializedNextSession}
   latestMessage={latestMessage}
   quarterWeek={quarterWeek}
  />
 );
}
