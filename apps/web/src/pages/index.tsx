"use client";

import { useEffect, useRef } from "react";
import { OnboardingFlow } from "../components/OnboardingFlow";

import { ProfilePage } from "@/components/profile/ProfilePage";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "../layout";

export default function App() {
  const { user } = useAuth();
  const scrollTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current);
        scrollTimer.current = null;
      }
    };
  }, []);

  if (!user) return null;

  const isFirstTimeUser =
    !user.username ||
    user.username.trim() === "" ||
    (!user.find_job && !user.explore_career && !user.upskill_and_learn && !user.prepare_interview);

  if (isFirstTimeUser) {
    return <OnboardingFlow />;
  }

  return (
    <Layout activeSection={"profile"}>
      <ProfilePage isOwner />
    </Layout>
  );
}
