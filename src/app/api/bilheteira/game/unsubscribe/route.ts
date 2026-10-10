import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyUnsubscribeToken } from "@/lib/bilheteira/game/unsubscribe-token";

export const dynamic = "force-dynamic";

function page(title: string, body: string, status = 200) {
  return new NextResponse(
    `<!doctype html><html lang="pt-PT"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title></head><body style="margin:0;background:#0B0A09;color:#F0EDE6;font-family:Inter,Arial,sans-serif;display:grid;place-items:center;min-height:100vh;padding:24px;text-align:center"><div><p style="font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:#DC4A32;margin:0 0 16px">Arte à Capela</p><h1 style="font-family:Georgia,serif;font-weight:500;font-size:32px;margin:0 0 12px">${title}</h1><p style="color:#DEE0DB;max-width:36em;margin:0 auto">${body}</p></div></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );
}

/** GET /api/bilheteira/game/unsubscribe?t=<token> — withdraws marketing consent. */
export async function GET(req: NextRequest) {
  const id = verifyUnsubscribeToken(req.nextUrl.searchParams.get("t") ?? "");
  if (!id) return page("Ligação inválida", "Esta ligação de cancelamento não é válida. Escreve para info@wepac.pt.", 400);
  await prisma.gameParticipant.updateMany({
    where: { id, marketingConsentAt: { not: null } },
    data: { marketingConsentAt: null },
  });
  return page(
    "Consentimento retirado",
    "Deixámos de usar o teu email para comunicações de marketing da WEPAC e da Arte à Capela. O teu prémio continua válido.",
  );
}
