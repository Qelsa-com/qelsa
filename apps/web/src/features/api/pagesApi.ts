"use client";

import { api } from "@/lib/convexApi";
import { useConvexMutationHook, useConvexQueryHook, useLazyConvexQueryHook } from "@/lib/convexHooks";

export function useGetPagesQuery(filters?: Record<string, string> | void, options?: { skip?: boolean }) {
  return useConvexQueryHook(
    api.pages.list,
    {
      name: (filters && "name" in filters ? filters.name : undefined) || (filters && "search" in filters ? filters.search : undefined),
      industry: filters && "industry" in filters ? filters.industry : undefined,
    },
    options,
  );
}
export function useGetMyPagesQuery(filters?: Record<string, string> | void, options?: { skip?: boolean }) {
  return useConvexQueryHook(api.pages.listMine, { search: filters && "search" in filters ? filters.search : undefined }, options);
}
export function useLazyGetMyPagesQuery() {
  return useLazyConvexQueryHook(api.pages.listMine);
}
export function useGetDiscoverPagesQuery(filters?: Record<string, string> | void, options?: { skip?: boolean }) {
  return useConvexQueryHook(api.pages.listDiscover, {}, options);
}
export function useGetPageByIdQuery(id?: string, options?: { skip?: boolean }) {
  return useConvexQueryHook(api.pages.getById, id ? { id } : undefined, { skip: options?.skip || !id });
}
export function useCreatePageMutation() {
  return useConvexMutationHook(api.pages.create, (data) => ({ data }));
}
export function useUpdatePageMutation() {
  return useConvexMutationHook(api.pages.update, ({ id, data }: { id: string | number; data: unknown }) => ({
    id: String(id),
    data,
  }));
}
