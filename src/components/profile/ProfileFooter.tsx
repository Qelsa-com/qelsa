const LINKS = ["Privacy Policy", "Terms of Service", "Help Center"];

export function ProfileFooter() {
  return (
    <footer className="w-full border-t border-white/12">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-between gap-4 px-6 py-8 text-[13px] text-white/45 sm:flex-row md:px-12 lg:px-20">
        <p>© {new Date().getFullYear()} Qelsa Job Platform. All rights reserved.</p>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {LINKS.map((link) => (
            <a key={link} href="#" className="transition-colors hover:text-white/70">
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
