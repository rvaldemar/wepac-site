import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionAdmin } from "@/lib/bilheteira/session";
import { loginAction } from "@/lib/bilheteira/auth-actions";
import { Shell, styles } from "../ui";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const admin = await getSessionAdmin();
  if (admin) redirect("/bilheteira/admin");
  const { error } = await searchParams;

  return (
    <Shell>
      <main style={styles.narrow}>
        <div style={styles.eyebrow}>Bilheteira · Admin</div>
        <h1 style={styles.h1}>Entrar</h1>
        {error && <div style={styles.error}>{error}</div>}
        <div style={styles.card}>
          <form action={loginAction} style={styles.form}>
            <label style={styles.label}>
              <span style={styles.labelText}>Email</span>
              <input
                type="email"
                name="email"
                required
                placeholder="nome@wepac.pt"
                style={styles.input}
              />
            </label>
            <label style={styles.label}>
              <span style={styles.labelText}>Password</span>
              <input
                type="password"
                name="password"
                required
                style={styles.input}
              />
            </label>
            <button type="submit" style={styles.button}>
              Entrar
            </button>
          </form>
        </div>
        <p style={{ fontSize: 13, color: "#666" }}>
          Ainda não tens conta?{" "}
          <Link href="/bilheteira/signup" style={styles.link}>
            Criar conta
          </Link>
        </p>
      </main>
    </Shell>
  );
}
