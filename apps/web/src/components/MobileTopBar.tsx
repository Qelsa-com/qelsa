"use client";

/**
 * Mobile top bar — brand on the left, hamburger on the right.
 * Opens the candidate side menu. Hidden at `lg`, where DesktopTopBar takes over.
 */

import { QelsaLogo } from "@/components/QelsaLogo";
import { useAuth } from "@/contexts/AuthContext";
import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";

export function MobileTopBar({
  onMenuClick,
  isPro = false,
  premiumLoading = false,
  scrolled = false,
}: {
  onMenuClick?: () => void;
  isPro?: boolean;
  premiumLoading?: boolean;
  scrolled?: boolean;
}) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const authBootstrapping = isLoading && !user;

  return (
    <header
      className={`sticky top-0 z-40 flex items-center justify-between border-b px-4 py-3 backdrop-blur-xl transition-colors duration-300 lg:hidden ${
        scrolled ? "border-white/[0.12] bg-[#06060f]/80" : "border-transparent bg-transparent"
      }`}
    >
      <button
        type="button"
        onClick={() => router.push("/")}
        className="flex items-center"
        aria-label="Qelsa home"
      >
        <QelsaLogo className="h-[22px] w-auto" />
      </button>

      <div className="flex items-center gap-2" aria-busy={authBootstrapping}>
        {authBootstrapping ? (
          <span aria-hidden className="h-8 w-20 animate-pulse rounded-full bg-white/[0.06]" />
        ) : isAuthenticated && user?.account_type !== "recruiter" && !premiumLoading && !isPro ? (
          <button
            type="button"
            onClick={() => router.push("/pricing")}
            className="rounded-full bg-gradient-to-r from-[#623dd6] via-[#8433ae] to-[#be2680] px-3.5 py-1.5 text-xs font-bold text-white shadow-lg shadow-purple-900/30 transition-opacity hover:opacity-95"
          >
            Get Pro
          </button>
        ) : null}
        <button
          type="button"
          aria-label="Open menu"
          onClick={onMenuClick}
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.04] text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          <Menu className="size-5" />
        </button>
      </div>
    </header>
  );
}
