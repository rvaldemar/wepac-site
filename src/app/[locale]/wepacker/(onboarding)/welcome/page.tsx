"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { wp } from "@/i18n/copy/wepacker";
import { OnboardingStepper } from "@/components/wepacker/OnboardingStepper";

export default function WelcomePage() {
  const locale = useLocale();

  return (
    <div className="flex min-h-screen items-center justify-center bg-wepac-black px-6 pt-16">
      <OnboardingStepper currentStep={0} />
      <div className="w-full max-w-lg text-center">
        <h1 className="font-barlow text-4xl font-bold text-wepac-white md:text-5xl">
          {wp(locale, "Bem-vindo ao WEPACKER.", "Welcome to WEPACKER.")}
        </h1>

        <div className="mt-10 space-y-4 text-left text-sm leading-relaxed text-wepac-text-secondary">
          <p>
            {wp(
              locale,
              "Ser WEPACKER é um modo de vida: carregar o teu próprio peso e ainda entregar valor à comunidade. Esta é a plataforma da WEPAC para o teu desenvolvimento humano integral através dos Six Pillars: Physical, Emotional, Character, Spiritual, Intellectual e Social.",
              "Being a WEPACKER is a way of life: carrying your own weight while adding value to the community. This is WEPAC's platform for your integral human development through the Six Pillars: Physical, Emotional, Character, Spiritual, Intellectual, and Social.",
            )}
          </p>
          <p>
            {wp(
              locale,
              "Aqui vais encontrar o teu Life Map — quem sou, onde estou, para onde vou, porquê, e que compromissos assumo —, os teus Goals, Trails e Sessions. Mentorships, Cycles e Packs aparecem apenas quando essas relações forem aceites explicitamente.",
              "Here you will find your Life Map — who I am, where I am, where I am going, why, and the commitments I make — along with your Goals, Trails, and Sessions. Mentorships, Cycles, and Packs only appear after those relationships have been explicitly accepted.",
            )}
          </p>
          <p>
            {wp(
              locale,
              "O que esperamos de ti: presença, honestidade, compromisso e disponibilidade para crescer. Não procuramos perfeição — procuramos verdade e evolução.",
              "What we expect from you: presence, honesty, commitment, and a willingness to grow. We are not looking for perfection — we are looking for truth and progress.",
            )}
          </p>
          <p>
            {wp(
              locale,
              "From packers to WEPACkers. My Journey acompanha a vida inteira; cada Cycle, Mentorship e Pack tem o seu próprio propósito e consentimento.",
              "From packers to WEPACkers. My Journey follows your whole life; every Cycle, Mentorship, and Pack has its own purpose and consent.",
            )}
          </p>
        </div>

        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/wepacker/login"
            className="border border-wepac-border px-6 py-3 text-sm text-wepac-text-secondary transition-colors hover:bg-wepac-card"
          >
            {wp(locale, "Voltar", "Back")}
          </Link>
          <Link
            href="/wepacker/agreement"
            className="bg-wepac-white px-8 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted"
          >
            {wp(locale, "Continuar", "Continue")}
          </Link>
        </div>
      </div>
    </div>
  );
}
