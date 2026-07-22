import { createHash } from "node:crypto";
import type { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  buildSessionCancelIcs,
  buildSessionInviteIcs,
} from "@/lib/wepacker/ics";
import { logSafeError } from "@/lib/wepacker/log-safe-error";
import { SESSION_KIND_LABELS } from "@/lib/wepacker/types";

const MAX_EMAIL_ATTEMPTS = 5;
const STALE_LOCK_MS = 15 * 60 * 1000;
const RETRY_DELAYS_MS = [
  60_000,
  5 * 60_000,
  30 * 60_000,
  2 * 60 * 60_000,
  12 * 60 * 60_000,
];
const SESSION_NOTIFICATION_TYPES: NotificationType[] = [
  "session_scheduled",
  "session_updated",
  "session_cancelled",
];

class SupersededNotificationError extends Error {
  constructor() {
    super("Notification intent superseded");
    this.name = "SupersededNotificationError";
  }
}

function logNotificationError(
  event: string,
  metadata: Record<string, unknown>,
  error: unknown,
): void {
  try {
    console.error(event, { ...metadata, ...logSafeError(error) });
  } catch {
    // Recovery and logging must never reject a post-commit delivery path.
  }
}

interface NotificationEventInput {
  recipientId: string;
  actorId?: string | null;
  type: NotificationType;
  resourceId: string;
  resourceVersion?: number;
  href: string;
  // A stable transition identifier. It is hashed before persistence so
  // caller-provided data can never become ledger or outbox content.
  dedupeScope?: string;
}

export interface PersistedNotificationEvent {
  notificationId: string;
  outboxId: string;
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 20);
}

function notificationDedupeKey(input: NotificationEventInput): string {
  return [
    input.type,
    input.resourceId,
    input.recipientId,
    digest(input.dedupeScope ?? "once"),
  ].join(":");
}

async function persistNotificationEvent(
  tx: Prisma.TransactionClient,
  input: NotificationEventInput,
): Promise<PersistedNotificationEvent> {
  const dedupeKey = notificationDedupeKey(input);
  const notification = await tx.notification.upsert({
    where: { dedupeKey },
    create: {
      recipientId: input.recipientId,
      actorId: input.actorId ?? null,
      type: input.type,
      resourceId: input.resourceId,
      resourceVersion: input.resourceVersion ?? null,
      href: input.href,
      dedupeKey,
    },
    update: {},
    select: { id: true },
  });
  const outbox = await tx.emailOutbox.upsert({
    where: { dedupeKey: `${dedupeKey}:email` },
    create: {
      notificationId: notification.id,
      recipientId: input.recipientId,
      dedupeKey: `${dedupeKey}:email`,
    },
    update: {},
    select: { id: true },
  });
  return { notificationId: notification.id, outboxId: outbox.id };
}

export interface PackNotificationEventInput {
  packMembershipId: string;
  recipientId: string;
  actorId: string;
  type: "pack_invited" | "pack_accepted";
  dedupeScope: string;
}

export async function persistPackNotificationEvent(
  tx: Prisma.TransactionClient,
  input: PackNotificationEventInput,
): Promise<PersistedNotificationEvent> {
  return persistNotificationEvent(tx, {
    recipientId: input.recipientId,
    actorId: input.actorId,
    type: input.type,
    resourceId: input.packMembershipId,
    href: "/wepacker/communities",
    dedupeScope: input.dedupeScope,
  });
}

export interface ConnectionNotificationEventInput {
  connectionId: string;
  recipientId: string;
  actorId: string;
  type: "connection_requested" | "connection_accepted";
  dedupeScope: string;
}

export async function persistConnectionNotificationEvent(
  tx: Prisma.TransactionClient,
  input: ConnectionNotificationEventInput,
): Promise<PersistedNotificationEvent> {
  return persistNotificationEvent(tx, {
    recipientId: input.recipientId,
    actorId: input.actorId,
    type: input.type,
    resourceId: input.connectionId,
    href: "/wepacker/connections",
    dedupeScope: input.dedupeScope,
  });
}

export interface SessionNotificationState {
  status: string;
  kind: string;
  scheduledAt: Date;
  durationMinutes: number;
  meetingUrl: string | null;
}

