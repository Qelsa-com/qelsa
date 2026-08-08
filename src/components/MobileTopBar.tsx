"use client";

/**
 * Mobile top bar — brand on the left, three circular actions on the right.
 *
 * Figma: Qelsa-Screen — jobs-listing-mobile / Top Navigation (777:18). Both
 * navbars render it, so signed-in and signed-out mobile share one bar; it
 * hides at `lg` where each navbar's own desktop header takes over.
 */

import { Bell, CircleHelp, Search, User } from "lucide-react";
import { useRouter } from "next/navigation";

/** 36px circular action. Renders inert when there's nowhere to go yet. */
function NavAction({ label, onClick, children }: { label: string; onClick?: () => void; children: React.ReactNode }) {
  const className = "flex size-9 shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.04] text-white/70";
  return onClick ? (
    <button type="button" aria-label={label} onClick={onClick} className={`${className} transition-colors hover:bg-white/[0.08] hover:text-white`}>
      {children}
    </button>
  ) : (
    <span aria-hidden="true" className={className}>
      {children}
    </span>
  );
}

export function MobileTopBar({ onProfileClick }: { onProfileClick?: () => void }) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/[0.12] bg-white/[0.06] px-4 py-3 backdrop-blur-xl lg:hidden">
      <button type="button" onClick={() => router.push("/")} className="flex items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-neon-cyan">
          <CircleHelp className="size-4 text-[#06060f]" strokeWidth={2} />
        </span>
        <span className="text-base font-bold text-white">Qelsa</span>
      </button>

      <div className="flex items-center gap-2">
        <NavAction label="Search jobs" onClick={() => router.push("/jobs/all")}>
          <Search className="size-4" />
        </NavAction>
        {/* Inert until there's a notifications destination to route to. */}
        <NavAction label="Notifications">
          <Bell className="size-4" />
        </NavAction>
        <NavAction label="Open profile" onClick={onProfileClick}>
          <User className="size-4" />
        </NavAction>
      </div>
    </header>
  );
}
