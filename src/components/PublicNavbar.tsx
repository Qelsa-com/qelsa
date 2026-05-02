import { Briefcase, Rss, User, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProfilePanel } from "./ProfilePanel";
import { Badge } from "./ui/badge";

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  isMain?: boolean;
  path: string;
}

// Main navigation items (bottom nav)
const publicNavbarItems: NavigationItem[] = [
  { id: "jobs", label: "Jobs", icon: Briefcase, badge: 12, isMain: true, path: "/jobs" },
  // { id: "qelsa-ai", label: "Qelsa AI", icon: Zap, isMain: true, path: "/qelsa-ai" },
  // { id: "blog", label: "Blog", icon: Rss, isMain: true, path: "/blog" },
];

export function PublicNavbar() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);

  const activeSection = publicNavbarItems.find((item) => item.path === location.pathname)?.id || "profile";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Desktop Header (Simple) */}
      <header
        className={`hidden lg:flex items-center justify-between px-6 py-4 transition-all duration-300 sticky top-0 z-50 ${isScrolled ? "glass-strong backdrop-blur-xl" : "glass backdrop-blur-lg"}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => router.push("/jobs")}>
          <div className="relative">
            <div className="w-10 h-10 rounded-xl gradient-animated flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
              <Zap className="h-5 w-5 text-black" />
            </div>
            <div className="absolute inset-0 w-10 h-10 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple opacity-50 blur-md group-hover:opacity-70 transition-opacity"></div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">Qelsa</h1>
            <span className="text-xs text-muted-foreground -mt-1">Future of Work</span>
          </div>
        </div>

        {/* Desktop Navigation Icons */}
        <div className="flex items-center gap-6">
          {publicNavbarItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  router.push(item.path);
                }}
                className={`relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 hover:scale-110 ${isActive ? "text-neon-cyan" : "text-muted-foreground"}`}
              >
                <div className="relative">
                  <Icon className={`h-6 w-6 transition-all duration-300 ${isActive ? "text-neon-cyan glow-cyan" : "group-hover:text-neon-cyan"}`} />
                  {item.badge && (
                    <Badge className="absolute -top-2 -right-2 h-5 min-w-[20px] text-xs bg-gradient-to-r from-neon-pink to-neon-purple text-white border-0 animate-pulse">{item.badge}</Badge>
                  )}
                </div>
                <span className={`text-xs font-medium ${isActive ? "text-neon-cyan" : "text-muted-foreground group-hover:text-white"}`}>{item.label}</span>
                {isActive && <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-neon-cyan rounded-full glow-cyan"></div>}
              </button>
            );
          })}

          {/* Profile Icon */}
          <button
            onClick={() => {
              setIsProfilePanelOpen(true);
            }}
            className={`relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 hover:scale-110 ${isProfilePanelOpen ? "text-neon-cyan" : "text-muted-foreground"}`}
          >
            <div className="relative">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isProfilePanelOpen ? "glass-strong border-2 border-neon-cyan glow-cyan" : "glass border border-glass-border hover:border-neon-cyan"
                }`}
              >
                <User className={`h-4 w-4 transition-all duration-300 ${isProfilePanelOpen ? "text-neon-cyan" : "text-muted-foreground"}`} />
              </div>
            </div>
            <span className={`text-xs font-medium ${isProfilePanelOpen ? "text-neon-cyan" : "text-muted-foreground group-hover:text-white"}`}>Profile</span>
            {isProfilePanelOpen && <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-neon-cyan rounded-full glow-cyan"></div>}
          </button>
        </div>
      </header>

      {/* Instagram-style Bottom Navigation (Mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-strong backdrop-blur-xl border-t border-glass-border">
        <div className="grid grid-cols-4 gap-1 px-2 py-2 safe-area-bottom">
          {publicNavbarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => router.push(item.path)}
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

          {/* Profile Button */}
          <button
            onClick={() => setIsProfilePanelOpen(true)}
            className={`relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 hover:scale-110 ${isProfilePanelOpen ? "text-neon-cyan" : "text-muted-foreground"}`}
          >
            <div className="relative">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isProfilePanelOpen ? "glass-strong border-2 border-neon-cyan scale-110" : "glass border border-glass-border"
                }`}
              >
                <User className={`h-3 w-3 transition-all duration-300 ${isProfilePanelOpen ? "text-neon-cyan" : "text-muted-foreground"}`} />
              </div>
            </div>
            <span className={`text-[10px] font-medium transition-all duration-300 leading-tight ${isProfilePanelOpen ? "text-neon-cyan" : "text-muted-foreground"}`}>Profile</span>
            {isProfilePanelOpen && <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-4 h-0.5 bg-neon-cyan rounded-full glow-cyan"></div>}
          </button>
        </div>
      </nav>

      {/* Bottom spacing for mobile content */}
      <div className="lg:hidden h-20"></div>

      {/* Profile Panel */}
      <ProfilePanel isOpen={isProfilePanelOpen} onClose={() => setIsProfilePanelOpen(false)} />
    </>
  );
}
