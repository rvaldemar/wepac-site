import { redirect } from "next/navigation";

// Applications were folded into the central leads inbox.
export default function AdminApplicationsRedirect() {
  redirect("/wepacker/admin/leads");
}
