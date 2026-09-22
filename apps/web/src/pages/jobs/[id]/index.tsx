import JobDetail from "@/components/job/JobDetail";
import type { GetServerSideProps } from "next";
import Layout from "../../../layout";

import { RESERVED_JOB_SLUGS } from "@/features/api/jobsApi";

/** Reserved slugs — do not treat them as a job id. */
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const id = ctx.params?.id;
  if (typeof id === "string" && RESERVED_JOB_SLUGS.has(id)) {
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
