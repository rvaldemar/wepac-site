import { NextResponse } from "next/server";
import { requireRole } from "@/lib/wepacker/guards";
import { dispatchDueEmailOutbox } from "@/lib/wepacker/notifications";

// Admin-only recovery endpoint. The normal path attempts delivery after the
// domain transaction commits; this recovers due/stale durable intents.
export async function POST() {
  try {
    await requireRole(["admin"]);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await dispatchDueEmailOutbox();
  return NextResponse.json(result);
}
