import { Link } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { getInstitutionalCopy } from "@/i18n/copy/institutional";
import { getSessionAdmin } from "@/lib/bilheteira/session";
import { signupAction } from "@/lib/bilheteira/auth-actions";
import { Shell, styles } from "../ui";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function SignupPage({ searchParams }: Props) {
  const copy = getInstitutionalCopy(await getLocale()).ticketing;
  const admin = await getSessionAdmin();
  if (admin) redirect("/bilheteira/admin");
  const { error } = await searchParams;

  return (
    <Shell>
      <main style={styles.narrow}>
        <div style={styles.eyebrow}>{copy.brand} · {copy.admin}</div>
        <h1 style={styles.h1}>{copy.createAccount}</h1>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 24 }}>
          {copy.onlyWepacEmails}
        </p>
        {error && <div style={styles.error}>{error}</div>}
        <div style={styles.card}>
          <form action={signupAction} style={styles.form}>
            <label style={styles.label}>
              <span style={styles.labelText}>{copy.name}</span>
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
              <span style={styles.labelText}>{copy.passwordMin}</span>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                style={styles.input}
              />
            </label>
            <button type="submit" style={styles.button}>
              {copy.createAccount}
            </button>
          </form>
        </div>
        <p style={{ fontSize: 13, color: "#666" }}>
          {copy.haveAccount}{" "}
          <Link href="/bilheteira/login" style={styles.link}>
            {copy.signIn}
          </Link>
        </p>
      </main>
    </Shell>
  );
}
