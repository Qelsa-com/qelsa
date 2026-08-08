import Link from "next/link";

/**
 * Site footer — divider, copyright, and the three policy links.
 *
 * Figma: Qelsa-Screen — footer (653:3765).
 */

const LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookie Policy", href: "/cookies" },
];

export function ProfileFooter() {
  return (
    <footer className="w-full px-6 pb-10 pt-20 sm:px-10">
      <div className="flex flex-col gap-8">
        <div className="h-px w-full bg-white/[0.12]" />
        <div className="flex flex-col items-center justify-between gap-4 text-xs text-white/50 sm:flex-row">
          {/* The design reads "© 2025"; the year stays dynamic so it can't go stale. */}
          <p>© {new Date().getFullYear()} Qelsa. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {LINKS.map((link) => (
              <Link key={link.label} href={link.href} className="transition-colors hover:text-white/70">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
