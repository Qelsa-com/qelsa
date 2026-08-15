"use client";

import { api } from "@/lib/convexApi";
import { useConvexMutationHook, useConvexQueryHook } from "@/lib/convexHooks";

export function useGetJobApplicationsQuery(
  args: { jobId: string; filters?: Record<string, string> } | undefined,
  options?: { skip?: boolean },
) {
  return useConvexQueryHook(
    api.jobApplications.listForJob,
    args ? { jobId: args.jobId, status: args.filters?.status } : undefined,
    { skip: options?.skip || !args?.jobId },
  );
}

export function useGetJobApplicationDetailQuery(
  args: { jobId: string; applicationId: string | number } | undefined,
  options?: { skip?: boolean },
) {
  return useConvexQueryHook(
    api.jobApplications.getDetail,
    args ? { jobId: args.jobId, applicationId: String(args.applicationId) } : undefined,
    { skip: options?.skip || !args?.jobId || args.applicationId == null },
  );
}

export function useCreateJobApplicationMutation() {
  return useConvexMutationHook(
    api.jobApplications.apply,
    (body: { id: string | number; applicationData?: { resume_id?: string | number; answers?: unknown; cover_letter?: string } }) => ({
      jobId: String(body.id),
      resume_id: body.applicationData?.resume_id ? String(body.applicationData.resume_id) : undefined,
      answers: body.applicationData?.answers,
    }),
  );
}

export function useEditBulkStatusMutation() {
  return useConvexMutationHook(
    api.jobApplications.bulkUpdateStatus,
    (data: { applicationIds: Array<string | number>; new_status: string }) => ({
      application_ids: data.applicationIds.map(String),
      new_status: data.new_status,
    }),
  );
}
