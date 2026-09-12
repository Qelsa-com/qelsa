import { ForCandidatesPage } from "@/components/ForCandidatesPage";
import Layout from "../layout";

/**
 * /candidates — candidate-facing marketing landing page.
 */
const Candidates = () => {
  return (
    <Layout activeSection="candidates">
      <ForCandidatesPage />
    </Layout>
  );
};

export default Candidates;
