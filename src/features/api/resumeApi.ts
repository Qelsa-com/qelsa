import { Resume } from "@/types/resume";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const resumesApi = createApi({
  reducerPath: "resumesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    prepareHeaders: (headers, { getState }) => {
      const token = localStorage.getItem("accessToken");
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Resumes"],

  endpoints: (builder) => ({
    getMyResumes: builder.query<Resume[], Record<string, string> | void>({
      query: (filters) => {
        const params = new URLSearchParams(filters || {});
        return `/resumes/my-resumes?${params.toString()}`;
      },
      transformResponse: (response: { success: boolean; data: Resume[] }) => response.data,
      providesTags: ["Resumes"],
    }),

    createResume: builder.mutation<{ success: boolean; message: string; data: Resume }, Partial<Resume>>({
      query: (newResume) => ({
        url: "/resumes/upload",
        method: "POST",
        body: newResume,
      }),
      invalidatesTags: ["Resumes"],
    }),
  }),
});

export const { useGetMyResumesQuery, useCreateResumeMutation } = resumesApi;
