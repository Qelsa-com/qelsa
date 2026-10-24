"use client";

import { useAdminAuth } from "@/contexts/AuthContext";
import {
  Briefcase,
  GraduationCap,
  Handshake,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Newspaper,
  ScrollText,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Waypoints,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/users", label: "Users", icon: Users },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/boards", label: "Job boards", mobileLabel: "Boards", icon: Waypoints },
  { href: "/plans", label: "Plans", icon: SlidersHorizontal },
  { href: "/blog", label: "Blog", icon: Newspaper },
  { href: "/interview-prep", label: "Interview prep", icon: GraduationCap },
  { href: "/affiliates", label: "Affiliate courses", icon: Handshake },
  { href: "/audit", label: "Audit log", icon: ScrollText },
];

const MOBILE_PRIMARY_ITEMS = NAV_ITEMS.slice(0, 4);

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAdminAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const morePanelRef = useRef<HTMLDivElement>(null);
  const overflowActive = NAV_ITEMS.slice(MOBILE_PRIMARY_ITEMS.length).some((item) =>
    isActive(pathname, item.href),
  );

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    morePanelRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  return (
    <div className="flex min-h-screen bg-[#06060f] text-white">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-glass-border bg-[#08080f]/80 lg:flex">
        <div className="flex items-center gap-2.5 border-b border-glass-border px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neon-purple/20">
            <ShieldCheck className="h-5 w-5 text-neon-cyan" />
          </div>
          <div>
            <p className="text-sm font-bold">Qelsa Admin</p>
            <p className="text-[11px] text-muted-foreground">Control panel</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-glass-border p-3">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{user?.name ?? "Admin"}</p>
              <p className="truncate text-[11px] text-muted-foreground">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              aria-label="Sign out"
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-glass-border px-5 py-4 lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neon-purple/20">
              <ShieldCheck className="h-4 w-4 text-neon-cyan" />
            </div>
            <p className="text-sm font-bold">Qelsa Admin</p>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-lg p-2 text-muted-foreground hover:bg-white/10 hover:text-white"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        <main className="min-w-0 flex-1 overflow-x-auto pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">{children}</main>

        {moreOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
              onClick={() => setMoreOpen(false)}
              aria-hidden
            />
            <div
              ref={morePanelRef}
              id="admin-more-menu"
              role="menu"
              aria-label="All admin pages"
              tabIndex={-1}
              className="absolute inset-x-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] max-h-[min(60dvh,28rem)] overflow-y-auto rounded-2xl border border-glass-border bg-[#08080f] p-2 shadow-2xl shadow-black/50 outline-none"
            >
              {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    onClick={() => setMoreOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
                      active ? "bg-white/10 text-neon-cyan" : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <nav
          aria-label="Admin navigation"
          className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-glass-border bg-[#08080f]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
        >
          {MOBILE_PRIMARY_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-w-0 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                  active ? "text-neon-cyan" : "text-muted-foreground"
                }`}
              >
                {active && <span className="absolute top-0 h-0.5 w-6 rounded-full bg-neon-cyan" />}
                <Icon className="h-[18px] w-[18px]" />
                <span className="w-full truncate px-1 text-center leading-tight">
                  {item.mobileLabel ?? item.label}
                </span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            aria-controls="admin-more-menu"
            aria-label="More admin pages"
            className={`relative flex min-w-0 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
              moreOpen || overflowActive ? "text-neon-cyan" : "text-muted-foreground"
            }`}
          >
            {(moreOpen || overflowActive) && <span className="absolute top-0 h-0.5 w-6 rounded-full bg-neon-cyan" />}
            <MoreHorizontal className="h-[18px] w-[18px]" />
            <span className="leading-tight">More</span>
          </button>
        </nav>
      </div>
    </div>
  );
}