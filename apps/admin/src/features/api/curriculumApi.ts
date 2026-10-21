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

export function useListCurriculumRunsQuery() {
  return useConvexQueryHook(api.curriculum.listRuns, {});
}

export function useListCurriculumTracksQuery() {
  return useConvexQueryHook(api.curriculum.listTracks, {});
}

export function useListAffiliateCatalogQuery() {
  return useConvexQueryHook(api.curriculum.listAffiliateCatalog, {});
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

export function useSetCurriculumTrackStatusMutation() {
  return useConvexMutationHook(api.curriculum.setTrackStatus, (input: { trackId: string; status: "draft" | "published" | "archived" }) => ({
    trackId: input.trackId,
    status: input.status,
  }));
}
