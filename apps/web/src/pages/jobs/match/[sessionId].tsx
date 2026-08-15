"use client";

import { MatchExperience } from "@/components/job/MatchExperience";
import { useGetMatchSessionQuery } from "@/features/api/jobsApi";
import { useRouter } from "next/router";
import Layout from "../../../layout";

export default function MatchSessionPage() {
  const router = useRouter();
  const sessionId = typeof router.query.sessionId === "string" ? router.query.sessionId : undefined;
  const { data: session, isLoading } = useGetMatchSessionQuery(sessionId, { skip: !sessionId });

  return (
    <Layout activeSection="jobs">
      {isLoading || !sessionId ? (
        <p className="p-8 text-white/70">Loading your match…</p>
      ) : !session ? (
        <p className="p-8 text-white/70">This match session was not found.</p>
      ) : (
        <MatchExperience session={session} />
      )}
    </Layout>
  );
}
