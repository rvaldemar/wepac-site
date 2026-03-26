import { validateInviteToken } from "@/lib/actions/invite";
import { InvitePageClient } from "./page-client";
import Link from "next/link";

export default async function InvitePage({
 params,
}: {
 params: Promise<{ token: string }>;
}) {
 const { token } = await params;
 const inviteUser = await validateInviteToken(token);

 if (!inviteUser) {
  return (
   <div className="flex min-h-screen items-center justify-center bg-wepac-black px-6">
    <div className="w-full max-w-sm text-center">
     <h1 className="font-barlow text-3xl font-bold text-wepac-white">
      Convite inválido
     </h1>
     <p className="mt-4 text-sm text-wepac-text-secondary">
      Este convite não existe ou já expirou. Contacta a equipa WEPAC.
     </p>
     <Link
      href="/artists/alpha/login"
      className="mt-8 inline-block bg-wepac-white px-8 py-3 text-sm font-bold text-wepac-black"
     >
      Ir para login
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
