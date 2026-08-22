"use client";

/**
 * Desktop top bar — brand, primary nav links, and the action cluster.
 *
 * Figma: Qelsa-Screen — header (653:3739). Both navbars render it so signed-in
 * and signed-out desktop share one bar; it hides below `lg`, where MobileTopBar
 * takes over.
 */

import { useAuth } from "@/contexts/AuthContext";
import { Bell, Search, User } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * `id` matches the `activeSection` each page passes to Layout. Qelsa AI points
 * at the dashboard ("/"); Network, Courses and Blog are not built yet and land
 * on Coming Soon.
 */
const NAV_LINKS = [
  { id: "profile", label: "Qelsa AI", href: "/" },
  { id: "jobs", label: "Jobs", href: "/jobs/smart_matches" },
  { id: "connections", label: "Network", href: "/network" },
  { id: "pages", label: "Pages", href: "/pages" },
  { id: "courses", label: "Courses", href: "/courses" },
  { id: "blog", label: "Blog", href: "/blogs" },
];

export function DesktopTopBar({ activeSection, onProfileClick }: { activeSection?: string; onProfileClick?: () => void }) {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 hidden items-center justify-between border-b border-white/[0.08] bg-[#06060f] px-10 py-4 lg:flex">
      <button type="button" onClick={() => router.push("/")} className="bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-[18px] font-bold leading-8 tracking-[-0.53px] text-transparent">
        Qelsa
      </button>

      <nav className="flex items-center gap-7">
        {NAV_LINKS.map((link) => {
          const active = link.id === activeSection;
          return (
            <button key={link.id} type="button" onClick={() => router.push(link.href)} className="relative flex items-center justify-center">
              <span className={`text-sm font-semibold transition-colors ${active ? "text-neon-cyan" : "text-white/70 hover:text-white"}`}>{link.label}</span>
              {/* Sits on the header's bottom edge, clearing the 16px padding. */}
              {active && <span className="absolute -bottom-4 left-0 h-0.5 w-full bg-neon-cyan" />}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-6">
        <button type="button" aria-label="Search jobs" onClick={() => router.push("/jobs/all")} className="text-white/70 transition-colors hover:text-white">
          <Search className="size-5" />
        </button>
        {/* Inert until there's a notifications destination to route to. */}
        <span aria-hidden="true" className="text-white/70">
          <Bell className="size-5" />
        </span>
        <button type="button" aria-label="Open profile" onClick={onProfileClick} className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/[0.12] bg-white/[0.04]">
          {user?.profile_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.profile_image} alt={user.name || "Profile"} className="size-full object-cover" />
          ) : (
            <User className="size-4 text-white/70" />
          )}
        </button>
      </div>
    </header>
  );
}
