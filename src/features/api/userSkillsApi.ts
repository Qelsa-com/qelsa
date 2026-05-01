import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { UserSkill } from "../../types/userSkill";

export const userSkillsApi = createApi({
  reducerPath: "userSkillsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    prepareHeaders: (headers, { getState }) => {
      const token = localStorage.getItem("accessToken");
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["UserSkills"],

  endpoints: (builder) => ({
    getUserSkills: builder.query<UserSkill[], Record<string, string> | void>({
      query: (filters) => {
        const params = new URLSearchParams(filters || {});
        return `user-skills?${params.toString()}`;
      },
      transformResponse: (response: { success: boolean; data: UserSkill[] }) => response.data,
      providesTags: ["UserSkills"],
    }),

    createUserSkill: builder.mutation<{ success: boolean; message: string; data: UserSkill }, Partial<UserSkill>>({
      query: (newUserSkill) => ({
        url: "user-skills",
        method: "POST",
        body: newUserSkill,
      }),
      invalidatesTags: ["UserSkills"],
    }),

    updateUserSkill: builder.mutation<{ success: boolean; message: string; data: UserSkill }, { id: number; data: Partial<UserSkill> }>({
      query: ({ id, data }) => ({
        url: `user-skills/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["UserSkills"],
    }),

    deleteUserSkill: builder.mutation<{ success: boolean; message: string }, number>({
      query: (id) => ({
        url: `user-skills/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["UserSkills"],
    }),

    bulkModifyUserSkills: builder.mutation<{ success: boolean; message: string; data: UserSkill }, UserSkill[]>({
      query: (userSkills) => ({
        url: "user-skills/bulk",
        method: "POST",
        body: userSkills,
      }),
      invalidatesTags: ["UserSkills"],
    }),
  }),
});

export const { useGetUserSkillsQuery, useCreateUserSkillMutation, useUpdateUserSkillMutation, useDeleteUserSkillMutation, useBulkModifyUserSkillsMutation } = userSkillsApi;
