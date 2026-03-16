"use client";

import { useState, FormEvent } from "react";
import { FadeIn } from "@/components/FadeIn";

export default function ContactoPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="pt-20">
      <section className="bg-wepac-black px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/40">
              Contacto
            </p>
            <h1 className="mt-4 font-barlow text-4xl font-bold text-wepac-white md:text-6xl">
              Fale connosco
            </h1>
          </FadeIn>
        </div>
      </section>

      <section className="bg-wepac-dark px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-2">
            {/* Info */}
            <FadeIn>
              <div>
                <h2 className="font-barlow text-2xl font-bold text-wepac-white">
                  Informações
                </h2>
                <div className="mt-8 space-y-6">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-wepac-white/40">
                      Email
                    </p>
                    <p className="mt-1 text-lg text-wepac-white">
                      geral@wepac.pt
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-wepac-white/40">
                      Localização
                    </p>
                    <p className="mt-1 text-lg text-wepac-white">
                      Braga, Portugal
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-wepac-white/40">
                      Redes Sociais
                    </p>
                    <div className="mt-2 flex gap-4">
                      <a
                        href="https://instagram.com/wepac"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-wepac-white/60 transition-colors hover:text-wepac-white"
                      >
                        Instagram
                      </a>
                      <a
                        href="https://facebook.com/wepac"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-wepac-white/60 transition-colors hover:text-wepac-white"
                      >
                        Facebook
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Form */}
            <FadeIn delay={0.15}>
              <div>
                <h2 className="font-barlow text-2xl font-bold text-wepac-white">
                  Envie uma mensagem
                </h2>

                {submitted ? (
                  <div className="mt-8 border border-wepac-white/20 p-8 text-center">
                    <p className="font-barlow text-xl font-bold text-wepac-white">
                      Mensagem enviada!
                    </p>
                    <p className="mt-2 text-wepac-white/60">
                      Entraremos em contacto em breve.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-bold uppercase tracking-wider text-wepac-white/40"
                      >
                        Nome
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        className="mt-2 w-full border-b border-wepac-white/20 bg-transparent py-3 text-wepac-white outline-none transition-colors focus:border-wepac-white"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-bold uppercase tracking-wider text-wepac-white/40"
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        className="mt-2 w-full border-b border-wepac-white/20 bg-transparent py-3 text-wepac-white outline-none transition-colors focus:border-wepac-white"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="subject"
                        className="block text-sm font-bold uppercase tracking-wider text-wepac-white/40"
                      >
                        Assunto
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        className="mt-2 w-full border-b border-wepac-white/20 bg-transparent py-3 text-wepac-white outline-none transition-colors focus:border-wepac-white"
                      >
                        <option value="geral" className="bg-wepac-black">
                          Informação geral
                        </option>
                        <option value="parcerias" className="bg-wepac-black">
                          Parcerias
                        </option>
                        <option value="servicos" className="bg-wepac-black">
                          Serviços musicais
                        </option>
                        <option value="educacao" className="bg-wepac-black">
                          Programas educativos
                        </option>
                        <option value="media" className="bg-wepac-black">
                          Media / Imprensa
                        </option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-bold uppercase tracking-wider text-wepac-white/40"
                      >
                        Mensagem
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={5}
                        required
                        className="mt-2 w-full border-b border-wepac-white/20 bg-transparent py-3 text-wepac-white outline-none transition-colors focus:border-wepac-white resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-wepac-white py-3 font-barlow text-sm font-bold uppercase tracking-wider text-wepac-black transition-opacity hover:opacity-90 md:w-auto md:px-12"
                    >
                      Enviar mensagem
                    </button>
                  </form>
                )}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
    </div>
  );
}
