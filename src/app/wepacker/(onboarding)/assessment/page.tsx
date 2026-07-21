import Link from "next/link";
import { getMyContext } from "@/lib/wepacker/actions/user";
import { OnboardingStepper } from "@/components/wepacker/OnboardingStepper";
import { hasDedicatedIndicators } from "@/lib/wepacker/types";
import AssessmentPageClient from "./page-client";

export default async function AssessmentPage() {
  const { membership } = await getMyContext();

  if (!membership) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-wepac-black px-6 pt-16">
        <OnboardingStepper currentStep={2} />
        <div className="w-full max-w-md text-center">
          <h1 className="font-barlow text-2xl font-bold text-wepac-white">
            Sem Journey associada
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-wepac-text-secondary">
            A tua conta ainda não está associada a uma Journey — contacta a
            equipa WEPAC.
          </p>
          <Link
            href="/wepacker/dashboard"
            className="mt-8 inline-block bg-wepac-white px-8 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted"
          >
            Ir para o meu espaço
          </Link>
        </div>
      </div>
    );
  }

  // getMyContext() → getMyMembership() reads the active membership fresh
  // from the DB on every request, so this reflects the current pack —
  // matches the anti-TOCTOU check enforced server-side in
  // submitSelfEvaluation, just surfaced here as a friendly blocked state
  // instead of a thrown error.
  if (!hasDedicatedIndicators(membership.packSlug)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-wepac-black px-6 pt-16">
        <OnboardingStepper currentStep={2} />
        <div className="w-full max-w-md text-center">
          <h1 className="font-barlow text-2xl font-bold text-wepac-white">
            Avaliação ainda não disponível
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-wepac-text-secondary">
            O pack {membership.packName} ainda não tem indicadores de
            avaliação próprios definidos. Contacta a equipa WEPAC — a
            avaliação fica disponível assim que o instrumento estiver
            configurado.
          </p>
          <Link
            href="/wepacker/dashboard"
            className="mt-8 inline-block bg-wepac-white px-8 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted"
          >
            Ir para o meu espaço
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AssessmentPageClient
      packSlug={membership.packSlug}
      membershipId={membership.membershipId}
    />
  );
}
