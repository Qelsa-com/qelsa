"use client";

import { api } from "@/lib/convexApi";
import { useConvexMutationHook, useConvexQueryHook, useLazyConvexQueryHook } from "@/lib/convexHooks";
import type { CareerGoal, ExtractedCareerGoal } from "@/types/careerGoal";
import { useAction } from "convex/react";

export function useGetMyCareerGoalQuery(options?: { skip?: boolean }) {
  return useConvexQueryHook(api.careerGoals.getMine, {}, options);
}

export function useUpsertCareerGoalMutation() {
  return useConvexMutationHook(
    api.careerGoals.upsert,
    (input: {
      description?: string;
      target_role?: string;
      target_roles?: string[];
      dream_companies?: string[];
      industries?: string[];
      timeline?: CareerGoal["timeline"];
      experience_level?: CareerGoal["experience_level"];
      skills?: string[];
      primary_focus?: CareerGoal["primary_focus"];
    }) => input,
  );
}

export function useExtractCareerGoalAction() {
  return useAction(api.careerGoalsGenerate.extractFromText) as (args: { description: string }) => Promise<ExtractedCareerGoal>;
}

export function useLazySearchIndustriesQuery() {
  const [trigger, state] = useLazyConvexQueryHook(api.seed.industries);
  const run = (search?: string) => trigger({ search: search ?? "" });
  return [run, state] as const;
}
