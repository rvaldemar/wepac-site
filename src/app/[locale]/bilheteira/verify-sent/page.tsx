import { Link } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getInstitutionalCopy } from "@/i18n/copy/institutional";
import { resendVerificationAction } from "@/lib/bilheteira/auth-actions";
import { Shell, styles } from "../ui";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ email?: string; resent?: string; error?: string }>;
};

export default async function VerifySentPage({ searchParams }: Props) {
  const copy = getInstitutionalCopy(await getLocale()).ticketing;
  const { email, resent, error } = await searchParams;

  return (
    <Shell>
      <main style={styles.narrow}>
        <div style={styles.eyebrow}>{copy.brand} · {copy.admin}</div>
        <h1 style={styles.h1}>{copy.confirmEmail}</h1>
        {error && <div style={styles.error}>{error}</div>}
        {resent && (
          <div
            style={{
              padding: 12,
              background: "#e8f5e9",
              border: "1px solid #1b5e20",
              color: "#1b5e20",
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            {copy.resendGeneric}
          </div>
        )}
        <div style={styles.card}>
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            {copy.sentEmailPrefix}{" "}
            {email && <strong>{email}</strong>} {copy.sentEmailSuffix}
          </p>
          <p style={{ marginTop: 16, color: "#666", fontSize: 13 }}>
            {copy.activateAccount}
          </p>
        </div>

        {email && (
          <div style={styles.card}>
            <div style={{ ...styles.labelText, marginBottom: 10 }}>
              {copy.didNotReceive}
            </div>
            <form action={resendVerificationAction} style={styles.form}>
              <input type="hidden" name="email" value={email} />
              <button type="submit" style={styles.buttonSecondary}>
                {copy.resendConfirmation}
              </button>
            </form>
          </div>
        )}

        <p style={{ fontSize: 13, color: "#666" }}>
          <Link href="/bilheteira/login" style={styles.link}>
            {copy.backToLogin}
          </Link>
        </p>
      </main>
    </Shell>
  );
}
