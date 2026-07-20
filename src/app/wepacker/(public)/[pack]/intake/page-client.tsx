"use client";

import { useState } from "react";
import { submitApplication } from "@/lib/wepacker/actions/application";

interface CandidaturaFormProps {
  packSlug: string;
  domainLabel: string;
}

export function CandidaturaFormClient({ packSlug, domainLabel }: CandidaturaFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const form = e.currentTarget;
    const fd = new FormData(form);

    const data = {
      packSlug,
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      phone: (fd.get("phone") as string) || undefined,
      area: (fd.get("area") as string) || undefined,
      socialLinks: (fd.get("socialLinks") as string) || undefined,
      motivation: (fd.get("motivation") as string) || undefined,
    };

    try {
      await submitApplication(data);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Erro ao enviar candidatura.");
    }
  }

  if (status === "success") {
    return (
      <div className="border border-wepac-border bg-wepac-card p-8 text-center">
        <p className="font-barlow text-2xl font-bold text-wepac-white">Candidatura recebida</p>
        <p className="mt-3 text-sm text-wepac-text-secondary">
          Vamos entrar em contacto. A equipa analisa o teu perfil e responde em breve.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input
          type="text"
          name="name"
          required
          placeholder="Nome *"
          className="border border-wepac-border bg-wepac-black px-4 py-3 text-sm text-wepac-white placeholder:text-wepac-text-tertiary focus:border-wepac-white focus:outline-none"
        />
        <input
          type="email"
          name="email"
          required
          placeholder="Email *"
          className="border border-wepac-border bg-wepac-black px-4 py-3 text-sm text-wepac-white placeholder:text-wepac-text-tertiary focus:border-wepac-white focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input
          type="tel"
          name="phone"
          placeholder="Telefone"
          className="border border-wepac-border bg-wepac-black px-4 py-3 text-sm text-wepac-white placeholder:text-wepac-text-tertiary focus:border-wepac-white focus:outline-none"
        />
        <input
          type="text"
          name="area"
          placeholder={`A tua área — ${domainLabel}`}
          className="border border-wepac-border bg-wepac-black px-4 py-3 text-sm text-wepac-white placeholder:text-wepac-text-tertiary focus:border-wepac-white focus:outline-none"
        />
      </div>
      <input
        type="text"
        name="socialLinks"
        placeholder="Link para portfolio ou redes sociais"
        className="w-full border border-wepac-border bg-wepac-black px-4 py-3 text-sm text-wepac-white placeholder:text-wepac-text-tertiary focus:border-wepac-white focus:outline-none"
      />
      <textarea
        name="motivation"
        placeholder="Porquê o WEPACKER? (máx. 500 caracteres)"
        maxLength={500}
        rows={4}
        className="w-full resize-none border border-wepac-border bg-wepac-black px-4 py-3 text-sm text-wepac-white placeholder:text-wepac-text-tertiary focus:border-wepac-white focus:outline-none"
      />
      {status === "error" && <p className="text-sm text-wepac-error">{errorMsg}</p>}
      <button
        type="submit"
        disabled={status === "loading"}
        className="border border-wepac-border bg-wepac-white px-8 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted disabled:opacity-50"
      >
        {status === "loading" ? "A enviar..." : "Enviar candidatura"}
      </button>
    </form>
  );
}
