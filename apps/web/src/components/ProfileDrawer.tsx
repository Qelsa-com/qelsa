"use client";

import { QelsaLogo } from "@/components/QelsaLogo";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Briefcase, FileText, LogOut, PenLine, Settings, Target, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection?: string;
}

const LEGAL_LINKS = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "Cookie Policy", href: "/cookies" },
];

const GUEST_ITEMS = [
  { id: "candidates", label: "For Candidates", href: "/candidates" },
  { id: "employers", label: "For Employers", href: "/employers" },
  { id: "jobs", label: "Jobs", href: "/jobs/all" },
  { id: "blog", label: "Blog", href: "/blogs" },
];

/** Items also in DesktopTopBar are hidden from `lg` so the drawer is account-only. */
const AUTHED_ITEMS = [
  { id: "jobs", label: "Jobs", href: "/jobs/smart-matches", icon: Briefcase, hideOnDesktop: true },
  { id: "connections", label: "Network", href: "/network", icon: Users, hideOnDesktop: true },
  { id: "goals", label: "Goals", href: "/goals", icon: Target },
  { id: "resume", label: "My Resume", href: "/profile/edit?section=media", icon: FileText },
  { id: "courses", label: "Courses", href: "/courses", icon: BookOpen, hideOnDesktop: true },
  { id: "blog", label: "Blog", href: "/blogs", icon: PenLine, hideOnDesktop: true },
];

function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function isItemActive(itemId: string, href: string, activeSection?: string, pathname?: string | null) {
  if (activeSection && itemId === activeSection) return true;
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  if (href.startsWith("/profile/edit?section=media")) {
    return pathname === "/profile/edit";
  }
  if (href === "/jobs/all" || href === "/jobs/smart-matches") return pathname === "/jobs" || pathname.startsWith("/jobs/");
  if (href === "/pages") return pathname === "/pages" || pathname.startsWith("/pages/");
  if (href === "/blogs") return pathname === "/blogs" || pathname.startsWith("/blogs/");
  if (href === "/network") return pathname === "/network" || pathname.startsWith("/network/");
  if (href === "/goals") return pathname === "/goals" || pathname.startsWith("/goals/");
  if (href === "/courses") return pathname === "/courses" || pathname.startsWith("/courses/");
  if (href === "/settings") return pathname === "/settings" || pathname.startsWith("/settings/");
  return pathname === href;
}

export function ProfileDrawer({ isOpen, onClose, activeSection }: ProfileDrawerProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    setVisible(false);
    const timeout = setTimeout(() => setMounted(false), 250);
    return () => clearTimeout(timeout);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!mounted) return null;

  const go = (path: string) => {
    onClose();
    router.push(path);
  };

  const signedIn = Boolean(isAuthenticated && user);

  return (
    <div className={`fixed inset-0 z-50 transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`} role="dialog" aria-modal="true" aria-label={signedIn ? "Account menu" : "Site menu"}>
      <div className="absolute inset-0 bg-[#06060f] lg:bg-black/60" onClick={onClose} />
      <div
        className={`absolute inset-0 flex flex-col bg-[#06060f] px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] transition-transform duration-250 ease-out lg:inset-y-0 lg:right-0 lg:left-auto lg:w-[400px] lg:border-l lg:border-white/10 ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <QelsaLogo className="h-[26px] w-auto" />
          <button type="button" onClick={onClose} aria-label="Close menu" className="flex size-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/[0.06]">
            <X className="size-5" />
          </button>
        </div>

        {signedIn ? (
          <AuthedMenu
            name={user?.name}
            username={user?.username}
            avatarUrl={user?.profile_image}
            activeSection={activeSection}
            pathname={pathname}
            onGo={go}
            signingOut={signingOut}
            onSignOut={async () => {
              if (signingOut) return;
              setSigningOut(true);
              await logout();
              onClose();
              window.location.replace("/jobs");
            }}
          />
        ) : (
          <GuestMenu activeSection={activeSection} pathname={pathname} onGo={go} />
        )}

        <footer className="mt-auto flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pb-4 pt-8 text-[13px] text-white/45">
          {LEGAL_LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={onClose} className="transition-colors hover:text-white/70">
              {link.label}
            </Link>
          ))}
        </footer>
      </div>
    </div>
  );
}

function GuestMenu({ activeSection, pathname, onGo }: { activeSection?: string; pathname: string | null; onGo: (path: string) => void }) {
  return (
    <nav className="mt-16 flex flex-col gap-3 lg:hidden">
      {GUEST_ITEMS.map((item) => {
        const active = isItemActive(item.id, item.href, activeSection, pathname);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onGo(item.href)}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-6 py-3.5 text-left text-[22px] font-semibold transition-colors ${active ? "border border-neon-cyan text-white" : "text-white hover:bg-white/[0.04]"}`}
          >
            {item.label}
          </button>
        );
      })}
      <button type="button" onClick={() => onGo("/auth")} className="mt-6 rounded-full border border-white/20 px-6 py-3.5 text-[22px] font-semibold text-white transition-colors hover:bg-white/[0.04]">
        Sign in
      </button>
    </nav>
  );
}

function AuthedMenu({
  name,
  username,
  avatarUrl,
  activeSection,
  pathname,
  onGo,
  signingOut,
  onSignOut,
}: {
  name?: string;
  username?: string;
  avatarUrl?: string;
  activeSection?: string;
  pathname: string | null;
  onGo: (path: string) => void;
  signingOut: boolean;
  onSignOut: () => void | Promise<void>;
}) {
  const displayName = name || (username ? `@${username}` : "User");
  const settingsActive = isItemActive("settings", "/settings", activeSection, pathname);

  return (
    <div className="mt-8 flex min-h-0 flex-1 flex-col">
      <button type="button" onClick={() => onGo("/profile")} className="flex w-full items-center gap-3 rounded-full bg-white/[0.05] px-3 py-2.5 text-left transition-colors hover:bg-white/[0.08]">
        <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-white">{initials(name)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-semibold text-white">{displayName}</p>
          {username ? <p className="truncate text-sm text-white/45">@{username}</p> : null}
        </div>
        <span className="shrink-0 pr-2 text-sm font-medium text-neon-cyan">View Profile</span>
      </button>

      <nav className="mt-8 flex flex-col gap-2">
        {AUTHED_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item.id, item.href, activeSection, pathname);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onGo(item.href)}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-4 rounded-full px-3 py-2.5 text-left transition-colors ${item.hideOnDesktop ? "lg:hidden" : ""} ${active ? "border border-neon-cyan text-white" : "text-white hover:bg-white/[0.04]"}`}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
                <Icon className="size-4" />
              </span>
              <span className="text-[20px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-white/10 pt-5">
        <button
          type="button"
          onClick={() => onGo("/settings")}
          aria-current={settingsActive ? "page" : undefined}
          className={`flex w-full items-center gap-4 rounded-full px-3 py-2.5 text-left transition-colors ${settingsActive ? "border border-neon-cyan text-white" : "text-white hover:bg-white/[0.04]"}`}
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
            <Settings className="size-4" />
          </span>
          <span className="text-[20px] font-medium">Settings</span>
        </button>
        <button type="button" onClick={() => void onSignOut()} disabled={signingOut} className="mt-1 flex w-full items-center gap-4 rounded-full px-3 py-2.5 text-left text-white transition-colors hover:bg-white/[0.04] disabled:opacity-50">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
            <LogOut className="size-4" />
          </span>
          <span className="text-[20px] font-medium">{signingOut ? "Signing out…" : "Sign Out"}</span>
        </button>
      </div>
    </div>
  );
}
