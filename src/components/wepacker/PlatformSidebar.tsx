"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useMobileDrawer } from "@/lib/useMobileDrawer";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  nested?: boolean;
  // Match this item only on the exact path — for index-style hrefs that are
  // a prefix of every sibling route (e.g. /wepacker/mentor).
  exact?: boolean;
}

interface NavGroup {
  header?: string;
  items: NavItem[];
}

const memberNavGroups: NavGroup[] = [
  {
    items: [
      { label: "My Journey", href: "/wepacker/dashboard", icon: "◆" },
      { label: "Basecamp", href: "/wepacker/basecamp", icon: "◫", nested: true },
      { label: "Legacy Assessment", href: "/wepacker/diagnosis", icon: "◎", nested: true },
      { label: "Life Map", href: "/wepacker/ppv", icon: "◇", nested: true },
      { label: "Strategic Plan", href: "/wepacker/plan", icon: "▣", nested: true },
      { label: "Trails", href: "/wepacker/trails", icon: "⟡", nested: true },
    ],
  },
  {
    header: "Activity",
    items: [
      { label: "Legacy Tasks", href: "/wepacker/tasks", icon: "☑" },
      { label: "Sessions", href: "/wepacker/sessions", icon: "◷" },
      { label: "Mentorships", href: "/wepacker/mentorships", icon: "↗" },
      { label: "Messages", href: "/wepacker/messages", icon: "✉" },
      { label: "Profile", href: "/wepacker/profile", icon: "◉" },
    ],
  },
];

const mentorNavGroups: NavGroup[] = [
  {
    items: [
      { label: "Mentor Dashboard", href: "/wepacker/mentor", icon: "◆", exact: true },
      { label: "Mentorships", href: "/wepacker/mentorships", icon: "↗" },
      { label: "Sessions", href: "/wepacker/mentor/sessions", icon: "◷" },
    ],
  },
];

const adminNavGroups: NavGroup[] = [
  {
    items: [
      { label: "Users", href: "/wepacker/admin/users", icon: "◉" },
      { label: "Legacy Delivery", href: "/wepacker/admin/cohorts", icon: "▣" },
      { label: "Leads", href: "/wepacker/admin/leads", icon: "◈" },
      { label: "Settings", href: "/wepacker/admin/settings", icon: "⚙" },
    ],
  },
];

interface SidebarProps {
  unreadMessages?: number;
  pendingTasks?: number;
  pendingMentorships?: number;
}

export function PlatformSidebar({
  unreadMessages = 0,
  pendingTasks = 0,
  pendingMentorships = 0,
}: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobileMenu = () => setMobileOpen(false);
  const { toggleRef, drawerRef } = useMobileDrawer<HTMLButtonElement, HTMLDivElement>(
    mobileOpen,
    closeMobileMenu
  );
  const { data: session } = useSession();
  const role = session?.user?.role;

  const isMentor = pathname.includes("/mentor");
  const isAdmin = pathname.includes("/admin");

  let navGroups = memberNavGroups;
  if (isMentor) navGroups = mentorNavGroups;
  if (isAdmin) navGroups = adminNavGroups;

  const canMentor = role === "mentor" || role === "admin";
  const canAdmin = role === "admin";

  function isActive(item: NavItem): boolean {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  function getBadgeCount(label: string): number {
    if (label === "Messages") return unreadMessages;
    if (label === "Tasks") return pendingTasks;
    if (label === "Mentorships") return pendingMentorships;
    return 0;
  }

  const navLinks = (onNavigate?: () => void) =>
    navGroups.map((group, groupIndex) => (
      <div key={group.header ?? `group-${groupIndex}`}>
        {group.header && (
          <div className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-wider text-wepac-text-tertiary">
            {group.header}
          </div>
        )}
        {group.items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 py-2.5 pr-3 text-sm transition-colors ${
              item.nested ? "pl-9" : "pl-3"
            } ${
              isActive(item)
                ? "bg-wepac-white text-wepac-black"
                : "text-wepac-text-secondary hover:bg-wepac-card hover:text-wepac-white"
            }`}
          >
            <span className="text-xs opacity-60">{item.icon}</span>
            {item.label}
            {getBadgeCount(item.label) > 0 && (
              <span className="ml-auto bg-wepac-white px-1.5 py-0.5 text-[10px] font-bold text-wepac-black">
                {getBadgeCount(item.label)}
              </span>
            )}
          </Link>
        ))}
      </div>
    ));

  const contextLinks = (onNavigate?: () => void) => (
    <>
      {!isMentor && !isAdmin && canMentor && (
        <Link
          href="/wepacker/mentor"
          onClick={onNavigate}
          className="block px-3 py-2 text-xs text-wepac-text-tertiary transition-colors hover:text-wepac-text-secondary"
        >
          Mentor Dashboard →
        </Link>
      )}
      {!isMentor && !isAdmin && canAdmin && (
        <Link
          href="/wepacker/admin/users"
          onClick={onNavigate}
          className="block px-3 py-2 text-xs text-wepac-text-tertiary transition-colors hover:text-wepac-text-secondary"
        >
          Admin →
        </Link>
      )}
      {(isMentor || isAdmin) && (
        <Link
          href="/wepacker/dashboard"
          onClick={onNavigate}
          className="block px-3 py-2 text-xs text-wepac-text-tertiary transition-colors hover:text-wepac-text-secondary"
        >
          ← My Journey
        </Link>
      )}
      <button
        onClick={() => signOut({ callbackUrl: "/wepacker/login" })}
        className="block w-full px-3 py-2 text-left text-xs text-wepac-text-tertiary transition-colors hover:text-wepac-text-secondary"
      >
        Sair
      </button>
    </>
  );

  return (
    <>
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-wepac-black/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <Link href="/wepacker/dashboard">
          <Image
            src="/logo/email/wepacker-lockup-white.png"
            alt="WEPACKER"
            width={112}
            height={56}
            className="h-7 w-auto"
            priority
          />
        </Link>
        <button
          ref={toggleRef}
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-wepac-white"
          aria-expanded={mobileOpen}
          aria-controls="mobile-sidebar-menu"
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            {mobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div
          id="mobile-sidebar-menu"
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
          tabIndex={-1}
          className="fixed inset-0 z-40 bg-wepac-black/95 pt-14 lg:hidden"
        >
          <nav className="flex flex-col gap-1 p-4">
            {navLinks(closeMobileMenu)}
            <div className="my-4 border-t border-wepac-border" />
            {contextLinks(closeMobileMenu)}
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-56 flex-col border-r border-wepac-border bg-wepac-black lg:flex">
        <div className="border-b border-wepac-border px-5 py-5">
          <Link href="/wepacker/dashboard">
            <Image
              src="/logo/email/wepacker-lockup-white.png"
              alt="WEPACKER"
              width={128}
              height={64}
              className="h-8 w-auto"
            />
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
          {navLinks()}
        </nav>

        <div className="border-t border-wepac-border p-3">{contextLinks()}</div>
      </aside>
    </>
  );
}
