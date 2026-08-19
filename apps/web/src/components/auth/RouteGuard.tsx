"use client";

import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/contexts/AuthContext";
import { needsOnboarding } from "@/lib/onboarding";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const PUBLIC_ROUTES = ["/", "/start", "/login", "/register", "/auth", "/jobs/all", "/jobs", "/qelsa-ai", "/network", "/courses", "/blogs"];
const ONBOARDING_EXEMPT = new Set(["/onboarding", "/auth", "/privacy", "/terms", "/cookies"]);
const JOB_STATIC = new Set(["all", "posted", "smart_matches", "create-job", "match"]);
const PUBLIC_JOB = /^\/jobs\/([^/]+)$/;
const PUBLIC_PROFILE = /^\/profile\/([^/]+)$/;
const RESERVED_PROFILE_HANDLES = ["edit", "certifications", "educations", "skills", "work-experience"];

const isPublicPath = (path: string) => {
  if (PUBLIC_ROUTES.includes(path)) return true;

  const jobId = PUBLIC_JOB.exec(path)?.[1];
  if (jobId && !JOB_STATIC.has(jobId) && jobId !== "my-jobs") return true;

  const handle = PUBLIC_PROFILE.exec(path)?.[1];
  return Boolean(handle) && !RESERVED_PROFILE_HANDLES.includes(handle);
};

export default function RouteGuard({ children }) {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { data: session, isPending } = authClient.useSession();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || isPending || isLoading || !router.isReady) return;

    const path = router.asPath.split(/[?#]/)[0];
    const isPublic = isPublicPath(path) || router.pathname === "/404";

    if (!session && !isPublic) {
      router.replace("/jobs");
      return;
    }

    if (user?.account_type && ["/login", "/register"].includes(path)) {
      router.replace("/jobs/all");
      return;
    }

    if (session && needsOnboarding(user) && !ONBOARDING_EXEMPT.has(path)) {
      router.replace("/onboarding");
    }
  }, [session, user, isClient, isPending, isLoading, router.isReady, router.asPath, logout, router]);

  if (!isClient || isPending || isLoading) return null;

  return children;
}
