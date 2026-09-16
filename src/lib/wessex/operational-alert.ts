import { prisma } from "@/lib/db";
import { emailTransporter, safeEmailRecipient } from "@/lib/email-security";
import type { ChatErrorCode } from "@/lib/wessex/chat-contract";
import { logSafeError } from "@/lib/wepacker/log-safe-error";

export const WESSEX_OPERATIONAL_ALERT_CODES = [
  "configuration",
  "upstream_auth",
  "upstream_unavailable",
  "invalid_response",
  "stream_failed",
] as const satisfies readonly ChatErrorCode[];

export type WessexOperationalAlertCode =
  (typeof WESSEX_OPERATIONAL_ALERT_CODES)[number];

export function isWessexOperationalAlertCode(
  code: ChatErrorCode,
): code is WessexOperationalAlertCode {
  return WESSEX_OPERATIONAL_ALERT_CODES.some((alertCode) => alertCode === code);
}

const WINDOW_MS = 6 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 4;
const RETRY_DELAYS_MS = [5 * 60_000, 30 * 60_000, 2 * 60 * 60_000] as const;

interface AlertRow {
  id: string;
  code: string;
  attempts: number;
  windowStartedAt: Date;
  status?: string;
  sentAt?: Date | null;
}

export interface WessexOperationalAlertStore {
  enqueue(code: WessexOperationalAlertCode, now: Date): Promise<AlertRow>;
  claim(id: string, now: Date): Promise<AlertRow | null>;
  markSent(id: string, deliveryStartedAt: Date, sentAt: Date): Promise<void>;
  markFailed(
    id: string,
    deliveryStartedAt: Date,
    nextAttemptAt: Date,
    errorKind: string,
    smtpCode: number | null,
  ): Promise<void>;
  due(now: Date, limit: number): Promise<string[]>;
}

function retryAt(attempts: number, now: Date): Date {
  const delay = RETRY_DELAYS_MS[Math.min(attempts - 1, RETRY_DELAYS_MS.length - 1)];
  return new Date(now.getTime() + delay);
}

export function buildWessexOperationalAlertEmail(code: WessexOperationalAlertCode) {
  const subject = `[WEPAC] Wessex chat operational alert: ${code}`;
  const text = [
    "A classified operational failure occurred in the public Wessex chat.",
    `Code: ${code}`,
    "Window: one alert per code every six hours.",
    "Inspect the application service and upstream provider status.",
  ].join("\n");
  return { subject, text };
}

