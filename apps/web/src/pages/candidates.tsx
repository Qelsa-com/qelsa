import { ForCandidatesPage } from "@/components/ForCandidatesPage";
import { Seo } from "@/components/Seo";
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

  // Render the marketing page while the session resolves so crawlers get the
  // content and metadata in the server-rendered HTML.
  if (!isLoading && isAuthenticated) return null;

  return (
    <Layout activeSection="candidates">
      <Seo
        title="Know where you fit before you apply"
        description="A readiness score for every job, the gaps to close, and the next step. Free to start."
        path="/candidates"
      />
      <ForCandidatesPage />
    </Layout>
  );
};

export default Candidates;
