"use client";

import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/contexts/AuthContext";
import { needsOnboarding } from "@/lib/onboarding";
import { useRouter } from "next/router";
import { useEffect, useState, type ReactNode } from "react";

const PUBLIC_ROUTES = [
  "/",
  "/start",
  "/login",
  "/register",
  "/auth",
  "/employer/auth",
  "/jobs/all",
  "/jobs",
  "/blogs",
  "/courses",
  "/network",
  "/employers",
  "/candidates",
  "/privacy",
  "/terms",
  "/cookies",
];
const ONBOARDING_EXEMPT = new Set(["/onboarding", "/auth", "/employer/auth", "/privacy", "/terms", "/cookies"]);
const JOB_STATIC = new Set(["all", "posted", "smart-matches", "create-job", "match", "ready", "almost", "smart_matches"]);
const PUBLIC_JOB = /^\/jobs\/([^/]+)$/;
const PUBLIC_PAGE = /^\/pages\/([^/]+)$/;
const PUBLIC_PROFILE = /^\/profile\/([^/]+)$/;
const RESERVED_PROFILE_HANDLES = ["edit", "certifications", "educations", "skills", "work-experience"];

const EMPLOYER_ONLY_PREFIXES = [
  "/employer/agent",
  "/jobs/posted",
  "/jobs/create-job",
  "/jobs/edit/",
  "/jobs/applications",
  "/team",
  "/settings/integrations",
  "/pages/create",
  "/pages/create-page",
];

const CANDIDATE_ONLY_PREFIXES = ["/agent", "/jobs/my-jobs", "/jobs/match", "/goals"];

function isEmployerOnlyPath(path: string) {
  if (path === "/pages") return true;
  if (path.startsWith("/pages/") && (path.endsWith("/edit") || path.endsWith("/manage"))) return true;
  return EMPLOYER_ONLY_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix));
}

function isCandidateOnlyPath(path: string) {
  return CANDIDATE_ONLY_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix));
}

const isPublicPath = (path: string) => {
  if (PUBLIC_ROUTES.includes(path)) return true;

  const jobId = PUBLIC_JOB.exec(path)?.[1];
  if (jobId && !JOB_STATIC.has(jobId) && jobId !== "my-jobs") return true;

  const handle = PUBLIC_PROFILE.exec(path)?.[1];
  if (Boolean(handle) && !RESERVED_PROFILE_HANDLES.includes(handle)) return true;

  const pageId = PUBLIC_PAGE.exec(path)?.[1];
  return Boolean(pageId) && pageId !== "create" && pageId !== "create-page";
};

export default function RouteGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { data: session, isPending } = authClient.useSession();
  const [isClient, setIsClient] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isPending && !isLoading) {
      setHasInitialized(true);
    }
  }, [isPending, isLoading]);

  useEffect(() => {
    if (!isClient || isPending || isLoading || !router.isReady) return;

    const path = router.asPath.split(/[?#]/)[0];
    const isPublic = isPublicPath(path) || router.pathname === "/404";

    if (!session && !isPublic) {
      if (path.startsWith("/courses/") || path === "/pricing") {
        router.replace(`/auth?returnUrl=${encodeURIComponent(router.asPath)}`);
        return;
      }
      router.replace("/");
      return;
    }

    if (user?.account_type && ["/login", "/register"].includes(path)) {
      router.replace("/jobs/all");
      return;
    }

    if (user) {
      const isEmployer = user.account_type === "recruiter";
      const employerHome = user.active_page_id ? `/pages/${user.active_page_id}` : "/pages";

      if (path === "/agent" && isEmployer) {
        router.replace("/employer/agent");
        return;
      }
      if (path.startsWith("/employer/agent") && !isEmployer) {
        router.replace("/agent");
        return;
      }
      if (isEmployerOnlyPath(path) && !isEmployer) {
        router.replace("/");
        return;
      }
      if (isCandidateOnlyPath(path) && isEmployer) {
        router.replace(employerHome);
        return;
      }
    }

    if (session && needsOnboarding(user) && !ONBOARDING_EXEMPT.has(path)) {
      router.replace("/onboarding");
    }
  }, [session, user, isClient, isPending, isLoading, router.isReady, router.asPath, logout, router]);

  const path = router.asPath.split(/[?#]/)[0];
  const isPublic = isPublicPath(path) || router.pathname === "/404";

  // Public pages (including /jobs/[id]) must SSR so crawlers see <Head> OG tags.
  // Returning null on the server previously stripped job link previews.
  if (isClient && !isPublic && !hasInitialized && (isPending || isLoading)) {
    return null;
  }

  return children;
}
