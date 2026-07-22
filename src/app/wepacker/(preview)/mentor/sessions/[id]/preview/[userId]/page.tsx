import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/wepacker/page-guards";
import {
  getSessionAttendeeSupportProjection,
  revokeAdminSessionAttendeePreviewGrant,
} from "@/lib/wepacker/actions/session-attendee-preview";
import { getAdminSupportPreviewGrantFromCookie } from "@/lib/wepacker/support-preview-security";
import { SESSION_KIND_LABELS } from "@/lib/wepacker/types";
import { AdminPreviewGate } from "./admin-preview-gate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};

function firstQueryValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SessionAttendeePreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; userId: string }>;
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  noStore();
  const actor = await requirePageUser();
  const [{ id, userId }, query] = await Promise.all([params, searchParams]);
  const errorCode = firstQueryValue(query.error);
  const grantId =
    actor.role === "admin"
      ? await getAdminSupportPreviewGrantFromCookie(id, userId)
      : null;

  const preview = await getSessionAttendeeSupportProjection(
    id,
    userId,
    grantId ?? undefined,
  );
  if (!preview) {
    if (actor.role === "admin") {
      return (
        <AdminPreviewGate
          sessionId={id}
          attendeeUserId={userId}
          errorCode={grantId ? "access_expired" : errorCode}
        />
      );
    }
    notFound();
  }

  const isAdminPreview = preview.accessMode === "admin_support";
  const revokeGrant = isAdminPreview
    ? revokeAdminSessionAttendeePreviewGrant.bind(null, id, userId)
    : null;

  return (
    <div className="min-h-screen px-6 py-8 lg:px-8">
      <header
        role="banner"
        aria-label="Read-only attendee preview"
        className="sticky top-0 z-10 mx-auto max-w-4xl border border-wepac-white/30 bg-wepac-black p-4 shadow-lg"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-wepac-white">
              Read-only preview: {preview.attendee.name}&apos;s Session view
            </p>
            <p className="mt-1 text-xs text-wepac-text-tertiary">
              You are still {preview.viewer.name}. This projection cannot act as
              {" "}
              {preview.attendee.name} or use attendee mutations.
            </p>
            {isAdminPreview && preview.accessExpiresAt && (
              <p className="mt-1 text-xs text-wepac-warning">
                Admin support access expires at{" "}
                {preview.accessExpiresAt.toLocaleTimeString("pt-PT", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                .
              </p>
            )}
          </div>
          {revokeGrant ? (
            <form action={revokeGrant}>
              <button
                type="submit"
                className="border border-wepac-border px-3 py-1.5 text-xs text-wepac-white hover:bg-wepac-card"
              >
                Exit &amp; revoke access
              </button>
            </form>
          ) : (
            <Link
              href={`/wepacker/mentor/sessions/${id}`}
              className="border border-wepac-border px-3 py-1.5 text-xs text-wepac-white hover:bg-wepac-card"
            >
              Exit Preview
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl">
        <section className="mt-8">
          <div className="mb-4">
            <h1 className="font-barlow text-2xl font-bold text-wepac-white">
              Session
            </h1>
            <p className="mt-1 text-sm text-wepac-text-tertiary">
              Attendee-safe projection of this Session only.
            </p>
          </div>

          <article className="border border-wepac-border bg-wepac-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-wepac-white">
                  {preview.session.scheduledAt.toLocaleDateString("pt-PT", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="mt-1 text-sm text-wepac-text-secondary">
                  {preview.session.scheduledAt.toLocaleTimeString("pt-PT", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · {preview.session.durationMinutes} min
                </p>
              </div>
              <span className="bg-wepac-input px-2 py-0.5 text-xs text-wepac-text-tertiary">
                {STATUS_LABELS[preview.session.status] ?? preview.session.status}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="bg-wepac-input px-2 py-0.5 text-xs text-wepac-text-tertiary">
                {preview.session.format === "individual" ? "Individual" : "Group"}
              </span>
              <span className="bg-wepac-input px-2 py-0.5 text-xs text-wepac-text-tertiary">
                {SESSION_KIND_LABELS[preview.session.kind]?.label ??
                  preview.session.kind}
              </span>
              <span className="bg-wepac-input px-2 py-0.5 text-xs text-wepac-text-tertiary">
                {preview.session.organizerName}
              </span>
              {!isAdminPreview &&
                preview.session.status === "scheduled" &&
                preview.session.meetingUrl && (
                  <a
                    href={preview.session.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-wepac-white hover:underline"
                  >
                    Join call →
                  </a>
                )}
            </div>

            {(preview.session.outcome || preview.session.sharedNote) && (
              <div className="mt-4 space-y-4 border-t border-wepac-border pt-4">
                {preview.session.outcome && (
                  <div>
                    <h2 className="text-xs font-bold uppercase text-wepac-text-tertiary">
                      Outcome
                    </h2>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-wepac-text-secondary">
                      {preview.session.outcome}
                    </p>
                  </div>
                )}
                {preview.session.sharedNote && (
                  <div>
                    <h2 className="text-xs font-bold uppercase text-wepac-text-tertiary">
                      Shared note
                    </h2>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-wepac-text-secondary">
                      {preview.session.sharedNote}
                    </p>
                  </div>
                )}
              </div>
            )}
          </article>
        </section>
      </main>
    </div>
  );
}
