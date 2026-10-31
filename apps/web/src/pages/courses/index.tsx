import { CoursesCatalog } from "@/components/courses/CoursesCatalog";
import { Seo } from "@/components/Seo";
import Layout from "../../layout";

const Courses = () => {
  return (
    <Layout activeSection="courses">
      <Seo
        title="Learn the skills the role needs"
        description="Courses, interview prep, and practice built around the gaps between your skills and the job you want."
        path="/courses"
      />
      <CoursesCatalog />
    </Layout>
  );
};

export default Courses;
