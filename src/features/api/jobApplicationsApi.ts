// features/api/jobApplicationsApi.ts
import { JobApplication, JobApplicationListItem } from "@/types/jobApplication";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const jobApplicationsApi = createApi({
  reducerPath: "jobApplicationsApi",

  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),

  tagTypes: ["Applications", "Application"],

  endpoints: (builder) => ({
    getJobApplications: builder.query<JobApplicationListItem[], { jobId: string; filters?: Record<string, string> }>({
      query: ({ jobId, filters = {} }) => {
        const params = new URLSearchParams(filters);
        return `jobs/${jobId}/applications?${params.toString()}`;
      },

      transformResponse: (response: { success: boolean; data: JobApplicationListItem[] }) => {
        return response.data;
      },

      providesTags: ["Applications"],
    }),

    // Full payload for a single application. Owner-only: 403 if the caller isn't
    // the job owner, 404 if the application doesn't exist / belong to the job.
    // Side effect on the server: fetching this flips an "applied" row to "viewed",
    // so we optimistically mirror that into the cached list below.
    getJobApplicationDetail: builder.query<JobApplication, { jobId: string; applicationId: number }>({
      query: ({ jobId, applicationId }) => `jobs/${jobId}/applications/${applicationId}`,

      transformResponse: (response: { success: boolean; data: JobApplication }) => response.data,

      async onQueryStarted({ jobId, applicationId }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            jobApplicationsApi.util.updateQueryData("getJobApplications", { jobId }, (draft) => {
              const row = draft.find((a) => a.id === applicationId);
              if (row && row.status === "applied") row.status = "viewed";
            })
          );
        } catch {
          // 403/404 (or network) — nothing to reconcile in the list cache.
        }
      },

      providesTags: (_result, _error, arg) => [{ type: "Application", id: arg.applicationId }],
    }),

    createJobApplication: builder.mutation({
      query: (body) => ({
        url: `jobs/${body.id}/applications`,
        method: "POST",
        body: body.applicationData,
      }),

      // transformResponse: (response: { success: boolean; data: Job }) => response.data,
    }),
    editBulkStatus: builder.mutation({
      query: (data) => ({
        url: `jobs/bulk-update-status`,
        method: "PUT",
        body: {
          application_ids: data.applicationIds,
          new_status: data.new_status,
        },
      }),

      transformResponse: (response: { success: boolean; data: JobApplication[] }) => response.data,
      invalidatesTags: (_result, _error, arg) => ["Applications", ...(arg.applicationIds ?? []).map((id: number) => ({ type: "Application" as const, id }))],
    }),
  }),
});

export const { useGetJobApplicationsQuery, useGetJobApplicationDetailQuery, useCreateJobApplicationMutation, useEditBulkStatusMutation } = jobApplicationsApi;
