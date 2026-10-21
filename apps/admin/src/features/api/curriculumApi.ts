"use client";

import { api } from "@/lib/convexApi";
import { useConvexMutationHook, useConvexQueryHook, withUnwrap } from "@/lib/convexHooks";
import { useAction } from "convex/react";
import { useState } from "react";

export type CurriculumRun = {
  id: string;
  status: "running" | "completed" | "failed";
  trigger: string;
  started_at: number;
  completed_at: number | null;
  model: string;
  tracks_created: number;
  tracks_published: number;
  error: string | null;
  decisions: Array<Record<string, unknown>>;
};

export type CurriculumTrack = {
  id: string;
  slug: string;
  title: string;
  role_family: string;
  level: string;
  status: "draft" | "published" | "archived";
  question_count: number;
  quality_score: number;
  quality_flags: string[];
  demand_score: number;
  model: string;
  created_at: number;
  updated_at: number;
};

export type AffiliateCourse = {
  course_id: string;
  title: string;
  provider: string;
  url: string;
  level: string;
  duration: string;
  free: boolean;
  description: string;
  skills: string[];
  affiliate: boolean;
};

export type ManagedAffiliateCourse = {
  id: string;
  provider: string;
  title: string;
  description: string;
  url: string;
  skills: string[];
  level: string;
  duration: string;
  free: boolean;
  status: "draft" | "published" | "archived";
  ai_filled: boolean;
  created_at: number;
  updated_at: number;
};

export type AffiliatePrefill = {
  provider: string;
  url: string;
  title: string;
  description: string;
  skills: string[];
  level: string;
  duration: string;
  free: boolean;
};

export function useListCurriculumRunsQuery() {
  return useConvexQueryHook(api.curriculum.listRuns, {});
}

export function useListCurriculumTracksQuery() {
  return useConvexQueryHook(api.curriculum.listTracks, {});
}

export function useListAffiliateCatalogQuery() {
  return useConvexQueryHook(api.curriculum.listAffiliateCatalog, {});
}

export function useListManagedAffiliateCoursesQuery() {
  return useConvexQueryHook(api.affiliateCourses.listManaged, {});
}

export function useAffiliatePlatformsQuery() {
  return useConvexQueryHook(api.affiliateCourses.listPlatforms, {});
}

export function usePrefillAffiliateCourseAction() {
  const prefill = useAction(api.affiliateCourses.prefill);
  const [isLoading, setIsLoading] = useState(false);
  const trigger = (input: { provider: string; url: string; hint?: string }) => {
    setIsLoading(true);
    return withUnwrap(
      Promise.resolve(prefill(input as never) as Promise<AffiliatePrefill>).finally(() => setIsLoading(false)),
    );
  };
  return [trigger, { isLoading }] as const;
}

export function useCreateAffiliateCourseMutation() {
  return useConvexMutationHook(api.affiliateCourses.create, (input: {
    provider: string;
    title: string;
    description: string;
    url: string;
    skills: string[];
    level: string;
    duration: string;
    free: boolean;
    aiFilled?: boolean;
  }) => input);
}

export function useSetAffiliateCourseStatusMutation() {
  return useConvexMutationHook(api.affiliateCourses.setStatus, (input: { courseId: string; status: "draft" | "published" | "archived" }) => ({
    courseId: input.courseId,
    status: input.status,
  }));
}

export function useListRoleOptionsQuery() {
  return useConvexQueryHook(api.curriculum.listRoleOptions, {});
}

export function useRunCurriculumAgentAction() {
  const run = useAction(api.curriculum.runAgent);
  const [isLoading, setIsLoading] = useState(false);
  const trigger = (input: { maxTracks?: number }) => {
    setIsLoading(true);
    return withUnwrap(
      Promise.resolve(run(input as never)).finally(() => setIsLoading(false)),
    );
  };
  return [trigger, { isLoading }] as const;
}

export function useGenerateForRoleAction() {
  const run = useAction(api.curriculum.generateForRole);
  const [isLoading, setIsLoading] = useState(false);
  const trigger = (input: { role: string; level?: string }) => {
    setIsLoading(true);
    return withUnwrap(
      Promise.resolve(run(input as never)).finally(() => setIsLoading(false)),
    );
  };
  return [trigger, { isLoading }] as const;
}

export function useSetCurriculumTrackStatusMutation() {
  return useConvexMutationHook(api.curriculum.setTrackStatus, (input: { trackId: string; status: "draft" | "published" | "archived" }) => ({
    trackId: input.trackId,
    status: input.status,
  }));
}
