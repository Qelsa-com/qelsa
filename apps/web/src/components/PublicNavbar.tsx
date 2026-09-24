"use client";

import { useState } from "react";
import { DesktopTopBar } from "./DesktopTopBar";
import { MobileTopBar } from "./MobileTopBar";
import { ProfileDrawer } from "./ProfileDrawer";

export function PublicNavbar({ activeSection, onProfileClick }: { activeSection?: string; onProfileClick?: () => void }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const openMenu = onProfileClick ?? (() => setIsMenuOpen(true));

  return (
    <>
      <DesktopTopBar activeSection={activeSection} onProfileClick={openMenu} />
      <MobileTopBar onMenuClick={openMenu} />
      {!onProfileClick && <ProfileDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} activeSection={activeSection} />}
    </>
  );
}
