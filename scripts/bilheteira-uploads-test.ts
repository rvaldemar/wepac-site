/**
 * Tests for the bilheteira cover-image upload + ticket preview feature.
 *
 * Usage:
 *   npx tsx scripts/bilheteira-uploads-test.ts
 *
 * Requires dev server running on http://localhost:3000 + seed DB.
 */

import { PrismaClient } from "@prisma/client";
import { createHmac, randomBytes } from "node:crypto";
import { mkdir, writeFile, unlink, readFile, stat } from "node:fs/promises";
import path from "node:path";
import {
  uploadsDir,
  extForMime,
  publicUrlForFile,
  filenameFromPublicUrl,
  MAX_UPLOAD_BYTES,
} from "../src/lib/bilheteira/uploads";

const prisma = new PrismaClient();
const BASE = process.env.APP_URL || "http://localhost:3000";
const SECRET = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
if (!SECRET) throw new Error("NEXTAUTH_SECRET required");

type Result = { name: string; ok: boolean; detail?: string };
const results: Result[] = [];

function record(name: string, ok: boolean, detail?: string) {
  results.push({ name, ok, detail });
  const tag = ok ? "✓" : "✗";
  console.log(detail ? `${tag} ${name} — ${detail}` : `${tag} ${name}`);
}

function base64UrlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signSession(adminId: string, email: string): string {
  const payload = JSON.stringify({ adminId, email, issuedAt: Date.now() });
  const body = base64UrlEncode(Buffer.from(payload));
  const mac = createHmac("sha256", SECRET!).update(body).digest();
  const sig = base64UrlEncode(mac);
  return `${body}.${sig}`;
}

async function get(p: string, cookie?: string) {
  const headers: Record<string, string> = {};
  if (cookie) headers.cookie = cookie;
  const res = await fetch(`${BASE}${p}`, { headers, redirect: "manual" });
  return {
    status: res.status,
    body: await res.text(),
    contentType: res.headers.get("content-type") || "",
    location: res.headers.get("location") || undefined,
  };
}

async function getBinary(p: string) {
  const res = await fetch(`${BASE}${p}`, { redirect: "manual" });
  const buf = Buffer.from(await res.arrayBuffer());
  return {
    status: res.status,
    buf,
    contentType: res.headers.get("content-type") || "",
    cacheControl: res.headers.get("cache-control") || "",
  };
}

// 1×1 transparent PNG
const PNG_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgAAIAAAUAAen63NgAAAAASUVORK5CYII=",
  "base64"
);

