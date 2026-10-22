"use client";

import { api } from "@/lib/convexApi";
import { useConvexMutationHook, useConvexQueryHook } from "@/lib/convexHooks";

export type AdminUserSummary = {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  role: string;
  account_type: string | null;
  is_active: boolean;
  profile_image: string | null;
  headline: string | null;
  city: string | null;
  job_seeking_status: string | null;
  hiring_role: string | null;
  onboarding_completed: boolean;
  created_at: number;
  last_login_at: number | null;
};

export type AdminUserDetail = {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  role: string;
  account_type: string | null;
  is_active: boolean;
  profile_image: string | null;
  headline: string | null;
  about: string | null;
  professional_summary: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  profile_visibility: string | null;
  show_phone_number: boolean;
  show_contact_to_recruiters: boolean;
  allow_profile_downloads: boolean;
  profile_view_analytics: boolean;
  work_preference: string | null;
  want_to_relocate: boolean | null;
  expected_salary_currency: string | null;
  expected_min_salary: number | null;
  expected_max_salary: number | null;
  linkedin_url: string | null;
  github_url: string | null;
  twitter_url: string | null;
  other_social_link: string | null;
  custom_profile_url: string | null;
  website: string | null;
  nationality: string | null;
  gender: string | null;
  pronoun: string | null;
  dob: number | null;
  job_seeking_status: string | null;
  hiring_role: string | null;
  profile_type: string | null;
  onboarding_completed: boolean;
  languages: unknown;
  interests: string[] | null;
  portfolio_links: unknown;
  relocate_locations: string[] | null;
  created_at: number;
  last_login_at: number | null;
  manual_pro: boolean;
  manual_pro_since: number | null;
  manual_pro_note: string | null;
};

export type AdminJobSummary = {
  id: string;
  title: string | null;
  company_name: string | null;
  status: string;
  location: string | null;
  work_type: string | null;
  workplace_type: string | null;
  salary: number | null;
  salary_currency: string | null;
  is_ingested: boolean;
  owner_id: string | null;
  owner_email: string | null;
  ats_integration_id: string | null;
  view_count: number;
  application_count: number;
  published_date: number | null;
  created_at: number;
  description: string | null;
};

export type AdminAuditEntry = {
  id: string;
  action: string;
  admin_email: string | null;
  target_user_id: string | null;
  target_job_id: string | null;
  before?: unknown;
  after?: unknown;
  note: string | null;
  created_at: number;
};

export type PlatformSummary = {
  users: number;
  seekers: number;
  recruiters: number;
  admins: number;
  inactiveUsers: number;
  jobs: number;
  openJobs: number;
  applications: number;
  publicBoards: number;
  recentSignups: Array<{
    id: string;
    name: string | null;
    email: string;
    role: string;
    account_type: string | null;
    created_at: number;
  }>;
  recentAudit: Array<{
    id: string;
    action: string;
    admin_email: string | null;
    target_user_id: string | null;
    target_job_id: string | null;
    note: string | null;
    created_at: number;
  }>;
};

/** Paginated user list. `cursor` is `undefined` for the first page. */
export function useListUsersQuery(
  filters: {
    search?: string;
    role?: "user" | "admin";
    accountType?: "seeker" | "recruiter";
    isActive?: boolean;
  },
  cursor?: string,
) {
  return useConvexQueryHook(
    api.admin.listUsers,
    {
      search: filters.search || undefined,
      role: filters.role,
      accountType: filters.accountType,
      isActive: filters.isActive,
      paginationOpts: { numItems: 25, cursor: cursor ?? null },
    },
    { skip: false },
  );
}

export function useGetUserQuery(userId: string | undefined) {
  return useConvexQueryHook(
    api.admin.getUser,
    { userId: userId as never },
    { skip: !userId },
  );
}

