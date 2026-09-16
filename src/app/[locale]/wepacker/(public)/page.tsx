import { redirect } from "@/i18n/navigation";

// /wepacker used to serve the public landing page. That page moved to
// /society: the entrance to the WEPAC Society, above all areas. /wepacker
// is now the member door only — it sends visitors straight to login.
export default async function WepackerRootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/wepacker/login", locale });
}
