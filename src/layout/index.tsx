"use client";

import { PublicNavbar } from "@/components/PublicNavbar";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { JobFilterSidebar } from "../components/job/JobFilterSidebar";
import { MainNavigation } from "../components/MainNavigation";
import { ProfileDrawer } from "../components/ProfileDrawer";

const Layout = ({ activeSection, children }) => {
  const [showQelsaNavigation, setShowQelsaNavigation] = useState(false);
  const [showJobFilterSidebar, setShowJobFilterSidebar] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && (!user.username || user.username.trim() === "" || (!user.find_job && !user.explore_career && !user.upskill_and_learn && !user.prepare_interview))) {
      router.push("/");
    }
  }, [router, user]);

  const handleProfileClick = useCallback(() => {
    setShowProfileDrawer(true);
  }, []);

  const handleCloseProfileDrawer = useCallback(() => {
    setShowProfileDrawer(false);
  }, []);

  return (
    <div className="min-h-screen relative">
      {/* Simplified background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-background via-background to-background">
        {/* Subtle animated elements - reduced complexity */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-neon-cyan/3 rounded-full blur-2xl opacity-50"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-neon-purple/3 rounded-full blur-2xl opacity-50"></div>
      </div>

      {isAuthenticated && user ? <MainNavigation activeSection={activeSection} onProfileClick={handleProfileClick} /> : <PublicNavbar />}

      {/* Main content with conditional spacing */}
      {/* <div className={activeSection === "qelsa-ai" ? "lg:pt-20" : "pb-20 lg:pb-0"}>{renderCurrentSection()}</div> */}

      {children}

      {/* Clears the fixed mobile tab bar both navbars render, so the last thing
          on the page isn't sitting under it. */}
      <div className="h-20 lg:hidden" aria-hidden="true" />

      {/* Job Filter Sidebar */}
      <JobFilterSidebar isOpen={showJobFilterSidebar} />

      {/* Profile Drawer */}
      <ProfileDrawer isOpen={showProfileDrawer} onClose={handleCloseProfileDrawer} />
    </div>
  );
};

export default Layout;
