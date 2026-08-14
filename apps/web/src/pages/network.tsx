import { ComingSoon } from "@/components/ComingSoon";
import Layout from "../layout";

// Not built yet — see the note in qelsa-ai.tsx. NetworkPage is still in src/components.
const Network = () => {
  return (
    <Layout activeSection={"connections"}>
      <ComingSoon />
    </Layout>
  );
};

export default Network;
