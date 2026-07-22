"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import type { BetaSignupStatus } from "@prisma/client";
import {
  sendBetaSignupConfirmationEmail,
  sendBetaSignupNotificationEmail,
} from "@/lib/email";
import { requireAdmin } from "@/lib/wepacker/guards";
import { VisitorRateLimiter, getVisitorIp } from "@/lib/wessex/rate-limit";

// "wepacker" is the sentinel slug of the generic intake (no pack chosen).
const GENERIC_PACK_SLUG = "wepacker";

// Dedicated instance: reuses the same tested VisitorRateLimiter
// implementation (windows/limits/cleanup) as the public Wessex chat
// endpoint (src/lib/wessex/rate-limit.ts), but keeps its own per-IP
// counters. This is an unrelated public surface — a burst of chat
// messages from a visitor must not exhaust their application budget,
// or vice versa.
const applicationRateLimiter = new VisitorRateLimiter();

// submitApplication is a Server Action, not a route handler, so there is
// no `Request` to read off directly — reconstruct just enough of one from
// the incoming request headers (via next/headers) for getVisitorIp, which
// only ever reads the two proxy headers below.
async function getApplicationVisitorIp(): Promise<string> {
  const incoming = await headers();
  const forwardedHeaders: Record<string, string> = {};
  const realIp = incoming.get("x-real-ip");
  if (realIp) forwardedHeaders["x-real-ip"] = realIp;
  const forwardedFor = incoming.get("x-forwarded-for");
  if (forwardedFor) forwardedHeaders["x-forwarded-for"] = forwardedFor;
  return getVisitorIp(new Request("http://localhost/", { headers: forwardedHeaders }));
}

// Public candidatura — feeds the existing beta_signups pipeline, tagged
// with the target pack or with the generic WEPACKER intake sentinel.
export async function submitApplication(data: {
  packSlug: string;
  name: string;
  email: string;
  phone?: string;
  area?: string;
  socialLinks?: string;
  motivation?: string;
}) {
  // Unauthenticated public write that also fires two emails per call —
  // rate limit before doing any other work. See rate-limit.ts for the
  // windows/limits and their rationale.
  const visitorIp = await getApplicationVisitorIp();
  const rateLimitResult = applicationRateLimiter.check(visitorIp);
  if (!rateLimitResult.allowed) {
    throw new Error(
      "Já recebemos várias candidaturas tuas num curto espaço de tempo. Espera um pouco e tenta novamente."
    );
  }

  const name = data.name?.trim();
  const email = data.email?.trim().toLowerCase();
  if (!name || !email) throw new Error("Nome e email são obrigatórios.");

  let packSlug: string = GENERIC_PACK_SLUG;
  if (data.packSlug !== GENERIC_PACK_SLUG) {
    const pack = await prisma.pack.findUnique({
      where: { slug: data.packSlug },
      select: { slug: true, active: true },
    });
    if (!pack || !pack.active) throw new Error("Pack inválido.");
    packSlug = pack.slug;
  }

  // An application is unique per (person, offer) — email + packSlug —
  // not per person: the same human can hold a standing application to
  // several WEPAC offers (Society, Summer University, Clínica, ...) at
  // once. Look up the specific offer this submission targets first.
  const existing = await prisma.betaSignup.findUnique({
    where: { email_packSlug: { email, packSlug } },
    select: { status: true, packSlug: true, notes: true },
  });

  // The generic sentinel has no offer of its own to look up against, so an
  // exact (email, "wepacker") match only ever fires for a genuine repeat
  // generic submission. A *first* generic submission from someone who
  // already has a specific-offer application on file is still the same
  // repeat-application case the bug fix below targets — look for that
  // specific row too, so the generic form doesn't quietly spin up a second,
  // separate "wepacker" application next to it. Ties (more than one
  // specific offer already on file) resolve to the most recent.
  const existingSpecificForGeneric =
    packSlug === GENERIC_PACK_SLUG && !existing
      ? await prisma.betaSignup.findFirst({
          where: { email, packSlug: { not: GENERIC_PACK_SLUG } },
          select: { status: true, packSlug: true, notes: true },
          orderBy: { createdAt: "desc" },
        })
      : null;

  const matchedExisting = existing ?? existingSpecificForGeneric;

  // Bug fix: without this, a rejected/contacted candidate who applies
  // again to an offer they already applied to gets the confirmation email
  // and has their answers overwritten, yet the row keeps its old status
  // and never returns to the pending queue an admin actually looks at —
  // the application is silently lost. Also preserve a specific pack: a
  // later resubmission through the generic intake must not overwrite a
  // more specific packSlug already on file.
  let finalPackSlug = packSlug;
  let notesForUpdate: string | undefined;
  let statusForUpdate: BetaSignupStatus | undefined;
  if (matchedExisting) {
    if (
      packSlug === GENERIC_PACK_SLUG &&
      matchedExisting.packSlug !== GENERIC_PACK_SLUG
    ) {
      finalPackSlug = matchedExisting.packSlug;
    }

    // Not surfaced anywhere new: `notes` already renders as "Notas
    // internas" in the admin leads inbox (page-client.tsx), so this is
    // the simplest way to give an admin the reapplication history
    // without touching that screen.
    const reapplicationNote = `[Reaplicação ${new Date().toISOString()}] Estado anterior: ${matchedExisting.status}.`;
    notesForUpdate = matchedExisting.notes
      ? `${matchedExisting.notes}\n${reapplicationNote}`
      : reapplicationNote;
    statusForUpdate = "pending";
  }

  const signup = await prisma.betaSignup.upsert({
    where: { email_packSlug: { email, packSlug: finalPackSlug } },
    update: {
      name,
      phone: data.phone || undefined,
      artisticArea: data.area || undefined,
      socialLinks: data.socialLinks || undefined,
      motivation: data.motivation || undefined,
      notes: notesForUpdate,
      status: statusForUpdate,
    },
    create: {
      name,
      email,
      phone: data.phone || null,
      artisticArea: data.area || null,
      socialLinks: data.socialLinks || null,
      motivation: data.motivation || null,
      packSlug: finalPackSlug,
    },
  });

  sendBetaSignupConfirmationEmail(name, email).catch(console.error);
  sendBetaSignupNotificationEmail(name, email, data.area).catch(console.error);

  return { id: signup.id };
}

// ===== ADMIN PIPELINE =====

export async function getApplications(status?: BetaSignupStatus) {
  await requireAdmin();
  return prisma.betaSignup.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export async function updateApplicationStatus(
  id: string,
  status: BetaSignupStatus
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
