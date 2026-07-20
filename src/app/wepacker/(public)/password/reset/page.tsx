"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { requestPasswordReset, resetPassword } from "@/lib/wepacker/actions/invite";

function RequestResetForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
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
            href="/wepacker/login"
            className="mt-6 inline-block text-sm text-wepac-white hover:underline"
          >
            Voltar ao login
          </Link>
        </div>
      ) : (
        <form
          className="mt-10 space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            try {
              await requestPasswordReset(email);
            } finally {
              setLoading(false);
              setSent(true);
            }
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
              className="mt-1 w-full bg-wepac-input px-4 py-3 text-sm text-wepac-white placeholder-wepac-text-tertiary outline-none focus:ring-1 focus:ring-wepac-white/50"
              placeholder="email@exemplo.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-wepac-white px-4 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted disabled:opacity-50"
          >
            {loading ? "A enviar..." : "Enviar link de recuperação"}
          </button>

          <Link
            href="/wepacker/login"
            className="block text-center text-sm text-wepac-text-tertiary hover:text-wepac-text-secondary"
          >
            Voltar ao login
          </Link>
        </form>
      )}
    </div>
  );
}

function NewPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  if (done) {
    return (
      <div className="w-full max-w-sm text-center">
        <h1 className="font-barlow text-3xl font-bold text-wepac-white">
          Password redefinida
        </h1>
        <p className="mt-4 text-sm text-wepac-text-secondary">
          A tua password foi alterada com sucesso.
        </p>
        <Link
          href="/wepacker/login"
          className="mt-8 inline-block bg-wepac-white px-8 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted"
        >
          Ir para login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center">
        <h1 className="font-barlow text-3xl font-bold text-wepac-white">
          Nova password
        </h1>
        <p className="mt-3 text-sm text-wepac-text-secondary">
          Define a tua nova password de acesso.
        </p>
      </div>

      <form
        className="mt-10 space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          if (password !== confirm) {
            setError("As passwords não coincidem.");
            return;
          }
          setLoading(true);
          try {
            await resetPassword(token, password);
            setDone(true);
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erro ao redefinir password.");
          } finally {
            setLoading(false);
          }
        }}
      >
        <div>
          <label htmlFor="password" className="block text-sm text-wepac-text-secondary">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full bg-wepac-input px-4 py-3 text-sm text-wepac-white placeholder-wepac-text-tertiary outline-none focus:ring-1 focus:ring-wepac-white/50"
            placeholder="Mínimo 8 caracteres"
          />
        </div>

        <div>
          <label htmlFor="confirm" className="block text-sm text-wepac-text-secondary">
            Confirmar password
          </label>
          <input
            id="confirm"
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 w-full bg-wepac-input px-4 py-3 text-sm text-wepac-white placeholder-wepac-text-tertiary outline-none focus:ring-1 focus:ring-wepac-white/50"
            placeholder="Repete a password"
          />
        </div>

        {error && <p className="text-sm text-wepac-error">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-wepac-white px-4 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted disabled:opacity-50"
        >
          {loading ? "A guardar..." : "Redefinir password"}
        </button>

        <Link
          href="/wepacker/login"
          className="block text-center text-sm text-wepac-text-tertiary hover:text-wepac-text-secondary"
        >
          Voltar ao login
        </Link>
      </form>
    </div>
  );
}

function PasswordResetContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  return (
    <div className="flex min-h-screen items-center justify-center bg-wepac-black px-6">
      {token ? <NewPasswordForm token={token} /> : <RequestResetForm />}
    </div>
  );
}

export default function PasswordResetPage() {
  return (
    <Suspense fallback={null}>
      <PasswordResetContent />
    </Suspense>
  );
}
