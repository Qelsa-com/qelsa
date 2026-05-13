import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { JobTitle } from "../../types/jobTitle";

export const jobTitlesApi = createApi({
  reducerPath: "jobTitlesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/seed",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("accessToken");
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    searchJobTitles: builder.query<JobTitle[], string>({
      query: (search) => `job-titles?search=${encodeURIComponent(search)}`,
      transformResponse: (response: { success: boolean; data: JobTitle[] }) => response.data,
    }),
  }),
});

export const { useLazySearchJobTitlesQuery } = jobTitlesApi;
