import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AtsIntegrationsPage from "../../components/settings/ats/AtsIntegrationsPage";
import Layout from "../../layout";

const IntegrationsSettings = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace("/auth?returnUrl=/settings/integrations");
      } else if (user.account_type !== "recruiter" && user.role !== "admin") {
        router.replace("/settings");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || (user.account_type !== "recruiter" && user.role !== "admin")) {
    return null;
  }

  return (
    <Layout activeSection="profile">
      <AtsIntegrationsPage />
    </Layout>
  );
};

export default IntegrationsSettings;
