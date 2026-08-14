"use client";

import { api } from "@/lib/convexApi";
import { useLazyConvexQueryHook } from "@/lib/convexHooks";

export function useLazySearchJobTitlesQuery() {
  const [trigger, state] = useLazyConvexQueryHook(api.seed.jobTitles);
  const run = (search?: string) => trigger({ search: search ?? "" });
  return [run, state] as const;
}
