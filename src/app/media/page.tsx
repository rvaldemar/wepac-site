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
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={`overflow-hidden bg-wepac-gray/10 ${
                    i % 5 === 0 ? "col-span-2 row-span-2" : ""
                  }`}
                >
                  <div
                    className={`flex items-center justify-center ${
                      i % 5 === 0 ? "aspect-square" : "aspect-[4/3]"
                    }`}
                  >
                    <span className="text-xs text-wepac-white/10">
                      Foto {i + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="mt-12 text-center text-sm text-wepac-white/40">
              Galeria em construção. Em breve, mais conteúdos.
            </p>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
