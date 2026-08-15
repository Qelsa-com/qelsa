"use client";

import { api } from "@/lib/convexApi";
import { useConvexMutationHook, useConvexQueryHook } from "@/lib/convexHooks";

export function useGetExperiencesQuery(_filters?: Record<string, string> | void, options?: { skip?: boolean }) {
  return useConvexQueryHook(api.experiences.list, {}, options);
}

export function useCreateExperienceMutation() {
  return useConvexMutationHook(api.experiences.create, (data) => ({ data }));
}

export function useUpdateExperienceMutation() {
  return useConvexMutationHook(
    api.experiences.update,
    ({ id, data }: { id: string | number; data: unknown }) => ({ id: String(id), data }),
  );
}

export function useDeleteExperienceMutation() {
  return useConvexMutationHook(api.experiences.remove, (id: string | number) => ({ id: String(id) }));
}

export function useUpdateExperiencesPositionMutation() {
  return useConvexMutationHook(
    api.experiences.bulkEdit,
    (items: Array<{ id?: string | number; position?: string | number }>) => ({
      items: items
        .filter((item) => item.id != null)
        .map((item, index) => ({
          id: String(item.id),
          position: Number(item.position) || index,
        })),
    }),
  );
}
