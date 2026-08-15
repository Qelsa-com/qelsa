"use client";

import { api } from "@/lib/convexApi";
import { useLazyConvexQueryHook } from "@/lib/convexHooks";

export function useLazySearchCompaniesQuery() {
  const [trigger, state] = useLazyConvexQueryHook(api.seed.companies);
  const run = (search?: string) => trigger({ search: search ?? "" });
  return [run, state] as const;
}
