"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionAdmin } from "./session";

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function priceToCents(value: string): number {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return 0;
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

function parseLocalDateTime(value: string): Date {
  // input type=datetime-local gives "YYYY-MM-DDTHH:mm" in local time
  return new Date(value);
}

async function requireAdmin() {
  const admin = await getSessionAdmin();
  if (!admin) redirect("/bilheteira/login");
  return admin;
}

function back(path: string, error: string): never {
  redirect(`${path}?error=${encodeURIComponent(error)}`);
}

export async function createEventAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const title = String(formData.get("title") || "").trim();
  const subtitle = String(formData.get("subtitle") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const departmentId = String(formData.get("departmentId") || "");
  const brandIdRaw = String(formData.get("brandId") || "");
  const brandId = brandIdRaw || null;
  const venue = String(formData.get("venue") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const startsAtRaw = String(formData.get("startsAt") || "");
  const doorsAtRaw = String(formData.get("doorsAt") || "");
  const durationRaw = String(formData.get("durationMinutes") || "");
  const capacityRaw = String(formData.get("capacity") || "");
  const coverImage = String(formData.get("coverImage") || "").trim() || null;
  const statusRaw = String(formData.get("status") || "draft");

  if (!title || !description || !departmentId || !venue || !startsAtRaw) {
    back(
      "/bilheteira/admin/events/new",
      "Preenche título, descrição, departamento, local e data."
    );
  }

  const tierNames = formData.getAll("tierName").map((v) => String(v).trim());
  const tierPrices = formData.getAll("tierPrice").map((v) => String(v));
  const tierDescriptions = formData
    .getAll("tierDescription")
    .map((v) => String(v).trim());

  const tiers = tierNames
    .map((name, i) => ({
      name,
      priceCents: priceToCents(tierPrices[i] || "0"),
      description: tierDescriptions[i] || null,
      sortOrder: i,
    }))
    .filter((t) => t.name.length > 0);

  if (tiers.length === 0) {
    back(
      "/bilheteira/admin/events/new",
      "Cria pelo menos uma tier de bilhete."
    );
  }

  const baseSlug = slugify(title) || `evento-${Date.now()}`;
  let slug = baseSlug;
  for (let i = 1; await prisma.event.findUnique({ where: { slug } }); i++) {
    slug = `${baseSlug}-${i}`;
  }

  const event = await prisma.event.create({
    data: {
      slug,
      title,
      subtitle: subtitle || null,
      description,
      departmentId,
      brandId,
      venue,
      address: address || null,
      startsAt: parseLocalDateTime(startsAtRaw),
      doorsAt: doorsAtRaw ? parseLocalDateTime(doorsAtRaw) : null,
      durationMinutes: durationRaw ? Number(durationRaw) : null,
      capacity: capacityRaw ? Number(capacityRaw) : null,
      coverImage,
      status:
        statusRaw === "published" || statusRaw === "draft" ? statusRaw : "draft",
      createdById: admin.id,
      tiers: { create: tiers },
    },
  });

  revalidatePath("/bilheteira/admin");
  revalidatePath("/bilheteira");
  redirect(`/bilheteira/admin/events/${event.id}`);
}

export async function updateEventAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) back("/bilheteira/admin", "Evento inválido.");

  const title = String(formData.get("title") || "").trim();
  const subtitle = String(formData.get("subtitle") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const departmentId = String(formData.get("departmentId") || "");
  const brandIdRaw = String(formData.get("brandId") || "");
  const brandId = brandIdRaw || null;
  const venue = String(formData.get("venue") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const startsAtRaw = String(formData.get("startsAt") || "");
  const doorsAtRaw = String(formData.get("doorsAt") || "");
  const durationRaw = String(formData.get("durationMinutes") || "");
  const capacityRaw = String(formData.get("capacity") || "");
  const coverImage = String(formData.get("coverImage") || "").trim() || null;
  const statusRaw = String(formData.get("status") || "draft");

  if (!title || !description || !departmentId || !venue || !startsAtRaw) {
    back(
      `/bilheteira/admin/events/${id}`,
      "Preenche todos os campos obrigatórios."
    );
  }

  await prisma.event.update({
    where: { id },
    data: {
      title,
      subtitle: subtitle || null,
      description,
      departmentId,
      brandId,
      venue,
      address: address || null,
      startsAt: parseLocalDateTime(startsAtRaw),
      doorsAt: doorsAtRaw ? parseLocalDateTime(doorsAtRaw) : null,
      durationMinutes: durationRaw ? Number(durationRaw) : null,
      capacity: capacityRaw ? Number(capacityRaw) : null,
      coverImage,
      status: ["draft", "published", "cancelled", "completed"].includes(
        statusRaw
      )
        ? (statusRaw as "draft" | "published" | "cancelled" | "completed")
        : "draft",
    },
  });

  revalidatePath("/bilheteira/admin");
  revalidatePath("/bilheteira");
  revalidatePath(`/bilheteira/admin/events/${id}`);
  redirect(`/bilheteira/admin/events/${id}?saved=1`);
}

export async function addTierAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const eventId = String(formData.get("eventId") || "");
  const name = String(formData.get("name") || "").trim();
  const priceRaw = String(formData.get("price") || "0");
  const description = String(formData.get("description") || "").trim() || null;
  const quantityRaw = String(formData.get("quantity") || "");

  if (!eventId || !name) {
    back(`/bilheteira/admin/events/${eventId}`, "Nome da tier é obrigatório.");
  }

  const count = await prisma.ticketTier.count({ where: { eventId } });
  await prisma.ticketTier.create({
    data: {
      eventId,
      name,
      priceCents: priceToCents(priceRaw),
      description,
      quantity: quantityRaw ? Number(quantityRaw) : null,
      sortOrder: count,
    },
  });
  revalidatePath(`/bilheteira/admin/events/${eventId}`);
  revalidatePath(`/bilheteira`);
  redirect(`/bilheteira/admin/events/${eventId}`);
}

export async function deleteTierAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const eventId = String(formData.get("eventId") || "");
  if (!id) back(`/bilheteira/admin/events/${eventId}`, "Tier inválida.");

  const ticketCount = await prisma.ticket.count({ where: { tierId: id } });
  if (ticketCount > 0) {
    back(
      `/bilheteira/admin/events/${eventId}`,
      "Não é possível apagar uma tier com bilhetes emitidos."
    );
  }
  await prisma.ticketTier.delete({ where: { id } });
  revalidatePath(`/bilheteira/admin/events/${eventId}`);
  redirect(`/bilheteira/admin/events/${eventId}`);
}

