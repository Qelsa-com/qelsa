import { ComingSoon } from "@/components/ComingSoon";
import Layout from "../layout";

// Not built yet — see the note in qelsa-ai.tsx. BlogPlatform is still in src/components.
const Blogs = () => {
  return (
    <Layout activeSection={"blog"}>
      <ComingSoon />
    </Layout>
  );
};

export default Blogs;
