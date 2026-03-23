"use client";

import Link from "next/link";
import { useState } from "react";

export default function PasswordResetPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-wepac-black px-6">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <h1 className="font-barlow text-3xl font-bold text-wepac-white">
            Recuperar password
          </h1>
          <p className="mt-3 text-sm text-wepac-text-secondary">
            Introduz o teu email e enviamos um link para redefinir a password.
          </p>
        </div>

        {sent ? (
          <div className="mt-10 text-center">
            <p className="text-sm text-wepac-text-secondary">
              Se o email existir na plataforma, receberás um link de recuperação.
            </p>
            <Link
              href="/artists/alpha/login"
              className="mt-6 inline-block text-sm text-wepac-white hover:underline"
            >
              Voltar ao login
            </Link>
          </div>
        ) : (
          <form
            className="mt-10 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <div>
              <label htmlFor="email" className="block text-sm text-wepac-text-secondary">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded bg-wepac-input px-4 py-3 text-sm text-wepac-white placeholder-wepac-text-tertiary outline-none focus:ring-1 focus:ring-wepac-white/50"
                placeholder="email@exemplo.com"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded bg-wepac-white px-4 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted"
            >
              Enviar link de recuperação
            </button>

            <Link
              href="/artists/alpha/login"
              className="block text-center text-sm text-wepac-text-tertiary hover:text-wepac-text-secondary"
            >
              Voltar ao login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
