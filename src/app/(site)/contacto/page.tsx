"use client";

import { useState, FormEvent, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FadeIn } from "@/components/FadeIn";
import { submitContactLead } from "@/lib/wepacker/actions/contact";

function ContactoContent() {
  const params = useSearchParams();
  const initialSubject = params.get("subject") ?? "geral";
  const initialMessage = params.get("message") ?? "";
  const ensemble = params.get("ensemble") ?? "";
  const service = params.get("service") ?? "";
  const total = params.get("total") ?? "";

  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const [subject, setSubject] = useState(initialSubject);
  const [message, setMessage] = useState(initialMessage);

  // Keep subject/message in sync with the URL search params without an
  // Effect: this is the "adjust state when a prop changes" pattern — track
  // the previous prop value in state and, if it changed since the last
  // render, update the derived state synchronously during render. React
  // re-renders immediately before committing, so this never paints a stale
  // frame and never cascades through an Effect.
  const [prevInitialSubject, setPrevInitialSubject] = useState(initialSubject);
  const [prevInitialMessage, setPrevInitialMessage] = useState(initialMessage);
  if (initialSubject !== prevInitialSubject) {
    setPrevInitialSubject(initialSubject);
    setSubject(initialSubject);
  }
  if (initialMessage !== prevInitialMessage) {
    setPrevInitialMessage(initialMessage);
    setMessage(initialMessage);
  }

  // Auto-scroll to form when arriving with prefilled data
  useEffect(() => {
    if (ensemble || initialMessage) {
      const el = document.getElementById("contact-form");
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }, [ensemble, initialMessage]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setError(false);

    const form = e.currentTarget;
    const data = new FormData(form);

    // Persist to the central leads inbox and send the formsubmit email in
    // parallel — success if either lands, so neither is a single point of
    // failure.
    const [dbResult, mailResult] = await Promise.allSettled([
      submitContactLead({
        name: (data.get("name") as string) || "",
        email: (data.get("email") as string) || "",
        subject: (data.get("subject") as string) || undefined,
        message: (data.get("message") as string) || "",
        ensemble: (data.get("ensemble") as string) || undefined,
        service: (data.get("service") as string) || undefined,
        total: (data.get("total") as string) || undefined,
      }),
      fetch("https://formsubmit.co/ajax/info@wepac.pt", {
        method: "POST",
        body: data,
      }).then((res) => {
        if (!res.ok) throw new Error("formsubmit failed");
      }),
    ]);

    // The DB lead is canonical (the central leads inbox — see OPS_LOG). If it
    // lands, the message counts as delivered even when the formsubmit email
    // notification fails; we just log that failure for follow-up.
    if (dbResult.status === "fulfilled") {
      if (mailResult.status === "rejected") {
        console.error("Contact form: formsubmit notification failed", mailResult.reason);
      }
      setSubmitted(true);
    } else if (mailResult.status === "fulfilled") {
      // DB write failed but the email notification still reached WEPAC, so the
      // lead isn't lost — show success too, but log the DB failure so it can
      // be investigated (it means this lead is missing from the admin backoffice).
      console.error("Contact form: lead DB write failed", dbResult.reason);
      setSubmitted(true);
    } else {
      setError(true);
    }
    setSending(false);
  }

  return (
    <div className="pt-20">
      <section className="bg-wepac-black px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/50">
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
          <div className="grid grid-cols-1 gap-10 md:gap-16 md:grid-cols-2">
            {/* Info */}
            <FadeIn>
              <div>
                <h2 className="font-barlow text-2xl font-bold text-wepac-white">
                  Informações
                </h2>
                <div className="mt-8 space-y-6">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-wepac-white/50">
                      Email
                    </p>
                    <p className="mt-1 text-lg text-wepac-white">
                      <a href="mailto:info@wepac.pt" className="hover:opacity-70 transition">
                        info@wepac.pt
                      </a>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-wepac-white/50">
                      Telefones
                    </p>
                    <p className="mt-1 text-lg text-wepac-white">
                      Jotta Pê —{" "}
                      <a href="tel:+351933515995" className="hover:opacity-70 transition">
                        +351 933 515 995
                      </a>
                    </p>
                    <p className="mt-1 text-lg text-wepac-white">
                      Gabriela Leite —{" "}
                      <a href="tel:+351963480535" className="hover:opacity-70 transition">
                        +351 963 480 535
                      </a>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-wepac-white/50">
                      Instagram
                    </p>
                    <p className="mt-1 text-lg text-wepac-white">
                      <a
                        href="https://www.instagram.com/wepac.oficial/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:opacity-70 transition"
                      >
                        @wepac.oficial
                      </a>
                    </p>
                    <p className="mt-1 text-lg text-wepac-white">
                      <a
                        href="https://www.instagram.com/wessex.pt/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:opacity-70 transition"
                      >
                        @wessex.pt
                      </a>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-wepac-white/50">
                      Localização
                    </p>
                    <p className="mt-1 text-lg text-wepac-white">
                      Carcavelos, Portugal
                    </p>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Form */}
            <FadeIn delay={0.15}>
              <div id="contact-form" className="scroll-mt-24">
                <h2 className="font-barlow text-2xl font-bold text-wepac-white">
                  Envie uma mensagem
                </h2>

                {submitted ? (
                  <div className="mt-8 border border-wepac-white/20 p-8 text-center">
                    <p className="font-barlow text-xl font-bold text-wepac-white">
                      Mensagem enviada!
                    </p>
                    <p className="mt-2 text-wepac-white/60">
                      Entraremos em contacto em breve. Respondemos em poucos dias úteis.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <input
                      type="hidden"
                      name="_subject"
                      value={
                        subject === "servicos" && ensemble
                          ? `Encomenda Wessex: ${ensemble} — ${total}€`
                          : "Nova mensagem do site wepac.pt"
                      }
                    />
                    <input type="hidden" name="_template" value="table" />
                    <input type="text" name="_honey" className="hidden" />
                    {ensemble && (
                      <input type="hidden" name="ensemble" value={ensemble} />
                    )}
                    {service && (
                      <input type="hidden" name="service" value={service} />
                    )}
                    {total && (
                      <input type="hidden" name="total" value={`${total}€`} />
                    )}
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-bold uppercase tracking-wider text-wepac-white/50"
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
                        className="block text-sm font-bold uppercase tracking-wider text-wepac-white/50"
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
                        className="block text-sm font-bold uppercase tracking-wider text-wepac-white/50"
                      >
                        Assunto
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
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
                        className="block text-sm font-bold uppercase tracking-wider text-wepac-white/50"
                      >
                        Mensagem
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={5}
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="mt-2 w-full border-b border-wepac-white/20 bg-transparent py-3 text-wepac-white outline-none transition-colors focus:border-wepac-white resize-none"
                      />
                    </div>
                    {error && (
                      <p className="text-red-400 text-sm">
                        Não foi possível enviar a mensagem. Tente novamente ou
                        contacte-nos diretamente através de{" "}
                        <a href="mailto:info@wepac.pt" className="underline">
                          info@wepac.pt
                        </a>
                        .
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={sending}
                      className="w-full bg-wepac-white py-3 font-barlow text-sm font-bold uppercase tracking-wider text-wepac-black transition-opacity hover:opacity-90 disabled:opacity-50 md:w-auto md:px-12"
                    >
                      {sending ? "A enviar..." : "Enviar mensagem"}
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

export default function ContactoPage() {
  return (
    <Suspense fallback={null}>
      <ContactoContent />
    </Suspense>
  );
}
