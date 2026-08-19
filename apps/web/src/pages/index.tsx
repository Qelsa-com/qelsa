"use client";

import { ProfilePage } from "@/components/profile/ProfilePage";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Layout from "../layout";

export default function App() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || user) return;
    router.replace("/jobs");
  }, [isLoading, router, user]);

  if (isLoading || !user) return null;

  return (
    <Layout activeSection={"profile"}>
      <ProfilePage isOwner />
    </Layout>
  );
}
