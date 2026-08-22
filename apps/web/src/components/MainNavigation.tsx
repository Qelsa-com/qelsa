import { Briefcase, FileText, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { DesktopTopBar } from "./DesktopTopBar";
import { MobileTopBar } from "./MobileTopBar";
import { Badge } from "./ui/badge";

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  url: string;
}

interface MainNavigationProps {
  activeSection: string;
  onProfileClick?: () => void;
}

// Main navigation items (bottom nav)
const mainNavigationItems: NavigationItem[] = [
  { id: "profile", label: "My Space", icon: Home, url: "/" },
  { id: "jobs", label: "Jobs", icon: Briefcase, badge: 12, url: "/jobs/smart_matches" },
  { id: "pages", label: "Pages", icon: FileText, url: "/pages" },
];

export function MainNavigation({ activeSection, onProfileClick }: MainNavigationProps) {
  const router = useRouter();

  return (
    <>
      {/* Desktop Header */}
      <DesktopTopBar activeSection={activeSection} onProfileClick={onProfileClick} />

      {/* Mobile Header */}
      <MobileTopBar onProfileClick={onProfileClick} />

      {/* Instagram-style Bottom Navigation (Mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-strong backdrop-blur-xl border-t border-glass-border">
        <div className="mx-auto flex max-w-md items-stretch justify-around px-2 py-1 safe-area-bottom">
          {mainNavigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                type="button"
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                onClick={() => router.push(item.url)}
                className={`relative flex flex-1 flex-col items-center gap-0.5 py-1.5 transition-colors ${isActive ? "text-neon-cyan" : "text-muted-foreground hover:text-white/80"}`}
              >
                <div className="relative">
                  <Icon className={`h-6 w-6 transition-transform ${isActive ? "scale-105" : ""}`} />
                  {item.badge && <Badge className="absolute -top-1 -right-2 h-4 min-w-[16px] text-[10px] bg-gradient-to-r from-neon-pink to-neon-purple text-white border-0 px-1">{item.badge > 9 ? "9+" : item.badge}</Badge>}
                </div>
                <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                {isActive && <div className="absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-neon-cyan glow-cyan" />}
              </button>
            );
          })}
        </div>
      </nav>

      {/* The spacer that clears this fixed bar lives in Layout, after the page
          content — here it only pushed the page down by 80px. */}
    </>
  );
}
