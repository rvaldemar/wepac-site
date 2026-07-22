const SAFE_DATABASE_MARKER =
  /(?:^|[_-])(?:dev|development|test|e2e|local|gate|codex)(?:[_-]|$)/i;
const FORBIDDEN_DATABASE_MARKER = /(?:^|[_-])(?:prod|production|stage|staging)(?:[_-]|$)/i;
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export interface DisposableSeedTarget {
  host: string;
  databaseName: string;
}

// This guard runs before PrismaClient is created and before any DELETE. A
// warning in documentation is not a safety boundary: destructive fixtures
// require both a loopback database and an explicit reset capability.
export function assertDisposableSeedTarget(
  env: Readonly<Record<string, string | undefined>> = process.env,
): DisposableSeedTarget {
  const rawUrl = env.DATABASE_URL?.trim();
  if (!rawUrl) throw new Error("Seed refused: DATABASE_URL is missing.");

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Seed refused: DATABASE_URL is invalid.");
  }
  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    throw new Error("Seed refused: DATABASE_URL must use PostgreSQL.");
  }

  const host = url.hostname;
  const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!LOOPBACK_HOSTS.has(host)) {
    throw new Error("Seed refused: database host is not loopback.");
  }
  if (
    !databaseName ||
    FORBIDDEN_DATABASE_MARKER.test(databaseName) ||
    !SAFE_DATABASE_MARKER.test(databaseName)
  ) {
    throw new Error("Seed refused: database name is not disposable.");
  }

  const e2eAuthorized = env.E2E_ALLOW_DB_RESET === "1";
  const manualAuthorized = env.WEPACKER_SEED_ALLOW_DB_RESET === "1";
  if (!e2eAuthorized && !manualAuthorized) {
    throw new Error("Seed refused: reset capability is not enabled.");
  }
  if (manualAuthorized && !e2eAuthorized) {
    const confirmedName = env.WEPACKER_SEED_DATABASE_NAME?.trim();
    if (!confirmedName || confirmedName !== databaseName) {
      throw new Error("Seed refused: exact database name is not confirmed.");
    }
  }

  return { host, databaseName };
}
