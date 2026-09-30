import { ApplicationsHub } from "@/components/job/ApplicationsHub";
import { ApplicationsManagementPage } from "@/components/ApplicationsManagementPage";
import Layout from "@/layout";
import { useSearchParams } from "next/navigation";

export default function Applications() {
  const searchParams = useSearchParams();
  const jobId = searchParams?.get("jobId");

  return (
    <Layout activeSection="jobs">
      {jobId ? <ApplicationsManagementPage /> : <ApplicationsHub />}
    </Layout>
  );
}

