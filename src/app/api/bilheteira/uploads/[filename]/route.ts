import { NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { uploadsDir } from "@/lib/bilheteira/uploads";

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  if (!/^[a-zA-Z0-9._-]+$/.test(filename) || filename.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const dir = uploadsDir();
  const filePath = path.join(dir, filename);
  // Paranoia: ensure the resolved path is inside uploads dir.
  if (!path.resolve(filePath).startsWith(path.resolve(dir))) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const [buf, info] = await Promise.all([readFile(filePath), stat(filePath)]);
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const mime = MIME_BY_EXT[ext] || "application/octet-stream";
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Content-Length": String(info.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
