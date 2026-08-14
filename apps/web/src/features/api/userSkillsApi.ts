"use client";

import { api } from "@/lib/convexApi";
import { useConvexMutationHook, useConvexQueryHook, useLazyConvexQueryHook } from "@/lib/convexHooks";

export function useGetUserSkillsQuery(_filters?: Record<string, string> | void, options?: { skip?: boolean }) {
  return useConvexQueryHook(api.userSkills.list, {}, options);
}

export function useCreateUserSkillMutation() {
  return useConvexMutationHook(api.userSkills.create, (data) => ({ data }));
}

export function useUpdateUserSkillMutation() {
  return useConvexMutationHook(
    api.userSkills.update,
    ({ id, data }: { id: string | number; data: unknown }) => ({ id: String(id), data }),
  );
}

export function useDeleteUserSkillMutation() {
  return useConvexMutationHook(api.userSkills.remove, (id: string | number) => ({ id: String(id) }));
}

export function useBulkModifyUserSkillsMutation() {
  return useConvexMutationHook(api.userSkills.bulkModify, (skills) => ({ skills }));
}

export function useLazySearchSkillsQuery() {
  const [trigger, state] = useLazyConvexQueryHook(api.seed.skills);
  const run = (search?: string) => trigger({ search: search || undefined });
  return [run, state] as const;
}
