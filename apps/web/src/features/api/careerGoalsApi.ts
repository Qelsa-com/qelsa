"use client";

import { api } from "@/lib/convexApi";
import { useConvexMutationHook, useConvexQueryHook } from "@/lib/convexHooks";
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
      target_role: string;
      dream_companies?: string[];
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