export function sessionTransitionDedupeScope(
  before: SessionNotificationState,
  after: SessionNotificationState,
  transitionId?: string,
): string {
  return digest(
    JSON.stringify({
      before: {
        status: before.status,
        kind: before.kind,
        scheduledAt: before.scheduledAt.toISOString(),
        durationMinutes: before.durationMinutes,
        meetingUrl: before.meetingUrl,
      },
      after: {
        status: after.status,
        kind: after.kind,
        scheduledAt: after.scheduledAt.toISOString(),
        durationMinutes: after.durationMinutes,
        meetingUrl: after.meetingUrl,
      },
      // Distinguishes a later A -> B transition after B -> A while the state
      // digest still keeps replays of one invocation idempotent.
      transitionId: transitionId ?? null,
    }),
  );
}

export interface SessionEventInput {
  sessionId: string;
  actorId?: string | null;
  type: "session_scheduled" | "session_updated" | "session_cancelled";
  dedupeScope?: string;
}

export async function persistSessionEvent(
  tx: Prisma.TransactionClient,
  input: SessionEventInput,
): Promise<PersistedNotificationEvent[]> {
  // The row update is the ordering primitive for every calendar-affecting
  // transition. PostgreSQL serializes concurrent increments, and the revision
  // is committed atomically with the Notification / EmailOutbox rows below.
  // This cannot be derived from createdAt: PostgreSQL's now() is transaction-
  // start time, so commit order can be reversed or two transitions can share
  // the same millisecond.
  const session = await tx.session.update({
    where: { id: input.sessionId },
    data: { calendarRevision: { increment: 1 } },
    select: {
      organizerId: true,
      calendarRevision: true,
      attendees: { select: { userId: true } },
    },
  });

  const recipientIds = Array.from(
    new Set([
      session.organizerId,
      ...session.attendees.map((attendee) => attendee.userId),
    ]),
  );
  return Promise.all(
    recipientIds.map(async (recipientId) => {
      const eventInput: NotificationEventInput = {
        recipientId,
        actorId: input.actorId ?? session.organizerId,
        type: input.type,
        resourceId: input.sessionId,
        resourceVersion: session.calendarRevision,
        href:
          recipientId === session.organizerId
            ? `/wepacker/mentor/sessions/${input.sessionId}`
            : "/wepacker/sessions",
        dedupeScope: input.dedupeScope,
      };
      const currentEmailDedupeKey = `${notificationDedupeKey(eventInput)}:email`;

      // Calendar delivery is latest-transition-wins. Keep the in-app ledger,
      // but atomically retire every older unsent email for this Person and
      // Session before staging the current transition.
      await tx.emailOutbox.updateMany({
        where: {
          recipientId,
          dedupeKey: { not: currentEmailDedupeKey },
          status: { in: ["pending", "processing", "failed"] },
          notification: {
            is: {
              resourceId: input.sessionId,
              type: { in: SESSION_NOTIFICATION_TYPES },
            },
          },
        },
        data: {
          status: "superseded",
          lockedAt: null,
          lastErrorKind: null,
          lastSmtpCode: null,
        },
      });

      return persistNotificationEvent(tx, eventInput);
    }),
  );
}

export interface MentorshipEventInput {
  mentorshipId: string;
  recipientId: string;
  actorId: string;
  type: "mentorship_invited" | "mentorship_accepted";
}

export async function persistMentorshipEvent(
  tx: Prisma.TransactionClient,
  input: MentorshipEventInput,
): Promise<PersistedNotificationEvent[]> {
  return [
    await persistNotificationEvent(tx, {
      recipientId: input.recipientId,
      actorId: input.actorId,
      type: input.type,
      resourceId: input.mentorshipId,
      href: "/wepacker/mentorships",
    }),
  ];
}

export interface SessionFollowupUpdatedEventInput {
  sessionId: string;
  recipientId: string;
  actorId: string;
  transitionScope: string;
}

