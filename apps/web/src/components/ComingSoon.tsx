"use client";

/**
 * Coming Soon — stands in for the nav destinations that aren't built yet
 * (Qelsa AI, Network, Courses, Blog).
 *
 * Figma: Qelsa-Screen — coming-soon (653:3633).
 */

import { useRouter } from "next/navigation";

export function ComingSoon() {
  const router = useRouter();

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-6 py-20">
      {/* bg-glow-purple / bg-glow-cyan — a blurred solid disc each. */}
      <div aria-hidden="true" className="pointer-events-none absolute left-[-200px] top-[100px] size-[600px] rounded-full bg-neon-purple/15 blur-[75px]" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-[-200px] size-[500px] rounded-full bg-neon-cyan/10 blur-[75px]" />

      {/* content-container */}
      <div className="relative flex flex-col items-center text-center">
        <h1 className="text-4xl font-extrabold text-white sm:text-5xl">Coming Soon</h1>
        <p className="mt-4 max-w-[520px] text-lg leading-[1.6] text-white/70">
          We&apos;re building something exciting. This feature is currently under development and will be available soon.
        </p>

        {/* button-row */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-10">
          <button
            onClick={() => router.push("/")}
            className="rounded-full gradient-primary px-8 py-3.5 text-base font-bold text-white transition-opacity hover:opacity-90"
          >
            Go to homepage
          </button>
          <button
            onClick={() => router.push("/jobs/all")}
            className="rounded-full border border-white/[0.12] px-8 py-3.5 text-base font-semibold text-white/70 transition-colors hover:border-white/25 hover:text-white"
          >
            Browse jobs
          </button>
        </div>
      </div>
    </div>
  );
}
