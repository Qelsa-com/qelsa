import { WorkExperienceEditorPage } from "@/components/WorkExperienceEditorPage";
import { WorkExperienceSection } from "@/components/WorkExperienceSection";
import Layout from "@/layout";

const WorkExperience = () => {
  return (
    <Layout activeSection={"profile"}>
      <WorkExperienceEditorPage />
    </Layout>
  );
};

export default WorkExperience;
