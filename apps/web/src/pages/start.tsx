"use client";

import { GuestResumeLanding } from "@/components/onboarding/GuestResumeLanding";
import { useAuth } from "@/contexts/AuthContext";
import { homeForAccount, needsOnboarding } from "@/lib/onboarding";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function StartPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || !user) return;
    if (needsOnboarding(user)) {
      router.replace("/onboarding");
      return;
    }
    router.replace(homeForAccount(user));
  }, [isLoading, router, user]);

  if (isLoading || user) return null;
  return <GuestResumeLanding />;
}
