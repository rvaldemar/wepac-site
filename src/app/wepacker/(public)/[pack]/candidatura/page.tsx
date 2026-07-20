import { redirect } from "next/navigation";

// Legacy route — the public application flow is now the pack Intake.
export default async function CandidaturaRedirect({
  params,
}: {
  params: Promise<{ pack: string }>;
}) {
  const { pack } = await params;
  redirect(`/wepacker/${pack}/intake`);
}
