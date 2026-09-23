import { DesktopTopBar } from "./DesktopTopBar";
import { MobileTopBar } from "./MobileTopBar";

interface MainNavigationProps {
  activeSection: string;
  onProfileClick?: () => void;
}

export function MainNavigation({ activeSection, onProfileClick }: MainNavigationProps) {
  return (
    <>
      <DesktopTopBar activeSection={activeSection} onProfileClick={onProfileClick} />
      <MobileTopBar onMenuClick={onProfileClick} />
    </>
  );
}
