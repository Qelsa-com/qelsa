"use client";

import { Briefcase, Building2, Rss, User, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DesktopTopBar } from "./DesktopTopBar";
import { MobileTopBar } from "./MobileTopBar";
import { ProfileDrawer } from "./ProfileDrawer";

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const publicNavbarItems: NavigationItem[] = [
  { id: "candidates", label: "Candidates", icon: Users, path: "/candidates" },
  { id: "employers", label: "Employers", icon: Building2, path: "/employers" },
  { id: "jobs", label: "Jobs", icon: Briefcase, path: "/jobs/all" },
  { id: "blog", label: "Blog", icon: Rss, path: "/blogs" },
];

export function PublicNavbar({ activeSection, onProfileClick }: { activeSection?: string; onProfileClick?: () => void }) {
  const router = useRouter();
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

  const handleOpenProfile = onProfileClick ?? (() => setIsProfileDrawerOpen(true));

  return (
    <>
      {/* Desktop Header */}
      <DesktopTopBar activeSection={activeSection} onProfileClick={handleOpenProfile} />

      {/* Mobile Header */}
      <MobileTopBar onProfileClick={handleOpenProfile} />

      {/* Instagram-style Bottom Navigation (Mobile) */}
      <nav className="mobile-tab-bar lg:hidden fixed inset-x-0 bottom-0 z-50">
        <div className="mx-auto flex max-w-md items-stretch justify-around px-2 py-1">
          {publicNavbarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                type="button"
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                onClick={() => router.push(item.path)}
                className={`relative flex flex-1 flex-col items-center gap-1 p-2 rounded-xl transition-colors ${isActive ? "text-neon-cyan" : "text-muted-foreground"}`}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 transition-all duration-300 ${isActive ? "text-neon-cyan scale-110" : "text-muted-foreground"}`} />
                </div>
                <span className={`text-[10px] font-medium transition-all duration-300 leading-tight ${isActive ? "text-neon-cyan" : "text-muted-foreground"}`}>{item.label}</span>
                {isActive && <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-4 h-0.5 bg-neon-cyan rounded-full glow-cyan"></div>}
              </button>
            );
          })}

          {/* Profile Button */}
          <button
            onClick={handleOpenProfile}
            className="relative flex flex-1 flex-col items-center gap-1 p-2 rounded-xl transition-colors text-muted-foreground hover:text-white"
          >
            <div className="relative">
              <div className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 glass border border-glass-border">
                <User className="h-3 w-3 transition-all duration-300 text-muted-foreground" />
              </div>
            </div>
            <span className="text-[10px] font-medium transition-all duration-300 leading-tight text-muted-foreground">Profile</span>
          </button>
        </div>
      </nav>

      {/* The spacer that clears this fixed bar lives in Layout, after the page
          content — here it only pushed the page down by 80px. */}

      {/* Profile Drawer (standalone fallback when onProfileClick is not provided) */}
      {!onProfileClick && (
        <ProfileDrawer isOpen={isProfileDrawerOpen} onClose={() => setIsProfileDrawerOpen(false)} />
      )}
    </>
  );
}
