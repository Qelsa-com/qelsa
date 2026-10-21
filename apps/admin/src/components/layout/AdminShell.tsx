"use client";

import { useAdminAuth } from "@/contexts/AuthContext";
import {
  Briefcase,
  LayoutDashboard,
  LogOut,
  ScrollText,
  ShieldCheck,
  Users,
  Waypoints,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/users", label: "Users", icon: Users },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/boards", label: "Job boards", icon: Waypoints },
  { href: "/audit", label: "Audit log", icon: ScrollText },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAdminAuth();

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

        <main className="min-w-0 flex-1 overflow-x-auto">{children}</main>

        <nav className="flex border-t border-glass-border bg-[#08080f]/90 lg:hidden">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  active ? "text-neon-cyan" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}