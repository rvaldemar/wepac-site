import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { requirePageRole } from "@/lib/wepacker/page-guards";
import { getAdminSessionAttendeePreviewIndex } from "@/lib/wepacker/actions/session-attendee-preview";
import { SESSION_KIND_LABELS } from "@/lib/wepacker/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};

export default async function AdminSupportPreviewPage() {
  noStore();
  await requirePageRole(["admin"]);
  const entries = await getAdminSessionAttendeePreviewIndex();

  return (
    <main className="p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-widest text-wepac-text-tertiary">
          Admin support
        </p>
        <h1 className="mt-2 font-barlow text-3xl font-bold text-wepac-white">
          Session attendee previews
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-wepac-text-tertiary">
          This index contains support metadata only. Opening an attendee-safe
          projection requires a structured purpose, ticket reference, fresh
          password re-authentication, and creates a 15-minute audited grant.
          Free-text reasons and raw ticket references are never stored.
        </p>

        {entries.length === 0 ? (
          <div className="mt-8 border border-wepac-border bg-wepac-card p-6 text-sm text-wepac-text-tertiary">
            No explicit Session attendees are available for support preview.
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto border border-wepac-border">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-wepac-card text-xs uppercase tracking-wide text-wepac-text-tertiary">
                <tr>
                  <th className="px-4 py-3">Attendee</th>
                  <th className="px-4 py-3">Organizer</th>
                  <th className="px-4 py-3">Session</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={`${entry.sessionId}:${entry.attendee.id}`}
                    className="border-t border-wepac-border text-wepac-text-secondary"
                  >
                    <td className="px-4 py-3 text-wepac-white">
                      {entry.attendee.name}
                    </td>
                    <td className="px-4 py-3">{entry.organizer.name}</td>
                    <td className="px-4 py-3">
                      <span className="block">
                        {entry.scheduledAt.toLocaleDateString("pt-PT")} ·{" "}
                        {entry.scheduledAt.toLocaleTimeString("pt-PT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="mt-1 block text-xs text-wepac-text-tertiary">
                        {entry.format === "individual" ? "Individual" : "Group"}
                        {" · "}
                        {SESSION_KIND_LABELS[entry.kind]?.label ?? entry.kind}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {STATUS_LABELS[entry.status] ?? entry.status}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/wepacker/mentor/sessions/${entry.sessionId}/preview/${entry.attendee.id}`}
                        className="whitespace-nowrap border border-wepac-border px-3 py-1.5 text-xs text-wepac-white hover:bg-wepac-card"
                      >
                        Open gated preview
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