export async function persistSessionFollowupUpdatedEvent(
  tx: Prisma.TransactionClient,
  input: SessionFollowupUpdatedEventInput,
): Promise<PersistedNotificationEvent[]> {
  const resourceVersion = Number(input.transitionScope.split("->").at(-1));
  if (!Number.isSafeInteger(resourceVersion) || resourceVersion < 1) {
    throw new Error("Invalid Session follow-up transition version");
  }
  const eventInput: NotificationEventInput = {
    recipientId: input.recipientId,
    actorId: input.actorId,
    type: "session_followup_updated",
    resourceId: input.sessionId,
    resourceVersion,
    href: "/wepacker/sessions",
    dedupeScope: input.transitionScope,
  };
  const currentEmailDedupeKey = `${notificationDedupeKey(eventInput)}:email`;

  // Follow-up delivery is latest-transition-wins, just like calendar
  // delivery. The visible in-app history stays append-only while older
  // unsent email intents are retired atomically with the new revision.
  await tx.emailOutbox.updateMany({
    where: {
      recipientId: input.recipientId,
      dedupeKey: { not: currentEmailDedupeKey },
      status: { in: ["pending", "processing", "failed"] },
      notification: {
        is: {
          resourceId: input.sessionId,
          type: "session_followup_updated",
        },
      },
    },
    data: {
      status: "superseded",
      lockedAt: null,
      lastErrorKind: null,
      lastSmtpCode: null,
    },
  });
  return [await persistNotificationEvent(tx, eventInput)];
}

export interface NewMessageEventInput {
  conversationId: string;
  messageId: string;
  recipientId: string;
  actorId: string;
}

export async function persistNewMessageEvent(
  tx: Prisma.TransactionClient,
  input: NewMessageEventInput,
): Promise<PersistedNotificationEvent[]> {
  return [
    await persistNotificationEvent(tx, {
      recipientId: input.recipientId,
      actorId: input.actorId,
      type: "new_message",
      resourceId: input.messageId,
      href: "/wepacker/messages",
      dedupeScope: input.conversationId,
    }),
  ];
}

export function dispatchPersistedNotificationEvents(
  events: readonly PersistedNotificationEvent[],
): void {
  for (const event of events) {
    void dispatchEmailOutboxById(event.outboxId).catch((error) => {
      logNotificationError(
        "[wepacker:notifications] post-commit dispatch crashed",
        { outboxId: event.outboxId },
        error,
      );
    });
  }
}

type OutboxDispatchRow = Prisma.EmailOutboxGetPayload<{
  include: {
    recipient: { select: { id: true; name: true; email: true } };
    notification: {
      include: { actor: { select: { id: true; name: true } } };
    };
  };
}>;

async function dispatchPackEmail(row: OutboxDispatchRow) {
  const packMembership = await prisma.packMembership.findUnique({
    where: { id: row.notification.resourceId },
    select: {
      userId: true,
      invitedById: true,
      status: true,
      pack: { select: { personalOwnerId: true } },
    },
  });
  const actor = row.notification.actor;
  if (!packMembership || !actor || !packMembership.pack.personalOwnerId) {
    throw new SupersededNotificationError();
  }

  const email = await import("@/lib/email");
  if (row.notification.type === "pack_invited") {
    if (
      packMembership.status !== "invited" ||
      row.recipientId !== packMembership.userId ||
      actor.id !== packMembership.invitedById ||
      actor.id !== packMembership.pack.personalOwnerId
    ) {
      throw new SupersededNotificationError();
    }
    await email.sendPackInvitationEmail({
      to: row.recipient.email,
      recipientName: row.recipient.name,
      ownerName: actor.name,
    });
    return;
  }

  if (
    packMembership.status !== "active" ||
    row.recipientId !== packMembership.pack.personalOwnerId ||
    actor.id !== packMembership.userId
  ) {
    throw new SupersededNotificationError();
  }
  await email.sendPackAcceptedEmail({
    to: row.recipient.email,
    recipientName: row.recipient.name,
    memberName: actor.name,
  });
}

