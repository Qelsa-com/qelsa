import { Briefcase, FileText, Home } from "lucide-react";
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
  // { id: "home", label: "Feed", icon: Activity, url: "/feed" },
  // { id: "qelsa-ai", label: "Qelsa AI", icon: Zap, url: "/qelsa-ai" },
  { id: "jobs", label: "Jobs", icon: Briefcase, badge: 12, url: "/jobs/smart_matches" },
  { id: "pages", label: "Pages", icon: FileText, url: "/pages" },
  // { id: "connections", label: "Network", icon: Users, url: "/network" },
  // { id: "courses", label: "Courses", icon: BookOpen, badge: 3, url: "/courses" },
  // { id: "blog", label: "Blog", icon: Rss, url: "/blogs" },
];

export function MainNavigation({ activeSection, onProfileClick }: MainNavigationProps) {
  return (
    <>
      {/* Desktop Header */}
      <DesktopTopBar activeSection={activeSection} onProfileClick={onProfileClick} />

      {/* Mobile Header */}
      <MobileTopBar onProfileClick={onProfileClick} />

      {/* Instagram-style Bottom Navigation (Mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-strong backdrop-blur-xl border-t border-glass-border">
        <div className="grid grid-cols-6 gap-1 px-2 py-2 safe-area-bottom">
          {mainNavigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                className={`relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 hover:scale-110 ${isActive ? "text-neon-cyan" : "text-muted-foreground"}`}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 transition-all duration-300 ${isActive ? "text-neon-cyan scale-110" : "text-muted-foreground"}`} />
                  {item.badge && (
                    <Badge className="absolute -top-1 -right-1 h-3 min-w-[12px] text-[10px] bg-gradient-to-r from-neon-pink to-neon-purple text-white border-0 animate-pulse px-1">
                      {item.badge > 9 ? "9+" : item.badge}
                    </Badge>
                  )}
                </div>
                <span className={`text-[10px] font-medium transition-all duration-300 leading-tight ${isActive ? "text-neon-cyan" : "text-muted-foreground"}`}>{item.label}</span>
                {isActive && <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-4 h-0.5 bg-neon-cyan rounded-full glow-cyan"></div>}
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
