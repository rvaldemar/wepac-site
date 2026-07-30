"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { wp } from "@/i18n/copy/wepacker";
import { useRouter } from "@/i18n/navigation";
import { signIn } from "next-auth/react";
import { acceptInvite } from "@/lib/wepacker/actions/invite";

export function InvitePageClient({
  token,
  userName,
  userEmail,
}: {
  token: string;
  userName: string;
  userEmail: string;
}) {
  const locale = useLocale();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-wepac-black px-6">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <h1 className="font-barlow text-3xl font-bold text-wepac-white">
            {wp(locale, "Bem-vindo à WEPACKER", "Welcome to WEPACKER")}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-wepac-text-secondary">
            {wp(locale, "Olá", "Hello")} {userName},{" "}
            {wp(
              locale,
              "foste convidado a entrar na WEPACKER. Cria a tua password para aceder a My Journey.",
              "you have been invited to join WEPACKER. Create your password to access My Journey.",
            )}
          </p>
        </div>

        <form
          className="mt-10 space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            if (password !== confirm) {
              setError(
                wp(
                  locale,
                  "As passwords não coincidem.",
                  "The passwords do not match.",
                ),
              );
              return;
            }
            setLoading(true);
            try {
              await acceptInvite(token, password);
              await signIn("credentials", {
                email: userEmail,
                password,
                redirect: false,
              });
              router.push("/wepacker/welcome");
            } catch (err: unknown) {
              setError(
                err instanceof Error
                  ? err.message
                  : wp(
                      locale,
                      "Erro ao criar conta.",
                      "Could not create the account.",
                    ),
              );
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
              placeholder={wp(
                locale,
                "Mínimo 8 caracteres",
                "At least 8 characters",
              )}
            />
          </div>

          <div>
            <label htmlFor="confirm" className="block text-sm text-wepac-text-secondary">
              {wp(locale, "Confirmar password", "Confirm password")}
            </label>
            <input
              id="confirm"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full bg-wepac-input px-4 py-3 text-sm text-wepac-white placeholder-wepac-text-tertiary outline-none focus:ring-1 focus:ring-wepac-white/50"
              placeholder={wp(
                locale,
                "Repete a password",
                "Repeat the password",
              )}
            />
          </div>

          {error && <p className="text-sm text-wepac-error">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-wepac-white px-4 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted disabled:opacity-50"
          >
            {loading
              ? wp(locale, "A criar conta...", "Creating account...")
              : wp(
                  locale,
                  "Criar conta e continuar",
                  "Create account and continue",
                )}
          </button>
        </form>
      </div>
    </div>
  );
}
