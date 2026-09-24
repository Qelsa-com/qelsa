"use client";

import { useAuth } from "@/contexts/AuthContext";
import {
  BookOpen,
  Briefcase,
  FileText,
  LogOut,
  Settings,
  Sparkles,
  Target,
  User,
  Users,
  X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ProfileDrawer({ isOpen, onClose }: ProfileDrawerProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  // Animate in on open, out on close.
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const t = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(t);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), 250);
    return () => clearTimeout(t);
  }, [isOpen]);

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  const go = (path: string) => {
    onClose();
    router.push(path);
  };

  const avatarUrl = (user as { profile_image?: string; avatar?: string } | null)?.profile_image;

  const candidateNavItems = [
    { id: "jobs", label: "Jobs", icon: Briefcase, path: "/jobs" },
    { id: "network", label: "Network", icon: Users, path: "/network" },
    { id: "goals", label: "Goals", icon: Target, path: "/goals" },
    { id: "resume", label: "My Resume", icon: FileText, path: "/profile/edit?section=media" },
    { id: "job-match", label: "Job Match AI", icon: Sparkles, path: "/jobs/match" },
    { id: "courses", label: "Courses", icon: BookOpen, path: "/courses" },
  ];

  const isItemActive = (path: string) => {
    if (path.includes("?section=media")) {
      return pathname === "/profile/edit" && searchParams?.get("section") === "media";
    }
    if (path === "/jobs") {
      return pathname === "/jobs" || pathname === "/jobs/all" || pathname === "/jobs/smart-matches";
    }
    return pathname === path || (path !== "/" && pathname?.startsWith(path + "/"));
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-50 flex h-full w-full max-w-[340px] sm:max-w-[380px] flex-col border-l border-white/10 bg-[#06060f] transition-transform duration-250 ease-out ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <span className="text-xl font-bold tracking-tight text-white">Qelsa</span>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/15 active:scale-95"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Profile Card */}
        {isAuthenticated && user ? (
          <div className="mx-6 mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/10">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={user.name ?? "Profile"} className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center text-sm font-bold text-white">
                    {initials(user.name)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-white">{user.name || "User"}</p>
                <p className="truncate text-sm text-white/50">
                  {user.username
                    ? `@${user.username}`
                    : user.email
                      ? `@${user.email.split("@")[0]}`
                      : "@user"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => go("/profile")}
              className="shrink-0 text-sm font-medium text-cyan-400 hover:text-cyan-300 hover:underline"
            >
              View Profile
            </button>
          </div>
        ) : (
          <div className="mx-6 mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <User className="size-6 text-white/60" />
            </div>
            <p className="mb-3 text-sm text-white/70">Sign in to unlock all features</p>
            <button
              type="button"
              onClick={() => go("/auth")}
              className="w-full rounded-full bg-gradient-to-r from-neon-purple to-neon-pink py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Sign In / Sign Up
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <nav className="flex flex-col gap-1.5">
            {candidateNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.path);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(item.path)}
                  className={`flex w-full items-center gap-3.5 rounded-2xl px-3.5 py-3 text-left transition-colors ${
                    isActive
                      ? "border border-cyan-500/40 bg-cyan-950/20 text-white font-medium"
                      : "border border-transparent text-white/85 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                      isActive ? "bg-cyan-500/15 text-cyan-400" : "bg-white/[0.06] text-white/70"
                    }`}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="text-base font-medium">{item.label}</span>
                </button>
              );
            })}

            <div className="my-2 h-px w-full bg-white/10" />

            {/* Settings */}
            <button
              type="button"
              onClick={() => go("/settings")}
              className={`flex w-full items-center gap-3.5 rounded-2xl px-3.5 py-3 text-left transition-colors ${
                pathname === "/settings"
                  ? "border border-cyan-500/40 bg-cyan-950/20 text-white font-medium"
                  : "border border-transparent text-white/85 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                  pathname === "/settings" ? "bg-cyan-500/15 text-cyan-400" : "bg-white/[0.06] text-white/70"
                }`}
              >
                <Settings className="size-5" />
              </span>
              <span className="text-base font-medium">Settings</span>
            </button>

            {/* Sign Out (when authenticated) */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  logout();
                  onClose();
                  window.location.href = "/jobs";
                }}
                className="flex w-full items-center gap-3.5 rounded-2xl border border-transparent px-3.5 py-3 text-left text-white/85 transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-white/70">
                  <LogOut className="size-5" />
                </span>
                <span className="text-base font-medium">Sign Out</span>
              </button>
            )}
          </nav>
        </div>

        {/* Footer Legal Links */}
        <div className="mt-auto flex items-center justify-center gap-6 px-6 pt-4 pb-8 text-xs text-white/40">
          <button type="button" onClick={() => go("/terms")} className="transition-colors hover:text-white">
            Terms
          </button>
          <button type="button" onClick={() => go("/privacy")} className="transition-colors hover:text-white">
            Privacy
          </button>
          <button type="button" onClick={() => go("/cookies")} className="transition-colors hover:text-white">
            Cookie Policy
          </button>
        </div>
      </aside>
    </>
  );
}
