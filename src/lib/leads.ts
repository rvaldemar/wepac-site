import { prisma } from "@/lib/db";
import { sendLeadNotificationEmail } from "@/lib/email";

export interface SaveLeadInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  eventType?: string | null;
  eventDate?: string | null;
  location?: string | null;
  guestCount?: number | null;
  musicalPreferences?: string | null;
  ensemble?: string | null;
  estimatedBudget?: string | null;
  notes?: string | null;
  conversationHistory?: unknown;
  consentGiven?: boolean;
}

export async function saveLead(input: SaveLeadInput) {
  // Upsert by email within 24h to avoid duplicates
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  if (input.email) {
    const existing = await prisma.lead.findFirst({
      where: {
        email: input.email,
        createdAt: { gte: oneDayAgo },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      const updated = await prisma.lead.update({
        where: { id: existing.id },
        data: {
          name: input.name || existing.name,
          phone: input.phone || existing.phone,
          eventType: input.eventType || existing.eventType,
          eventDate: input.eventDate || existing.eventDate,
          location: input.location || existing.location,
          guestCount: input.guestCount ?? existing.guestCount,
          musicalPreferences:
            input.musicalPreferences || existing.musicalPreferences,
          ensemble: input.ensemble || existing.ensemble,
          estimatedBudget: input.estimatedBudget || existing.estimatedBudget,
          notes: input.notes || existing.notes,
          conversationHistory:
            (input.conversationHistory as object) ??
            (existing.conversationHistory as object),
        },
      });
      return { lead: updated, isNew: false };
    }
  }

  const lead = await prisma.lead.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      eventType: input.eventType,
      eventDate: input.eventDate,
      location: input.location,
      guestCount: input.guestCount,
      musicalPreferences: input.musicalPreferences,
      ensemble: input.ensemble,
      estimatedBudget: input.estimatedBudget,
      notes: input.notes,
      conversationHistory: input.conversationHistory as object,
      source: "chat",
      consentGiven: input.consentGiven ?? false,
      consentTimestamp: input.consentGiven ? new Date() : null,
    },
  });

  // Send email notification (fire-and-forget)
  sendLeadNotificationEmail({ ...input, name: lead.name, source: "chat" });

  return { lead, isNew: true };
}
