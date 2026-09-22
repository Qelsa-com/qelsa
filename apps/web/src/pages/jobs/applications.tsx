import { ApplicationsManagementPage } from "@/components/ApplicationsManagementPage";
import Layout from "@/layout";

export default function Applications() {
  return (
    <Layout activeSection="jobs">
      <ApplicationsManagementPage />
    </Layout>
  );
}