const prismaAlertStore: WessexOperationalAlertStore = {
  async enqueue(code, now) {
    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`wessex-operational-alert:${code}`}, 0))`;
      const existing = await tx.wessexOperationalAlert.findUnique({
        where: { code },
        select: {
          id: true,
          code: true,
          attempts: true,
          windowStartedAt: true,
          status: true,
          sentAt: true,
        },
      });
      if (!existing) {
        return tx.wessexOperationalAlert.create({
          data: { code, windowStartedAt: now },
          select: { id: true, code: true, attempts: true, windowStartedAt: true },
        });
      }
      const cooldownEnded =
        existing.windowStartedAt.getTime() + WINDOW_MS <= now.getTime();
      if (!cooldownEnded) return existing;
      return tx.wessexOperationalAlert.update({
        where: { code },
        data: {
          windowStartedAt: now,
          status: "pending",
          attempts: 0,
          nextAttemptAt: now,
          deliveryStartedAt: null,
          sentAt: null,
          lastErrorKind: null,
          lastSmtpCode: null,
        },
        select: { id: true, code: true, attempts: true, windowStartedAt: true },
      });
    });
  },
  async claim(id, now) {
    const claimedAt = new Date(now);
    const result = await prisma.wessexOperationalAlert.updateMany({
      where: {
        id,
        attempts: { lt: MAX_ATTEMPTS },
        nextAttemptAt: { lte: now },
        status: { in: ["pending", "failed"] },
      },
      data: {
        status: "sending",
        attempts: { increment: 1 },
        deliveryStartedAt: claimedAt,
        windowStartedAt: claimedAt,
      },
    });
    if (result.count !== 1) return null;
    return prisma.wessexOperationalAlert.findUnique({
      where: { id },
      select: { id: true, code: true, attempts: true, windowStartedAt: true },
    });
  },
  async markSent(id, deliveryStartedAt, sentAt) {
    await prisma.wessexOperationalAlert.updateMany({
      where: { id, status: "sending", deliveryStartedAt },
      data: { status: "sent", sentAt, lastErrorKind: null, lastSmtpCode: null },
    });
  },
  async markFailed(id, deliveryStartedAt, nextAttemptAt, errorKind, smtpCode) {
    await prisma.wessexOperationalAlert.updateMany({
      where: { id, status: "sending", deliveryStartedAt },
      data: {
        status: "failed",
        nextAttemptAt,
        lastErrorKind: errorKind,
        lastSmtpCode: smtpCode,
      },
    });
  },
  async due(now, limit) {
    const rows = await prisma.wessexOperationalAlert.findMany({
      where: {
        attempts: { lt: MAX_ATTEMPTS },
        nextAttemptAt: { lte: now },
        status: { in: ["pending", "failed"] },
      },
      select: { id: true },
      orderBy: { nextAttemptAt: "asc" },
      take: Math.max(1, Math.min(limit, 50)),
    });
    return rows.map((row) => row.id);
  },
};

export class WessexOperationalAlerter {
  constructor(
    private readonly store: WessexOperationalAlertStore,
    private readonly send: (message: {
      to: string;
      subject: string;
      text: string;
    }) => Promise<unknown>,
    private readonly recipient: () => string,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async record(code: WessexOperationalAlertCode): Promise<void> {
    const now = this.now();
    const row = await this.store.enqueue(code, now);
    queueMicrotask(() => {
      void this.dispatch(row.id).catch((error) => {
        console.error("[wessex alert] immediate_dispatch_failed", logSafeError(error));
      });
    });
  }

  async dispatchDue(limit = 10): Promise<void> {
    const ids = await this.store.due(this.now(), limit);
    await Promise.all(ids.map((id) => this.dispatch(id)));
  }

  private async dispatch(id: string): Promise<void> {
    const claimedAt = this.now();
    const row = await this.store.claim(id, claimedAt);
    if (!row || !WESSEX_OPERATIONAL_ALERT_CODES.includes(row.code as WessexOperationalAlertCode)) {
      return;
    }
    const code = row.code as WessexOperationalAlertCode;
    try {
      const to = safeEmailRecipient(this.recipient());
      await this.send({ to, ...buildWessexOperationalAlertEmail(code) });
    } catch (error) {
      const safe = logSafeError(error);
      try {
        await this.store.markFailed(
          id,
          claimedAt,
          retryAt(row.attempts, this.now()),
          safe.kind,
          safe.smtpCode,
        );
      } catch (persistenceError) {
        console.error("[wessex alert] retry_state_failed", {
          code,
          ...logSafeError(persistenceError),
        });
        return;
      }
      console.error("[wessex alert] delivery_failed", { code, ...safe });
      return;
    }
    try {
      await this.store.markSent(id, claimedAt, this.now());
    } catch (error) {
      // The SMTP result is now ambiguous to future processes. Leave `sending`
      // terminal until the six-hour cooldown expires rather than risk a duplicate.
      console.error("[wessex alert] delivery_ack_failed", {
        code,
        ...logSafeError(error),
      });
    }
  }
}

export const wessexOperationalAlerter = new WessexOperationalAlerter(
  prismaAlertStore,
  (message) => emailTransporter.sendMail({
    from: process.env.SMTP_FROM || "info@wepac.pt",
    ...message,
  }),
  () => process.env.WESSEX_ALERT_EMAIL || process.env.SMTP_FROM || "info@wepac.pt",
);
