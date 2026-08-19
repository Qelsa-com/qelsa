"use client";

import { GuestResumeLanding } from "@/components/onboarding/GuestResumeLanding";
import { ProfilePage } from "@/components/profile/ProfilePage";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useRef } from "react";
import Layout from "../layout";

export default function App() {
  const { user, isLoading } = useAuth();
  const scrollTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current);
        scrollTimer.current = null;
      }
    };
  }, []);

  if (isLoading) return null;
  if (!user) return <GuestResumeLanding />;

  return (
    <Layout activeSection={"profile"}>
      <ProfilePage isOwner />
    </Layout>
  );
}
