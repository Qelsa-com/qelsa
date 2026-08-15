"use client";

import { ExternalMatchForm } from "@/components/job/ExternalMatchForm";
import Layout from "../../../layout";

export default function MatchEntryPage() {
  return (
    <Layout activeSection="jobs">
      <ExternalMatchForm />
    </Layout>
  );
}
