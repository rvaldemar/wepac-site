import { Link } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { getInstitutionalCopy } from "@/i18n/copy/institutional";
import { getSessionAdmin } from "@/lib/bilheteira/session";
import { loginAction } from "@/lib/bilheteira/auth-actions";
import { Shell, styles } from "../ui";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const copy = getInstitutionalCopy(await getLocale()).ticketing;
  const admin = await getSessionAdmin();
  if (admin) redirect("/bilheteira/admin");
  const { error } = await searchParams;

  return (
    <Shell>
      <main style={styles.narrow}>
        <div style={styles.eyebrow}>{copy.brand} · {copy.admin}</div>
        <h1 style={styles.h1}>{copy.signIn}</h1>
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
              <span style={styles.labelText}>{copy.password}</span>
              <input
                type="password"
                name="password"
                required
                style={styles.input}
              />
            </label>
            <button type="submit" style={styles.button}>
              {copy.signIn}
            </button>
          </form>
        </div>
        <p style={{ fontSize: 13, color: "#666" }}>
          {copy.noAccount}{" "}
          <Link href="/bilheteira/signup" style={styles.link}>
            {copy.createAccount}
          </Link>
        </p>
      </main>
    </Shell>
  );
}
