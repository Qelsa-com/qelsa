"use client";

import { ExternalMatchForm } from "@/components/job/ExternalMatchForm";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Layout from "../../../layout";

export default function MatchEntryPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/auth?actionType=profile&returnUrl=${encodeURIComponent("/jobs/match")}`);
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <Layout activeSection="jobs">
      {isAuthenticated ? <ExternalMatchForm /> : null}
    </Layout>
  );
}
