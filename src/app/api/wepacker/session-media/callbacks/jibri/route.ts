import {
  MAX_CALLBACK_BYTES,
  processJibriCallback,
} from "@/lib/wepacker/session-media/callbacks";
import { readBoundedUtf8Body } from "@/lib/wepacker/session-media/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await processJibriCallback(
      request,
      await readBoundedUtf8Body(request, MAX_CALLBACK_BYTES),
    );
    return Response.json({ accepted: true });
  } catch {
    return Response.json({ accepted: false }, { status: 400 });
  }
}