export function useUpdateUserMutation() {
  return useConvexMutationHook(
    api.admin.updateUser,
    (input: {
      userId: string;
      updates: Record<string, unknown>;
      note?: string;
    }) => ({ userId: input.userId as never, updates: input.updates, note: input.note }),
  );
}

export function useSetUserRoleMutation() {
  return useConvexMutationHook(
    api.admin.setUserRole,
    (input: { userId: string; role: "user" | "admin"; note?: string }) => ({
      userId: input.userId as never,
      role: input.role,
      note: input.note,
    }),
  );
}

export function useSetUserActiveMutation() {
  return useConvexMutationHook(
    api.admin.setUserActive,
    (input: { userId: string; isActive: boolean; note?: string }) => ({
      userId: input.userId as never,
      isActive: input.isActive,
      note: input.note,
    }),
  );
}

export function useGrantManualProMutation() {
  return useConvexMutationHook(
    api.admin.grantManualPro,
    (input: { userId: string; note?: string }) => ({
      userId: input.userId as never,
      note: input.note,
    }),
  );
}

export function useRevokeManualProMutation() {
  return useConvexMutationHook(
    api.admin.revokeManualPro,
    (input: { userId: string; note?: string }) => ({
      userId: input.userId as never,
      note: input.note,
    }),
  );
}

export function useListJobsQuery(
  filters: { status?: string; search?: string; onlyIngested?: boolean },
  cursor?: string,
) {
  return useConvexQueryHook(
    api.admin.listJobs,
    {
      status: filters.status || undefined,
      search: filters.search || undefined,
      onlyIngested: filters.onlyIngested,
      paginationOpts: { numItems: 25, cursor: cursor ?? null },
    },
    { skip: false },
  );
}

export function useModerateJobMutation() {
  return useConvexMutationHook(
    api.admin.moderateJob,
    (input: {
      jobId: string;
      action: "close" | "reopen" | "pause" | "delete";
      note?: string;
    }) => ({ jobId: input.jobId as never, action: input.action, note: input.note }),
  );
}

export function usePlatformSummaryQuery() {
  return useConvexQueryHook(api.admin.platformSummary, {}, { skip: false });
}

export function useListAuditLogQuery(cursor?: string, targetUserId?: string) {
  return useConvexQueryHook(
    api.admin.listAuditLog,
    {
      targetUserId: targetUserId as never,
      paginationOpts: { numItems: 25, cursor: cursor ?? null },
    },
    { skip: false },
  );
}

export function useRebuildStatsMutation() {
  return useConvexMutationHook(api.admin.rebuildStats, () => ({}));
}

/* ---------------------------------------------------------------------------
 * ATS public boards (admin-only backend functions).
 * ------------------------------------------------------------------------- */

export function useListPublicBoardsQuery() {
  return useConvexQueryHook(api.atsIntegrations.listPublicBoards, {}, { skip: false });
}

export function useAddPublicBoardMutation() {
  return useConvexMutationHook(
    api.atsIntegrations.addPublicBoard,
    (input: { provider: string; subdomain: string }) => input,
  );
}

export function useRemovePublicBoardMutation() {
  return useConvexMutationHook(
    api.atsIntegrations.removePublicBoard,
    (id: string) => ({ id }),
  );
}

export function useRetryPublicBoardMutation() {
  return useConvexMutationHook(
    api.atsIntegrations.retryPublicBoard,
    (id: string) => ({ id }),
  );
}

export function useGetSyncControlQuery() {
  return useConvexQueryHook(api.atsIntegrations.getSyncControl, {}, { skip: false });
}

export function useSetSyncEnabledMutation() {
  return useConvexMutationHook(
    api.atsIntegrations.setSyncEnabled,
    (enabled: boolean) => ({ enabled }),
  );
}

/**
 * Admin-only: wipes seeded, scraped, and ATS-ingested jobs. Jobs posted by
 * users are kept. The backend runs the delete in the background.
 */
export function useWipeAllJobsMutation() {
  return useConvexMutationHook(api.jobs.wipeAll, () => ({}));
}
