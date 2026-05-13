import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Experience } from "../../types/experience";

export const experiencesApi = createApi({
  reducerPath: "experiencesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    prepareHeaders: (headers, { getState }) => {
      const token = localStorage.getItem("accessToken");
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Experiences"],

  endpoints: (builder) => ({
    getExperiences: builder.query<Experience[], Record<string, string> | void>({
      query: (filters) => {
        const params = new URLSearchParams(filters || {});
        return `experiences?${params.toString()}`;
      },
      transformResponse: (response: { success: boolean; data: Experience[] }) => response.data,
      providesTags: ["Experiences"],
    }),

    createExperience: builder.mutation<{ success: boolean; message: string; data: Experience }, Partial<Experience>>({
      query: (newExperience) => ({
        url: "experiences",
        method: "POST",
        body: newExperience,
      }),
      invalidatesTags: ["Experiences"],
    }),

    updateExperience: builder.mutation<{ success: boolean; message: string; data: Experience }, { id: number; data: Partial<Experience> }>({
      query: ({ id, data }) => ({
        url: `experiences/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Experiences"],
    }),

    deleteExperience: builder.mutation<{ success: boolean; message: string }, number>({
      query: (id) => ({
        url: `experiences/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Experiences"],
    }),

    updateExperiencesPosition: builder.mutation<{ success: boolean; message: string }, any>({
      query: (data) => ({
        url: `experiences/bulk-edit`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Experiences"],
    }),
  }),
});

export const {
  useGetExperiencesQuery,
  useCreateExperienceMutation,
  useUpdateExperienceMutation,
  useDeleteExperienceMutation,
  useUpdateExperiencesPositionMutation,
} = experiencesApi;
