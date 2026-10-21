import { DesktopTopBar } from "./DesktopTopBar";
import { MobileTopBar } from "./MobileTopBar";

interface MainNavigationProps {
  activeSection: string;
  onProfileClick?: () => void;
  isPro?: boolean;
  premiumLoading?: boolean;
}

export function MainNavigation({ activeSection, onProfileClick, isPro = false, premiumLoading = false }: MainNavigationProps) {
  return (
    <>
      <DesktopTopBar
        activeSection={activeSection}
        onProfileClick={onProfileClick}
        isPro={isPro}
        premiumLoading={premiumLoading}
      />
      <MobileTopBar
        onMenuClick={onProfileClick}
        isPro={isPro}
        premiumLoading={premiumLoading}
      />
    </>
  );
}
