// features/api/jobsApi.ts
import { JobApplication } from "@/types/jobApplication";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Job } from "../../types/job";
import { buildJobQueryParams, JobFilters } from "./utils/buildJobQueryParams";

export const jobsApi = createApi({
  reducerPath: "jobsApi",

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

  tagTypes: ["Jobs", "Job", "Cities", "Types"],

  endpoints: (builder) => ({
    getJobs: builder.query<any, JobFilters | void>({
      query: (filters) => {
        const params = buildJobQueryParams(filters);
        return `jobs?${params.toString()}`;
      },
      transformResponse: (response: any) => response.data,
      providesTags: ["Jobs"],
    }),

    getDiscoverJobs: builder.query<Job[], JobFilters | void>({
      query: (filters) => {
        const params = buildJobQueryParams(filters);
        return `jobs?${params.toString()}`;
      },
      transformResponse: (response: { success: boolean; data: Job[] }) => response.data,
      providesTags: ["Jobs"],
    }),

    getAppliedJobs: builder.query<JobApplication[], { city?: string; search?: string; page_id?: string } | void>({
      query: (filters) => {
        const params = new URLSearchParams();

        if (filters) {
          if (filters.city) params.append("city", filters.city);
          if (filters.search) params.append("search", filters.search);
          if (filters.page_id) params.append("page_id", filters.page_id);
        }

        return `jobs/applied?${params.toString()}`;
      },

      transformResponse: (response: { success: boolean; data: JobApplication[] }) => {
        return response.data;
      },

      providesTags: ["Jobs"],
    }),

    getInProgressJobs: builder.query<Job[], { city?: string; search?: string; page_id?: string } | void>({
      query: (filters) => {
        const params = new URLSearchParams();

        if (filters) {
          if (filters.city) params.append("city", filters.city);
          if (filters.search) params.append("search", filters.search);
          if (filters.page_id) params.append("page_id", filters.page_id);
        }

        return `jobs?${params.toString()}`;
      },

      transformResponse: (response: { success: boolean; data: Job[] }) => {
        return response.data;
      },

      providesTags: ["Jobs"],
    }),

    getPostedJobs: builder.query<Job[], { city?: string; search?: string; page_id?: string } | void>({
      query: (filters) => {
        const params = new URLSearchParams();

        if (filters) {
          if (filters.city) params.append("city", filters.city);
          if (filters.search) params.append("search", filters.search);
          if (filters.page_id) params.append("page_id", filters.page_id);
        }

        return `jobs/posted?${params.toString()}`;
      },

      transformResponse: (response: { success: boolean; data: Job[] }) => {
        return response.data;
      },

      providesTags: ["Jobs"],
    }),

    getSavedJobs: builder.query<Job[], { city?: string; search?: string; page_id?: string } | void>({
      query: (filters) => {
        const params = new URLSearchParams();

        if (filters) {
          if (filters.city) params.append("city", filters.city);
          if (filters.search) params.append("search", filters.search);
          if (filters.page_id) params.append("page_id", filters.page_id);
        }

        return `jobs/saved?${params.toString()}`;
      },

      transformResponse: (response: { success: boolean; data: Job[] }) => {
        return response.data;
      },

      providesTags: ["Jobs"],
    }),

    getJobById: builder.query<Job, string>({
      query: (id) => `jobs/${id}`,
      transformResponse: (response: { success: boolean; data: Job }) => response.data,
      providesTags: (result, error, id) => [{ type: "Job", id }],
    }),

    getCities: builder.query<string[], void>({
      query: () => `jobs/cities`,
      transformResponse: (response: { success: boolean; data: string[] }) => response.data,
      providesTags: ["Cities"],
    }),

    getJobTypes: builder.query<string[], void>({
      query: () => `jobs/types`,
      transformResponse: (response: { success: boolean; data: string[] }) => response.data,
      providesTags: ["Types"],
    }),

    createJob: builder.mutation({
      query: (body) => ({
        url: "jobs/with-questions",
        method: "POST",
        body,
      }),

      transformResponse: (response: { success: boolean; data: Job }) => response.data,

      invalidatesTags: ["Jobs", "Cities", "Types"],
    }),

    toggleSaveJob: builder.mutation({
      query: (jobId) => ({
        url: `jobs/${jobId}/toggle-save`,
        method: "POST",
      }),

      transformResponse: (response: { success: boolean; data: Job }) => response.data,
      invalidatesTags: (result, error, jobId) => [{ type: "Job", id: jobId }, "Jobs"],
    }),
    deleteJob: builder.mutation({
      query: (jobId) => ({
        url: `jobs/${jobId}`,
        method: "DELETE",
      }),

      transformResponse: (response: { success: boolean; data: Job }) => response.data,

      invalidatesTags: ["Jobs", "Cities", "Types"],
    }),
    editJob: builder.mutation({
      query: ({ jobId, body }) => ({
        url: `jobs/${jobId}`,
        method: "PUT",
        body,
      }),

      transformResponse: (response: { success: boolean; data: Job }) => response.data,

      invalidatesTags: (result, error, { jobId }) => [{ type: "Job", id: jobId }, "Jobs"],
    }),
  }),
});

export const {
  useGetJobsQuery,
  useLazyGetJobsQuery,
  useGetDiscoverJobsQuery,
  useLazyGetDiscoverJobsQuery,
  useGetAppliedJobsQuery,
  useLazyGetAppliedJobsQuery,
  useGetInProgressJobsQuery,
  useGetPostedJobsQuery,
  useGetSavedJobsQuery,
  useLazyGetSavedJobsQuery,
  useGetJobByIdQuery,
  useGetCitiesQuery,
  useGetJobTypesQuery,
  useCreateJobMutation,
  useToggleSaveJobMutation,
  useDeleteJobMutation,
  useEditJobMutation,
} = jobsApi;
