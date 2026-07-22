"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { sendLeadNotificationEmail } from "@/lib/email";
import {
  getVisitorIpFromHeaders,
  VisitorRateLimiter,
} from "@/lib/wessex/rate-limit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_KEYS = new Set([
  "name",
  "email",
  "subject",
  "message",
  "ensemble",
  "service",
  "total",
  "honey",
]);
const CONTACT_SUBJECTS = new Set([
  "geral",
  "parcerias",
  "servicos",
  "educacao",
  "media",
]);
const contactRateLimiter = new VisitorRateLimiter();

type InputRecord = Record<string, unknown>;

function parseExactRecord(value: unknown): InputRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Invalid contact input.");
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error("Invalid contact input.");
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string" || !CONTACT_KEYS.has(key)) {
      throw new Error("Invalid contact input.");
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !("value" in descriptor)) {
      throw new Error("Invalid contact input.");
    }
  }
  return value as InputRecord;
}

function requiredText(
  record: InputRecord,
  key: "name" | "email" | "message",
  maxLength: number,
): string {
  const value = record[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Nome, email e mensagem são obrigatórios.");
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) throw new Error("Invalid contact input.");
  return normalized;
}

function optionalText(
  record: InputRecord,
  key: "ensemble" | "service" | "total" | "honey",
  maxLength: number,
): string | null {
  const value = record[key];
  if (value === undefined) return null;
  if (typeof value !== "string") throw new Error("Invalid contact input.");
  const normalized = value.trim();
  if (normalized.length > maxLength) throw new Error("Invalid contact input.");
  return normalized || null;
}

// Public contact requests use request handling as their lawful basis. They are
// not marketing consent and must never set the consent fields implicitly.
export async function submitContactLead(input: unknown) {
  const requestHeaders = await headers();
  const rateLimit = contactRateLimiter.check(
    getVisitorIpFromHeaders(requestHeaders),
  );
  if (!rateLimit.allowed) {
    throw new Error("Demasiadas tentativas. Tenta novamente mais tarde.");
  }

  const data = parseExactRecord(input);
  const honey = optionalText(data, "honey", 200);
  // Quiet acknowledgement prevents the honeypot from becoming an oracle.
  if (honey) return { submitted: true } as const;

  const name = requiredText(data, "name", 200);
  const email = requiredText(data, "email", 320).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) throw new Error("Email inválido.");
  const message = requiredText(data, "message", 10_000);
  const rawSubject = data.subject === undefined ? "geral" : data.subject;
  if (typeof rawSubject !== "string" || !CONTACT_SUBJECTS.has(rawSubject)) {
    throw new Error("Invalid contact input.");
  }
  const ensemble = optionalText(data, "ensemble", 200);
  const service = optionalText(data, "service", 200);
  const total = optionalText(data, "total", 100);
  const notes = `${rawSubject}\n\n${message}`;

  const lead = await prisma.lead.create({
    data: {
      name,
      email,
      eventType: service,
      ensemble,
      estimatedBudget: total,
      notes,
      source: "contact",
      consentGiven: false,
      consentTimestamp: null,
    },
    select: { id: true },
  });

  // The database is canonical; attempt the staff notification before the
  // action returns. The shared email helper scrubs delivery errors.
  await sendLeadNotificationEmail({
    name,
    email,
    eventType: service,
    ensemble,
    estimatedBudget: total,
    notes,
    source: "contact",
  });

  void lead;
  return { submitted: true } as const;
}
