import { DesktopTopBar } from "./DesktopTopBar";
import { MobileTopBar } from "./MobileTopBar";

interface MainNavigationProps {
  activeSection: string;
  onProfileClick?: () => void;
  isPro?: boolean;
  premiumLoading?: boolean;
  scrolled?: boolean;
}

export function MainNavigation({
  activeSection,
  onProfileClick,
  isPro = false,
  premiumLoading = false,
  scrolled = false,
}: MainNavigationProps) {
  return (
    <>
      <DesktopTopBar
        activeSection={activeSection}
        onProfileClick={onProfileClick}
        isPro={isPro}
        premiumLoading={premiumLoading}
        scrolled={scrolled}
      />
      <MobileTopBar
        onMenuClick={onProfileClick}
        isPro={isPro}
        premiumLoading={premiumLoading}
        scrolled={scrolled}
      />
    </>
  );
}
