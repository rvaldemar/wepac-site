export type AccountRole = "member" | "admin";

export function safeInternalCallbackUrl(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;

  try {
    const url = new URL(value, "https://wepac.internal");
    if (url.origin !== "https://wepac.internal") return null;
    if (url.pathname !== "/wepacker" && !url.pathname.startsWith("/wepacker/")) {
      return null;
    }
    if (url.pathname === "/wepacker/login") return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function postLoginPath(role: AccountRole, callbackUrl: string | null): string {
  return (
    safeInternalCallbackUrl(callbackUrl) ??
    (role === "admin" ? "/wepacker/admin/users" : "/wepacker/dashboard")
  );
}
