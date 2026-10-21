import { NextResponse } from "next/server";

export function GET() {
  return new NextResponse(null, {
    status: 308,
    headers: {
      Location: "/convites/quem-e-o-teu-mestre",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
