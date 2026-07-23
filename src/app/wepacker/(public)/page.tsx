import { redirect } from "next/navigation";

// /wepacker used to serve the public landing page. That page moved to
// /society: the entrance to the WEPAC Society, above all areas. /wepacker
// is now the member door only — it sends visitors straight to login.
export default function WepackerRootPage() {
  redirect("/wepacker/login");
}
