import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Company } from "../../types/company";

export const companiesApi = createApi({
  reducerPath: "companiesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/seed",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("accessToken");
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    searchCompanies: builder.query<Company[], string>({
      query: (search) => `companies?search=${encodeURIComponent(search)}`,
      transformResponse: (response: { success: boolean; data: Company[] }) => response.data,
    }),
  }),
});

export const { useLazySearchCompaniesQuery } = companiesApi;