async function main() {
  console.log(`━━━ Uploads + preview tests (against ${BASE}) ━━━\n`);

  // ---- Unit: uploads lib helpers ----
  console.log("━━━ uploads.ts unit helpers ━━━");

  record(
    "extForMime('image/png') → 'png'",
    extForMime("image/png") === "png"
  );
  record(
    "extForMime('image/jpeg') → 'jpg'",
    extForMime("image/jpeg") === "jpg"
  );
  record(
    "extForMime('IMAGE/WEBP') → 'webp' (case-insensitive)",
    extForMime("IMAGE/WEBP") === "webp"
  );
  record("extForMime('text/plain') → null", extForMime("text/plain") === null);
  record("MAX_UPLOAD_BYTES = 5MB", MAX_UPLOAD_BYTES === 5 * 1024 * 1024);
  record(
    "publicUrlForFile('a.png')",
    publicUrlForFile("a.png") === "/api/bilheteira/uploads/a.png"
  );
  record(
    "filenameFromPublicUrl round-trip",
    filenameFromPublicUrl("/api/bilheteira/uploads/abc.png") === "abc.png"
  );
  record(
    "filenameFromPublicUrl rejects path traversal",
    filenameFromPublicUrl("/api/bilheteira/uploads/../etc/passwd") === null
  );
  record(
    "filenameFromPublicUrl rejects foreign URL",
    filenameFromPublicUrl("https://example.com/foo.png") === null
  );
  record(
    "uploadsDir() returns absolute path",
    path.isAbsolute(uploadsDir())
  );

  // ---- API route: /api/bilheteira/uploads/[filename] ----
  console.log("\n━━━ /api/bilheteira/uploads/[filename] route ━━━");

  const notFound = await getBinary(
    "/api/bilheteira/uploads/does-not-exist.png"
  );
  record("missing file → 404", notFound.status === 404);

  const badName = await getBinary("/api/bilheteira/uploads/abc%2F..%2Fetc");
  record(
    "path-traversal → 404 (status=" + badName.status + ")",
    badName.status === 404
  );

  // Write a real file into UPLOAD_DIR and fetch it back
  const dir = uploadsDir();
  await mkdir(dir, { recursive: true });
  const testName = `test-${randomBytes(4).toString("hex")}.png`;
  const testPath = path.join(dir, testName);
  await writeFile(testPath, PNG_BYTES);

  const fetched = await getBinary(`/api/bilheteira/uploads/${testName}`);
  record(
    "written file → 200",
    fetched.status === 200,
    `status=${fetched.status}`
  );
  record(
    "content-type = image/png",
    fetched.contentType.includes("image/png")
  );
  record(
    "bytes match what we wrote",
    Buffer.compare(fetched.buf, PNG_BYTES) === 0
  );
  record(
    "Cache-Control is immutable",
    fetched.cacheControl.includes("immutable")
  );

  // ---- Admin event page: preview + upload markers ----
  console.log("\n━━━ admin event edit page: new sections ━━━");

  const seedAdmin = await prisma.ticketingAdmin.findUnique({
    where: { email: "admin@wepac.pt" },
  });
  if (!seedAdmin) throw new Error("Seed admin missing — run prisma db seed");
  const event = await prisma.event.findUnique({
    where: { slug: "ananda-roda-iberia-antiga-2026-04-23" },
    include: { tiers: true, brand: true },
  });
  if (!event) throw new Error("Seed event missing");

  const cookie = `bilheteira_session=${signSession(seedAdmin.id, seedAdmin.email)}`;
  const adminPage = await get(
    `/bilheteira/admin/events/${event.id}`,
    cookie
  );
  record("admin event page → 200", adminPage.status === 200);
  record(
    "page contains 'Pré-visualização do bilhete'",
    adminPage.body.includes("Pré-visualização do bilhete")
  );
  record(
    "page contains 'Imagem de capa'",
    adminPage.body.includes("Imagem de capa")
  );
  record(
    "page contains 'Carregar imagem' upload label",
    adminPage.body.includes("Carregar imagem")
  );
  record(
    "page contains placeholder name 'Maria Exemplo'",
    adminPage.body.includes("Maria Exemplo")
  );
  record(
    "page contains placeholder serial 'BT-001'",
    adminPage.body.includes("BT-001")
  );
  record(
    "page shows event title inside ticket preview (no brand → TicketView)",
    adminPage.body.includes(event.title)
  );
  if (event.brand?.slug === "capela-viva") {
    record(
      "page uses CapelaVivaTicketView markers (cv- prefix)",
      adminPage.body.includes("cv-")
    );
  } else {
    record(
      "page uses TicketView markers (bt- prefix)",
      adminPage.body.includes("bt-") || adminPage.body.includes("BT-001")
    );
  }

  // ---- coverImage round-trip: set via DB, check appears in pages ----
  console.log("\n━━━ coverImage round-trip ━━━");

  const coverUrl = publicUrlForFile(testName);
  await prisma.event.update({
    where: { id: event.id },
    data: { coverImage: coverUrl },
  });

  const adminPageWithCover = await get(
    `/bilheteira/admin/events/${event.id}`,
    cookie
  );
  record(
    "admin page renders current cover <img>",
    adminPageWithCover.body.includes(`src="${coverUrl}"`)
  );
  record(
    "admin page shows 'Remover imagem' button",
    adminPageWithCover.body.includes("Remover imagem")
  );
  record(
    "admin page shows the cover URL text",
    adminPageWithCover.body.includes(coverUrl)
  );

  // Image should be reachable through the API route
  const imageFetch = await getBinary(coverUrl);
  record(
    `GET ${coverUrl} → 200 via API route`,
    imageFetch.status === 200
  );

  // Public event page renders cover as hero.
  const publicEvent = await get(`/bilheteira/${event.slug}`);
  record(
    "public event page references coverImage",
    publicEvent.body.includes(coverUrl)
  );

  // Ticket page renders the uploaded image (Capela Viva photo OR bt-cover)
  const ticket = await prisma.ticket.create({
    data: {
      eventId: event.id,
      tierId: event.tiers[0].id,
      buyerName: "Teste Cover",
      buyerEmail: "teste-cover@example.com",
      seats: 1,
      priceCents: event.tiers[0].priceCents,
    },
  });
  const ticketPage = await get(`/bilheteira/ticket/${ticket.id}`);
  record(
    "ticket page 200",
    ticketPage.status === 200,
    `status=${ticketPage.status}`
  );
  record(
    "ticket page uses uploaded coverImage",
    ticketPage.body.includes(coverUrl)
  );
  if (event.brand?.slug === "capela-viva") {
    record(
      "capela-viva: uploaded cover replaces default photo",
      !ticketPage.body.includes("/bilheteira/capela-viva/ananda-roda.jpeg")
    );
  }
  await prisma.ticket.delete({ where: { id: ticket.id } });

  // ---- Cleanup ----
  console.log("\n━━━ Cleanup ━━━");
  await prisma.event.update({
    where: { id: event.id },
    data: { coverImage: null },
  });
  try {
    await unlink(testPath);
  } catch {
    // ignore
  }
  record("restored event.coverImage = null + test file removed", true);

  // ---- Summary ----
  console.log(`\n━━━ Summary ━━━`);
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  console.log(`${passed}/${results.length} passed`);
  if (failed.length) {
    console.log(`\nFailed:`);
    for (const f of failed)
      console.log(`  ✗ ${f.name}${f.detail ? " — " + f.detail : ""}`);
    process.exitCode = 1;
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
