"use client";

import JobDetail from "@/components/job/JobDetail";
import React from "react";
import Layout from "../../../layout";

const JobDetails: React.FC = () => {
  return (
    <Layout activeSection="jobs">
      <JobDetail />
    </Layout>
  );
};

export default JobDetails;
