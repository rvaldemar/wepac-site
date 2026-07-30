import { Scanner } from "./scanner";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ pin?: string }>;

export default async function PortaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  return <Scanner initialPin={params.pin ?? ""} />;
}
