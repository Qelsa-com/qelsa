import Image from "next/image";
import Link from "next/link";

/**
 * Footer for the public marketing pages (/candidates, /employers).
 *
 * The header for these pages comes from Layout -> PublicNavbar -> DesktopTopBar;
 * this is its counterpart, so neither piece of chrome is redefined per page.
 * Only the closing tagline differs between pages.
 */

const FOOTER_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookie Policy", href: "/cookies" },
];

export function MarketingFooter({ tagline }: { tagline: string }) {
  return (
    <footer className="px-6 pb-12 pt-20">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <Link href="/" className="flex items-center" aria-label="Qelsa home">
            <Image src="/qelsa-logo.svg" alt="Qelsa" width={91} height={29} unoptimized className="h-[26px] w-auto" />
          </Link>
          <nav className="flex flex-wrap items-center gap-8">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-base text-white/60 transition-colors hover:text-white">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-8 text-[15px] text-white/35">
          {/* The design reads "© 2026"; the year stays dynamic so it cannot go stale. */}
          <p>© {new Date().getFullYear()} Qelsa. All rights reserved.</p>
          <p>{tagline}</p>
        </div>
      </div>
    </footer>
  );
}
