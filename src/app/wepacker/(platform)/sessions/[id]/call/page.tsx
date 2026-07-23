import Link from "next/link";
import { notFound } from "next/navigation";
import { SessionCall } from "@/components/wepacker/SessionCall";
import {
  getMyJitsiJoin,
  getMySessionCallView,
} from "@/lib/wepacker/actions/session-media";
import { requirePageUser } from "@/lib/wepacker/page-guards";

export const dynamic = "force-dynamic";

export default async function SessionCallPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageUser();
  const { id } = await params;
  const callData = await Promise.all([
      getMyJitsiJoin(id),
      getMySessionCallView(id),
    ]).catch(() => null);
  if (!callData) notFound();
  const [join, state] = callData;
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-barlow text-2xl font-bold text-wepac-white">
            Chamada da Session
          </h1>
          <p className="mt-1 text-sm text-wepac-text-tertiary">
            Acesso autenticado e limitado aos dois participantes exatos.
          </p>
        </div>
        <Link
          href={
            state.isOrganizer
              ? `/wepacker/mentor/sessions/${id}`
              : `/wepacker/sessions/${id}`
          }
          className="text-xs text-wepac-text-secondary hover:underline"
        >
          Voltar
        </Link>
      </div>
      <SessionCall
        sessionId={id}
        baseUrl={join.baseUrl}
        room={join.room}
        token={join.token}
        isOrganizer={state.isOrganizer}
        initialCapacity={state.capacity}
        initialConsent={state.consent}
        initialRecording={state.activeRecording}
      />
    </div>
  );
}
