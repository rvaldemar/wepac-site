import "dotenv/config";
import { prisma } from "@/lib/db";
import {
  dispatchPersistedNotificationEvents,
  persistSessionEvent,
} from "@/lib/wepacker/notifications";

if (process.env.REISSUE_SESSION_CALL_INVITES !== "authenticated-jwt-cutover-v1") {
  throw new Error("Explicit REISSUE_SESSION_CALL_INVITES confirmation required.");
}

const sessions = await prisma.session.findMany({
  where: { status: "scheduled", scheduledAt: { gte: new Date() } },
  select: { id: true, organizerId: true },
});

for (const session of sessions) {
  const events = await prisma.$transaction((tx) =>
    persistSessionEvent(tx, {
      sessionId: session.id,
      actorId: session.organizerId,
      type: "session_updated",
      dedupeScope: "authenticated-jwt-cutover-v1",
    }),
  );
  dispatchPersistedNotificationEvents(events);
}

console.info("[session-media:reinvite] staged", { count: sessions.length });
await prisma.$disconnect();
