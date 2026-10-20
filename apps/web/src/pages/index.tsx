import { LandingPage } from "@/components/LandingPage";
import { MySpaceDashboard } from "@/components/space/MySpaceDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Layout from "../layout";

export default function App() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (user && user.account_type === "recruiter") {
      router.replace(user.active_page_id ? `/pages/${user.active_page_id}` : "/pages");
    }
  }, [isLoading, router, user]);

  if (isLoading) return null;

  if (!isAuthenticated || !user) {
    return <LandingPage />;
  }

  return (
    <Layout activeSection={"space"}>
      <MySpaceDashboard />
    </Layout>
  );
}
