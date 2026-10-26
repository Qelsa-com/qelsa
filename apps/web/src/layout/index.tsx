"use client";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { EmployerSidebar } from "@/components/EmployerSidebar";
import { QelsaLogo } from "@/components/QelsaLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useGetMyBillingQuery } from "@/features/api/billingApi";
import type { MyBilling } from "@/types/billing";
import { Menu } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { JobFilterSidebar } from "../components/job/JobFilterSidebar";
import { MainNavigation } from "../components/MainNavigation";
import { MobileTabBar } from "../components/MobileTabBar";
import { ProfileDrawer } from "../components/ProfileDrawer";

import { useEmployerSidebar } from "@/lib/employerSidebarState";
import { useScrolled } from "@/lib/useScrolled";

interface LayoutProps {
  activeSection?: string;
  children: React.ReactNode;
  /** Hide the candidate tab bar on full-screen action flows (job detail, goals). */
  hideMobileTabBar?: boolean;
}

const Layout = ({ activeSection, children, hideMobileTabBar = false }: LayoutProps) => {
  const [showJobFilterSidebar, setShowJobFilterSidebar] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { isCollapsed: isSidebarCollapsed, toggle: handleToggleSidebar } = useEmployerSidebar();
  const { user, isAuthenticated } = useAuth();
  const scrolled = useScrolled();
  const isAgentScreen = activeSection === "agent" && isAuthenticated;

  const handleProfileClick = useCallback(() => {
    setShowProfileDrawer(true);
  }, []);

  const handleCloseProfileDrawer = useCallback(() => {
    setShowProfileDrawer(false);
  }, []);

  const isRecruiter = isAuthenticated && user?.account_type === "recruiter";
  const showMobileTabBar = Boolean(isAuthenticated && !isRecruiter && !isAgentScreen && !hideMobileTabBar);
  const { data: billingData } = useGetMyBillingQuery({
    skip: !isAuthenticated || isRecruiter,
  });
  const billing = billingData as MyBilling | undefined;
  const isPro = Boolean(billing?.is_pro);
  const premiumLoading = isAuthenticated && !isRecruiter && billing === undefined;

  return (
    <div
      className={`min-h-screen relative flex flex-col ${
        isAgentScreen
          ? "max-lg:fixed max-lg:inset-x-0 max-lg:top-[var(--agent-vv-offset,0px)] max-lg:h-[var(--agent-vv-height,100dvh)] max-lg:min-h-0 max-lg:overflow-hidden"
          : ""
      }`}
    >      {/* Simplified background */}
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
          <header
            className={`sticky top-0 z-40 flex items-center justify-between border-b px-4 py-3 backdrop-blur-xl transition-colors duration-300 lg:hidden ${
              scrolled ? "border-white/[0.12] bg-[#06060f]/80" : "border-transparent bg-transparent"
            }`}
          >
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
          <MainNavigation
            activeSection={activeSection ?? (isAuthenticated ? "profile" : "home")}
            onProfileClick={handleProfileClick}
            isPro={isPro}
            premiumLoading={premiumLoading}
            scrolled={scrolled}
          />

          <div className={`flex flex-1 flex-col ${showMobileTabBar ? "max-lg:pb-[calc(4.5rem+env(safe-area-inset-bottom))]" : ""}`}>
            <ErrorBoundary label="this page">{children}</ErrorBoundary>
          </div>
        </>
      )}

      {showMobileTabBar ? <MobileTabBar /> : null}

      {/* Job Filter Sidebar */}
      <JobFilterSidebar isOpen={showJobFilterSidebar} />

      {/* Profile Drawer */}
      <ProfileDrawer isOpen={showProfileDrawer} onClose={handleCloseProfileDrawer} activeSection={activeSection} isPro={isPro} />
    </div>
  );
};

export default Layout;

