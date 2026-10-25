"use client";

import { api } from "@/lib/convexApi";
import { useConvexMutationHook, useConvexQueryHook } from "@/lib/convexHooks";

export type BlogStatus = "draft" | "published";

export type BlogSection = {
  heading: string;
  paragraphs: string[];
  bullets: string[];
};

export type BlogFaq = { question: string; answer: string };
export type BlogLink = { label: string; href: string };

export type AdminBlogSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  meta_title: string;
  meta_description: string;
  primary_keyword: string;
  search_intent: string;
  category: string;
  tags: string[];
  cover_image_url: string | null;
  cover_image_alt: string;
  cover_status: "ready" | "failed";
  cover_error: string | null;
  status: BlogStatus;
  seo_score: number;
  word_count: number;
  reading_minutes: number;
  model: string;
  image_model: string;
  created_at: number;
  updated_at: number;
  published_at: number | null;
};

export type AdminBlog = AdminBlogSummary & {
  intro: string;
  key_takeaways: string[];
  sections: BlogSection[];
  faq: BlogFaq[];
  related_links: BlogLink[];
  image_prompt: string;
  prompt_version: string;
};

export type BlogRunState = {
  id: string;
  status: "running" | "completed" | "failed";
  title_hint: string | null;
  model: string;
  image_model: string;
  started_at: number;
  completed_at: number | null;
  blog_id: string | null;
  error: string | null;
};

export type ActiveBlogRun = {
  id: string;
  status: "running";
  title_hint: string | null;
  started_at: number;
  model: string;
  image_model: string;
};

export function useListAdminBlogsQuery() {
  return useConvexQueryHook(api.blog.listAdmin, {});
}

export function useBlogGenerationStateQuery() {
  return useConvexQueryHook(api.blog.generationState, {});
}

export function useActiveBlogRunsQuery() {
  return useConvexQueryHook(api.blog.listActiveRuns, {});
}

export function useGetAdminBlogQuery(blogId: string | null) {
  return useConvexQueryHook(
    api.blog.getAdmin,
    blogId ? { blogId } : undefined,
    { skip: !blogId },
  );
}

export function useStartBlogGenerationMutation() {
  return useConvexMutationHook(api.blog.startGeneration);
}

export function useSetBlogStatusMutation() {
  return useConvexMutationHook(api.blog.setStatus);
}

export function useDeleteBlogMutation() {
  return useConvexMutationHook(api.blog.remove);
}

export function useRetryBlogCoverMutation() {
  return useConvexMutationHook(api.blog.retryCover);
}
