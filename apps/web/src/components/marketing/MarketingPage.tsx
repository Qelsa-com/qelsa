import { QelsaLogo } from "@/components/QelsaLogo";
import { ArrowRight } from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shared shell for the public marketing pages.
 *
 * The home page is the reference for this system: editorial serif headings,
 * Inter for body/product UI, one dark field, and a quiet footer. Reusing these
 * pieces keeps /candidates and /employers from drifting back into a second
 * visual language.
 */

export const MARKETING_SECTION = "mx-auto w-full max-w-[1240px] px-4 py-14 sm:px-6 sm:py-20 lg:py-[120px]";

export const MARKETING_FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06060f]";

export const PRIMARY_CTA = `gradient-landing group inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[16px] font-medium text-white transition-opacity hover:opacity-95 ${MARKETING_FOCUS}`;

export const SECONDARY_CTA = `inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/15 px-6 text-[16px] font-medium text-white/80 transition-colors hover:border-white/30 hover:bg-white/[0.04] hover:text-white ${MARKETING_FOCUS}`;

export const PANEL = "rounded-2xl border border-white/[0.1] bg-[#0F0F23]";

export function MarketingPage({ children }: { children: ReactNode }) {
  return (
    <div className="font-landing relative isolate overflow-x-clip text-white antialiased selection:bg-[#00D4FF]/20 selection:text-[#00D4FF]">
      <Head>
        <link rel="preload" href="/fonts/inter-latin-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link
          rel="preload"
          href="/fonts/instrument-serif-regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/instrument-serif-italic.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </Head>
      <div
        aria-hidden="true"
        className="landing-aurora pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px]"
      />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}

export function SectionIntro({ id, title, lead }: { id?: string; title: string; lead?: ReactNode }) {
  return (
    <div>
      <h2
        id={id}
        className="font-editorial mx-auto max-w-[760px] text-balance text-center text-[38px] leading-[1.02] tracking-[-0.02em] sm:text-[50px] lg:text-[62px]"
      >
        {title}
      </h2>
      <span
        aria-hidden="true"
        className="mx-auto mt-6 block h-px w-12 bg-[linear-gradient(90deg,transparent,#7C2FF3,#D73E9D,transparent)]"
      />
      {lead ? (
        <p className="mx-auto mt-5 max-w-[720px] text-balance text-center text-[20px] leading-[1.35] tracking-[-0.2px] text-white/70 sm:text-[24px]">
          {lead}
        </p>
      ) : null}
    </div>
  );
}

export function ClosingCta({
  title,
  accent,
  href,
  label,
}: {
  title: string;
  accent: string;
  href: string;
  label: string;
}) {
  return (
    <section className="mx-auto w-full max-w-[1100px] px-4 pb-20 pt-6 sm:px-6 sm:pb-24 lg:pb-[120px]">
      <div className="landing-cta-card rounded-[32px] px-5 py-14 text-center sm:px-12 sm:py-16 lg:py-24">
        <h2 className="font-editorial text-balance text-[44px] leading-[1.02] tracking-[-0.02em] sm:text-[58px] lg:text-[72px]">
          <span className="block">{title}</span>
          <span className="block italic bg-[linear-gradient(90deg,#A78BFA,#F472B6)] bg-clip-text text-transparent">
            {accent}
          </span>
        </h2>
        <div className="mt-8 flex justify-center">
          <Link href={href} className={PRIMARY_CTA}>
            {label}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#070913] py-12">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col items-center gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col items-center sm:items-start">
          <Link
            href="/"
            aria-label="Qelsa home"
            className={`inline-flex min-h-11 items-center ${MARKETING_FOCUS}`}
          >
            <QelsaLogo className="h-6 w-auto" />
          </Link>
          <p className="text-[12px] text-white/50">Copyright © 2026 Qelsa</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[12px] text-white/60">
          <Link
            href="/privacy"
            className={`inline-flex min-h-11 items-center transition-colors hover:text-white ${MARKETING_FOCUS}`}
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className={`inline-flex min-h-11 items-center transition-colors hover:text-white ${MARKETING_FOCUS}`}
          >
            Terms
          </Link>
          <Link
            href="/cookies"
            className={`inline-flex min-h-11 items-center transition-colors hover:text-white ${MARKETING_FOCUS}`}
          >
            Cookies
          </Link>
          <a
            href="mailto:support@qelsa.com"
            className={`inline-flex min-h-11 items-center transition-colors hover:text-white ${MARKETING_FOCUS}`}
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
