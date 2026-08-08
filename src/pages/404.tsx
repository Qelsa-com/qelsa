import { useRouter } from "next/navigation";

/**
 * 404 — served automatically by Next.js for any unmatched URL.
 *
 * Figma: Qelsa-Screen — error-404 (653:3649). Deliberately standalone (no
 * `Layout`): the design is a bare full-viewport screen with no nav chrome, and
 * Layout's profile-completeness effect would redirect off the page.
 */

const NotFound = () => {
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#06060f] px-6">
      {/* bg-glow-purple / bg-glow-cyan — a blurred solid disc each. */}
      <div aria-hidden="true" className="pointer-events-none absolute left-[calc(50%+120px)] top-[calc(50%-80px)] size-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-purple/15 blur-[60px]" />
      <div aria-hidden="true" className="pointer-events-none absolute left-[calc(50%-120px)] top-[calc(50%-40px)] size-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-cyan/10 blur-[50px]" />

      {/* error-content-stack */}
      <div className="relative flex w-full max-w-[800px] flex-col items-center text-center">
        <p
          className="bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-[110px] font-extrabold leading-none text-transparent sm:text-[160px]"
          style={{ textShadow: "0px 20px 60px rgba(124, 58, 237, 0.2)" }}
        >
          404
        </p>

        {/* text-block */}
        <div className="flex w-full flex-col items-center gap-4 pt-6">
          <h1 className="text-2xl font-semibold text-white sm:text-[32px]">Page not found</h1>
          <p className="max-w-[480px] text-base leading-[1.5] text-white/60">
            The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
          </p>
        </div>

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

        {/* footer-link-container */}
        <p className="pt-6 text-sm text-white/50">
          Need help?{" "}
          <a href="https://qelsa.com/support" target="_blank" rel="noreferrer" className="font-medium text-neon-cyan transition-opacity hover:opacity-80">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
};

export default NotFound;
