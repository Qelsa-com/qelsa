"use client";

import { api } from "@/lib/convexApi";
import { useConvexMutationHook, useConvexQueryHook, useLazyConvexQueryHook, withUnwrap } from "@/lib/convexHooks";
import type { ParsedProfile } from "@/lib/resumeDraft";
import { uploadFileToR2 } from "@/lib/r2Upload";
import { useAction, useMutation } from "convex/react";
import { useState } from "react";
import type { AccountType } from "./authApi";

export type JobSeekingStatus = "actively_hunting" | "exploring" | "building_skills";
export type HiringRole = "founder_cxo" | "hr_ta" | "hiring_manager" | "recruitment_agency";

export function useSearchOnboardingCompaniesQuery(search: string, options?: { skip?: boolean }) {
  const skip = options?.skip || search.trim().length === 0;
  return useConvexQueryHook(api.onboarding.searchCompanies, skip ? undefined : { search }, { skip });
}

export function useLazySearchOnboardingCompaniesQuery() {
  const [trigger, state] = useLazyConvexQueryHook(api.onboarding.searchCompanies);
  const run = (search: string) => trigger({ search });
  return [run, state] as const;
}

export function useCompleteCandidateOnboardingMutation() {
  return useConvexMutationHook(
    api.onboarding.completeCandidateOnboarding,
    (input: { job_seeking_status: JobSeekingStatus }) => input,
  );
}

export function useCompleteHrOnboardingMutation() {
  return useConvexMutationHook(
    api.onboarding.completeHrOnboarding,
    (input: {
      company_name: string;
      catalog_company_id?: string;
      hiring_role: HiringRole;
      industry: string;
      size_id: string;
    }) => input,
  );
}

export function useSetAccountTypeAndResetOnboardingMutation() {
  return useConvexMutationHook(
    api.onboarding.setAccountTypeAndResetOnboarding,
    (input: { account_type: AccountType }) => input,
  );
}

export function useGetCompanySizesQuery(options?: { skip?: boolean }) {
  return useConvexQueryHook(api.seed.companySizes, {}, options);
}

export function useApplyParsedProfileMutation() {
  return useConvexMutationHook(
    api.onboarding.applyParsedProfile,
    (input: { profile: ParsedProfile; storage_id?: string; filename?: string }) => input,
  );
}

export function useParseResume() {
  const generateUploadUrl = useMutation(api.files.generateResumeUploadUrl);
  const syncMetadata = useMutation(api.files.syncResumeMetadata);
  const parseResume = useAction(api.resumeParse.parseResume);
  const [isLoading, setIsLoading] = useState(false);

  const trigger = async (file: File) => {
    setIsLoading(true);
    try {
      const storageId = await uploadFileToR2(generateUploadUrl, syncMetadata, file);
      const profile = (await parseResume({
        storageId,
        filename: file.name,
        contentType: file.type || undefined,
      })) as ParsedProfile;
      return { profile, storageId, filename: file.name };
    } finally {
      setIsLoading(false);
    }
  };

  return [((file: File) => withUnwrap(trigger(file))), { isLoading }] as const;
}
