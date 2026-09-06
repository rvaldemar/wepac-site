"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { getSessionAdmin } from "./session";
import {
  uploadsDir,
  extForMime,
  publicUrlForFile,
  MAX_UPLOAD_BYTES,
} from "./uploads";

async function requireAdmin() {
  const admin = await getSessionAdmin();
  if (!admin) redirect("/bilheteira/login");
  return admin;
}

function back(path: string, error: string): never {
  redirect(`${path}?error=${encodeURIComponent(error)}`);
}

export async function uploadEventCoverAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const eventId = String(formData.get("eventId") || "");
  const file = formData.get("file");
  const backPath = `/bilheteira/admin/events/${eventId}`;

  if (!eventId) back("/bilheteira/admin", "Evento inválido.");
  if (!(file instanceof File) || file.size === 0) {
    back(backPath, "Nenhum ficheiro enviado.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    back(backPath, "Imagem demasiado grande (máx. 5MB).");
  }

  const ext = extForMime(file.type);
  if (!ext) {
    back(backPath, "Formato não suportado. Usa JPG, PNG, WEBP ou GIF.");
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) back("/bilheteira/admin", "Evento não encontrado.");

  const dir = uploadsDir();
  await mkdir(dir, { recursive: true });

  const filename = `${eventId}-${randomBytes(6).toString("hex")}.${ext}`;
  const filePath = path.join(dir, filename);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, bytes);

  // Keep prior assets: issued emails still reference their immutable URLs.
  // Compare-and-swap prevents a concurrent replacement from being overwritten.
  try {
    const result = await prisma.event.updateMany({
      where: { id: eventId, coverImage: event.coverImage },
      data: { coverImage: publicUrlForFile(filename) },
    });
    if (result.count !== 1) throw new Error("Cover changed concurrently");
  } catch {
    await unlink(filePath).catch(() => {});
    back(backPath, "Não foi possível guardar a imagem. A imagem anterior foi preservada. Recarrega a página e tenta novamente.");
  }

  revalidatePath(backPath);
  revalidatePath("/bilheteira");
  revalidatePath(`/bilheteira/${event.slug}`);
  redirect(`${backPath}?saved=1`);
}

export async function removeEventCoverAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const eventId = String(formData.get("eventId") || "");
  const backPath = `/bilheteira/admin/events/${eventId}`;
  if (!eventId) back("/bilheteira/admin", "Evento inválido.");

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) back("/bilheteira/admin", "Evento não encontrado.");

  if (formData.get("confirmRemove") !== "yes") {
    back(backPath, "Confirma a remoção. Para substituir a imagem, envia diretamente o novo ficheiro.");
  }

  // Detach only; retain the asset for issued emails and recovery.
  const removed = await prisma.event.updateMany({
    where: { id: eventId, coverImage: event.coverImage },
    data: { coverImage: null },
  });
  if (removed.count !== 1) back(backPath, "A imagem mudou. Recarrega a página.");

  revalidatePath(backPath);
  revalidatePath("/bilheteira");
  revalidatePath(`/bilheteira/${event.slug}`);
  redirect(`${backPath}?saved=1`);
}
