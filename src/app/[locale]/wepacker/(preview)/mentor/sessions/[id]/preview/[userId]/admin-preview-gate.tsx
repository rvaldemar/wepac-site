import { Link } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { wp } from "@/i18n/copy/wepacker";
import { createAdminSessionAttendeePreviewGrant } from "@/lib/wepacker/actions/session-attendee-preview";

export async function AdminPreviewGate({
  sessionId,
  attendeeUserId,
  errorCode,
}: {
  sessionId: string;
  attendeeUserId: string;
  errorCode?: string;
}) {
  const locale = await getLocale();
  const errorMessages: Record<string, string> = {
    invalid_request: wp(
      locale,
      "Escolhe um propósito de suporte, indica uma referência de ticket válida e introduz a tua password atual.",
      "Choose a support purpose, provide a valid ticket reference, and enter your current password.",
    ),
    reauth_failed: wp(
      locale,
      "A nova autenticação de administrador falhou.",
      "Fresh Admin re-authentication failed.",
    ),
    reauth_rate_limited: wp(
      locale,
      "Demasiadas tentativas de autenticação falhadas. Aguarda 15 minutos e tenta novamente.",
      "Too many failed re-authentication attempts. Wait 15 minutes and try again.",
    ),
    target_unavailable: wp(
      locale,
      "Esta pessoa não é participante explícita da Session pedida ou já és o seu organizador.",
      "This person is not an explicit attendee of the requested Session, or you already organize it.",
    ),
    access_expired: wp(
      locale,
      "A autorização limitada de pré-visualização é inválida, expirou, foi revogada ou já não corresponde a este participante da Session.",
      "The scoped preview grant is invalid, expired, revoked, or no longer matches this Session attendee.",
    ),
  };
  const createGrant = createAdminSessionAttendeePreviewGrant.bind(
    null,
    sessionId,
    attendeeUserId,
  );
  const error = errorCode ? errorMessages[errorCode] : null;

  return (
    <main className="mx-auto min-h-screen max-w-xl px-6 py-10 lg:px-8">
      <section className="border border-wepac-white/30 bg-wepac-card p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-wepac-text-tertiary">
          {wp(locale, "Acesso de suporte administrativo", "Admin support access")}
        </p>
        <h1 className="mt-2 font-barlow text-2xl font-bold text-wepac-white">
          {wp(
            locale,
            "Abrir uma pré-visualização limitada e só de leitura",
            "Open a scoped read-only preview",
          )}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-wepac-text-secondary">
          {wp(
            locale,
            "Isto não personifica o participante. O acesso limita-se a uma projeção segura desta Session, expira após 15 minutos e fica registado no histórico de auditoria de segurança.",
            "This does not impersonate the attendee. Access is limited to one attendee-safe projection of this Session, expires after 15 minutes, and is recorded in the security audit trail.",
          )}
        </p>

        {error && (
          <p
            role="alert"
            className="mt-4 border border-wepac-error/40 p-3 text-sm text-wepac-error"
          >
            {error}
          </p>
        )}

        <form action={createGrant} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="support-preview-reason"
              className="block text-sm text-wepac-text-secondary"
            >
              {wp(locale, "Propósito do suporte", "Support purpose")}
            </label>
            <select
              id="support-preview-reason"
              name="reasonCode"
              required
              defaultValue=""
              className="mt-1 w-full border border-wepac-border bg-wepac-input p-3 text-sm text-wepac-white"
            >
              <option value="" disabled>
                {wp(locale, "Seleciona um propósito", "Select a purpose")}
              </option>
              <option value="reported_issue">
                {wp(locale, "Problema de produto reportado", "Reported product issue")}
              </option>
              <option value="incident_response">
                {wp(locale, "Resposta a incidente", "Incident response")}
              </option>
              <option value="data_correction">
                {wp(locale, "Suporte de correção de dados", "Data correction support")}
              </option>
              <option value="quality_assurance">
                {wp(locale, "Garantia de qualidade", "Quality assurance")}
              </option>
            </select>
            <p className="mt-1 text-xs text-wepac-text-tertiary">
              {wp(
                locale,
                "Motivos em texto livre não são aceites nem guardados.",
                "Free-text reasons are not accepted or retained.",
              )}
            </p>
          </div>

          <div>
            <label
              htmlFor="support-preview-ticket"
              className="block text-sm text-wepac-text-secondary"
            >
              {wp(locale, "Referência do ticket", "Ticket reference")}
            </label>
            <input
              id="support-preview-ticket"
              name="ticketReference"
              required
              minLength={3}
              maxLength={100}
              pattern="[A-Za-z0-9][A-Za-z0-9._:/-]{2,99}"
              autoComplete="off"
              className="mt-1 w-full border border-wepac-border bg-wepac-input p-3 text-sm text-wepac-white"
              placeholder="SUP-123"
            />
          </div>

          <div>
            <label
              htmlFor="support-preview-password"
              className="block text-sm text-wepac-text-secondary"
            >
              {wp(locale, "Password atual", "Current password")}
            </label>
            <input
              id="support-preview-password"
              name="password"
              type="password"
              required
              maxLength={256}
              autoComplete="current-password"
              className="mt-1 w-full border border-wepac-border bg-wepac-input p-3 text-sm text-wepac-white"
            />
            <p className="mt-1 text-xs text-wepac-text-tertiary">
              {wp(
                locale,
                "A password nunca é guardada. A referência do ticket em bruto só existe na memória do pedido; o armazenamento recebe um resumo criptográfico com chave.",
                "The password is never stored. The raw ticket reference is kept only in request memory; storage receives a keyed digest.",
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              className="bg-wepac-white px-4 py-2 text-sm font-bold text-wepac-black"
            >
              {wp(
                locale,
                "Abrir pré-visualização só de leitura",
                "Open read-only preview",
              )}
            </button>
            <Link
              href="/wepacker/admin/support-preview"
              className="text-sm text-wepac-text-tertiary hover:text-wepac-white"
            >
              {wp(locale, "Cancelar", "Cancel")}
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
