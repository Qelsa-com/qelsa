import { formatCity } from "@/constants/city";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronRight, FileText, GraduationCap, LogOut, MapPin, Plug, Settings, User, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { icon: User, label: "View Profile", path: "/profile", accent: "text-neon-cyan", bg: "bg-neon-cyan/15" },
  { icon: FileText, label: "My Resumes", path: "/profile/edit", accent: "text-neon-green", bg: "bg-neon-green/15" },
  { icon: Users, label: "Network", path: "/network", accent: "text-neon-cyan", bg: "bg-neon-cyan/15" },
  { icon: GraduationCap, label: "Courses", path: "/courses", accent: "text-neon-yellow", bg: "bg-neon-yellow/15" },
  { icon: Plug, label: "Integrations", path: "/settings/integrations", accent: "text-neon-purple", bg: "bg-neon-purple/15" },
  { icon: Settings, label: "Settings", path: "/settings", accent: "text-muted-foreground", bg: "bg-white/10" },
];

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

  return (
    <>
      {/* Backdrop */}
      <div className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`} onClick={onClose} />

      {/* Drawer */}
      <aside className={`fixed top-0 right-0 z-50 flex h-full w-80 flex-col border-l border-glass-border bg-[#0b0b14] transition-transform duration-250 ease-out lg:w-[380px] ${visible ? "translate-x-0" : "translate-x-full"}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-glass-border px-5 py-4">
          <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">Account</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-white" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Profile card */}
          {isAuthenticated && user ? (
            <div className="px-5 pt-6 pb-5">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="rounded-full bg-gradient-to-br from-neon-cyan via-neon-purple to-neon-pink p-[2px]">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt={user.name ?? "Profile"} className="h-14 w-14 rounded-full border-2 border-[#0b0b14] object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#0b0b14] bg-white/10 text-base font-bold text-white">{initials(user.name)}</div>
                    )}
                  </div>
                  <span className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0b0b14] bg-neon-green" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-white">{user.name ?? "User"}</p>
                  {user.username && <p className="truncate text-sm text-neon-cyan">@{user.username}</p>}
                </div>
              </div>

              {user.headline && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-white/60">{user.headline}</p>}

              {user.city && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{formatCity(user.city)}</span>
                </div>
              )}

              <button type="button" onClick={() => go("/profile/edit")} className="mt-4 w-full rounded-full border border-glass-border bg-white/5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10">
                Edit profile
              </button>
            </div>
          ) : (
            <div className="px-5 pt-6 pb-5 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-glass-border bg-white/5">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mb-4 text-sm text-muted-foreground">Sign in to unlock your career potential</p>
              <button type="button" onClick={() => go("/auth")} className="w-full rounded-full bg-gradient-to-r from-neon-purple to-neon-pink py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90">
                Sign In / Sign Up
              </button>
            </div>
          )}

          {/* Navigation */}
          {isAuthenticated && (
            <nav className="px-3 pb-4">
              <p className="px-2 pt-2 pb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Menu</p>
              <ul className="space-y-0.5">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <button type="button" onClick={() => go(item.path)} className="group flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-white/5">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.bg}`}>
                          <Icon className={`h-4 w-4 ${item.accent}`} />
                        </span>
                        <span className="flex-1 text-sm text-white/80 transition-colors group-hover:text-white">{item.label}</span>
                        <ChevronRight className="h-4 w-4 text-white/25 transition-all group-hover:translate-x-0.5 group-hover:text-white/60" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}
        </div>

        {/* Footer */}
        {isAuthenticated && (
          <div className="border-t border-glass-border p-4">
            <button
              type="button"
              onClick={() => {
                logout();
                onClose();
                window.location.href = "/jobs";
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-glass-border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