async function dispatchConnectionEmail(row: OutboxDispatchRow) {
  const connection = await prisma.personConnection.findUnique({
    where: { id: row.notification.resourceId },
    select: {
      firstUserId: true,
      secondUserId: true,
      requestedById: true,
      status: true,
    },
  });
  const actor = row.notification.actor;
  if (!connection || !actor || !connection.requestedById) {
    throw new SupersededNotificationError();
  }
  const endpoints = new Set([connection.firstUserId, connection.secondUserId]);
  if (!endpoints.has(row.recipientId) || !endpoints.has(actor.id)) {
    throw new SupersededNotificationError();
  }

  const email = await import("@/lib/email");
  if (row.notification.type === "connection_requested") {
    if (
      connection.status !== "pending" ||
      actor.id !== connection.requestedById ||
      row.recipientId === connection.requestedById
    ) {
      throw new SupersededNotificationError();
    }
    await email.sendConnectionRequestEmail({
      to: row.recipient.email,
      recipientName: row.recipient.name,
      requesterName: actor.name,
    });
    return;
  }

  if (
    connection.status !== "active" ||
    row.recipientId !== connection.requestedById ||
    actor.id === connection.requestedById
  ) {
    throw new SupersededNotificationError();
  }
  await email.sendConnectionAcceptedEmail({
    to: row.recipient.email,
    recipientName: row.recipient.name,
    personName: actor.name,
  });
}

async function dispatchMentorshipEmail(row: OutboxDispatchRow) {
  const mentorship = await prisma.mentorship.findUnique({
    where: { id: row.notification.resourceId },
    select: {
      mentorId: true,
      menteeId: true,
      invitedById: true,
      status: true,
      mentorAcceptedAt: true,
      menteeAcceptedAt: true,
      activatedAt: true,
      endedAt: true,
      mentor: { select: { name: true } },
      mentee: { select: { name: true } },
    },
  });
  const actor = row.notification.actor;
  if (!mentorship || !actor) throw new SupersededNotificationError();

  const email = await import("@/lib/email");
  if (row.notification.type === "mentorship_invited") {
    if (
      mentorship.status !== "pending" ||
      mentorship.endedAt !== null ||
      row.recipientId !== mentorship.menteeId ||
      actor.id !== mentorship.mentorId ||
      actor.id !== mentorship.invitedById
    ) {
      throw new SupersededNotificationError();
    }
    await email.sendMentorshipInvitationEmail({
      to: row.recipient.email,
      recipientName: row.recipient.name,
      mentorName: mentorship.mentor.name,
    });
    return;
  }

  if (
    mentorship.status !== "active" ||
    mentorship.mentorAcceptedAt === null ||
    mentorship.menteeAcceptedAt === null ||
    mentorship.activatedAt === null ||
    mentorship.endedAt !== null ||
    row.recipientId !== mentorship.mentorId ||
    actor.id !== mentorship.menteeId
  ) {
    throw new SupersededNotificationError();
  }
  await email.sendMentorshipAcceptedEmail({
    to: row.recipient.email,
    recipientName: row.recipient.name,
    menteeName: mentorship.mentee.name,
  });
}

async function dispatchSessionEmail(row: OutboxDispatchRow) {
  const session = await prisma.session.findUnique({
    where: { id: row.notification.resourceId },
    select: {
      id: true,
      organizerId: true,
      status: true,
      kind: true,
      scheduledAt: true,
      durationMinutes: true,
      meetingUrl: true,
      calendarRevision: true,
      attendees: {
        where: { userId: row.recipientId },
        select: { userId: true },
      },
    },
  });
  const actor = row.notification.actor;
  if (
    !session ||
    !actor ||
    actor.id !== session.organizerId ||
    (session.organizerId !== row.recipientId && session.attendees.length !== 1) ||
    row.notification.resourceVersion === null ||
    row.notification.resourceVersion !== session.calendarRevision
  ) {
    throw new SupersededNotificationError();
  }
  const stateMatchesIntent =
    row.notification.type === "session_cancelled"
      ? session.status === "cancelled"
      : session.status === "scheduled";
  if (!stateMatchesIntent) throw new SupersededNotificationError();

  const organizerEmail = (process.env.SMTP_FROM || "info@wepac.pt").replace(
    /^.*<|>.*$/g,
    "",
  );
  const icsInput = {
    sessionId: session.id,
    kind: session.kind,
    scheduledAt: session.scheduledAt,
    durationMinutes: session.durationMinutes,
    meetingUrl: session.meetingUrl,
    organizer: { name: "WEPAC", email: organizerEmail },
    attendees: [{ name: row.recipient.name, email: row.recipient.email }],
    sequence: row.notification.resourceVersion,
  };
  const kindLabel = SESSION_KIND_LABELS[session.kind]?.label ?? session.kind;
  const email = await import("@/lib/email");
  if (row.notification.type === "session_cancelled") {
    await email.sendSessionCancelEmail({
      to: row.recipient.email,
      recipientName: row.recipient.name,
      kindLabel,
      scheduledAt: session.scheduledAt,
      meetingUrl: session.meetingUrl,
      ics: buildSessionCancelIcs(icsInput),
    });
    return;
  }
  await email.sendSessionInviteEmail({
    to: row.recipient.email,
    recipientName: row.recipient.name,
    kindLabel,
    scheduledAt: session.scheduledAt,
    meetingUrl: session.meetingUrl,
    ics: buildSessionInviteIcs(icsInput),
  });
}

