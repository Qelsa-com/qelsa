import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { DegreeName } from "../../types/degreeName";
import { FieldOfStudy } from "../../types/fieldOfStudy";
import { Skill, SkillCategory } from "../../types/userSkill";
import { College } from "../../types/education";
import { CertificationCatalog, IssuingBody } from "../../types/certification";
import { CompanySize } from "../../types/page";

export const seedApi = createApi({
  reducerPath: "seedApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/seed",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("accessToken");
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getDegreeNames: builder.query<DegreeName[], void>({
      query: () => "degree-names",
      transformResponse: (response: { success: boolean; data: DegreeName[] }) => response.data,
    }),
    getFieldsOfStudy: builder.query<FieldOfStudy[], void>({
      query: () => "fields-of-study",
      transformResponse: (response: { success: boolean; data: FieldOfStudy[] }) => response.data,
    }),
    getSkills: builder.query<Skill[], string | void>({
      query: (q) => (q ? `skills?search=${encodeURIComponent(q)}` : "skills"),
      transformResponse: (response: { success: boolean; data: Skill[] }) => response.data,
    }),
    getSkillCategories: builder.query<SkillCategory[], void>({
      query: () => "skill-categories",
      transformResponse: (response: { success: boolean; data: SkillCategory[] }) => response.data,
    }),
    getColleges: builder.query<College[], string>({
      query: (search) => `colleges?search=${encodeURIComponent(search)}`,
      transformResponse: (response: { success: boolean; data: College[] }) => response.data,
    }),
    getCertificationCatalog: builder.query<CertificationCatalog[], { search?: string; limit?: number }>({
      query: ({ search = "", limit = 20 }) => `certifications?search=${encodeURIComponent(search)}&limit=${limit}`,
      transformResponse: (response: { success: boolean; data: CertificationCatalog[] }) => response.data,
    }),
    getIssuingBodies: builder.query<IssuingBody[], { search?: string; limit?: number }>({
      query: ({ search = "", limit = 20 }) => `issuing-bodies?search=${encodeURIComponent(search)}&limit=${limit}`,
      transformResponse: (response: { success: boolean; data: IssuingBody[] }) => response.data,
    }),
    getCompanySizes: builder.query<CompanySize[], { search?: string; limit?: number }>({
      query: ({ search = "", limit = 20 }) => `company-sizes?search=${encodeURIComponent(search)}&limit=${limit}`,
      transformResponse: (response: { success: boolean; data: CompanySize[] }) => response.data,
    }),
  }),
});

export const {
  useGetDegreeNamesQuery,
  useGetFieldsOfStudyQuery,
  useGetSkillsQuery,
  useLazyGetSkillsQuery,
  useGetSkillCategoriesQuery,
  useLazyGetCollegesQuery,
  useLazyGetCertificationCatalogQuery,
  useLazyGetIssuingBodiesQuery,
  useLazyGetCompanySizesQuery,
} = seedApi;
