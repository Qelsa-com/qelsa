import { ForCandidatesPage } from "@/components/ForCandidatesPage";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Layout from "../layout";

/**
 * /candidates — candidate-facing marketing landing page.
 */
const Candidates = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    router.replace(user?.account_type === "recruiter" ? (user.active_page_id ? `/pages/${user.active_page_id}` : "/pages") : "/");
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || isAuthenticated) return null;

  return (
    <Layout activeSection="candidates">
      <ForCandidatesPage />
    </Layout>
  );
};

export default Candidates;