export async function createManualTicketAction(
  formData: FormData
): Promise<void> {
  await requireAdmin();
  const eventId = String(formData.get("eventId") || "");
  const tierId = String(formData.get("tierId") || "");
  const buyerName = String(formData.get("buyerName") || "").trim();
  const buyerEmail =
    String(formData.get("buyerEmail") || "")
      .trim()
      .toLowerCase() || "manual@wepac.pt";
  const seatsRaw = String(formData.get("seats") || "1");

  if (!eventId || !tierId || !buyerName) {
    back(
      `/bilheteira/admin/events/${eventId}`,
      "Preenche nome, tier e evento."
    );
  }

  const tier = await prisma.ticketTier.findUnique({ where: { id: tierId } });
  if (!tier) back(`/bilheteira/admin/events/${eventId}`, "Tier inexistente.");

  await prisma.ticket.create({
    data: {
      eventId,
      tierId,
      buyerName,
      buyerEmail,
      seats: Math.max(1, Math.min(20, Number(seatsRaw) || 1)),
      priceCents: tier.priceCents,
    },
  });
  revalidatePath(`/bilheteira/admin/events/${eventId}`);
  redirect(`/bilheteira/admin/events/${eventId}`);
}

export async function checkInTicketAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const eventId = String(formData.get("eventId") || "");
  if (!id) back(`/bilheteira/admin/events/${eventId}`, "Bilhete inválido.");

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) back(`/bilheteira/admin/events/${eventId}`, "Bilhete não encontrado.");

  if (ticket.checkedInAt) {
    await prisma.ticket.update({
      where: { id },
      data: { checkedInAt: null, status: "pending" },
    });
  } else {
    await prisma.ticket.update({
      where: { id },
      data: { checkedInAt: new Date(), status: "checked_in" },
    });
  }
  revalidatePath(`/bilheteira/admin/events/${eventId}`);
  redirect(`/bilheteira/admin/events/${eventId}`);
}

export async function deleteTicketAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const eventId = String(formData.get("eventId") || "");
  if (!id) back(`/bilheteira/admin/events/${eventId}`, "Bilhete inválido.");
  await prisma.ticket.delete({ where: { id } });
  revalidatePath(`/bilheteira/admin/events/${eventId}`);
  redirect(`/bilheteira/admin/events/${eventId}`);
}
