"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useGetProfileQuery } from "@/features/api/authApi";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

// The last four are the Coming Soon screens behind nav links that aren't built
// yet — static, no session needed, and the top bar shows them signed out too.
const PUBLIC_ROUTES = ["/login", "/register", "/auth", "/jobs/all", "/jobs", "/qelsa-ai", "/network", "/courses", "/blogs"];
const PUBLIC_DYNAMIC = /^\/jobs\/\d+$/;

// /profile/<handle> is the read-only profile and needs no session. The owner's
// editors live at the same depth, so those handles are reserved and stay gated.
const PUBLIC_PROFILE = /^\/profile\/([^/]+)$/;
const RESERVED_PROFILE_HANDLES = ["edit", "certifications", "educations", "skills", "work-experience"];

const isPublicPath = (path) => {
  if (PUBLIC_ROUTES.includes(path) || PUBLIC_DYNAMIC.test(path)) return true;

  const handle = PUBLIC_PROFILE.exec(path)?.[1];
  return Boolean(handle) && !RESERVED_PROFILE_HANDLES.includes(handle);
};

export default function RouteGuard({ children }) {
  const router = useRouter();
  const { setUserProfile, logout, isAuthenticated } = useAuth();

  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const [isClient, setIsClient] = useState(false);

  const { data: profile, error, isFetching } = useGetProfileQuery(undefined, { skip: !token });

  useEffect(() => {
    setIsClient(true);
  }, []);

  // When profile loads → set user in AuthContext
  useEffect(() => {
    if (profile) {
      setUserProfile(profile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  useEffect(() => {
    // Wait for the router to resolve. On a hard refresh of a statically-optimized
    // dynamic route, asPath is initially the unresolved pattern until isReady, so
    // evaluating the guard early would misclassify e.g. /jobs/123 as non-public.
    if (!isClient || isFetching || !router.isReady) return;

    // Use the resolved URL (asPath), not router.pathname — for dynamic routes
    // pathname is the pattern (e.g. "/jobs/[id]"), which never matches the
    // numeric PUBLIC_DYNAMIC regex and would wrongly gate public job pages.
    const path = router.asPath.split(/[?#]/)[0];

    // An unmatched URL renders /404, where asPath is the bad path and so never
    // matches a public route — without this, a signed-out visitor typing a wrong
    // URL is bounced to /jobs instead of seeing the 404 page.
    const isPublic = isPublicPath(path) || router.pathname === "/404";

    // ⭐ CASE 1 — No token and protected route
    if (!token && !isPublic) {
      router.replace("/jobs");
      return;
    }

    // ⭐ CASE 2 — Token exists but 401 (expired + refresh failed).
    // Drop the dead session either way, but only bounce off the page when it
    // actually needs one — a stale token shouldn't eject a reader from a public
    // profile or job listing.
    if (error) {
      logout();
      if (!isPublic) router.replace("/jobs");
      return;
    }

    // ⭐ CASE 3 — Logged in user visiting login/register
    if (profile && ["/login", "/register", "/auth"].includes(path)) {
      router.replace("/jobs/all");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isClient, isFetching, error, profile, router.isReady, router.asPath]);

  if (!isClient || isFetching) return null;

  return children;
}
