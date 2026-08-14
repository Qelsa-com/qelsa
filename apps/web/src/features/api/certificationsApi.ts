"use client";

import { api } from "@/lib/convexApi";
import { useConvexMutationHook, useConvexQueryHook } from "@/lib/convexHooks";

export function useGetCertificationsQuery(_arg?: void, options?: { skip?: boolean }) {
  return useConvexQueryHook(api.certifications.list, {}, options);
}

export function useCreateCertificationMutation() {
  return useConvexMutationHook(api.certifications.create, (data) => ({ data }));
}

export function useUpdateCertificationMutation() {
  return useConvexMutationHook(
    api.certifications.update,
    ({ id, data }: { id: string | number; data: unknown }) => ({ id: String(id), data }),
  );
}

export function useDeleteCertificationMutation() {
  return useConvexMutationHook(api.certifications.remove, (id: string | number) => ({ id: String(id) }));
}
