import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Page } from "../../types/page";

export const pagesApi = createApi({
  reducerPath: "pagesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    prepareHeaders: (headers, { getState }) => {
      const token = localStorage.getItem("accessToken");
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Pages"],

  endpoints: (builder) => ({
    getPages: builder.query<Page[], Record<string, string> | void>({
      query: (filters) => {
        const params = new URLSearchParams(filters || {});
        return `pages?${params.toString()}`;
      },
      transformResponse: (response: { success: boolean; data: Page[] }) => response.data,
      providesTags: ["Pages"],
    }),

    getMyPages: builder.query<Page[], Record<string, string> | void>({
      query: (filters) => {
        const params = new URLSearchParams(filters || {});
        return `pages/my?${params.toString()}`;
      },
      transformResponse: (response: { success: boolean; data: Page[] }) => response.data,
      providesTags: ["Pages"],
    }),

    getDiscoverPages: builder.query<Page[], Record<string, string> | void>({
      query: (filters) => {
        const params = new URLSearchParams(filters || {});
        return `pages/discover?${params.toString()}`;
      },
      transformResponse: (response: { success: boolean; data: Page[] }) => response.data,
      providesTags: ["Pages"],
    }),

    getPageById: builder.query<Page, string>({
      query: (id) => `pages/${id}`,
      transformResponse: (response: { success: boolean; data: Page }) => response.data,
      providesTags: ["Pages"],
    }),

    createPage: builder.mutation<{ success: boolean; message: string; data: Page }, Partial<Page>>({
      query: (newPage) => ({
        url: "pages",
        method: "POST",
        body: newPage,
      }),
      invalidatesTags: ["Pages"],
    }),

    updatePage: builder.mutation<{ success: boolean; message: string; data: Page }, { id: number; data: Partial<Page> }>({
      query: ({ id, data }) => ({
        url: `pages/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Pages"],
    }),
  }),
});

export const { useGetPagesQuery, useGetMyPagesQuery, useGetDiscoverPagesQuery, useGetPageByIdQuery, useCreatePageMutation, useUpdatePageMutation } = pagesApi;
