import { Metadata } from "next";
import { FadeIn } from "@/components/FadeIn";

export const metadata: Metadata = {
  title: "Media",
  description: "Galeria de fotos e vídeos da WEPAC.",
};

export default function MediaPage() {
  return (
    <div className="pt-20">
      <section className="bg-wepac-black px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/40">
              Media
            </p>
            <h1 className="mt-4 font-barlow text-4xl font-bold text-wepac-white md:text-6xl">
              Galeria
            </h1>
          </FadeIn>
        </div>
      </section>

      <section className="bg-wepac-dark px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <p className="text-center text-sm text-wepac-white/40">
              Galeria em construção. Em breve, mais conteúdos.
            </p>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
