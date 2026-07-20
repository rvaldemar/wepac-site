"use server";

import { prisma } from "@/lib/db";
import { sendLeadNotificationEmail } from "@/lib/email";

// Public: persists a /contacto form submission into the central leads
// inbox (in addition to the formsubmit.co email the page already sends).
export async function submitContactLead(data: {
  name: string;
  email: string;
  subject?: string;
  message: string;
  ensemble?: string;
  service?: string;
  total?: string;
}) {
  const name = data.name?.trim();
  const email = data.email?.trim().toLowerCase();
  const message = data.message?.trim();
  if (!name || !email || !message) {
    throw new Error("Nome, email e mensagem são obrigatórios.");
  }

  const notes = data.subject ? `${data.subject.trim()}\n\n${message}` : message;

  const lead = await prisma.lead.create({
    data: {
      name,
      email,
      eventType: data.service || null,
      ensemble: data.ensemble || null,
      estimatedBudget: data.total || null,
      notes,
      source: "contact",
      consentGiven: true,
      consentTimestamp: new Date(),
    },
  });

  sendLeadNotificationEmail({
    name,
    email,
    eventType: data.service || null,
    ensemble: data.ensemble || null,
    estimatedBudget: data.total || null,
    notes,
    source: "contact",
  }).catch(console.error);

  return { id: lead.id };
}
