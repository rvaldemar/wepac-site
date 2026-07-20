"use client";

import { useState } from "react";
import { updateMyProfile } from "@/lib/wepacker/actions/user";
import { LEVEL_LABELS, PHASE_LABELS, type MembershipContext } from "@/lib/wepacker/types";

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    bio: string | null;
    phone: string | null;
    avatarUrl: string | null;
  };
  membership: MembershipContext | null;
}

export default function ProfilePageClient({ user, membership }: Props) {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateMyProfile({ name, bio, phone });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-barlow text-2xl font-bold text-wepac-white">Perfil</h1>
      <p className="mt-1 text-sm text-wepac-text-tertiary">
        Os teus dados pessoais e de desenvolvimento.
      </p>

      <div className="mt-8 max-w-lg space-y-6">
        {/* Avatar placeholder */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center bg-wepac-white/10">
            <span className="font-barlow text-xl font-bold text-wepac-white">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-wepac-white">{user.name}</p>
            <p className="text-xs text-wepac-text-tertiary">{user.email}</p>
            {membership && (
              <div className="mt-1 flex gap-2">
                <span className="bg-wepac-white/10 px-2 py-0.5 text-xs text-wepac-white">
                  {LEVEL_LABELS[membership.level]}
                </span>
                <span className="bg-wepac-input px-2 py-0.5 text-xs text-wepac-text-tertiary">
                  {PHASE_LABELS[membership.currentPhase]}
                </span>
              </div>
            )}
          </div>
        </div>

        {membership && (
          <div className="border border-wepac-border bg-wepac-card p-5">
            <h2 className="text-sm font-bold text-wepac-white">A tua membership</h2>
            <div className="mt-3 space-y-1 text-sm text-wepac-text-secondary">
              <p>Pack: {membership.packName}</p>
              <p>Cohort: {membership.cohortName}</p>
              <p>Nível: {LEVEL_LABELS[membership.level]}</p>
              <p>Fase: {PHASE_LABELS[membership.currentPhase]}</p>
            </div>
          </div>
        )}

        {!membership && (
          <p className="text-sm text-wepac-text-tertiary">
            Ainda sem cohort associada — contacta a equipa WEPAC.
          </p>
        )}

        {/* Form */}
        <div>
          <label className="block text-sm text-wepac-text-secondary">Nome</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full bg-wepac-input px-4 py-3 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
          />
        </div>

        <div>
          <label className="block text-sm text-wepac-text-secondary">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="mt-1 w-full bg-wepac-input px-4 py-3 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
          />
        </div>

        <div>
          <label className="block text-sm text-wepac-text-secondary">Telefone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full bg-wepac-input px-4 py-3 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
          />
        </div>

        <div>
          <label className="block text-sm text-wepac-text-secondary">Email</label>
          <input
            value={user.email}
            disabled
            className="mt-1 w-full bg-wepac-input/50 px-4 py-3 text-sm text-wepac-text-tertiary"
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="bg-wepac-white px-6 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted disabled:opacity-50"
          >
            {saving ? "A guardar..." : "Guardar alterações"}
          </button>
          {saved && <span className="text-xs text-wepac-success">Guardado.</span>}
        </div>
      </div>
    </div>
  );
}
