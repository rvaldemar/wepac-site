"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-wepac-black px-6">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <h1 className="font-barlow text-3xl font-bold text-wepac-white">
            Artista Alpha
          </h1>
          <p className="mt-1 text-sm text-wepac-text-tertiary">
            WEPAC — Companhia de Artes
          </p>
        </div>

        <form
          className="mt-10 space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setLoading(true);
            const res = await signIn("credentials", {
              email,
              password,
              redirect: false,
            });
            setLoading(false);
            if (res?.error) {
              setError("Email ou password incorretos.");
              return;
            }
            router.push("/artists/alpha/dashboard");
            router.refresh();
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

          <div>
            <label htmlFor="password" className="block text-sm text-wepac-text-secondary">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded bg-wepac-input px-4 py-3 text-sm text-wepac-white placeholder-wepac-text-tertiary outline-none focus:ring-1 focus:ring-wepac-white/50"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-wepac-text-tertiary">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="accent-wepac-white"
              />
              Manter sessão
            </label>
            <Link
              href="/artists/alpha/password/reset"
              className="text-sm text-wepac-white hover:underline"
            >
              Esqueci a password
            </Link>
          </div>

          {error && (
            <p className="text-sm text-wepac-error">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-wepac-white px-4 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted disabled:opacity-50"
          >
            {loading ? "A entrar..." : "Entrar"}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-wepac-text-tertiary">
          Acesso por convite. Não tens conta?{" "}
          <a href="mailto:info@wepac.pt" className="text-wepac-white hover:underline">
            Contacta-nos
          </a>
        </p>
      </div>
    </div>
  );
}
