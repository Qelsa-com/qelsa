"use client";

import { QelsaLogo } from "@/components/QelsaLogo";
import { useAuth } from "@/contexts/AuthContext";
import {
  AppWindow,
  Bell,
  BookOpen,
  Briefcase,
  ChevronsLeft,
  ChevronsRight,
  Cpu,
  LogOut,
  PenLine,
  Target,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useEmployerSidebar } from "@/lib/employerSidebarState";

interface EmployerSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function EmployerSidebar({
  collapsed: controlledCollapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: EmployerSidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [drawerMounted, setDrawerMounted] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    if (mobileOpen) {
      setDrawerMounted(true);
      const frame = requestAnimationFrame(() => setDrawerVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    setDrawerVisible(false);
    const timeout = setTimeout(() => setDrawerMounted(false), 250);
    return () => clearTimeout(timeout);
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseMobile?.();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen, onCloseMobile]);

  const handleSignOut = async () => {
    await logout();
    onCloseMobile?.();
    router.push("/auth");
    toast.success("Signed out successfully");
  };

  const { isCollapsed: hookCollapsed, toggle: hookToggle } = useEmployerSidebar();

  const isCollapsed =
    controlledCollapsed !== undefined ? controlledCollapsed : hookCollapsed;

  const handleToggle = onToggleCollapse || hookToggle;

  const activePageId = user?.active_page_id;
  const mySpaceUrl = activePageId ? `/pages/${activePageId}` : "/pages";

  const userManagementUrl = activePageId ? `/pages/${activePageId}/manage` : "/team";

  const navItems = [
    {
      id: "my-space",
      label: "My Space",
      icon: AppWindow,
      href: mySpaceUrl,
      isActive:
        pathname === "/" ||
        pathname === "/pages" ||
        (pathname.startsWith("/pages/") &&
          !pathname.includes("/manage") &&
          !pathname.includes("/edit")),
    },
    {
      id: "applications",
      label: "Applications",
      icon: Cpu,
      href: "/jobs/applications",
      isActive: pathname.startsWith("/jobs/applications"),
    },
    {
      id: "manage-jobs",
      label: "Manage Jobs",
      icon: Briefcase,
      href: "/jobs/posted",
      isActive:
        pathname.startsWith("/jobs/posted") ||
        pathname === "/jobs/create-job" ||
        pathname.startsWith("/jobs/edit/"),
    },
    {
      id: "user-management",
      label: "User Management",
      icon: Users,
      href: userManagementUrl,
      isActive:
        pathname === "/team" ||
        pathname.includes("/manage"),
    },
    {
      id: "hiring-goals",
      label: "Hiring Goals",
      icon: Target,
      href: "/goals",
      isActive: pathname.startsWith("/goals"),
    },
    {
      id: "integrations",
      label: "Integrations",
      icon: BookOpen,
      href: "/settings/integrations",
      isActive: pathname.startsWith("/settings/integrations"),
    },
    {
      id: "settings",
      label: "Settings",
      icon: PenLine,
      href: "/settings",
      isActive: pathname === "/settings",
    },
  ];

  const sidebarContent = (collapsedState: boolean) => (
    <div className="flex h-full flex-col justify-between">
      {/* Top Section: Brand + Menu */}
      <div className="flex flex-col">
        {/* Brand Header */}
        <div
          className={`flex h-20 items-center ${
            collapsedState ? "justify-center px-0" : "gap-3 px-5"
          }`}
        >
          <Link
            href={mySpaceUrl}
            className="flex items-center gap-3 transition-opacity hover:opacity-90"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-neon-purple to-neon-pink shadow-md">
              <span className="text-base font-extrabold text-white">Q</span>
            </div>
            {!collapsedState && (
              <span className="text-2xl font-bold tracking-tight text-white">
                qelsa
              </span>
            )}
          </Link>
        </div>

        {/* Navigation Items */}
        <nav
          className={`mt-4 flex flex-col gap-2 ${
            collapsedState ? "items-center px-2" : "px-3"
          }`}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.isActive;

            return (
              <Link
                key={item.id}
                href={item.href}
                title={collapsedState ? item.label : undefined}
                aria-label={item.label}
                className={`group flex items-center transition-all ${
                  collapsedState
                    ? "size-11 shrink-0 justify-center rounded-full aspect-square"
                    : "h-11 w-full gap-3.5 px-4 rounded-xl"
                } ${
                  active
                    ? "border border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan font-medium shadow-[0_0_15px_rgba(0,242,254,0.15)]"
                    : "text-white/70 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <Icon
                  className={`size-5 shrink-0 transition-transform group-hover:scale-105 ${
                    active ? "text-neon-cyan" : "text-white/70 group-hover:text-white"
                  }`}
                />
                {!collapsedState && (
                  <span className="truncate text-[15px]">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Collapse Toggle + Notification Bell + Sign Out */}
      <div
        className={`flex flex-col gap-3 pb-6 ${
          collapsedState ? "items-center px-2" : "items-start px-3"
        }`}
      >
        <button
          type="button"
          onClick={handleToggle}
          aria-label={collapsedState ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsedState ? "Expand sidebar" : "Collapse sidebar"}
          className={`flex items-center transition-colors ${
            collapsedState
              ? "size-10 justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.08] hover:text-white"
              : "h-11 w-full justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-white/80 hover:bg-white/[0.08] hover:text-white"
          }`}
        >
          {collapsedState ? (
            <ChevronsRight className="size-4" />
          ) : (
            <>
              <ChevronsLeft className="size-4" />
              <span>Collapse</span>
            </>
          )}
        </button>

        {collapsedState ? (
          <>
            {/* Circular Notification Bell in collapsed */}
            <button
              type="button"
              onClick={() => toast.info("No new notifications")}
              aria-label="Notifications"
              title="Notifications"
              className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              <Bell className="size-4" />
            </button>

            {/* Circular Sign Out button in collapsed */}
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign Out"
              title="Sign Out"
              className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-red-400/80 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut className="size-4" />
            </button>
          </>
        ) : (
          <div className="flex w-full items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
            {/* Circular Notification Bell aligned to left */}
            <button
              type="button"
              onClick={() => toast.info("No new notifications")}
              aria-label="Notifications"
              title="Notifications"
              className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white shrink-0"
            >
              <Bell className="size-4" />
            </button>

            {/* Sign Out Button with icon and text */}
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign Out"
              title="Sign Out"
              className="flex h-10 items-center gap-2 rounded-xl px-3.5 text-xs font-semibold text-red-400/80 transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut className="size-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-40 hidden lg:flex flex-col justify-between border-r border-white/[0.08] bg-[#06060f] transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {sidebarContent(isCollapsed)}
      </aside>

      {/* Mobile drawer — same right-slide overlay as the candidate menu */}
      {drawerMounted && (
        <div
          className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-200 ${
            drawerVisible ? "opacity-100" : "opacity-0"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Account menu"
        >
          <div className="absolute inset-0 bg-[#06060f]" onClick={onCloseMobile} />
          <div
            className={`absolute inset-0 flex flex-col bg-[#06060f] px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] transition-transform duration-250 ease-out ${
              drawerVisible ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between">
              <QelsaLogo className="h-[26px] w-auto" />
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close menu"
                className="flex size-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/[0.06]"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="mt-8 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => onCloseMobile?.()}
                    aria-current={item.isActive ? "page" : undefined}
                    className={`flex items-center gap-4 rounded-full px-3 py-2.5 text-left transition-colors ${
                      item.isActive
                        ? "border border-neon-cyan text-white"
                        : "text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
                      <Icon className="size-4" />
                    </span>
                    <span className="text-[20px] font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-6 border-t border-white/10 pt-5">
              <button
                type="button"
                onClick={() => toast.info("No new notifications")}
                className="flex w-full items-center gap-4 rounded-full px-3 py-2.5 text-left text-white transition-colors hover:bg-white/[0.04]"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
                  <Bell className="size-4" />
                </span>
                <span className="text-[20px] font-medium">Notifications</span>
              </button>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="mt-1 flex w-full items-center gap-4 rounded-full px-3 py-2.5 text-left text-white transition-colors hover:bg-white/[0.04]"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
                  <LogOut className="size-4" />
                </span>
                <span className="text-[20px] font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
