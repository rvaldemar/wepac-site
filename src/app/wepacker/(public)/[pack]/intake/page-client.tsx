"use client";

import { useState } from "react";
import Link from "next/link";
import { submitApplication } from "@/lib/wepacker/actions/application";

interface CandidaturaFormProps {
  packSlug: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateFields(fd: FormData): FieldErrors {
  const errors: FieldErrors = {};

  const name = (fd.get("name") as string)?.trim();
  if (!name) errors.name = "O nome é obrigatório.";

  const email = (fd.get("email") as string)?.trim();
  if (!email) errors.email = "O email é obrigatório.";
  else if (!EMAIL_PATTERN.test(email)) errors.email = "Introduz um email válido.";

  return errors;
}

export function CandidaturaFormClient({ packSlug }: CandidaturaFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");

    const form = e.currentTarget;
    const fd = new FormData(form);

    const errors = validateFields(fd);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setStatus("idle");
      return;
    }
    setFieldErrors({});
    setStatus("loading");

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
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm text-wepac-text-secondary">
            Nome <span className="text-wepac-error" aria-hidden="true">*</span>
          </label>
          <input
            id="name"
            type="text"
            name="name"
            required
            aria-required="true"
            aria-invalid={fieldErrors.name ? true : undefined}
            aria-describedby={fieldErrors.name ? "name-error" : undefined}
            placeholder="Ex: Maria Silva"
            className="w-full border border-wepac-border bg-wepac-black px-4 py-3 text-sm text-wepac-white placeholder:text-wepac-text-tertiary focus:border-wepac-white focus:outline-none"
          />
          {fieldErrors.name && (
            <p id="name-error" role="alert" className="mt-1 text-xs text-wepac-error">
              {fieldErrors.name}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-wepac-text-secondary">
            Email <span className="text-wepac-error" aria-hidden="true">*</span>
          </label>
          <input
            id="email"
            type="email"
            name="email"
            required
            aria-required="true"
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
            placeholder="Ex: maria@exemplo.com"
            className="w-full border border-wepac-border bg-wepac-black px-4 py-3 text-sm text-wepac-white placeholder:text-wepac-text-tertiary focus:border-wepac-white focus:outline-none"
          />
          {fieldErrors.email && (
            <p id="email-error" role="alert" className="mt-1 text-xs text-wepac-error">
              {fieldErrors.email}
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="mb-1 block text-sm text-wepac-text-secondary">
            Telefone
          </label>
          <input
            id="phone"
            type="tel"
            name="phone"
            placeholder="Ex: 912 345 678"
            className="w-full border border-wepac-border bg-wepac-black px-4 py-3 text-sm text-wepac-white placeholder:text-wepac-text-tertiary focus:border-wepac-white focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="area" className="mb-1 block text-sm text-wepac-text-secondary">
            Área de prática
          </label>
          <input
            id="area"
            type="text"
            name="area"
            placeholder="Ex: teatro, música, artes visuais"
            className="w-full border border-wepac-border bg-wepac-black px-4 py-3 text-sm text-wepac-white placeholder:text-wepac-text-tertiary focus:border-wepac-white focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label htmlFor="socialLinks" className="mb-1 block text-sm text-wepac-text-secondary">
          Portfolio / redes sociais
        </label>
        <input
          id="socialLinks"
          type="text"
          name="socialLinks"
          placeholder="Ex: https://instagram.com/maria"
          className="w-full border border-wepac-border bg-wepac-black px-4 py-3 text-sm text-wepac-white placeholder:text-wepac-text-tertiary focus:border-wepac-white focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="motivation" className="mb-1 block text-sm text-wepac-text-secondary">
          Porquê o WEPACKER?
        </label>
        <textarea
          id="motivation"
          name="motivation"
          placeholder="Conta-nos em poucas palavras (máx. 500 caracteres)"
          maxLength={500}
          rows={4}
          className="w-full resize-none border border-wepac-border bg-wepac-black px-4 py-3 text-sm text-wepac-white placeholder:text-wepac-text-tertiary focus:border-wepac-white focus:outline-none"
        />
      </div>

      <p className="text-xs text-wepac-text-tertiary">
        Os dados que preenches aqui são usados apenas para responder à tua
        candidatura — a equipa entra em contacto em poucos dias úteis. Consulta a{" "}
        <Link href="/privacidade" className="text-wepac-white underline hover:text-wepac-accent-muted">
          política de privacidade
        </Link>
        .
      </p>

      {status === "error" && (
        <p role="alert" className="text-sm text-wepac-error">
          {errorMsg}
        </p>
      )}
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
