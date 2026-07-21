"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { acceptAgreement } from "@/lib/wepacker/actions/invite";
import { OnboardingStepper } from "@/components/wepacker/OnboardingStepper";

const COMMITMENTS = [
  "Comprometo-me a estar presente nas Sessions que aceitei, salvo motivo de força maior comunicado com antecedência.",
  "Comprometo-me a ser pontual nas interações que aceitei.",
  "Comprometo-me a dar e receber feedback com honestidade e respeito.",
  "Comprometo-me a cumprir os compromissos e reflexões que assumir.",
  "Comprometo-me a manter uma atitude aberta ao crescimento e ao confronto construtivo.",
  "Comprometo-me a respeitar a confidencialidade do que outras pessoas partilham comigo.",
  "Comprometo-me a tratar cada pessoa e comunidade com cuidado e responsabilidade.",
];

export default function AgreementPage() {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { data: session, update } = useSession();
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-wepac-black px-6 pb-16 pt-16">
      <OnboardingStepper currentStep={1} />
      <div className="w-full max-w-lg">
        <h1 className="font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
          Participation Agreement
        </h1>
        <p className="mt-4 text-sm text-wepac-text-secondary">
          Para participar na WEPACKER, pedimos que leias e aceites os
          seguintes compromissos. São a base da nossa relação.
        </p>

        <div className="mt-8 space-y-4">
          {COMMITMENTS.map((c, i) => (
            <div key={i} className="flex gap-3 border-l-2 border-wepac-border pl-4">
              <span className="mt-0.5 text-xs text-wepac-white">{i + 1}.</span>
              <p className="text-sm leading-relaxed text-wepac-text-secondary">{c}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-wepac-border pt-6">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 accent-wepac-white"
            />
            <span className="text-sm text-wepac-text-secondary">
              Li e aceito as condições de participação na WEPACKER.
            </span>
          </label>

          <div className="mt-6 flex items-center gap-4">
            <a
              href="/wepacker/welcome"
              className="border border-wepac-border px-6 py-3 text-sm text-wepac-text-secondary transition-colors hover:bg-wepac-card"
            >
              Voltar
            </a>
            <button
              disabled={!accepted || loading}
              onClick={async () => {
                if (!session?.user?.id) return;
                setLoading(true);
                try {
                  await acceptAgreement();
                  // next-auth's client update() only POSTs the session
                  // (triggering the jwt() callback's trigger:"update"
                  // branch, which re-reads onboarded from the DB) when
                  // called with a defined argument — update() with no
                  // args resolves to a plain GET session read instead,
                  // silently leaving the JWT's onboarded flag stale and
                  // stranding the member in a welcome/assessment redirect
                  // loop after finishing onboarding.
                  await update({});
                  router.push("/wepacker/dashboard");
                } catch {
                  setLoading(false);
                }
              }}
              className={`px-8 py-3 text-sm font-bold transition-colors ${
                accepted
                  ? "bg-wepac-white hover:bg-wepac-accent-muted text-wepac-black"
                  : "cursor-not-allowed bg-wepac-input text-wepac-text-tertiary"
              } disabled:opacity-50`}
            >
              {loading ? "A processar..." : "Accept and open My Journey"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
