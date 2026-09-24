"use client";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { EmployerSidebar } from "@/components/EmployerSidebar";
import { PublicNavbar } from "@/components/PublicNavbar";
import { QelsaLogo } from "@/components/QelsaLogo";
import { useAuth } from "@/contexts/AuthContext";
import { Menu } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { JobFilterSidebar } from "../components/job/JobFilterSidebar";
import { MainNavigation } from "../components/MainNavigation";
import { ProfileDrawer } from "../components/ProfileDrawer";

import { useEmployerSidebar } from "@/lib/employerSidebarState";

interface LayoutProps {
  activeSection?: string;
  children: React.ReactNode;
}

const Layout = ({ activeSection, children }: LayoutProps) => {
  const [showJobFilterSidebar, setShowJobFilterSidebar] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { isCollapsed: isSidebarCollapsed, toggle: handleToggleSidebar } = useEmployerSidebar();
  const { user, isAuthenticated } = useAuth();

  const handleProfileClick = useCallback(() => {
    setShowProfileDrawer(true);
  }, []);

  const handleCloseProfileDrawer = useCallback(() => {
    setShowProfileDrawer(false);
  }, []);

  const isRecruiter = isAuthenticated && user?.account_type === "recruiter";

  return (
    <div className="min-h-screen relative">
      {/* Simplified background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-background via-background to-background">
        {/* Subtle animated elements - reduced complexity */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-neon-cyan/3 rounded-full blur-2xl opacity-50"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-neon-purple/3 rounded-full blur-2xl opacity-50"></div>
      </div>

      {isRecruiter ? (
        <>
          {/* Employer Sidebar (Desktop fixed + Mobile drawer) */}
          <EmployerSidebar
            collapsed={isSidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
            mobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />

          {/* Mobile Recruiter Top Bar (matching Image 1) */}
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/[0.12] bg-[#06060f]/80 px-4 py-3 backdrop-blur-xl lg:hidden">
            <Link
              href={user?.active_page_id ? `/pages/${user.active_page_id}` : "/pages"}
              className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
            >
              <QelsaLogo className="h-[22px] w-auto" />
            </Link>

            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.04] text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
          </header>

          {/* Main content with left margin transition on desktop */}
          <div
            className={`min-h-screen transition-[padding] duration-300 ease-in-out ${
              isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
            }`}
          >
            <ErrorBoundary label="this page">
              {children}
            </ErrorBoundary>
          </div>
        </>
      ) : (
        <>
          {isAuthenticated && user ? (
            <MainNavigation activeSection={activeSection ?? "profile"} onProfileClick={handleProfileClick} />
          ) : (
            <PublicNavbar activeSection={activeSection} onProfileClick={handleProfileClick} />
          )}

          <ErrorBoundary label="this page">{children}</ErrorBoundary>
        </>
      )}

      {/* Job Filter Sidebar */}
      <JobFilterSidebar isOpen={showJobFilterSidebar} />

      {/* Profile Drawer */}
      <ProfileDrawer isOpen={showProfileDrawer} onClose={handleCloseProfileDrawer} activeSection={activeSection} />
    </div>
  );
};

export default Layout;

