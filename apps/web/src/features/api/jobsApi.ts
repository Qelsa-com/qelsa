"use client";

import { useAction } from "convex/react";
import { api } from "@/lib/convexApi";
import { useConvexMutationHook, useConvexQueryHook, useLazyConvexQueryHook } from "@/lib/convexHooks";
import type { JobFilters } from "./utils/buildJobQueryParams";

function jobListArgs(filters?: JobFilters | Record<string, string> | void) {
  if (!filters) return {};
  const record = filters as JobFilters & Record<string, string>;
  return {
    cities: record.cities,
    departments: record.departments,
    job_types: record.job_types,
    workplace_types: record.workplace_types,
    salary_min: typeof record.salary_min === "number" ? record.salary_min : undefined,
    salary_max: typeof record.salary_max === "number" ? record.salary_max : undefined,
    search: record.search,
    sort_by: record.sort_by,
    city: record.city,
    page_id: record.page_id,
  };
}

export function useGetJobsQuery(filters?: JobFilters | void, options?: { skip?: boolean }) {
  return useConvexQueryHook(api.jobs.list, jobListArgs(filters), options);
}
export function useLazyGetJobsQuery() {
  const [trigger, state] = useLazyConvexQueryHook(api.jobs.list);
  const run = (filters?: JobFilters, preferCacheValue?: boolean) => trigger(jobListArgs(filters) as never, preferCacheValue);
  return [run, state] as const;
}
export function useGetDiscoverJobsQuery(filters?: JobFilters | void, options?: { skip?: boolean }) {
  return useConvexQueryHook(api.jobs.list, jobListArgs(filters), options);
}
export function useLazyGetDiscoverJobsQuery() {
  const [trigger, state] = useLazyConvexQueryHook(api.jobs.list);
  const run = (filters?: JobFilters, preferCacheValue?: boolean) => trigger(jobListArgs(filters) as never, preferCacheValue);
  return [run, state] as const;
}
export function useGetAppliedJobsQuery(filters?: Record<string, string> | void, options?: { skip?: boolean }) {
  return useConvexQueryHook(
    api.jobs.listApplied,
    { search: filters && "search" in filters ? filters.search : undefined, status: filters && "status" in filters ? filters.status : undefined },
    options,
  );
}
export function useLazyGetAppliedJobsQuery() {
  const [trigger, state] = useLazyConvexQueryHook(api.jobs.listApplied);
  const run = (filters?: Record<string, string>, preferCacheValue?: boolean) =>
    trigger({ search: filters?.search, status: filters?.status } as never, preferCacheValue);
  return [run, state] as const;
}
export function useGetInProgressJobsQuery(filters?: JobFilters | void, options?: { skip?: boolean }) {
  return useConvexQueryHook(api.jobs.list, jobListArgs(filters), options);
}
export function useLazyGetInProgressJobsQuery() {
  const [trigger, state] = useLazyConvexQueryHook(api.jobs.list);
  const run = (filters?: JobFilters, preferCacheValue?: boolean) => trigger(jobListArgs(filters) as never, preferCacheValue);
  return [run, state] as const;
}
export function useGetPostedJobsQuery(filters?: Record<string, string> | void, options?: { skip?: boolean }) {
  return useConvexQueryHook(api.jobs.listPosted, { search: filters && "search" in filters ? filters.search : undefined, status: filters && "status" in filters ? filters.status : undefined }, options);
}
export function useGetSavedJobsQuery(filters?: Record<string, string> | void, options?: { skip?: boolean }) {
  return useConvexQueryHook(api.jobs.listSaved, { search: filters && "search" in filters ? filters.search : undefined }, options);
}
export function useLazyGetSavedJobsQuery() {
  const [trigger, state] = useLazyConvexQueryHook(api.jobs.listSaved);
  const run = (filters?: Record<string, string>, preferCacheValue?: boolean) =>
    trigger({ search: filters?.search } as never, preferCacheValue);
  return [run, state] as const;
}
export function useGetJobByIdQuery(id?: string, options?: { skip?: boolean }) {
  return useConvexQueryHook(api.jobs.getById, id ? { id } : undefined, { skip: options?.skip || !id });
}
export function useGetSimilarJobsQuery(id?: string, options?: { skip?: boolean }) {
  return useConvexQueryHook(api.jobs.listSimilar, id ? { id } : undefined, { skip: options?.skip || !id });
}
export function useGetCitiesQuery() {
  return useConvexQueryHook(api.jobs.listJobCities, {});
}
export function useGetJobTypesQuery() {
  return useConvexQueryHook(api.jobs.listJobTypes, {});
}
export function useCreateJobMutation() {
  return useConvexMutationHook(api.jobs.createWithQuestions, (payload) => ({ payload }));
}
export function useGenerateJobDraftAction() {
  return useAction(api.jobsGenerate.generateDraft);
}
export function useToggleSaveJobMutation() {
  return useConvexMutationHook(api.jobs.toggleSave, (jobId: string | number) => ({ jobId: String(jobId) }));
}
export function useRecordJobViewMutation() {
  return useConvexMutationHook(api.jobs.recordView, (jobId: string | number) => ({ jobId: String(jobId) }));
}
export function useDeleteJobMutation() {
  return useConvexMutationHook(api.jobs.remove, (jobId: string | number) => ({ jobId: String(jobId) }));
}
export function useEditJobMutation() {
  return useConvexMutationHook(api.jobs.update, ({ jobId, body }: { jobId: string | number; body: unknown }) => ({
    jobId: String(jobId),
    data: body,
  }));
}
