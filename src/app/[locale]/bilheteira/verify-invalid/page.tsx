import { Link } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getInstitutionalCopy } from "@/i18n/copy/institutional";
import { Shell, styles } from "../ui";

export const dynamic = "force-dynamic";

export default async function VerifyInvalidPage() {
  const copy = getInstitutionalCopy(await getLocale()).ticketing;
  return (
    <Shell>
      <main style={styles.narrow}>
        <div style={styles.eyebrow}>{copy.brand} · {copy.admin}</div>
        <h1 style={styles.h1}>{copy.invalidLink}</h1>
        <div style={styles.card}>
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            {copy.invalidLinkBody}
          </p>
          <p style={{ marginTop: 16 }}>
            <Link href="/bilheteira/signup" style={styles.link}>
              {copy.createAccount}
            </Link>
          </p>
        </div>
      </main>
    </Shell>
  );
}
