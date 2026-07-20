// Next.js server actions are addressed by an ID baked into the client
// bundle at build time. If the server redeploys (new build) while a tab
// stays open on the old bundle, that ID no longer resolves and the call
// throws "Failed to find Server Action ... — this request might be from
// an older or newer deployment." A plain retry re-sends the same stale
// ID and fails identically — only a page reload (fresh bundle) fixes it.
export function isStaleDeploymentError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /Failed to find Server Action|older or newer deployment/i.test(
    message
  );
}

export function friendlySubmitError(err: unknown, fallback: string): string {
  return isStaleDeploymentError(err)
    ? "A plataforma foi atualizada entretanto e esta página ficou desatualizada. Recarrega a página — vais ter de preencher esta parte de novo, mas a partir daí funciona normalmente."
    : fallback;
}
