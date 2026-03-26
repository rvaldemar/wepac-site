"use client";

import { useState } from "react";
import { updateProfile } from "@/lib/actions/user";
import { LEVEL_LABELS, PHASE_LABELS, type ArtistLevel, type ArtistPhase } from "@/lib/types/artist";

interface Props {
 user: {
  id: string;
  name: string;
  email: string;
  level: string;
  currentPhase: string;
  bio?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
 };
}

export default function ProfilePageClient({ user }: Props) {
 const [name, setName] = useState(user.name);
 const [bio, setBio] = useState(user.bio ?? "");
 const [phone, setPhone] = useState(user.phone ?? "");

 const handleSave = async () => {
  await updateProfile({ name, bio, phone });
 };

 return (
  <div className="p-6 lg:p-8">
   <h1 className="font-barlow text-2xl font-bold text-wepac-white">
    Perfil
   </h1>
   <p className="mt-1 text-sm text-wepac-text-tertiary">
    Os teus dados pessoais e artísticos.
   </p>

   <div className="mt-8 max-w-lg space-y-6">
    {/* Avatar placeholder */}
    <div className="flex items-center gap-4">
     <div className="flex h-16 w-16 items-center justify-center bg-wepac-white/10">
      <span className="font-barlow text-xl font-bold text-wepac-white">
       {user.name.split(" ").map((n) => n[0]).join("")}
      </span>
     </div>
     <div>
      <p className="text-sm font-medium text-wepac-white">{user.name}</p>
      <p className="text-xs text-wepac-text-tertiary">{user.email}</p>
      <div className="mt-1 flex gap-2">
       <span className="bg-wepac-white/10 px-2 py-0.5 text-xs text-wepac-white">
        {LEVEL_LABELS[user.level as ArtistLevel]}
       </span>
       <span className="bg-wepac-input px-2 py-0.5 text-xs text-wepac-text-tertiary">
        {PHASE_LABELS[user.currentPhase as ArtistPhase]}
       </span>
      </div>
     </div>
    </div>

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

    <button
     onClick={handleSave}
     className="bg-wepac-white px-6 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted"
    >
     Guardar alterações
    </button>
   </div>
  </div>
 );
}
