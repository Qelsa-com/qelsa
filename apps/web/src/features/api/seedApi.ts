"use client";

import { api } from "@/lib/convexApi";
import { useConvexQueryHook, useLazyConvexQueryHook } from "@/lib/convexHooks";

export function useGetDegreeNamesQuery(_arg?: void, options?: { skip?: boolean }) {
  return useConvexQueryHook(api.seed.degreeNames, {}, options);
}

export function useGetFieldsOfStudyQuery(_arg?: void, options?: { skip?: boolean }) {
  return useConvexQueryHook(api.seed.fieldsOfStudy, {}, options);
}

export function useGetSkillsQuery(search?: string | void, options?: { skip?: boolean }) {
  return useConvexQueryHook(api.seed.skills, { search: search || undefined }, options);
}

export function useLazyGetSkillsQuery() {
  const [trigger, state] = useLazyConvexQueryHook(api.seed.skills);
  const run = (search?: string) => trigger({ search: search || undefined });
  return [run, state] as const;
}

export function useGetSkillCategoriesQuery(_arg?: void, options?: { skip?: boolean }) {
  return useConvexQueryHook(api.seed.skillCategories, {}, options);
}

export function useLazyGetCollegesQuery() {
  const [trigger, state] = useLazyConvexQueryHook(api.seed.colleges);
  const run = (search?: string) => trigger({ search: search ?? "" });
  return [run, state] as const;
}

export function useLazyGetCertificationCatalogQuery() {
  const [trigger, state] = useLazyConvexQueryHook(api.seed.certifications);
  const run = (args?: { search?: string; limit?: number }) => trigger(args ?? {});
  return [run, state] as const;
}

export function useLazyGetIssuingBodiesQuery() {
  const [trigger, state] = useLazyConvexQueryHook(api.seed.issuingBodies);
  const run = (args?: { search?: string; limit?: number }) => trigger(args ?? {});
  return [run, state] as const;
}

export function useLazyGetCompanySizesQuery() {
  const [trigger, state] = useLazyConvexQueryHook(api.seed.companySizes);
  const run = (args?: { search?: string; limit?: number }) => trigger({ search: args?.search });
  return [run, state] as const;
}

export function useGetStatesQuery(search?: string | void, options?: { skip?: boolean }) {
  return useConvexQueryHook(api.seed.states, { search: search || undefined }, options);
}

export function useLazySearchCitiesQuery() {
  const [trigger, state] = useLazyConvexQueryHook(api.seed.cities);
  const run = (search?: string) => trigger({ search: search ?? "" });
  return [run, state] as const;
}
