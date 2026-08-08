import Link from "next/link";

// Help Center has no route yet, so it stays a placeholder.
const LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Help Center", href: "#" },
];

export function ProfileFooter() {
  return (
    <footer className="w-full border-t border-white/12">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-between gap-4 px-6 py-8 text-[13px] text-white/45 sm:flex-row md:px-12 lg:px-20">
        <p>© {new Date().getFullYear()} Qelsa Job Platform. All rights reserved.</p>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {LINKS.map((link) => (
            <Link key={link.label} href={link.href} className="transition-colors hover:text-white/70">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
