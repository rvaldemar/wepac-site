import Link from "next/link";
import { resendVerificationAction } from "@/lib/bilheteira/auth-actions";
import { Shell, styles } from "../ui";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ email?: string; resent?: string; error?: string }>;
};

export default async function VerifySentPage({ searchParams }: Props) {
  const { email, resent, error } = await searchParams;

  return (
    <Shell>
      <main style={styles.narrow}>
        <div style={styles.eyebrow}>Bilheteira · Admin</div>
        <h1 style={styles.h1}>Confirma o teu email</h1>
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
            Se o email existir, reenviámos o link.
          </div>
        )}
        <div style={styles.card}>
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            Enviámos um email{email ? ` para ` : " "}
            {email && <strong>{email}</strong>} com um link de confirmação.
          </p>
          <p style={{ marginTop: 16, color: "#666", fontSize: 13 }}>
            Clica no link para activar a conta. O link expira em 24 horas.
          </p>
        </div>

        {email && (
          <div style={styles.card}>
            <div style={{ ...styles.labelText, marginBottom: 10 }}>
              Não recebeste?
            </div>
            <form action={resendVerificationAction} style={styles.form}>
              <input type="hidden" name="email" value={email} />
              <button type="submit" style={styles.buttonSecondary}>
                Reenviar email de confirmação
              </button>
            </form>
          </div>
        )}

        <p style={{ fontSize: 13, color: "#666" }}>
          <Link href="/bilheteira/login" style={styles.link}>
            ← Voltar ao login
          </Link>
        </p>
      </main>
    </Shell>
  );
}
