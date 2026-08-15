import { ApplicationsManagementPage } from "@/components/ApplicationsManagementPage";
import Layout from "@/layout";

const Applications = () => {
  return (
    <Layout activeSection={"jobs"}>
      <ApplicationsManagementPage />
    </Layout>
  );
};

export default Applications;
