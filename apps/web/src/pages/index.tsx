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
    if (isLoading) return;
    if (!user) {
      router.replace("/jobs");
      return;
    }
    if (user.account_type === "recruiter") {
      router.replace(user.active_page_id ? `/pages/${user.active_page_id}` : "/pages");
    }
  }, [isLoading, router, user]);

  if (isLoading || !user || user.account_type === "recruiter") return null;

  return (
    <Layout activeSection={"profile"}>
      <ProfilePage isOwner />
    </Layout>
  );
}
