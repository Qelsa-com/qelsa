import { Activity, Bell, BookOpen, Briefcase, FileText, Filter, Home, Mail, Rss, Search, User, Users, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  url: string;
}

interface MainNavigationProps {
  activeSection: string;
  onJobSearch?: (query: string) => void;
  onJobFilter?: () => void;
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

export function MainNavigation({ activeSection, onJobSearch, onJobFilter, onProfileClick }: MainNavigationProps) {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleTabChange = (tab: string) => {
    router.push(tab);
  };

  return (
    <>
      {/* Desktop Header (Simple) */}
      <header
        className={`hidden lg:flex items-center justify-between px-6 py-4 transition-all duration-300 sticky top-0 z-50 ${isScrolled ? "glass-strong backdrop-blur-xl" : "glass backdrop-blur-lg"}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 group cursor-pointer">
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
          {mainNavigationItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <Button
                key={item.id}
                onClick={() => handleTabChange(item.url)}
                // sx={{ textDecoration: "none", color: "inherit" }}
                className={`relative group flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 hover:scale-110 ${
                  isActive ? "text-neon-cyan" : "text-muted-foreground hover:text-white"
                }`}
              >
                <div className="relative">
                  <Icon className={`h-6 w-6 transition-all duration-300 ${isActive ? "text-neon-cyan glow-cyan" : "group-hover:text-neon-cyan"}`} />
                  {item.badge && (
                    <Badge className="absolute -top-2 -right-2 h-5 min-w-[20px] text-xs bg-gradient-to-r from-neon-pink to-neon-purple text-white border-0 animate-pulse">{item.badge}</Badge>
                  )}
                </div>
                <span className={`text-xs font-medium ${isActive ? "text-neon-cyan" : "text-muted-foreground group-hover:text-white"}`}>{item.label}</span>
                {isActive && <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-neon-cyan rounded-full glow-cyan"></div>}
              </Button>
            );
          })}
        </div>

        {/* User Section */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative glass rounded-full hover:glass-strong hover:glow-cyan transition-all duration-300">
            <Bell className="h-5 w-5 text-neon-cyan" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-neon-pink rounded-full animate-pulse"></div>
          </Button>

          <div className="relative group cursor-pointer" onClick={onProfileClick}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink p-0.5 hover:scale-110 transition-all duration-300">
              <div className="w-full h-full rounded-full glass flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="absolute inset-0 w-10 h-10 rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple opacity-0 group-hover:opacity-50 blur-md transition-opacity"></div>
          </div>
        </div>
      </header>

      {/* Mobile Header - Jobs Page */}
      {activeSection === "jobs" ? (
        <header className="lg:hidden glass backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center gap-3 px-4 py-3">
            {/* Profile Avatar */}
            <div className="relative group cursor-pointer" onClick={onProfileClick}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink p-0.5 hover:scale-110 transition-all duration-300">
                <div className="w-full h-full rounded-full glass flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="absolute inset-0 w-8 h-8 rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple opacity-0 group-hover:opacity-50 blur-md transition-opacity"></div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && onJobSearch) {
                      onJobSearch(searchQuery);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2 glass rounded-xl border border-glass-border text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:border-transparent transition-all duration-300"
                />
              </div>
            </div>

            {/* Filter Icon */}
            <button onClick={onJobFilter} className="w-8 h-8 rounded-full glass hover:glass-strong flex items-center justify-center hover:scale-110 transition-all duration-300">
              <Filter className="h-4 w-4 text-neon-purple" />
            </button>
          </div>
        </header>
      ) : (
        /* Mobile Header (Standard) */
        <header className="lg:hidden glass backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="relative group cursor-pointer" onClick={onProfileClick}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink p-0.5 hover:scale-110 transition-all duration-300">
                <div className="w-full h-full rounded-full glass flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="absolute inset-0 w-8 h-8 rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple opacity-0 group-hover:opacity-50 blur-md transition-opacity"></div>
            </div>

            {/* Right side icons */}
            <div className="flex items-center gap-3">
              {/* Messages */}
              <div className="relative cursor-pointer group">
                <div className="w-8 h-8 rounded-full glass hover:glass-strong flex items-center justify-center hover:scale-110 transition-all duration-300">
                  <Mail className="h-4 w-4 text-neon-cyan" />
                </div>
                {/* Message notification badge */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-neon-pink rounded-full animate-pulse"></div>
              </div>

              {/* Notifications */}
              <div className="relative cursor-pointer group">
                <div className="w-8 h-8 rounded-full glass hover:glass-strong flex items-center justify-center hover:scale-110 transition-all duration-300">
                  <Bell className="h-4 w-4 text-neon-purple" />
                </div>
                {/* Notification badge */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-neon-cyan rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </header>
      )}

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

      {/* Bottom spacing for mobile content */}
      <div className="lg:hidden h-20"></div>
    </>
  );
}
