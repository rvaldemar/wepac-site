import { Link } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { wp } from "@/i18n/copy/wepacker";
import { unstable_noStore as noStore } from "next/cache";
import { requirePageRole } from "@/lib/wepacker/page-guards";
import { getAdminSessionAttendeePreviewIndex } from "@/lib/wepacker/actions/session-attendee-preview";
import { SESSION_KIND_LABELS } from "@/lib/wepacker/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminSupportPreviewPage() {
  noStore();
  const locale = await getLocale();
  await requirePageRole(["admin"]);
  const entries = await getAdminSessionAttendeePreviewIndex();
  const statusLabels: Record<string, string> = {
    scheduled: wp(locale, "Agendada", "Scheduled"),
    completed: wp(locale, "Realizada", "Completed"),
    cancelled: wp(locale, "Cancelada", "Cancelled"),
    no_show: wp(locale, "Não compareceu", "No show"),
  };

  return (
    <main className="p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-widest text-wepac-text-tertiary">
          {wp(locale, "Suporte administrativo", "Admin support")}
        </p>
        <h1 className="mt-2 font-barlow text-3xl font-bold text-wepac-white">
          {wp(
            locale,
            "Pré-visualizações de participantes em Sessions",
            "Session attendee previews",
          )}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-wepac-text-tertiary">
          {wp(
            locale,
            "Este índice contém apenas metadados de suporte. Abrir uma projeção segura para o participante exige um propósito estruturado, uma referência de ticket e nova autenticação por password; cria uma autorização auditada de 15 minutos. Motivos em texto livre e referências de ticket em bruto nunca são guardados.",
            "This index contains support metadata only. Opening an attendee-safe projection requires a structured purpose, ticket reference, fresh password re-authentication, and creates a 15-minute audited grant. Free-text reasons and raw ticket references are never stored.",
          )}
        </p>

        {entries.length === 0 ? (
          <div className="mt-8 border border-wepac-border bg-wepac-card p-6 text-sm text-wepac-text-tertiary">
            {wp(
              locale,
              "Não há participantes explícitos em Sessions disponíveis para pré-visualização de suporte.",
              "No explicit Session attendees are available for support preview.",
            )}
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto border border-wepac-border">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-wepac-card text-xs uppercase tracking-wide text-wepac-text-tertiary">
                <tr>
                  <th className="px-4 py-3">
                    {wp(locale, "Participante", "Attendee")}
                  </th>
                  <th className="px-4 py-3">
                    {wp(locale, "Organizador", "Organizer")}
                  </th>
                  <th className="px-4 py-3">Session</th>
                  <th className="px-4 py-3">
                    {wp(locale, "Estado", "Status")}
                  </th>
                  <th className="px-4 py-3">
                    <span className="sr-only">
                      {wp(locale, "Ação", "Action")}
                    </span>
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
                        {entry.scheduledAt.toLocaleDateString(locale)} ·{" "}
                        {entry.scheduledAt.toLocaleTimeString(locale, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="mt-1 block text-xs text-wepac-text-tertiary">
                        {entry.format === "individual"
                          ? "Individual"
                          : wp(locale, "Grupo", "Group")}
                        {" · "}
                        {SESSION_KIND_LABELS[entry.kind]?.label ?? entry.kind}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {statusLabels[entry.status] ?? entry.status}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/wepacker/mentor/sessions/${entry.sessionId}/preview/${entry.attendee.id}`}
                        className="whitespace-nowrap border border-wepac-border px-3 py-1.5 text-xs text-wepac-white hover:bg-wepac-card"
                      >
                        {wp(
                          locale,
                          "Abrir pré-visualização protegida",
                          "Open gated preview",
                        )}
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
