import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Certification, CertificationPayload } from "../../types/certification";

export const certificationsApi = createApi({
  reducerPath: "certificationsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("accessToken");
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Certifications"],

  endpoints: (builder) => ({
    getCertifications: builder.query<Certification[], void>({
      query: () => "certifications",
      transformResponse: (response: { success: boolean; data: Certification[] }) => response.data,
      providesTags: ["Certifications"],
    }),

    createCertification: builder.mutation<{ success: boolean; message: string; data: Certification }, CertificationPayload>({
      query: (body) => ({
        url: "certifications",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Certifications"],
    }),

    updateCertification: builder.mutation<{ success: boolean; message: string; data: Certification }, { id: number; data: CertificationPayload }>({
      query: ({ id, data }) => ({
        url: `certifications/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Certifications"],
    }),

    deleteCertification: builder.mutation<{ success: boolean; message: string }, number>({
      query: (id) => ({
        url: `certifications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Certifications"],
    }),
  }),
});

export const { useGetCertificationsQuery, useCreateCertificationMutation, useUpdateCertificationMutation, useDeleteCertificationMutation } = certificationsApi;
