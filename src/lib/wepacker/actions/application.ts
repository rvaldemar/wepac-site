"use server";

import type { BetaSignupStatus } from "@prisma/client";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import {
  sendBetaSignupConfirmationEmail,
  sendBetaSignupNotificationEmail,
} from "@/lib/email";
import { requireAdmin } from "@/lib/wepacker/guards";
import { logSafeError } from "@/lib/wepacker/log-safe-error";
import {
  getVisitorIpFromHeaders,
  VisitorRateLimiter,
} from "@/lib/wessex/rate-limit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const APPLICATION_KEYS = new Set([
  "name",
  "email",
  "phone",
  "artisticArea",
  "socialLinks",
  "motivation",
]);
const MAX_NAME_LENGTH = 200;
const MAX_EMAIL_LENGTH = 320;
const MAX_PHONE_LENGTH = 64;
const MAX_ARTISTIC_AREA_LENGTH = 200;
const MAX_SOCIAL_LINKS_LENGTH = 2_000;
const MAX_MOTIVATION_LENGTH = 500;
const applicationRateLimiter = new VisitorRateLimiter();

type InputRecord = Record<string, unknown>;

function parseExactRecord(value: unknown): InputRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Application input must be an object.");
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error("Application input has an invalid prototype.");
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string" || !APPLICATION_KEYS.has(key)) {
      throw new Error("Application input contains an unsupported field.");
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !("value" in descriptor)) {
      throw new Error("Application input contains an invalid field.");
    }
  }
  return value as InputRecord;
}

function parseRequiredText(
  record: InputRecord,
  key: "name" | "email",
  maxLength: number,
): string {
  if (typeof record[key] !== "string") {
    throw new Error(`${key} obrigatório.`);
  }
  const value = record[key].trim();
  if (!value) throw new Error(`${key} obrigatório.`);
  if (value.length > maxLength) {
    throw new Error(`${key} não pode exceder ${maxLength} caracteres.`);
  }
  return value;
}

function parseOptionalText(
  record: InputRecord,
  key: "phone" | "artisticArea" | "socialLinks" | "motivation",
  maxLength: number,
): string | null {
  const value = record[key];
  if (value === undefined) return null;
  if (typeof value !== "string") throw new Error(`${key} inválido.`);
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new Error(`${key} não pode exceder ${maxLength} caracteres.`);
  }
  return normalized || null;
}

function isUniqueConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

// Generic WEPACKER intake. Applications are never interpreted as Pack
// Memberships, Cycle Enrollments, Mentorships or relationship consent.
export async function submitApplication(input: unknown) {
  const requestHeaders = await headers();
  const rateLimit = applicationRateLimiter.check(
    getVisitorIpFromHeaders(requestHeaders),
  );
  if (!rateLimit.allowed) {
    throw new Error("Demasiadas tentativas. Tenta novamente mais tarde.");
  }

  const data = parseExactRecord(input);
  const name = parseRequiredText(data, "name", MAX_NAME_LENGTH);
  const email = parseRequiredText(data, "email", MAX_EMAIL_LENGTH).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) throw new Error("Email inválido.");
  const phone = parseOptionalText(data, "phone", MAX_PHONE_LENGTH);
  const artisticArea = parseOptionalText(
    data,
    "artisticArea",
    MAX_ARTISTIC_AREA_LENGTH,
  );
  const socialLinks = parseOptionalText(
    data,
    "socialLinks",
    MAX_SOCIAL_LINKS_LENGTH,
  );
  const motivation = parseOptionalText(
    data,
    "motivation",
    MAX_MOTIVATION_LENGTH,
  );

  try {
    await prisma.betaSignup.create({
      data: {
      name,
        email,
        phone,
        artisticArea,
        socialLinks,
        motivation,
      },
      select: { id: true },
    });
  } catch (error) {
    // Duplicate submissions receive the same acknowledgement but never mutate
    // stored PII or emit another applicant/staff email.
    if (isUniqueConflict(error)) return { submitted: true } as const;
    throw error;
  }

  void sendBetaSignupConfirmationEmail(name, email).catch((error) => {
    console.error("[wepacker intake] confirmation_failed", logSafeError(error));
  });
  void sendBetaSignupNotificationEmail(name, email, artisticArea ?? undefined).catch(
    (error) => {
      console.error(
        "[wepacker intake] staff_notification_failed",
        logSafeError(error),
      );
    },
  );

  return { submitted: true } as const;
}

export async function getApplications(status?: BetaSignupStatus) {
  await requireAdmin();
  return prisma.betaSignup.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export async function updateApplicationStatus(
  id: string,
  status: BetaSignupStatus,
) {
  await requireAdmin();
  return prisma.betaSignup.update({ where: { id }, data: { status } });
}

export async function updateApplicationNotes(id: string, notes: string) {
  await requireAdmin();
  return prisma.betaSignup.update({ where: { id }, data: { notes } });
}

export async function deleteApplication(id: string) {
  await requireAdmin();
  await prisma.betaSignup.delete({ where: { id } });
}
