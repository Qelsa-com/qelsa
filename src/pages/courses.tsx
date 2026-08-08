import { ComingSoon } from "@/components/ComingSoon";
import Layout from "../layout";

// Not built yet — see the note in qelsa-ai.tsx. CoursesPage is still in src/components.
const Courses = () => {
  return (
    <Layout activeSection={"courses"}>
      <ComingSoon />
    </Layout>
  );
};

export default Courses;
