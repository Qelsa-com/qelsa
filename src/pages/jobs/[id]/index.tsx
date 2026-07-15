"use client";

import React from "react";
import { JobDetailPageRedesign } from "../../../components/job/JobDetailPageRedesign";
import Layout from "../../../layout";

const JobDetails: React.FC = () => {
  return (
    <Layout activeSection="jobs">
      <JobDetailPageRedesign />
    </Layout>
  );
};

export default JobDetails;
