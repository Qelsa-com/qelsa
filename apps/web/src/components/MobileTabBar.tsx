"use client";

/**
 * Candidate mobile tab bar.
 *
 * Icon-only by design: the four primary destinations fit in one thumb row while
 * the drawer still carries the full account navigation. The bar follows native
 * app behaviour: it hides as you scroll down, reveals as you scroll up, gets out
 * of the way when a field opens the keyboard, and stays off the Agent screen.
 */

import { BookOpen, BotMessageSquare, Briefcase, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const TABS = [
  { id: "space", label: "My Space", href: "/", icon: Home },
  { id: "jobs", label: "Jobs", href: "/jobs/all", icon: Briefcase },
  { id: "agent", label: "Agent", href: "/agent", icon: BotMessageSquare },
  { id: "courses", label: "Learn & Practice", href: "/courses", icon: BookOpen },
] as const;

const SCROLL_DELTA = 10;
const TOP_REVEAL = 12;

function activeTabForPath(pathname: string | null) {
  if (!pathname) return null;
  if (pathname === "/") return "space";
  if (pathname === "/agent" || pathname.startsWith("/agent/")) return "agent";
  if (pathname.startsWith("/jobs")) return "jobs";
  if (pathname.startsWith("/courses")) return "courses";
  return null;
}

function isEditableElement(element: Element | null) {
  if (!(element instanceof HTMLElement)) return false;
  if (element.isContentEditable || element.getAttribute("role") === "textbox") return true;

  const tag = element.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag !== "INPUT") return false;

  const type = (element as HTMLInputElement).type;
  return !["button", "checkbox", "color", "file", "image", "radio", "range", "reset", "submit"].includes(type);
}

export function MobileTabBar() {
  const pathname = usePathname();
  const [hiddenByScroll, setHiddenByScroll] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const lastScrollY = useRef(0);
  const scrollFrame = useRef<number | null>(null);

  const isAgentScreen = pathname === "/agent" || pathname.startsWith("/agent/");

  // Reset the bar on navigation. A fresh screen should start with its primary
  // navigation visible, even if the previous page was scrolled far down.
  useEffect(() => {
    lastScrollY.current = window.scrollY;
    setHiddenByScroll(false);
  }, [pathname]);

  useEffect(() => {
    const update = () => {
      scrollFrame.current = null;
      const y = Math.max(0, window.scrollY);
      const delta = y - lastScrollY.current;

      if (y <= TOP_REVEAL) {
        setHiddenByScroll(false);
      } else if (delta > SCROLL_DELTA) {
        setHiddenByScroll(true);
      } else if (delta < -SCROLL_DELTA) {
        setHiddenByScroll(false);
      }

      lastScrollY.current = y;
    };

    const onScroll = () => {
      if (scrollFrame.current !== null) return;
      scrollFrame.current = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollFrame.current !== null) window.cancelAnimationFrame(scrollFrame.current);
      scrollFrame.current = null;
    };
  }, [pathname]);

  useEffect(() => {
    let blurTimer: ReturnType<typeof setTimeout> | undefined;
    const visualViewport = window.visualViewport;

    const updateKeyboardState = () => {
      const viewportShrunk = visualViewport ? window.innerHeight - visualViewport.height > 120 : false;
      const editableFocused = isEditableElement(document.activeElement);
      setKeyboardOpen(viewportShrunk || editableFocused);
    };

    const onFocusOut = () => {
      if (blurTimer) clearTimeout(blurTimer);
      blurTimer = setTimeout(updateKeyboardState, 120);
    };

    updateKeyboardState();
    visualViewport?.addEventListener("resize", updateKeyboardState);
    visualViewport?.addEventListener("scroll", updateKeyboardState);
    document.addEventListener("focusin", updateKeyboardState);
    document.addEventListener("focusout", onFocusOut);
    window.addEventListener("orientationchange", updateKeyboardState);

    return () => {
      if (blurTimer) clearTimeout(blurTimer);
      visualViewport?.removeEventListener("resize", updateKeyboardState);
      visualViewport?.removeEventListener("scroll", updateKeyboardState);
      document.removeEventListener("focusin", updateKeyboardState);
      document.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("orientationchange", updateKeyboardState);
    };
  }, []);

  if (isAgentScreen) return null;

  const activeTab = activeTabForPath(pathname);
  const visible = !hiddenByScroll && !keyboardOpen;

  return (
    <nav
      data-testid="mobile-tab-bar"
      data-state={visible ? "visible" : "hidden"}
      aria-label="Primary mobile navigation"
      aria-hidden={!visible}
      className={`fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] z-40 mx-auto max-w-md rounded-full border border-white/[0.08] bg-[#06060f]/60 px-2 py-1.5 shadow-[0_14px_44px_rgba(0,0,0,0.42)] backdrop-blur-2xl transition-[transform,opacity] duration-300 ease-out lg:hidden ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[calc(100%+0.5rem+env(safe-area-inset-bottom))] opacity-0"
      }`}
    >
      <div className="mx-auto grid h-12 w-full max-w-lg grid-cols-4">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-label={tab.label}
              aria-current={active ? "page" : undefined}
              tabIndex={visible ? undefined : -1}
              className="group relative flex touch-manipulation items-center justify-center"
            >
              <span
                className={`relative flex size-10 items-center justify-center rounded-xl transition-all duration-200 ${
                  active
                    ? "bg-white/[0.12] text-white ring-1 ring-white/[0.08]"
                    : "text-white/55 group-hover:bg-white/[0.04] group-hover:text-white/80"
                }`}
              >
                <Icon className="size-[21px]" strokeWidth={active ? 2.3 : 1.8} />
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
