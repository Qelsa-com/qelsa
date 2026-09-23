"use client";

/**
 * Mobile top bar — brand on the left, hamburger on the right.
 * Opens the candidate side menu. Hidden at `lg`, where DesktopTopBar takes over.
 */

import { CircleHelp, Menu } from "lucide-react";
import { useRouter } from "next/navigation";

export function MobileTopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/[0.12] bg-white/[0.06] px-4 py-3 backdrop-blur-xl lg:hidden">
      <button type="button" onClick={() => router.push("/")} className="flex items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-neon-cyan">
          <CircleHelp className="size-4 text-[#06060f]" strokeWidth={2} />
        </span>
        <span className="text-base font-bold text-white">Qelsa</span>
      </button>

      <button
        type="button"
        aria-label="Open menu"
        onClick={onMenuClick}
        className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.04] text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white"
      >
        <Menu className="size-5" />
      </button>
    </header>
  );
}
