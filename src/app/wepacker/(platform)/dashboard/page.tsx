import { requirePageUser } from "@/lib/wepacker/page-guards";
import { getMyContext } from "@/lib/wepacker/actions/user";
import {
  computeAreaScores,
  getEvaluations,
  getIndicatorScores,
} from "@/lib/wepacker/actions/evaluation";
import { getStrategicMapScores } from "@/lib/wepacker/actions/plan";
import { getMyTasks } from "@/lib/wepacker/actions/task";
import { getMySessions, getNextSession } from "@/lib/wepacker/actions/session";
import { getMyConversations } from "@/lib/wepacker/actions/message";
import { getTrails } from "@/lib/wepacker/actions/trail";
import DashboardPageClient from "./page-client";

// Chronological order — mirrors the diagnosis page's moment handling.
const MOMENTS = ["entry", "mid", "exit"] as const;

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
          A tua conta ainda não está associada a uma Journey — contacta a
          equipa WEPAC.
        </p>
      </div>
    );
  }

  const userId = user.id;

  const evaluations = await getEvaluations(userId);
  // "Actual" = the most recent moment that actually has a self or mentor
  // evaluation; "Anterior" = the one before it, if any. Was previously
  // hardcoded to mid/entry, which showed an all-zero "Actual" radar for
  // every member who has only completed the entry self-assessment
  // (the common case — mid only exists after a mentor's mid-point
  // evaluation session).
  const availableMoments = MOMENTS.filter((m) =>
    evaluations.some((e) => e.moment === m)
  );
  const currentMoment = availableMoments[availableMoments.length - 1] ?? "entry";
  const previousMoment =
    availableMoments.length > 1
      ? availableMoments[availableMoments.length - 2]
      : null;

  const [currentScores, previousScores, indicatorScores, strategicMapScores, allTasks, nextSession, mySessions, conversations, trails] =
    await Promise.all([
      computeAreaScores(userId, currentMoment),
      previousMoment ? computeAreaScores(userId, previousMoment) : null,
      getIndicatorScores(userId, currentMoment),
      getStrategicMapScores(userId),
      getMyTasks(),
      getNextSession(),
      getMySessions(),
      getMyConversations(),
      getTrails(userId),
    ]);

  const activeTrails = trails
    .filter((t) => t.status === "active")
    .slice(0, 3)
    .map((t) => ({ id: t.id, title: t.title }));

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

  // Minimal shape for the trail visualization — chronology + status/type
  // only, no notes/outcomes (those never need to leave the sessions page).
  const serializedSessions = mySessions.map((s) => ({
    id: s.id,
    scheduledAt: s.scheduledAt.toISOString(),
    status: s.status,
    sessionType: s.sessionType,
    kind: s.kind,
  }));

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
      currentMoment={currentMoment}
      previousScores={previousScores}
      previousMoment={previousMoment}
      indicatorScores={indicatorScores}
      strategicMapScores={serializedStrategicMapScores}
      pendingTasks={pendingTasks}
      activeTrails={activeTrails}
      nextSession={serializedNextSession}
      sessions={serializedSessions}
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
