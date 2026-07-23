import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/wepacker/guards";

const CSP =
  "default-src 'none'; script-src 'none'; connect-src 'none'; img-src 'none'; " +
  "font-src 'none'; object-src 'none'; frame-src 'none'; form-action 'none'; " +
  "base-uri 'none'; style-src 'unsafe-inline'";

export async function GET(
  _request: Request,
  context: { params: Promise<{ documentId: string }> },
) {
  try {
    const actor = await requireUser();
    const { documentId } = await context.params;
    const document = await prisma.sessionResultDocument.findUnique({
      where: { id: documentId },
      include: {
        session: { select: { organizerId: true } },
        attendee: { select: { userId: true } },
      },
    });
    const organizer = document?.session.organizerId === actor.id;
    const exactAttendee =
      document?.attendee.userId === actor.id &&
      document.publishedAt !== null &&
      document.revokedAt === null;
    if (
      !document ||
      document.erasedAt ||
      !document.contentHtml ||
      (!organizer && !exactAttendee)
    ) {
      return new Response("Not found", { status: 404 });
    }
    await prisma.sessionArtifactAuditEvent.create({
      data: {
        sessionId: document.sessionId,
        actorUserId: actor.id,
        subjectUserId: document.attendee.userId,
        type: "document_viewed",
        resourceId: document.id,
        resourceVersion: document.version,
      },
    });
    return new Response(document.contentHtml, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "content-security-policy": CSP,
        "cache-control": "private, no-store, max-age=0",
        "x-content-type-options": "nosniff",
        "x-frame-options": "DENY",
        "x-robots-tag": "noindex, nofollow, noarchive",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
