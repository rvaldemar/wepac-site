import Image from "next/image";
import Link from "next/link";
import { FadeIn } from "@/components/FadeIn";

export const metadata = {
  title: "Wessex | WEPAC — Serviços Musicais",
  description:
    "Performances musicais de excelência. Curadoria artística para eventos privados, corporativos e institucionais.",
};

export default function WessexPage() {
  return (
    <div className="bg-black text-white">
      {/* Hero Section */}
      <section className="relative w-full h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-black via-gray-900 to-black z-10" />
          <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black" />
        </div>

        <div className="relative z-20 container mx-auto px-6 max-w-4xl">
          <FadeIn>
            <div className="text-center space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Excelência Musical
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Performances musicais de qualidade para eventos privados,
                corporativos e institucionais.
              </p>
              <div className="pt-4">
                <Link
                  href="#contact"
                  className="inline-block px-8 py-3 bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition"
                >
                  Pedir Orçamento
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Quem Somos */}
      <section className="py-20 md:py-32 bg-black border-t border-gray-800">
        <div className="container mx-auto px-6 max-w-5xl">
          <FadeIn>
            <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">
              Quem Somos
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <FadeIn>
              <div className="relative h-96 md:h-auto aspect-square bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-500 text-sm">Imagem em alta resolução</p>
                  <p className="text-gray-600 text-xs mt-2">wessex-about.jpg</p>
                </div>
              </div>
            </FadeIn>

            <FadeIn>
              <div className="space-y-6">
                <p className="text-lg text-gray-300 leading-relaxed">
                  Wessex é um serviço de curadoria artística e performance
                  musical de excelência. Especializamo-nos em criar experiências
                  musicais memoráveis para eventos privados, corporativos e
                  institucionais.
                </p>
                <p className="text-lg text-gray-300 leading-relaxed">
                  Com uma abordagem dedicada e flexível, adaptamos repertório e
                  formato a cada evento, garantindo uma experiência artística
                  única e profissional.
                </p>
                <div className="flex gap-4 pt-4">
                  <span className="text-sm text-yellow-500 font-semibold">
                    Curadoria Artística
                  </span>
                  <span className="text-sm text-yellow-500 font-semibold">
                    Repertório Diverso
                  </span>
                  <span className="text-sm text-yellow-500 font-semibold">
                    Profissionalismo
                  </span>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-20 md:py-32 bg-black border-t border-gray-800">
        <div className="container mx-auto px-6">
          <FadeIn>
            <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">
              Performances
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <FadeIn key={i}>
                <div className="relative h-64 md:h-72 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden group flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-500 text-sm">Imagem Performance {i}</p>
                    <p className="text-gray-600 text-xs mt-2">wessex-gallery-{i}.jpg</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 md:py-32 bg-black border-t border-gray-800">
        <div className="container mx-auto px-6 max-w-5xl">
          <FadeIn>
            <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">
              Equipa
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Artista 1",
                role: "Performance Principal",
              },
              {
                name: "Artista 2",
                role: "Performance Principal",
              },
              {
                name: "Artista 3",
                role: "Performance Principal",
              },
            ].map((member) => (
              <FadeIn key={member.name}>
                <div className="text-center space-y-4">
                  <div className="relative h-64 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-gray-500 text-sm">Foto {member.name}</p>
                      <p className="text-gray-600 text-xs mt-2">wessex-member-{member.name.split(" ")[1]}.jpg</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{member.name}</h3>
                    <p className="text-sm text-gray-400">{member.role}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        id="contact"
        className="py-20 md:py-32 bg-gradient-to-r from-yellow-500 to-yellow-400"
      >
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <FadeIn>
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">
              Pronto para sua próxima performance?
            </h2>
            <p className="text-lg text-black/80 mb-8">
              Entre em contacto para conhecer nossos serviços e orçamento
              personalizado.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contacto"
                className="px-8 py-3 bg-black text-white font-semibold hover:bg-gray-900 transition"
              >
                Pedir Orçamento
              </Link>
              <Link
                href="/"
                className="px-8 py-3 border-2 border-black text-black font-semibold hover:bg-black/10 transition"
              >
                Voltar ao Início
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
