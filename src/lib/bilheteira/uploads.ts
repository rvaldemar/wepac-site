import path from "node:path";

export function uploadsDir(): string {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
}

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function extForMime(mime: string): string | null {
  return EXT_BY_MIME[mime.toLowerCase()] || null;
}

export function publicUrlForFile(filename: string): string {
  return `/api/bilheteira/uploads/${filename}`;
}

export function filenameFromPublicUrl(url: string): string | null {
  const prefix = "/api/bilheteira/uploads/";
  if (!url.startsWith(prefix)) return null;
  const name = url.slice(prefix.length);
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) return null;
  return name;
}