async function dispatchSessionFollowupEmail(row: OutboxDispatchRow) {
  const attendee = await prisma.sessionAttendee.findUnique({
    where: {
      sessionId_userId: {
        sessionId: row.notification.resourceId,
        userId: row.recipientId,
      },
    },
    select: {
      followupRevision: true,
      session: { select: { organizerId: true } },
    },
  });
  const actor = row.notification.actor;
  if (
    !attendee ||
    !actor ||
    actor.id !== attendee.session.organizerId ||
    row.notification.resourceVersion === null ||
    attendee.followupRevision !== row.notification.resourceVersion
  ) {
    throw new SupersededNotificationError();
  }
  const email = await import("@/lib/email");
  await email.sendSessionFollowupUpdatedEmail({
    to: row.recipient.email,
    recipientName: row.recipient.name,
  });
}

async function dispatchMessageEmail(row: OutboxDispatchRow) {
  const message = await prisma.message.findUnique({
    where: { id: row.notification.resourceId },
    select: { userId: true, conversationId: true },
  });
  const actor = row.notification.actor;
  if (!message || !actor || message.userId !== actor.id) {
    throw new SupersededNotificationError();
  }
  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId: message.conversationId },
    select: { userId: true },
  });
  const participantIds = new Set(
    participants.map((participant) => participant.userId),
  );
  if (
    !participantIds.has(row.recipientId) ||
    !participantIds.has(actor.id) ||
    actor.id === row.recipientId
  ) {
    throw new SupersededNotificationError();
  }
  const email = await import("@/lib/email");
  await email.sendNewMessageEmail({
    to: row.recipient.email,
    recipientName: row.recipient.name,
    senderName: actor.name,
  });
}

async function sendOutboxEmail(row: OutboxDispatchRow) {
  switch (row.notification.type) {
    case "pack_invited":
    case "pack_accepted":
      return dispatchPackEmail(row);
    case "connection_requested":
    case "connection_accepted":
      return dispatchConnectionEmail(row);
    case "mentorship_invited":
    case "mentorship_accepted":
      return dispatchMentorshipEmail(row);
    case "session_scheduled":
    case "session_updated":
    case "session_cancelled":
      return dispatchSessionEmail(row);
    case "session_followup_updated":
      return dispatchSessionFollowupEmail(row);
    case "new_message":
      return dispatchMessageEmail(row);
    default:
      throw new SupersededNotificationError();
  }
}

function retryAt(attempts: number, now: Date): Date {
  const delay =
    RETRY_DELAYS_MS[
      Math.min(Math.max(attempts - 1, 0), RETRY_DELAYS_MS.length - 1)
    ];
  return new Date(now.getTime() + delay);
}

