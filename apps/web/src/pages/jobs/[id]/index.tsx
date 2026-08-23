import JobDetail from "@/components/job/JobDetail";
import type { GetServerSideProps } from "next";
import Layout from "../../../layout";

/** Deleted slug — do not treat it as a job id. */
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  if (ctx.params?.id === "smart_matches") {
    return { notFound: true };
  }
  return { props: {} };
};

export default function JobDetails() {
  return (
    <Layout activeSection="jobs">
      <JobDetail />
    </Layout>
  );
}
