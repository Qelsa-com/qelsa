"use client";

import { Briefcase, Rss, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DesktopTopBar } from "./DesktopTopBar";
import { MobileTopBar } from "./MobileTopBar";
import { ProfilePanel } from "./ProfilePanel";

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const publicNavbarItems: NavigationItem[] = [
  { id: "jobs", label: "Jobs", icon: Briefcase, path: "/jobs/all" },
  { id: "blog", label: "Blog", icon: Rss, path: "/blogs" },
];

export function PublicNavbar({ activeSection }: { activeSection?: string }) {
  const router = useRouter();
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);

  return (
    <>
      {/* Desktop Header */}
      <DesktopTopBar activeSection={activeSection} onProfileClick={() => setIsProfilePanelOpen(true)} />

      {/* Mobile Header */}
      <MobileTopBar onProfileClick={() => setIsProfilePanelOpen(true)} />

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
            onClick={() => setIsProfilePanelOpen(true)}
            className={`relative flex flex-1 flex-col items-center gap-1 p-2 rounded-xl transition-colors ${isProfilePanelOpen ? "text-neon-cyan" : "text-muted-foreground"}`}
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

      {/* The spacer that clears this fixed bar lives in Layout, after the page
          content — here it only pushed the page down by 80px. */}

      {/* Profile Panel */}
      <ProfilePanel isOpen={isProfilePanelOpen} onClose={() => setIsProfilePanelOpen(false)} />
    </>
  );
}
