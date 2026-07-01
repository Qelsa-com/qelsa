"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useGetProfileQuery } from "@/features/api/authApi";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const PUBLIC_ROUTES = ["/login", "/register", "/auth", "/jobs/all", "/jobs"];
const PUBLIC_DYNAMIC = /^\/jobs\/\d+$/;

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

    const isPublic = PUBLIC_ROUTES.includes(path) || PUBLIC_DYNAMIC.test(path);

    // ⭐ CASE 1 — No token and protected route
    if (!token && !isPublic) {
      router.replace("/jobs");
      return;
    }

    // ⭐ CASE 2 — Token exists but 401 (expired + refresh failed)
    if (error) {
      logout();
      router.replace("/jobs");
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
