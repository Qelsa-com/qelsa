"use client";

/**
 * Desktop top bar — brand, primary nav links, and the action cluster.
 *
 * Figma: Qelsa-Screen — header (653:3739). Both navbars render it so signed-in
 * and signed-out desktop share one bar; it hides below `lg`, where MobileTopBar
 * and the hamburger menu take over.
 */

import { QelsaLogo } from "@/components/QelsaLogo";
import { useAuth } from "@/contexts/AuthContext";
import { Search, User } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * `id` matches the `activeSection` each page passes to Layout. Signed-out users
 * only see Jobs and Blog. Signed-in users keep the full product nav; Jobs lands
 * on Smart Matches. Network, Courses, and Blog are not built yet and land on
 * Coming Soon.
 */
const AUTHED_NAV_LINKS = [
  { id: "profile", label: "My Space", href: "/" },
  { id: "jobs", label: "Jobs", href: "/jobs/smart-matches" },
  { id: "connections", label: "Network", href: "/network" },
  { id: "courses", label: "Courses", href: "/courses" },
  { id: "blog", label: "Blog", href: "/blogs" },
];

const GUEST_NAV_LINKS = [
  { id: "candidates", label: "For Candidates", href: "/candidates" },
  { id: "employers", label: "For Employers", href: "/employers" },
  { id: "jobs", label: "Jobs", href: "/jobs/all" },
  { id: "blog", label: "Blogs", href: "/blogs" },
];

export function DesktopTopBar({ activeSection, onProfileClick }: { activeSection?: string; onProfileClick?: () => void }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const links = isAuthenticated ? AUTHED_NAV_LINKS : GUEST_NAV_LINKS;

  return (
    <header className="sticky top-0 z-50 hidden border-b border-white/[0.08] bg-[#06060f] lg:block">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <button type="button" onClick={() => router.push("/")} className="flex items-center">
          <QelsaLogo priority className="h-[26px] w-auto" />
        </button>

        <nav className="flex items-center gap-9">
          {links.map((link) => {
            const active = link.id === activeSection;
            return (
              <button key={link.id} type="button" onClick={() => router.push(link.href)} className="relative flex items-center justify-center">
                <span className={`text-[15px] font-semibold transition-colors ${active ? "text-sky-400" : "text-white/70 hover:text-white"}`}>{link.label}</span>
                {/* Sits on the header's bottom edge, clearing the 16px padding. */}
                {active && <span className="absolute -bottom-4 left-0 h-0.5 w-full bg-sky-400" />}
              </button>
            );
          })}
        </nav>

        {!isAuthenticated ? (
          <button type="button" onClick={() => router.push("/auth")} className="text-[15px] font-semibold text-white transition-colors hover:text-white/80">
            Sign in
          </button>
        ) : (
          <div className="flex items-center gap-6">
            <button type="button" aria-label="Search jobs" onClick={() => router.push("/jobs/all")} className="text-white/70 transition-colors hover:text-white">
              <Search className="size-5" />
            </button>
            <button type="button" aria-label="Open profile" onClick={onProfileClick} className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/[0.12] bg-white/[0.04]">
              {user?.profile_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.profile_image} alt={user.name || "Profile"} className="size-full object-cover" />
              ) : (
                <User className="size-4 text-white/70" />
              )}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
