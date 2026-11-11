"use client";

import { api } from "@/lib/convexApi";
import { useConvexQueryHook } from "@/lib/convexHooks";

/** Admin-controlled public flags. Missing rows default to off server-side. */
export function useFeatureFlagsQuery() {
  return useConvexQueryHook(api.features.getPublic, {}, { skip: false });
}
