"use client";

import { useState } from "react";

export default function InvitePage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  return (
    <div className="flex min-h-screen items-center justify-center bg-wepac-black px-6">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <h1 className="font-barlow text-3xl font-bold text-wepac-white">
            Bem-vindo ao Artista Alpha
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-wepac-text-secondary">
            Foste convidado para participar no programa Artistas WEPAC. Cria a
            tua password para começar.
          </p>
        </div>

        <form
          className="mt-10 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            window.location.href = "/artists/alpha/welcome";
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
              className="mt-1 w-full rounded bg-wepac-input px-4 py-3 text-sm text-wepac-white placeholder-wepac-text-tertiary outline-none focus:ring-1 focus:ring-wepac-white/50"
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
              className="mt-1 w-full rounded bg-wepac-input px-4 py-3 text-sm text-wepac-white placeholder-wepac-text-tertiary outline-none focus:ring-1 focus:ring-wepac-white/50"
              placeholder="Repete a password"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded bg-wepac-white px-4 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted"
          >
            Criar conta e continuar
          </button>
        </form>
      </div>
    </div>
  );
}
