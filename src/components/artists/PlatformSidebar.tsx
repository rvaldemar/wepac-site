"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";

const artistNav = [
 { label: "Dashboard", href: "/artists/alpha/dashboard", icon: "◆" },
 { label: "Diagnóstico", href: "/artists/alpha/diagnosis", icon: "◎" },
 { label: "PPV", href: "/artists/alpha/ppv", icon: "◇" },
 { label: "Plano", href: "/artists/alpha/plan", icon: "▣" },
 { label: "Tarefas", href: "/artists/alpha/tasks", icon: "☑" },
 { label: "Sessões", href: "/artists/alpha/sessions", icon: "◷" },
 { label: "Mensagens", href: "/artists/alpha/messages", icon: "✉" },
 { label: "Perfil", href: "/artists/alpha/profile", icon: "◉" },
];

const mentorNav = [
 { label: "Painel Mentor", href: "/artists/alpha/mentor", icon: "◆" },
 { label: "Sessões", href: "/artists/alpha/mentor/sessions", icon: "◷" },
 { label: "Tarefas", href: "/artists/alpha/mentor/tasks", icon: "☑" },
 { label: "Mensagens", href: "/artists/alpha/mentor/messages", icon: "✉" },
];

const adminNav = [
 { label: "Utilizadores", href: "/artists/alpha/admin/users", icon: "◉" },
 { label: "Candidaturas", href: "/artists/alpha/admin/beta-signups", icon: "✦" },
 { label: "Configurações", href: "/artists/alpha/admin/settings", icon: "⚙" },
];

interface SidebarProps {
 unreadMessages?: number;
 pendingTasks?: number;
}

export function PlatformSidebar({ unreadMessages = 0, pendingTasks = 0 }: SidebarProps) {
 const pathname = usePathname();
 const [mobileOpen, setMobileOpen] = useState(false);
 const { data: session } = useSession();
 const role = session?.user?.role;

 const isMentor = pathname.includes("/mentor");
 const isAdmin = pathname.includes("/admin");

 let nav = artistNav;
 if (isMentor) nav = mentorNav;
 if (isAdmin) nav = adminNav;

 const canMentor = role === "mentor" || role === "admin";
 const canAdmin = role === "admin";

 function getBadgeCount(label: string): number {
  if (label === "Mensagens") return unreadMessages;
  if (label === "Tarefas") return pendingTasks;
  return 0;
 }

 return (
  <>
   {/* Mobile header */}
   <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-wepac-black/95 px-4 py-3 backdrop-blur-md lg:hidden">
    <Link
     href="/artists/alpha/dashboard"
     className="font-barlow text-lg font-bold text-wepac-white"
    >
     Artista Alpha
    </Link>
    <button
     onClick={() => setMobileOpen(!mobileOpen)}
     className="text-wepac-white"
     aria-label="Menu"
    >
     <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      {mobileOpen ? (
       <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      ) : (
       <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
      )}
     </svg>
    </button>
   </div>

   {/* Mobile nav overlay */}
   {mobileOpen && (
    <div className="fixed inset-0 z-40 bg-wepac-black/95 pt-14 lg:hidden">
     <nav className="flex flex-col gap-1 p-4">
      {nav.map((item) => (
       <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
         pathname === item.href
          ? "bg-wepac-white text-wepac-black"
          : "text-wepac-text-secondary hover:bg-wepac-card"
        }`}
       >
        <span className="text-xs">{item.icon}</span>
        {item.label}
        {getBadgeCount(item.label) > 0 && (
         <span className="bg-wepac-white text-wepac-black text-[10px] font-bold px-1.5 py-0.5 ml-auto">
          {getBadgeCount(item.label)}
         </span>
        )}
       </Link>
      ))}
      <div className="my-4 border-t border-wepac-border" />
      {!isMentor && !isAdmin && canMentor && (
       <Link
        href="/artists/alpha/mentor"
        onClick={() => setMobileOpen(false)}
        className="px-4 py-2 text-xs text-wepac-text-tertiary hover:text-wepac-text-secondary"
       >
        Vista Mentor →
       </Link>
      )}
      {(isMentor || isAdmin) && (
       <Link
        href="/artists/alpha/dashboard"
        onClick={() => setMobileOpen(false)}
        className="px-4 py-2 text-xs text-wepac-text-tertiary hover:text-wepac-text-secondary"
       >
        ← Vista Artista
       </Link>
      )}
      <button
       onClick={() => signOut({ callbackUrl: "/artists/alpha/login" })}
       className="mt-2 px-4 py-2 text-left text-xs text-wepac-text-tertiary hover:text-wepac-text-secondary"
      >
       Sair
      </button>
     </nav>
    </div>
   )}

   {/* Desktop sidebar */}
   <aside className="fixed left-0 top-0 hidden h-screen w-56 flex-col border-r border-wepac-border bg-wepac-black lg:flex">
    <div className="border-b border-wepac-border px-5 py-5">
     <Link href="/artists/alpha/dashboard">
      <span className="font-barlow text-lg font-bold text-wepac-white">
       Artista Alpha
      </span>
      <span className="mt-0.5 block text-xs text-wepac-text-tertiary">
       WEPAC — Companhia de Artes
      </span>
     </Link>
    </div>

    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
     {nav.map((item) => (
      <Link
       key={item.href}
       href={item.href}
       className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
        pathname === item.href
         ? "bg-wepac-white text-wepac-black"
         : "text-wepac-text-secondary hover:bg-wepac-card hover:text-wepac-white"
       }`}
      >
       <span className="text-xs opacity-60">{item.icon}</span>
       {item.label}
       {getBadgeCount(item.label) > 0 && (
        <span className="bg-wepac-white text-wepac-black text-[10px] font-bold px-1.5 py-0.5 ml-auto">
         {getBadgeCount(item.label)}
        </span>
       )}
      </Link>
     ))}
    </nav>

    <div className="border-t border-wepac-border p-3">
     {!isMentor && !isAdmin && canMentor && (
      <Link
       href="/artists/alpha/mentor"
       className="block px-3 py-2 text-xs text-wepac-text-tertiary transition-colors hover:text-wepac-text-secondary"
      >
       Vista Mentor →
      </Link>
     )}
     {!isMentor && !isAdmin && canAdmin && (
      <Link
       href="/artists/alpha/admin/users"
       className="block px-3 py-2 text-xs text-wepac-text-tertiary transition-colors hover:text-wepac-text-secondary"
      >
       Admin →
      </Link>
     )}
     {(isMentor || isAdmin) && (
      <Link
       href="/artists/alpha/dashboard"
       className="block px-3 py-2 text-xs text-wepac-text-tertiary transition-colors hover:text-wepac-text-secondary"
      >
       ← Vista Artista
      </Link>
     )}
     <button
      onClick={() => signOut({ callbackUrl: "/artists/alpha/login" })}
      className="block w-full px-3 py-2 text-left text-xs text-wepac-text-tertiary transition-colors hover:text-wepac-text-secondary"
     >
      Sair
     </button>
    </div>
   </aside>
  </>
 );
}
