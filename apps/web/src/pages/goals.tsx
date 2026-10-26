import { GoalSettingPage } from "@/components/goals/GoalSettingPage";
import Layout from "@/layout";

const Goals = () => {
  return (
    <Layout activeSection="goals" hideMobileTabBar>
      <GoalSettingPage />
    </Layout>
  );
};

export default Goals;
