"use client";

import { QelsaLogo } from "@/components/QelsaLogo";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export interface PublicNavbarProps {
  activeSection?: string;
  onProfileClick?: () => void;
}

const NAV_LINKS = [
  { id: "candidates", label: "For Candidates", href: "/candidates" },
  { id: "employers", label: "For Employers", href: "/employers" },
  { id: "jobs", label: "Jobs", href: "/jobs/all" },
  { id: "pricing", label: "Pricing", href: "/pricing" },
];

export function PublicNavbar({ activeSection }: PublicNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isLinkActive = (id: string, href: string) => {
    if (activeSection) return activeSection === id;
    if (id === "jobs") return pathname?.startsWith("/jobs");
    return pathname === href;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#0a0c16]/85 backdrop-blur-md">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center" aria-label="Qelsa home">
            <QelsaLogo priority className="h-7 w-auto" />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => {
              const active = isLinkActive(link.id, link.href);
              return (
                <Link key={link.id} href={link.href} className={`text-sm transition-colors ${active ? "font-semibold text-white" : "font-medium text-white/70 hover:text-white"}`}>
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          <Link href="/auth?returnUrl=/profile" className="rounded-full border border-white/20 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-white/35 hover:bg-white/[0.08]">
            Get a job
          </Link>
          <Link
            href="/employer/auth?returnUrl=/jobs/posted"
            className="rounded-full bg-gradient-to-r from-[#623dd6] via-[#8433ae] to-[#be2680] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition-opacity hover:opacity-95"
          >
            Hire talent
          </Link>
        </div>

        {/* Mobile hamburger */}
        <div className="flex items-center sm:hidden">
          <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80" aria-label="Toggle navigation">
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-white/10 bg-[#0d1020] px-6 py-6 sm:hidden">
          <nav className="flex flex-col gap-4 text-base">
            {NAV_LINKS.map((link) => {
              const active = isLinkActive(link.id, link.href);
              return (
                <Link key={link.id} href={link.href} onClick={() => setMobileMenuOpen(false)} className={`transition-colors ${active ? "font-semibold text-white" : "font-medium text-white/80 hover:text-white"}`}>
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 flex flex-col gap-3">
            <Link href="/auth?returnUrl=/profile" onClick={() => setMobileMenuOpen(false)} className="rounded-full border border-white/20 bg-white/[0.04] py-3 text-center text-sm font-semibold text-white">
              Get a job
            </Link>
            <Link
              href="/employer/auth?returnUrl=/jobs/posted"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-full bg-gradient-to-r from-[#623dd6] via-[#8433ae] to-[#be2680] py-3 text-center text-sm font-semibold text-white shadow-lg"
            >
              Hire talent
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
