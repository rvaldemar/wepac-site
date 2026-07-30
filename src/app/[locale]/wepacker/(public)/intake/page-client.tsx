"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { submitApplication } from "@/lib/wepacker/actions/application";
import {
  intakeFormSurfaceCopy,
  type GenericIntakeSource,
  type IntakeFormSurfaceCopy,
} from "@/i18n/copy/society-surfaces";
import type { AppLocale } from "@/i18n/routing";

export type { GenericIntakeSource } from "@/i18n/copy/society-surfaces";

interface CandidaturaFormProps {
  source?: GenericIntakeSource;
}

interface FieldErrors {
  name?: string;
  email?: string;
  entrantType?: string;
  focus?: string;
  currentMoment?: string;
  motivation?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateFields(
  fd: FormData,
  copy: IntakeFormSurfaceCopy,
): FieldErrors {
  const errors: FieldErrors = {};

  const name = (fd.get("name") as string)?.trim();
  if (!name) errors.name = copy.validation.nameRequired;

  const email = (fd.get("email") as string)?.trim();
  if (!email) errors.email = copy.validation.emailRequired;
  else if (!EMAIL_PATTERN.test(email))
    errors.email = copy.validation.emailInvalid;

  const entrantType = (fd.get("entrantType") as string)?.trim();
  if (!entrantType || !copy.entrantTypeLabels[entrantType]) {
    errors.entrantType = copy.validation.entrantTypeRequired;
  }

  const focus = (fd.get("focus") as string)?.trim();
  if (!focus || !copy.focusLabels[focus]) {
    errors.focus = copy.validation.focusRequired;
  }

  const currentMoment = (fd.get("currentMoment") as string)?.trim();
  if (!currentMoment) {
    errors.currentMoment = copy.validation.currentMomentRequired;
  }

  const motivation = (fd.get("motivation") as string)?.trim();
  if (!motivation) {
    errors.motivation = copy.validation.motivationRequired;
  }

  return errors;
}

function buildGenericMotivation(
  fd: FormData,
  copy: IntakeFormSurfaceCopy,
  source?: GenericIntakeSource,
): string {
  const entrantType = (fd.get("entrantType") as string)?.trim();
  const focus = (fd.get("focus") as string)?.trim();
  const currentMoment = (fd.get("currentMoment") as string)?.trim();
  const motivation = (fd.get("motivation") as string)?.trim();

  return [
    `${copy.serialized.entrantType}: ${copy.entrantTypeLabels[entrantType] ?? entrantType}`,
    `${copy.serialized.focus}: ${copy.focusLabels[focus] ?? focus}`,
    `${copy.serialized.currentMoment}: ${currentMoment}`,
    source ? `${copy.serialized.source}: /${source}` : null,
    "",
    `${copy.serialized.motivation}:`,
    motivation,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

export function CandidaturaFormClient({ source }: CandidaturaFormProps) {
  const locale = useLocale() as AppLocale;
  const copy = intakeFormSurfaceCopy[locale];
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [entrantType, setEntrantType] = useState(
    source === "familias"
      ? "family"
      : source === "organizations"
        ? "organization"
        : "",
  );
  const [focus, setFocus] = useState(
    source === "academy"
      ? "education"
      : source === "upgraded-backpack"
        ? "continuity"
        : source === "organizations"
          ? "organization-community"
          : "",
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

    const errors = validateFields(fd, copy);
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
      motivation: buildGenericMotivation(fd, copy, source),
    };

    try {
      await submitApplication(data);
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg(copy.submitError);
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
          {copy.successTitle}
        </p>
        <p className="mt-3 text-sm text-wepac-text-secondary">
          {copy.successBody}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="name"
            className="mb-1 block text-sm text-wepac-text-secondary"
          >
            {copy.fields.name}{" "}
            <span className="text-wepac-error" aria-hidden="true">
              *
            </span>
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
            placeholder={copy.fields.namePlaceholder}
            className="w-full border border-wepac-border bg-wepac-black px-4 py-3 text-sm text-wepac-white placeholder:text-wepac-text-tertiary focus:border-wepac-white focus:outline-none"
          />
          {fieldErrors.name && (
            <p
              id="name-error"
              role="alert"
              className="mt-1 text-xs text-wepac-error"
            >
              {fieldErrors.name}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm text-wepac-text-secondary"
          >
            {copy.fields.email}{" "}
            <span className="text-wepac-error" aria-hidden="true">
              *
            </span>
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
            placeholder={copy.fields.emailPlaceholder}
            className="w-full border border-wepac-border bg-wepac-black px-4 py-3 text-sm text-wepac-white placeholder:text-wepac-text-tertiary focus:border-wepac-white focus:outline-none"
          />
          {fieldErrors.email && (
            <p
              id="email-error"
              role="alert"
              className="mt-1 text-xs text-wepac-error"
            >
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
              {copy.fields.entrantType}{" "}
              <span className="text-wepac-error" aria-hidden="true">
                *
              </span>
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
              <option value="">{copy.fields.choose}</option>
              {Object.entries(copy.entrantTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
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
              {copy.fields.focus}{" "}
              <span className="text-wepac-error" aria-hidden="true">
                *
              </span>
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
              <option value="">{copy.fields.choose}</option>
              {Object.entries(copy.focusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {fieldErrors.focus && (
              <p
                id="focus-error"
                role="alert"
                className="mt-1 text-xs text-wepac-error"
              >
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
            {copy.fields.currentMoment}{" "}
            <span className="text-wepac-error" aria-hidden="true">
              *
            </span>
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
            placeholder={copy.fields.currentMomentPlaceholder}
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
          <label
            htmlFor="phone"
            className="mb-1 block text-sm text-wepac-text-secondary"
          >
            {copy.fields.phone}
          </label>
          <input
            id="phone"
            type="tel"
            name="phone"
            autoComplete="tel"
            placeholder={copy.fields.phonePlaceholder}
            className="w-full border border-wepac-border bg-wepac-black px-4 py-3 text-sm text-wepac-white placeholder:text-wepac-text-tertiary focus:border-wepac-white focus:outline-none"
          />
        </div>
        {isArtisticBranch && (
          <div>
            <label
              htmlFor="area"
              className="mb-1 block text-sm text-wepac-text-secondary"
            >
              {copy.fields.practiceArea}
            </label>
            <input
              id="area"
              type="text"
              name="area"
              placeholder={copy.fields.practiceAreaPlaceholder}
              className="w-full border border-wepac-border bg-wepac-black px-4 py-3 text-sm text-wepac-white placeholder:text-wepac-text-tertiary focus:border-wepac-white focus:outline-none"
            />
          </div>
        )}
      </div>
      {isArtisticBranch && (
        <div>
          <label
            htmlFor="socialLinks"
            className="mb-1 block text-sm text-wepac-text-secondary"
          >
            {copy.fields.socialLinks}
          </label>
          <input
            id="socialLinks"
            type="text"
            name="socialLinks"
            placeholder={copy.fields.socialLinksPlaceholder}
            className="w-full border border-wepac-border bg-wepac-black px-4 py-3 text-sm text-wepac-white placeholder:text-wepac-text-tertiary focus:border-wepac-white focus:outline-none"
          />
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {isArtisticBranch
          ? copy.artisticFieldsVisible
          : copy.artisticFieldsHidden}
      </p>
      <div>
        <label
          htmlFor="motivation"
          className="mb-1 block text-sm text-wepac-text-secondary"
        >
          {copy.fields.motivation}{" "}
          <span className="text-wepac-error" aria-hidden="true">
            *
          </span>
        </label>
        <textarea
          id="motivation"
          name="motivation"
          required
          aria-required="true"
          aria-invalid={fieldErrors.motivation ? true : undefined}
          aria-describedby={
            fieldErrors.motivation ? "motivation-error" : undefined
          }
          placeholder={copy.fields.motivationPlaceholder}
          maxLength={180}
          rows={4}
          className="w-full resize-none border border-wepac-border bg-wepac-black px-4 py-3 text-sm text-wepac-white placeholder:text-wepac-text-tertiary focus:border-wepac-white focus:outline-none"
        />
        {fieldErrors.motivation && (
          <p
            id="motivation-error"
            role="alert"
            className="mt-1 text-xs text-wepac-error"
          >
            {fieldErrors.motivation}
          </p>
        )}
      </div>

      <p className="text-xs text-wepac-text-tertiary">
        {copy.privacyPrefix}{" "}
        <Link
          href="/privacidade"
          className="text-wepac-white underline hover:text-wepac-accent-muted"
        >
          {copy.privacyLink}
        </Link>
        {copy.privacySuffix}
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
        {status === "loading" ? copy.loading : copy.submit}
      </button>
    </form>
  );
}
