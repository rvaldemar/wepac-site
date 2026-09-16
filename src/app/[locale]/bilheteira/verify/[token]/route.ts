import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setSessionCookie } from "@/lib/bilheteira/session";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { token } = await params;
  const base = process.env.APP_URL || "https://wepac.pt";

  const admin = await prisma.ticketingAdmin.findUnique({
    where: { verificationToken: token },
  });

  const now = new Date();
  const expired =
    admin?.verificationExpiresAt && admin.verificationExpiresAt < now;

  if (!admin || expired) {
    return NextResponse.redirect(`${base}/bilheteira/verify-invalid`);
  }

  await prisma.ticketingAdmin.update({
    where: { id: admin.id },
    data: {
      emailVerifiedAt: admin.emailVerifiedAt ?? now,
      verificationToken: null,
      verificationExpiresAt: null,
      lastLoginAt: now,
    },
  });

  await setSessionCookie(admin.id, admin.email);
  return NextResponse.redirect(`${base}/bilheteira/admin?verified=1`);
}
