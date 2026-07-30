"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { submitApplication } from "@/lib/wepacker/actions/application";

interface CandidaturaFormProps {
  source?: GenericIntakeSource;
}

export type GenericIntakeSource =
  | "society"
  | "life-plan"
  | "familias"
  | "academy"
  | "upgraded-backpack";

interface FieldErrors {
  name?: string;
  email?: string;
  entrantType?: string;
  focus?: string;
  currentMoment?: string;
  motivation?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ENTRANT_TYPE_LABELS: Record<string, string> = {
  person: "Pessoa",
  family: "Família",
  organization: "Organização",
  artist: "Artista",
};

const FOCUS_LABELS: Record<string, string> = {
  education: "Educação",
  relationships: "Relações / família",
  career: "Carreira",
  "personal-project": "Projeto pessoal",
  "organization-community": "Organização / comunidade",
  "artistic-practice": "Prática artística",
  continuity: "Continuidade / subscrição",
  other: "Outro",
};

function validateFields(fd: FormData): FieldErrors {
  const errors: FieldErrors = {};

  const name = (fd.get("name") as string)?.trim();
  if (!name) errors.name = "O nome é obrigatório.";

  const email = (fd.get("email") as string)?.trim();
  if (!email) errors.email = "O email é obrigatório.";
  else if (!EMAIL_PATTERN.test(email)) errors.email = "Introduz um email válido.";

  const entrantType = (fd.get("entrantType") as string)?.trim();
  if (!entrantType || !ENTRANT_TYPE_LABELS[entrantType]) {
    errors.entrantType = "Escolhe como estás a entrar.";
  }

  const focus = (fd.get("focus") as string)?.trim();
  if (!focus || !FOCUS_LABELS[focus]) {
    errors.focus = "Escolhe o que queres trabalhar ou construir.";
  }

  const currentMoment = (fd.get("currentMoment") as string)?.trim();
  if (!currentMoment) {
    errors.currentMoment = "Conta-nos em que momento te encontras.";
  }

  const motivation = (fd.get("motivation") as string)?.trim();
  if (!motivation) {
    errors.motivation = "Conta-nos onde estás e o que gostarias de construir.";
  }

  return errors;
}

function buildGenericMotivation(fd: FormData, source?: GenericIntakeSource): string {
  const entrantType = (fd.get("entrantType") as string)?.trim();
  const focus = (fd.get("focus") as string)?.trim();
  const currentMoment = (fd.get("currentMoment") as string)?.trim();
  const motivation = (fd.get("motivation") as string)?.trim();

  return [
    `Entro como: ${ENTRANT_TYPE_LABELS[entrantType] ?? entrantType}`,
    `Quero trabalhar ou construir: ${FOCUS_LABELS[focus] ?? focus}`,
    `Momento atual: ${currentMoment}`,
    source ? `Origem: /${source}` : null,
    "",
    "Onde estou e o que gostaria de construir:",
    motivation,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

export function CandidaturaFormClient({ source }: CandidaturaFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [entrantType, setEntrantType] = useState(
    source === "familias" ? "family" : ""
  );
  const [focus, setFocus] = useState(
    source === "academy"
      ? "education"
      : source === "upgraded-backpack"
        ? "continuity"
        : ""
  );
  const successRef = useRef<HTMLDivElement>(null);
  const isArtisticBranch =
    entrantType === "artist" || focus === "artistic-practice";

  useEffect(() => {
    if (status === "success") successRef.current?.focus();
  }, [status]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");

    const form = e.currentTarget;
    const fd = new FormData(form);

    const errors = validateFields(fd);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setStatus("idle");
      const firstInvalidField = form.elements.namedItem(Object.keys(errors)[0]);
      if (firstInvalidField instanceof HTMLElement) firstInvalidField.focus();
      return;
    }
    setFieldErrors({});
    setStatus("loading");

    const data = {
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      phone: (fd.get("phone") as string) || undefined,
      artisticArea: isArtisticBranch
        ? (fd.get("area") as string) || undefined
        : undefined,
      socialLinks: isArtisticBranch
        ? (fd.get("socialLinks") as string) || undefined
        : undefined,
      motivation: buildGenericMotivation(fd, source),
    };

    try {
      await submitApplication(data);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Erro ao enviar o ponto de partida."
      );
    }
  }

  if (status === "success") {
    return (
      <div
        ref={successRef}
        role="status"
        tabIndex={-1}
        className="border border-wepac-border bg-wepac-card p-8 text-center outline-none"
      >
        <p className="font-barlow text-2xl font-bold text-wepac-white">
          Ponto de partida recebido
        </p>
        <p className="mt-3 text-sm text-wepac-text-secondary">
          Vamos entrar em contacto para encontrar contigo o próximo passo.
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
            autoComplete="name"
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
            autoComplete="email"
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
      <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="entrantType"
                className="mb-1 block text-sm text-wepac-text-secondary"
              >
                Entro como <span className="text-wepac-error" aria-hidden="true">*</span>
              </label>
              <select
                id="entrantType"
                name="entrantType"
                required
                value={entrantType}
                onChange={(event) => setEntrantType(event.target.value)}
                aria-required="true"
                aria-invalid={fieldErrors.entrantType ? true : undefined}
                aria-describedby={
                  fieldErrors.entrantType ? "entrantType-error" : undefined
                }
                className="w-full border border-wepac-border bg-wepac-black px-4 py-3 text-sm text-wepac-white focus:border-wepac-white focus:outline-none"
              >
                <option value="">Escolhe uma opção</option>
                <option value="person">Pessoa</option>
                <option value="family">Família</option>
                <option value="organization">Organização</option>
                <option value="artist">Artista</option>
              </select>
              {fieldErrors.entrantType && (
                <p
                  id="entrantType-error"
                  role="alert"
                  className="mt-1 text-xs text-wepac-error"
                >
                  {fieldErrors.entrantType}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="focus"
                className="mb-1 block text-sm text-wepac-text-secondary"
              >
                O que quero trabalhar ou construir?{" "}
                <span className="text-wepac-error" aria-hidden="true">*</span>
              </label>
              <select
                id="focus"
                name="focus"
                required
                value={focus}
                onChange={(event) => setFocus(event.target.value)}
                aria-required="true"
                aria-invalid={fieldErrors.focus ? true : undefined}
                aria-describedby={fieldErrors.focus ? "focus-error" : undefined}
                className="w-full border border-wepac-border bg-wepac-black px-4 py-3 text-sm text-wepac-white focus:border-wepac-white focus:outline-none"
              >
                <option value="">Escolhe uma opção</option>
                <option value="education">Educação</option>
                <option value="relationships">Relações / família</option>
                <option value="career">Carreira</option>
                <option value="personal-project">Projeto pessoal</option>
                <option value="organization-community">
                  Organização / comunidade
                </option>
                <option value="artistic-practice">Prática artística</option>
                <option value="continuity">Continuidade / subscrição</option>
                <option value="other">Outro</option>
              </select>
              {fieldErrors.focus && (
                <p id="focus-error" role="alert" className="mt-1 text-xs text-wepac-error">
                  {fieldErrors.focus}
                </p>
              )}
            </div>
          </div>
          <div>
            <label
              htmlFor="currentMoment"
              className="mb-1 block text-sm text-wepac-text-secondary"
            >
              Em que momento me encontro?{" "}
              <span className="text-wepac-error" aria-hidden="true">*</span>
            </label>
            <input
              id="currentMoment"
              type="text"
              name="currentMoment"
              required
              maxLength={120}
              aria-required="true"
              aria-invalid={fieldErrors.currentMoment ? true : undefined}
              aria-describedby={
                fieldErrors.currentMoment ? "currentMoment-error" : undefined
              }
              placeholder="Ex: estou a tomar uma decisão importante"
              className="w-full border border-wepac-border bg-wepac-black px-4 py-3 text-sm text-wepac-white placeholder:text-wepac-text-tertiary focus:border-wepac-white focus:outline-none"
            />
            {fieldErrors.currentMoment && (
              <p
                id="currentMoment-error"
                role="alert"
                className="mt-1 text-xs text-wepac-error"
              >
                {fieldErrors.currentMoment}
              </p>
            )}
          </div>
      </>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="mb-1 block text-sm text-wepac-text-secondary">
            Telefone
          </label>
          <input
            id="phone"
            type="tel"
            name="phone"
            autoComplete="tel"
            placeholder="Ex: 912 345 678"
            className="w-full border border-wepac-border bg-wepac-black px-4 py-3 text-sm text-wepac-white placeholder:text-wepac-text-tertiary focus:border-wepac-white focus:outline-none"
          />
        </div>
        {isArtisticBranch && (
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
        )}
      </div>
      {isArtisticBranch && (
        <div>
          <label htmlFor="socialLinks" className="mb-1 block text-sm text-wepac-text-secondary">
            Portefólio / redes sociais
          </label>
          <input
            id="socialLinks"
            type="text"
            name="socialLinks"
            placeholder="Ex: https://instagram.com/maria"
            className="w-full border border-wepac-border bg-wepac-black px-4 py-3 text-sm text-wepac-white placeholder:text-wepac-text-tertiary focus:border-wepac-white focus:outline-none"
          />
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {isArtisticBranch
          ? "Campos opcionais de prática artística disponíveis."
          : "Campos de prática artística ocultos."}
      </p>
      <div>
        <label htmlFor="motivation" className="mb-1 block text-sm text-wepac-text-secondary">
          Onde estás e o que gostarias de construir?{" "}
          <span className="text-wepac-error" aria-hidden="true">*</span>
        </label>
        <textarea
          id="motivation"
          name="motivation"
          required
          aria-required="true"
          aria-invalid={fieldErrors.motivation ? true : undefined}
          aria-describedby={fieldErrors.motivation ? "motivation-error" : undefined}
          placeholder="Conta-nos o que está a acontecer e o que gostarias que fosse diferente."
          maxLength={180}
          rows={4}
          className="w-full resize-none border border-wepac-border bg-wepac-black px-4 py-3 text-sm text-wepac-white placeholder:text-wepac-text-tertiary focus:border-wepac-white focus:outline-none"
        />
        {fieldErrors.motivation && (
          <p id="motivation-error" role="alert" className="mt-1 text-xs text-wepac-error">
            {fieldErrors.motivation}
          </p>
        )}
      </div>

      <p className="text-xs text-wepac-text-tertiary">
        Os dados que preenches aqui são usados apenas para compreender o teu
        ponto de partida e entrar em contacto contigo. Consulta a{" "}
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
        {status === "loading"
          ? "A enviar..."
          : "Dar o primeiro passo"}
      </button>
    </form>
  );
}
