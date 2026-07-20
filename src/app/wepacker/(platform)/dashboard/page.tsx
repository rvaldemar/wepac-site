import { requirePageUser } from "@/lib/wepacker/page-guards";
import { getMyContext } from "@/lib/wepacker/actions/user";
import { computeAreaScores, getIndicatorScores } from "@/lib/wepacker/actions/evaluation";
import { getStrategicMapScores } from "@/lib/wepacker/actions/plan";
import { getMyTasks } from "@/lib/wepacker/actions/task";
import { getNextSession } from "@/lib/wepacker/actions/session";
import { getMyConversations } from "@/lib/wepacker/actions/message";
import DashboardPageClient from "./page-client";

export default async function DashboardPage() {
  await requirePageUser();
  const { user, membership } = await getMyContext();

  if (!membership) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="font-barlow text-2xl font-bold text-wepac-white">
          Olá, {user.name}
        </h1>
        <p className="mt-4 max-w-md text-sm text-wepac-text-tertiary">
          A tua conta ainda não está associada a uma jornada — contacta a
          equipa WEPAC.
        </p>
      </div>
    );
  }

  const membershipId = membership.membershipId;

  const [currentScores, previousScores, indicatorScores, strategicMapScores, allTasks, nextSession, conversations] =
    await Promise.all([
      computeAreaScores(membershipId, "mid"),
      computeAreaScores(membershipId, "entry"),
      getIndicatorScores(membershipId, "mid"),
      getStrategicMapScores(membershipId),
      getMyTasks(),
      getNextSession(),
      getMyConversations(),
    ]);

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

  // Latest message across all conversations the user participates in.
  const allMessages = conversations.flatMap((c) => c.messages);
  const latestMessage = allMessages.length
    ? allMessages.reduce((latest, m) =>
        new Date(m.createdAt).getTime() > new Date(latest.createdAt).getTime() ? m : latest
      )
    : null;

  // Quarter week — 12-week trimestral cycle, same heuristic used across the platform.
  const now = new Date();
  const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
  const quarterStart = new Date(now.getFullYear(), quarterMonth, 1);
  const quarterWeek = Math.min(
    12,
    Math.max(1, Math.ceil((now.getTime() - quarterStart.getTime()) / (7 * 24 * 60 * 60 * 1000)))
  );

  return (
    <DashboardPageClient
      user={{ name: user.name }}
      membership={membership}
      currentScores={currentScores}
      previousScores={previousScores}
      indicatorScores={indicatorScores}
      strategicMapScores={serializedStrategicMapScores}
      pendingTasks={pendingTasks}
      nextSession={serializedNextSession}
      latestMessage={
        latestMessage
          ? {
              id: latestMessage.id,
              body: latestMessage.body,
              readAt: latestMessage.readAt ?? null,
              createdAt: latestMessage.createdAt,
              own: latestMessage.userId === user.id,
            }
          : null
      }
      quarterWeek={quarterWeek}
    />
  );
}
