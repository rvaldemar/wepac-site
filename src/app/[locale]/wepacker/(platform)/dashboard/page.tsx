import { requirePageUser } from "@/lib/wepacker/page-guards";
import { getMyContext } from "@/lib/wepacker/actions/user";
import { getMyActions } from "@/lib/wepacker/actions/action";
import { getMySessions, getNextSession } from "@/lib/wepacker/actions/session";
import { getMyConversations } from "@/lib/wepacker/actions/message";
import { getTrails } from "@/lib/wepacker/actions/trail";
import DashboardPageClient from "./page-client";

export default async function DashboardPage() {
  await requirePageUser();
  const { user, stage } = await getMyContext();

  const [allActions, nextSession, sessions, conversations, trails] =
    await Promise.all([
      getMyActions(),
      getNextSession(),
      getMySessions(),
      getMyConversations(),
      getTrails(user.id),
    ]);

  const activeActions = allActions
    .filter(
      (action) => action.status === "pending" || action.status === "in_progress",
    )
    .slice(0, 5)
    .map((action) => ({
      id: action.id,
      title: action.title,
      dueAt: action.dueAt?.toISOString() ?? null,
      origin: action.origin,
    }));

  const activeTrails = trails
    .filter((trail) => trail.status === "active")
    .slice(0, 3)
    .map((trail) => ({ id: trail.id, title: trail.title }));

  const allMessages = conversations.flatMap((conversation) => conversation.messages);
  const latestMessage = allMessages.length
    ? allMessages.reduce((latest, message) =>
        new Date(message.createdAt).getTime() >
        new Date(latest.createdAt).getTime()
          ? message
          : latest,
      )
    : null;

  return (
    <DashboardPageClient
      user={{ name: user.name }}
      stage={stage}
      activeActions={activeActions}
      activeTrails={activeTrails}
      nextSession={
        nextSession
          ? {
              id: nextSession.id,
              scheduledAt: nextSession.scheduledAt.toISOString(),
              durationMinutes: nextSession.durationMinutes,
              meetingUrl: nextSession.meetingUrl,
              attendeeCount: nextSession.attendeeCount,
            }
          : null
      }
      sessions={sessions.map((session) => ({
        id: session.id,
        scheduledAt: session.scheduledAt.toISOString(),
        status: session.status,
        kind: session.kind,
        attendeeCount: session.attendeeCount,
      }))}
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
    />
  );
}
