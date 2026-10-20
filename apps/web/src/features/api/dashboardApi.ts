"use client";

import { api } from "@/lib/convexApi";
import { useConvexQueryHook } from "@/lib/convexHooks";

export type DashboardSummary = {
  savedCount: number;
  applicationCounts: {
    total: number;
    active: number;
    shortlisted: number;
    closed: number;
  };
  latestApplications: {
    id: string;
    status: string;
    appliedAt: number;
    jobId: string | null;
    jobTitle: string | null;
    companyName: string | null;
  }[];
};

export function useGetDashboardSummaryQuery(options?: { skip?: boolean }) {
  return useConvexQueryHook<Record<string, never>, DashboardSummary>(api.dashboard.summary, {}, options);
}
