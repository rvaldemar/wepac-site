"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useState } from "react";
import { useLocale } from "next-intl";
import { wp } from "@/i18n/copy/wepacker";
import { signIn } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";

export default function LoginPage() {
  const locale = useLocale();
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
          <Image
            src="/logo/email/wepacker-lockup-white.png"
            alt="WEPACKER"
            width={160}
            height={80}
            className="mx-auto h-10 w-auto"
            priority
          />
          <p className="mt-1 text-sm text-wepac-text-tertiary">
            WEPAC
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
              setError(
                wp(
                  locale,
                  "Email ou password incorretos.",
                  "Incorrect email or password.",
                ),
              );
              return;
            }
            router.push("/wepacker/dashboard");
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
              className="mt-1 w-full bg-wepac-input px-4 py-3 text-sm text-wepac-white placeholder-wepac-text-tertiary outline-none focus:ring-1 focus:ring-wepac-white/50"
              placeholder={wp(
                locale,
                "email@exemplo.com",
                "email@example.com",
              )}
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
              className="mt-1 w-full bg-wepac-input px-4 py-3 text-sm text-wepac-white placeholder-wepac-text-tertiary outline-none focus:ring-1 focus:ring-wepac-white/50"
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
              {wp(locale, "Manter sessão", "Keep me signed in")}
            </label>
            <Link
              href="/wepacker/password/reset"
              className="text-sm text-wepac-white hover:underline"
            >
              {wp(locale, "Esqueci a password", "Forgot password")}
            </Link>
          </div>

          {error && <p className="text-sm text-wepac-error">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-wepac-white px-4 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted disabled:opacity-50"
          >
            {loading
              ? wp(locale, "A entrar...", "Signing in...")
              : wp(locale, "Entrar", "Sign in")}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-wepac-text-tertiary">
          {wp(
            locale,
            "Acesso por convite. Não tens conta?",
            "Access is by invitation. No account?",
          )}{" "}
          <a href="mailto:info@wepac.pt" className="text-wepac-white hover:underline">
            {wp(locale, "Contacta-nos", "Contact us")}
          </a>
        </p>
      </div>
    </div>
  );
}
