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
  filenameFromPublicUrl,
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

  // Delete previous upload if it was ours.
  if (event.coverImage) {
    const prev = filenameFromPublicUrl(event.coverImage);
    if (prev) {
      try {
        await unlink(path.join(dir, prev));
      } catch {
        // ignore — file may not exist anymore
      }
    }
  }

  await prisma.event.update({
    where: { id: eventId },
    data: { coverImage: publicUrlForFile(filename) },
  });

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

  if (event.coverImage) {
    const prev = filenameFromPublicUrl(event.coverImage);
    if (prev) {
      try {
        await unlink(path.join(uploadsDir(), prev));
      } catch {
        // ignore
      }
    }
  }

  await prisma.event.update({
    where: { id: eventId },
    data: { coverImage: null },
  });

  revalidatePath(backPath);
  revalidatePath("/bilheteira");
  revalidatePath(`/bilheteira/${event.slug}`);
  redirect(`${backPath}?saved=1`);
}
