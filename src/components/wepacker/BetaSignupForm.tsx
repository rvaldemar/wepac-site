"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { wp } from "@/i18n/copy/wepacker";
import { submitApplication } from "@/lib/wepacker/actions/application";

// Public application form used on the /artist marketing page. It creates a
// generic WEPACKER application and never implies a Pack or Cycle relationship.
export function BetaSignupForm() {
  const locale = useLocale();
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const form = e.currentTarget;
    const fd = new FormData(form);

    const data = {
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      phone: (fd.get("phone") as string) || undefined,
      artisticArea: (fd.get("artisticArea") as string) || undefined,
      socialLinks: (fd.get("socialLinks") as string) || undefined,
      motivation: (fd.get("motivation") as string) || undefined,
    };

    try {
      await submitApplication(data);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err instanceof Error
          ? err.message
          : wp(
              locale,
              "Erro ao enviar candidatura.",
              "Could not submit the application.",
            ),
      );
    }
  }

  if (status === "success") {
    return (
      <div className="border border-wepac-gray/30 bg-black p-8 text-center">
        <p className="font-barlow text-2xl font-bold text-white">
          {wp(locale, "Candidatura enviada", "Application submitted")}
        </p>
        <p className="mt-3 text-sm text-white/60">
          {wp(
            locale,
            "A equipa analisa o teu perfil e entra em contacto em breve.",
            "The team will review your profile and contact you soon.",
          )}
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
          placeholder={wp(locale, "Nome *", "Name *")}
          className="border border-wepac-gray/30 bg-black px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white focus:outline-none"
        />
        <input
          type="email"
          name="email"
          required
          placeholder="Email *"
          className="border border-wepac-gray/30 bg-black px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input
          type="tel"
          name="phone"
          placeholder={wp(locale, "Telefone", "Phone")}
          className="border border-wepac-gray/30 bg-black px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white focus:outline-none"
        />
        <input
          type="text"
          name="artisticArea"
          defaultValue="Arts"
          placeholder={wp(locale, "A tua área artística", "Your artistic field")}
          className="border border-wepac-gray/30 bg-black px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white focus:outline-none"
        />
      </div>
      <input
        type="text"
        name="socialLinks"
        placeholder={wp(
          locale,
          "Link para portfolio ou redes sociais",
          "Portfolio or social media link",
        )}
        className="w-full border border-wepac-gray/30 bg-black px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white focus:outline-none"
      />
      <textarea
        name="motivation"
        placeholder={wp(
          locale,
          "Porquê o WEPACKER? (máx. 500 caracteres)",
          "Why WEPACKER? (500 characters max.)",
        )}
        maxLength={500}
        rows={4}
        className="w-full resize-none border border-wepac-gray/30 bg-black px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white focus:outline-none"
      />
      {status === "error" && <p className="text-sm text-red-400">{errorMsg}</p>}
      <button
        type="submit"
        disabled={status === "loading"}
        className="border border-wepac-gray/30 bg-white px-8 py-3 text-sm font-bold text-black transition-colors hover:bg-wepac-gray disabled:opacity-50"
      >
        {status === "loading"
          ? wp(locale, "A enviar...", "Submitting...")
          : wp(locale, "Enviar candidatura", "Submit application")}
      </button>
    </form>
  );
}
