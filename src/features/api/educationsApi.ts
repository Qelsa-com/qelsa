import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Education } from "../../types/education";

export const educationsApi = createApi({
  reducerPath: "educationsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    prepareHeaders: (headers, { getState }) => {
      const token = localStorage.getItem("accessToken");
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Educations"],

  endpoints: (builder) => ({
    getEducations: builder.query<Education[], Record<string, string> | void>({
      query: (filters) => {
        const params = new URLSearchParams(filters || {});
        return `educations?${params.toString()}`;
      },
      transformResponse: (response: { success: boolean; data: Education[] }) => response.data,
      providesTags: ["Educations"],
    }),

    createEducation: builder.mutation<{ success: boolean; message: string; data: Education }, Partial<Education>>({
      query: (newEducation) => ({
        url: "educations",
        method: "POST",
        body: newEducation,
      }),
      invalidatesTags: ["Educations"],
    }),

    updateEducation: builder.mutation<{ success: boolean; message: string; data: Education }, { id: number; data: Partial<Education> }>({
      query: ({ id, data }) => ({
        url: `educations/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Educations"],
    }),

    deleteEducation: builder.mutation<{ success: boolean; message: string }, number>({
      query: (id) => ({
        url: `educations/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Educations"],
    }),

    updateEducationsPosition: builder.mutation<{ success: boolean; message: string }, any>({
      query: (data) => ({
        url: `educations/bulk-edit`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Educations"],
    }),

  }),
});

export const { useGetEducationsQuery, useCreateEducationMutation, useUpdateEducationMutation, useDeleteEducationMutation, useUpdateEducationsPositionMutation } = educationsApi;
