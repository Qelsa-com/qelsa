import { ForCandidatesPage } from "@/components/ForCandidatesPage";
import { MarketingFooter } from "@/components/MarketingFooter";
import Layout from "../layout";

const Candidates = () => {
  return (
    <Layout activeSection={"candidates"}>
      <ForCandidatesPage />
      <MarketingFooter tagline="Providing precise career direction." />
    </Layout>
  );
};

export default Candidates;
