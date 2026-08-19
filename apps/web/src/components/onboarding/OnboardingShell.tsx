"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { QUIET_LINK } from "./styles";

export function OnboardingShell({ children, onBack }: { children: ReactNode; onBack?: () => void }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10" style={{ background: "var(--background)" }}>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[540px] w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-purple/10 blur-[130px]" />
      </div>

      <Image src="/qelsa-logo.svg" alt="Qelsa" width={91} height={29} priority unoptimized className="mb-8 h-[21px] w-auto" />

      <div className="w-full max-w-[460px]">{children}</div>

      {onBack ? (
        <button type="button" onClick={onBack} className={`mt-6 ${QUIET_LINK}`}>
          ← Back
        </button>
      ) : null}
    </div>
  );
}

export function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={`h-1 w-7 rounded-full ${index < current ? "bg-gradient-to-r from-neon-cyan to-neon-purple" : "bg-white/10"}`}
          />
        ))}
      </div>
      <span className="text-sm tabular-nums text-muted-foreground">
        {current} / {total}
      </span>
    </div>
  );
}

export function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
