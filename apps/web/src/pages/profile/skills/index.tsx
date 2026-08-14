import { SkillsEditor } from "@/components/SkillsEditor";
import { SkillsViewPage } from "@/components/SkillsViewPage";
import Layout from "@/layout";

const Skills = () => {
  return (
    <Layout activeSection={"profile"}>
      <SkillsViewPage />
    </Layout>
  );
};

export default Skills;
