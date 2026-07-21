import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { requirePageRole } from "@/lib/wepacker/page-guards";
import { getSessionAttendeePreview } from "@/lib/wepacker/actions/session";
import { SessionCard } from "@/app/wepacker/(platform)/sessions/page-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SessionAttendeePreviewPage({
  params,
}: {
  params: Promise<{ id: string; userId: string }>;
}) {
  noStore();
  await requirePageRole(["mentor", "admin"]);
  const { id, userId } = await params;
  const preview = await getSessionAttendeePreview(id, userId);
  if (!preview) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-8 lg:px-8">
      <div
        role="status"
        className="sticky top-0 z-10 border border-wepac-white/30 bg-wepac-black p-4 shadow-lg"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-wepac-white">
              Previewing {preview.attendee.name}&apos;s Session view
            </p>
            <p className="mt-1 text-xs text-wepac-text-tertiary">
              You are still {preview.viewer.name}. This preview is read-only and
              cannot act as {preview.attendee.name}.
            </p>
          </div>
          <Link
            href={`/wepacker/mentor/sessions/${id}`}
            className="border border-wepac-border px-3 py-1.5 text-xs text-wepac-white hover:bg-wepac-card"
          >
            Exit Preview
          </Link>
        </div>
      </div>

      <section className="mt-8">
        <div className="mb-4">
          <h1 className="font-barlow text-2xl font-bold text-wepac-white">
            Sessions
          </h1>
          <p className="mt-1 text-sm text-wepac-text-tertiary">
            This is the attendee-safe projection of this Session only.
          </p>
        </div>
        <SessionCard
          session={{
            ...preview.session,
            scheduledAt: preview.session.scheduledAt.toISOString(),
          }}
          highlighted={preview.session.status === "scheduled"}
        />
      </section>
    </main>
  );
}