export async function dispatchEmailOutboxById(
  outboxId: string,
): Promise<"sent" | "skipped" | "failed"> {
  const now = new Date();
  try {
    const claimed = await prisma.emailOutbox.updateMany({
      where: {
        id: outboxId,
        attempts: { lt: MAX_EMAIL_ATTEMPTS },
        OR: [
          { status: "pending", nextAttemptAt: { lte: now } },
          { status: "failed", nextAttemptAt: { lte: now } },
          {
            status: "processing",
            lockedAt: { lt: new Date(now.getTime() - STALE_LOCK_MS) },
          },
        ],
      },
      data: {
        status: "processing",
        attempts: { increment: 1 },
        lockedAt: now,
      },
    });
    if (claimed.count !== 1) return "skipped";

    const row = await prisma.emailOutbox.findUnique({
      where: { id: outboxId },
      include: {
        recipient: { select: { id: true, name: true, email: true } },
        notification: {
          include: { actor: { select: { id: true, name: true } } },
        },
      },
    });
    if (
      !row ||
      row.recipientId !== row.notification.recipientId ||
      row.status !== "processing" ||
      row.lockedAt?.getTime() !== now.getTime()
    ) {
      throw new SupersededNotificationError();
    }

    await sendOutboxEmail(row);
    const completed = await prisma.emailOutbox.updateMany({
      where: {
        id: outboxId,
        status: "processing",
        lockedAt: now,
      },
      data: {
        status: "sent",
        sentAt: new Date(),
        lockedAt: null,
        lastErrorKind: null,
        lastSmtpCode: null,
      },
    });
    // A newer Session transition can supersede this row after claim. Never
    // overwrite that terminal decision with `sent`; the email may already be
    // in-flight, but the durable state remains latest-transition-wins and will
    // never retry a superseded intent.
    return completed.count === 1 ? "sent" : "skipped";
  } catch (error) {
    try {
      if (error instanceof SupersededNotificationError) {
        await prisma.emailOutbox.updateMany({
          where: {
            id: outboxId,
            status: "processing",
            lockedAt: now,
          },
          data: {
            status: "superseded",
            lockedAt: null,
            lastErrorKind: null,
            lastSmtpCode: null,
          },
        });
        return "skipped";
      }

      const safe = logSafeError(error);
      const current = await prisma.emailOutbox.findUnique({
        where: { id: outboxId },
        select: {
          attempts: true,
          notificationId: true,
          status: true,
          lockedAt: true,
        },
      });
      if (
        !current ||
        current.status !== "processing" ||
        current.lockedAt?.getTime() !== now.getTime()
      ) {
        return "skipped";
      }
      const failed = await prisma.emailOutbox.updateMany({
        where: {
          id: outboxId,
          status: "processing",
          lockedAt: now,
        },
        data: {
          status: "failed",
          nextAttemptAt: retryAt(current.attempts, now),
          lockedAt: null,
          lastErrorKind: safe.kind,
          lastSmtpCode: safe.smtpCode,
        },
      });
      if (failed.count === 1) {
        logNotificationError(
          "[wepacker:notifications] email dispatch failed",
          { outboxId, notificationId: current.notificationId },
          error,
        );
        return "failed";
      }
      return "skipped";
    } catch (recoveryError) {
      logNotificationError(
        "[wepacker:notifications] email dispatch recovery failed",
        { outboxId },
        recoveryError,
      );
    }
    return "failed";
  }
}

export async function dispatchDueEmailOutbox(limit = 25): Promise<{
  attempted: number;
  sent: number;
  failed: number;
}> {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const now = new Date();
  const rows = await prisma.emailOutbox.findMany({
    where: {
      attempts: { lt: MAX_EMAIL_ATTEMPTS },
      OR: [
        { status: "pending", nextAttemptAt: { lte: now } },
        { status: "failed", nextAttemptAt: { lte: now } },
        {
          status: "processing",
          lockedAt: { lt: new Date(now.getTime() - STALE_LOCK_MS) },
        },
      ],
    },
    select: { id: true },
    orderBy: { nextAttemptAt: "asc" },
    take: safeLimit,
  });
  const results = await Promise.all(
    rows.map((row) => dispatchEmailOutboxById(row.id)),
  );
  return {
    attempted: rows.length,
    sent: results.filter((result) => result === "sent").length,
    failed: results.filter((result) => result === "failed").length,
  };
}

export { MAX_EMAIL_ATTEMPTS };
