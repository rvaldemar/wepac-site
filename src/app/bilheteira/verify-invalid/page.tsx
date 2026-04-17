import Link from "next/link";
import { Shell, styles } from "../ui";

export const dynamic = "force-dynamic";

export default function VerifyInvalidPage() {
  return (
    <Shell>
      <main style={styles.narrow}>
        <div style={styles.eyebrow}>Bilheteira · Admin</div>
        <h1 style={styles.h1}>Link inválido</h1>
        <div style={styles.card}>
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            Este link de verificação é inválido ou expirou. Os links são
            válidos durante 24 horas.
          </p>
          <p style={{ marginTop: 16 }}>
            <Link href="/bilheteira/signup" style={styles.link}>
              Tentar criar conta novamente
            </Link>
          </p>
        </div>
      </main>
    </Shell>
  );
}
