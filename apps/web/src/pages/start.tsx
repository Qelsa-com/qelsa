"use client";

import { GuestResumeLanding } from "@/components/onboarding/GuestResumeLanding";
import { Seo } from "@/components/Seo";
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

  // This is a conversion flow, not a content page. Keep it out of the index
  // until its resume content is server-rendered.
  const seo = (
    <Seo
      title="Check your resume"
      description="Upload your resume and see how your skills match the roles you want."
      path="/start"
      noindex
    />
  );

  if (isLoading || user) return <>{seo}</>;
  return (
    <>
      {seo}
      <GuestResumeLanding />
    </>
  );
}
