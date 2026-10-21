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
import { Crown, User } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * `id` matches the `activeSection` each page passes to Layout. Signed-out users
 * only see Jobs and Blog. Signed-in users keep the full product nav; Jobs lands
 * on Smart Matches. Network, Courses, and Blog are not built yet and land on
 * Coming Soon.
 */
const AUTHED_NAV_LINKS = [
  { id: "space", label: "My Space", href: "/" },
  { id: "jobs", label: "Jobs", href: "/jobs/all" },
  { id: "agent", label: "Agent", href: "/agent" },
  { id: "connections", label: "Network", href: "/network" },
  { id: "courses", label: "Courses", href: "/courses" },
  { id: "blog", label: "Blog", href: "/blogs" },
];

const GUEST_NAV_LINKS = [
  { id: "candidates", label: "For Candidates", href: "/candidates" },
  { id: "employers", label: "For Employers", href: "/employers" },
  { id: "jobs", label: "Jobs", href: "/jobs/all" },
  { id: "courses", label: "Courses", href: "/courses" },
  { id: "pricing", label: "Pricing", href: "/pricing" },
];

export function DesktopTopBar({
  activeSection,
  onProfileClick,
  isPro = false,
  premiumLoading = false,
  scrolled = false,
}: {
  activeSection?: string;
  onProfileClick?: () => void;
  isPro?: boolean;
  premiumLoading?: boolean;
  scrolled?: boolean;
}) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const links = isAuthenticated ? AUTHED_NAV_LINKS : GUEST_NAV_LINKS;

  return (
    <header
      className={`sticky top-0 z-50 hidden border-b backdrop-blur-xl transition-colors duration-300 lg:block ${
        scrolled ? "border-white/[0.08] bg-[#06060f]/80" : "border-transparent bg-transparent"
      }`}
    >
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
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/auth?returnUrl=/profile")}
              className="rounded-full border border-white/20 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-white/35 hover:bg-white/[0.08]"
            >
              Get a job
            </button>
            <button
              type="button"
              onClick={() => router.push("/employer/auth?returnUrl=/jobs/posted")}
              className="rounded-full bg-gradient-to-r from-[#623dd6] via-[#8433ae] to-[#be2680] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition-opacity hover:opacity-95"
            >
              Hire talent
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {premiumLoading ? (
              <span aria-hidden className="h-9 w-[88px] animate-pulse rounded-full bg-white/[0.05]" />
            ) : user?.account_type !== "recruiter" && !isPro ? (
              <button
                type="button"
                onClick={() => router.push("/pricing")}
                className="rounded-full bg-gradient-to-r from-[#623dd6] via-[#8433ae] to-[#be2680] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition-opacity hover:opacity-95"
              >
                Get Pro
              </button>
            ) : null}
            <button
              type="button"
              aria-label={isPro ? "Open profile — Qelsa Pro member" : "Open profile"}
              onClick={onProfileClick}
              className="relative flex size-8 shrink-0 items-center justify-center overflow-visible rounded-full border border-white/[0.12] bg-white/[0.04]"
            >
              <span className="flex size-full items-center justify-center overflow-hidden rounded-full">
                {user?.profile_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.profile_image} alt={user.name || "Profile"} className="size-full object-cover" />
                ) : (
                  <User className="size-4 text-white/70" />
                )}
              </span>
              {isPro ? (
                <span
                  title="Qelsa Pro member"
                  className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-amber-400 text-[#2a1a03] shadow-[0_0_10px_rgba(251,191,36,0.45)] ring-2 ring-[#06060f]"
                >
                  <Crown className="size-2.5" strokeWidth={2.5} aria-hidden />
                </span>
              ) : null}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
