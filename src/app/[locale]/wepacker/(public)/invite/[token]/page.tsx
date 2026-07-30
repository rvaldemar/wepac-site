import { Link } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { wp } from "@/i18n/copy/wepacker";
import { validateInviteToken } from "@/lib/wepacker/actions/invite";
import { InvitePageClient } from "./page-client";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const locale = await getLocale();
  const { token } = await params;
  const inviteUser = await validateInviteToken(token);

  if (!inviteUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-wepac-black px-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="font-barlow text-3xl font-bold text-wepac-white">
            {wp(locale, "Convite inválido", "Invalid invitation")}
          </h1>
          <p className="mt-4 text-sm text-wepac-text-secondary">
            {wp(
              locale,
              "Este convite não existe ou já expirou. Contacta a equipa WEPAC.",
              "This invitation does not exist or has expired. Contact the WEPAC team.",
            )}
          </p>
          <Link
            href="/wepacker/login"
            className="mt-8 inline-block bg-wepac-white px-8 py-3 text-sm font-bold text-wepac-black"
          >
            {wp(locale, "Ir para login", "Go to sign in")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <InvitePageClient
      token={token}
      userName={inviteUser.name}
      userEmail={inviteUser.email}
    />
  );
}
