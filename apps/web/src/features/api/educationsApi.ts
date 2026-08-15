"use client";

import { api } from "@/lib/convexApi";
import { useConvexMutationHook, useConvexQueryHook } from "@/lib/convexHooks";

export function useGetEducationsQuery(_filters?: Record<string, string> | void, options?: { skip?: boolean }) {
  return useConvexQueryHook(api.educations.list, {}, options);
}

export function useCreateEducationMutation() {
  return useConvexMutationHook(api.educations.create, (data) => ({ data }));
}

export function useUpdateEducationMutation() {
  return useConvexMutationHook(
    api.educations.update,
    ({ id, data }: { id: string | number; data: unknown }) => ({ id: String(id), data }),
  );
}

export function useDeleteEducationMutation() {
  return useConvexMutationHook(api.educations.remove, (id: string | number) => ({ id: String(id) }));
}

export function useUpdateEducationsPositionMutation() {
  return useConvexMutationHook(api.educations.bulkEdit,     (items: Array<{ id?: string | number; position?: string | number }>) => ({
    items: items
      .filter((item) => item.id != null)
      .map((item, index) => ({
        id: String(item.id),
        position: Number(item.position) || index,
      })),
  }));
}
