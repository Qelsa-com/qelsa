"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const MESSAGES = ["Reading your education...", "Reading your experience...", "Reading your skills..."];

interface ResumeParsingProps {
  /** When true, renders inside a bounded container (like on profile/my space) without min-h-screen or duplicate logo */
  embedded?: boolean;
  showLogo?: boolean;
}

export function ResumeParsing({ embedded = false, showLogo }: ResumeParsingProps) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(12);

  const shouldShowLogo = showLogo ?? !embedded;

  useEffect(() => {
    const messageTick = setInterval(() => setIndex((current) => (current + 1) % MESSAGES.length), 1800);
    const progressTick = setInterval(() => setProgress((current) => Math.min(88, current + 4)), 280);
    return () => {
      clearInterval(messageTick);
      clearInterval(progressTick);
    };
  }, []);

  if (embedded) {
    return (
      <div className="relative flex min-h-[340px] w-full flex-col items-center justify-center overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.02] px-6 py-14 shadow-[0_4px_24px_rgba(0,0,0,0.25)] sm:rounded-[24px] sm:py-16">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-purple/15 blur-[90px]" />
        </div>

        <div className="flex h-20 w-20 items-center justify-center rounded-full gradient-primary shadow-[0_0_36px_rgba(124,58,237,0.4)] animate-pulse">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white" aria-hidden>
            <path d="M12 2.5 13.4 8l5.6 1.4L13.4 10.8 12 16.5l-1.4-5.7L5 9.4 10.6 8 12 2.5Z" />
          </svg>
        </div>

        <p className="mt-6 text-lg font-medium text-white">{MESSAGES[index]}</p>
        <div className="mt-4 h-1.5 w-60 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full gradient-primary transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4" style={{ background: "var(--background)" }}>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-purple/10 blur-[130px]" />
      </div>

      {shouldShowLogo && (
        <Image src="/qelsa-logo.svg" alt="Qelsa" width={91} height={29} priority unoptimized className="h-[26px] w-auto" />
      )}

      <div className={`${shouldShowLogo ? "mt-16" : "mt-0"} flex h-28 w-28 items-center justify-center rounded-full gradient-primary shadow-[0_0_40px_rgba(124,58,237,0.35)]`}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white" aria-hidden>
          <path d="M12 2.5 13.4 8l5.6 1.4L13.4 10.8 12 16.5l-1.4-5.7L5 9.4 10.6 8 12 2.5Z" />
        </svg>
      </div>

      <p className="mt-8 text-xl font-medium text-white">{MESSAGES[index]}</p>
      <div className="mt-6 h-1.5 w-64 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full gradient-primary transition-[width] duration-300" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
