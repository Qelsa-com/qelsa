import { CoursesCatalog } from "@/components/courses/CoursesCatalog";
import Layout from "../../layout";

const Courses = () => {
  return (
    <Layout activeSection="courses">
      <CoursesCatalog />
    </Layout>
  );
};

export default Courses;
