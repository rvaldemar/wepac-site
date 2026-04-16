import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(req: NextRequest) {
  const adminKey = req.headers.get("x-sn-admin-key");
  if (!adminKey || adminKey !== process.env.SN_ADMIN_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";

  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  const existing = await prisma.semNomeTicket.findUnique({ where: { id: token } });
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.semNomeTicket.delete({ where: { id: token } });

  return NextResponse.json({ ok: true });
}
