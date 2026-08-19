"use client";

import { api } from "@/lib/convexApi";
import { useAction, useMutation } from "convex/react";
import { useConvexQueryHook, withUnwrap } from "@/lib/convexHooks";
import { useState } from "react";

/* ---------------------------------------------------------------- *
 *  Draft shape returned by the resume parser (convex `resumeParse.parse`)
 *  and edited on the "Check your details" review screen.
 * ---------------------------------------------------------------- */
export interface ResumeExperience {
  company: string | null;
  role: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current?: boolean;
  description: string | null;
  responsibilities: string[];
  tools: string[];
}
export interface ResumeEducation {
  degree: string | null;
  field_of_study: string | null;
  institution: string | null;
  start_year: number | null;
  end_year: number | null;
}
export interface ResumeDraft {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin_url: string | null;
  summary: string | null;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: string[];
  certifications: string[];
  languages: string[];
  _source?: "gemini" | "heuristic";
}

export function useGetMyResumesQuery(_filters?: Record<string, string> | void, options?: { skip?: boolean }) {
  return useConvexQueryHook(api.resumes.listMine, {}, options);
}

/**
 * Upload a resume file to Convex storage and create the `resumes` row.
 * Convex uploads are a two-step dance: mint a short-lived upload URL, POST the
 * file to it, then persist the returned storageId. Returns `{ resume: { id } }`
 * so the onboarding flow can immediately parse it.
 */
export function useUploadResumeMutation() {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const create = useMutation(api.resumes.create);
  const [isLoading, setIsLoading] = useState(false);
  const trigger = async (input: FormData | { title?: string; file?: File }) => {
    setIsLoading(true);
    try {
      let file: File | undefined;
      let title = "Resume";
      if (input instanceof FormData) {
        file = input.get("file") as File;
        title = (input.get("title") as string) || file?.name || "Resume";
      } else {
        file = input.file;
        title = input.title || file?.name || "Resume";
      }
      if (!file) throw new Error("Resume file is required");
      const postUrl = await generateUploadUrl();
      const res = await fetch(postUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      const { storageId } = await res.json();
      const created = (await create({ title, storageId })) as { resume?: { id: string } };
      return { resume: { id: created?.resume?.id as string } };
    } finally {
      setIsLoading(false);
    }
  };
  const run = (input: FormData | { title?: string; file?: File }) => withUnwrap(trigger(input));
  return [run, { isLoading }] as const;
}

/** Kept for backwards compatibility with the team's existing upload wrapper. */
export function useCreateResumeMutation() {
  const [upload, state] = useUploadResumeMutation();
  const run = (input: FormData | { title?: string; file?: File }) =>
    withUnwrap(upload(input).then((r) => ({ data: { id: r.resume.id } })));
  return [run, state] as const;
}

/**
 * Parse an already-uploaded resume by id: reads the file from storage, sends it
 * to Gemini, and returns an editable `{ draft }`. Runs as a Convex action.
 */
export function useParseResumeMutation() {
  const parse = useAction(api.resumeParse.parse);
  const [isLoading, setIsLoading] = useState(false);
  const trigger = async (resumeId: string) => {
    setIsLoading(true);
    try {
      return (await parse({ resumeId: resumeId as never })) as { draft: ResumeDraft };
    } finally {
      setIsLoading(false);
    }
  };
  const run = (resumeId: string) => withUnwrap(trigger(resumeId));
  return [run, { isLoading }] as const;
}

/**
 * Save a user-confirmed draft into the real profile tables (users, experiences,
 * educations, skills…). Returns per-section counts.
 */
export function useConfirmProfileMutation() {
  const importProfile = useMutation(api.resumes.importProfile);
  const [isLoading, setIsLoading] = useState(false);
  const trigger = async (draft: ResumeDraft) => {
    setIsLoading(true);
    try {
      return (await importProfile({ draft: draft as never })) as Record<string, number>;
    } finally {
      setIsLoading(false);
    }
  };
  const run = (draft: ResumeDraft) => withUnwrap(trigger(draft));
  return [run, { isLoading }] as const;
}
