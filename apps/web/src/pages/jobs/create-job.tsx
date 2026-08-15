import { JobPostingPage } from "@/components/job/JobPostingPage";
import Layout from "@/layout";

const CreateJob = () => {
  return (
    <Layout activeSection={"jobs"}>
      <JobPostingPage />;
    </Layout>
  );
};

export default CreateJob;
