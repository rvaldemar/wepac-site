import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionAdmin } from "@/lib/bilheteira/session";
import { signupAction } from "@/lib/bilheteira/auth-actions";
import { Shell, styles } from "../ui";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function SignupPage({ searchParams }: Props) {
  const admin = await getSessionAdmin();
  if (admin) redirect("/bilheteira/admin");
  const { error } = await searchParams;

  return (
    <Shell>
      <main style={styles.narrow}>
        <div style={styles.eyebrow}>Bilheteira · Admin</div>
        <h1 style={styles.h1}>Criar conta</h1>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 24 }}>
          Apenas emails <strong>@wepac.pt</strong> são aceites.
        </p>
        {error && <div style={styles.error}>{error}</div>}
        <div style={styles.card}>
          <form action={signupAction} style={styles.form}>
            <label style={styles.label}>
              <span style={styles.labelText}>Nome</span>
              <input type="text" name="name" required style={styles.input} />
            </label>
            <label style={styles.label}>
              <span style={styles.labelText}>Email (@wepac.pt)</span>
              <input
                type="email"
                name="email"
                required
                placeholder="nome@wepac.pt"
                style={styles.input}
              />
            </label>
            <label style={styles.label}>
              <span style={styles.labelText}>Password (min. 8)</span>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                style={styles.input}
              />
            </label>
            <button type="submit" style={styles.button}>
              Criar conta
            </button>
          </form>
        </div>
        <p style={{ fontSize: 13, color: "#666" }}>
          Já tens conta?{" "}
          <Link href="/bilheteira/login" style={styles.link}>
            Entrar
          </Link>
        </p>
      </main>
    </Shell>
  );
}
