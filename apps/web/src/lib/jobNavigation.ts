import { useRouter } from "next/router";
import { useEffect } from "react";

export const STORAGE_KEY_LAST_JOBS_PAGE = "qelsa_last_jobs_page";
export const STORAGE_KEY_LAST_JOBS_FEED = "qelsa_last_jobs_feed";

/**
 * Checks if a given path is a jobs listing / browse / management page.
 */
export function isJobsListingRoute(path: string): boolean {
  const pathname = path.split("?")[0].split("#")[0];
  return (
    pathname === "/jobs/all" ||
    pathname === "/jobs/smart-matches" ||
    pathname === "/jobs/my-jobs" ||
    pathname.startsWith("/jobs/my-jobs/") ||
    pathname === "/jobs/almost" ||
    pathname === "/jobs/ready" ||
    pathname === "/jobs/posted"
  );
}

/**
 * Checks if a given path is a primary browse feed (excluding my-jobs / posted).
 */
export function isJobsFeedRoute(path: string): boolean {
  const pathname = path.split("?")[0].split("#")[0];
  return (
    pathname === "/jobs/all" ||
    pathname === "/jobs/smart-matches" ||
    pathname === "/jobs/almost" ||
    pathname === "/jobs/ready"
  );
}

/**
 * Persists the current job route in sessionStorage so back navigation can
 * accurately fall back to the user's specific originating page.
 */
export function recordJobsNavigation(path: string): void {
  if (typeof window === "undefined") return;
  try {
    if (isJobsListingRoute(path)) {
      sessionStorage.setItem(STORAGE_KEY_LAST_JOBS_PAGE, path);
    }
    if (isJobsFeedRoute(path)) {
      sessionStorage.setItem(STORAGE_KEY_LAST_JOBS_FEED, path);
    }
  } catch {
    // Ignore sessionStorage quota or security exceptions (e.g. sandboxed iframes)
  }
}

/**
 * Returns the last visited jobs page URL (with query params intact), or null.
 */
export function getLastJobsPage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(STORAGE_KEY_LAST_JOBS_PAGE);
  } catch {
    return null;
  }
}

/**
 * Returns the last visited primary jobs feed URL (/jobs/all or /jobs/smart-matches), or null.
 */
export function getLastJobsFeed(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(STORAGE_KEY_LAST_JOBS_FEED);
  } catch {
    return null;
  }
}

/**
 * Determines whether the browser has in-app history to safely call router.back().
 */
export function canGoBack(): boolean {
  if (typeof window === "undefined") return false;
  const state = window.history.state as { idx?: number } | null;
  if (typeof state?.idx === "number" && state.idx > 0) {
    return true;
  }
  if (
    typeof document !== "undefined" &&
    document.referrer &&
    document.referrer.startsWith(window.location.origin) &&
    window.history.length > 1
  ) {
    return true;
  }
  return false;
}

export type NavRouter = {
  back: () => void;
  push: (url: string) => Promise<boolean> | void;
};

/**
 * Context-aware back navigation for job details and action pages.
 * If in-app history exists, uses router.back() to preserve filters, search, and scroll.
 * Otherwise falls back to the specified fallbackUrl, last visited jobs page, or "/jobs/all".
 */
export function goBackJobs(router: NavRouter, fallbackUrl?: string): void {
  if (canGoBack()) {
    router.back();
    return;
  }
  const target = fallbackUrl || getLastJobsPage() || "/jobs/all";
  router.push(target);
}

/**
 * Exit navigation for "My Jobs" screens back to the primary browse feed.
 * Directs the user back to where they entered from (/jobs/smart-matches or /jobs/all).
 */
export function navigateBackFromMyJobs(router: NavRouter, fallbackUrl?: string): void {
  const target = fallbackUrl || getLastJobsFeed() || "/jobs/all";
  router.push(target);
}

/**
 * Hook to automatically track visited job routes in _app.js.
 */
export function useJobNavigationTracker(): void {
  const router = useRouter();

  useEffect(() => {
    if (router.asPath) {
      recordJobsNavigation(router.asPath);
    }
  }, [router.asPath]);
}
