"use client";

import { api } from "@/lib/convexApi";
import { useConvexMutationHook, useConvexQueryHook } from "@/lib/convexHooks";

export function useGetPageMembersQuery(pageId?: string, options?: { skip?: boolean }) {
  return useConvexQueryHook(
    api.pageMembers.listMembers,
    pageId ? { pageId: pageId as never } : undefined,
    { skip: options?.skip || !pageId },
  );
}

export function useSearchUsersQuery(
  args: { query: string; pageId?: string },
  options?: { skip?: boolean },
) {
  const shouldSkip = options?.skip || !args.query.trim();
  return useConvexQueryHook(
    api.pageMembers.searchUsers,
    shouldSkip
      ? undefined
      : {
          query: args.query,
          pageId: args.pageId as never,
        },
    { skip: shouldSkip },
  );
}

export function useAddPageMemberMutation() {
  return useConvexMutationHook(
    api.pageMembers.addMember,
    ({ pageId, userId, role }: { pageId: string; userId: string; role: "admin" | "editor" }) => ({
      pageId: pageId as never,
      userId: userId as never,
      role,
    }),
  );
}

export function useUpdateMemberRoleMutation() {
  return useConvexMutationHook(
    api.pageMembers.updateRole,
    ({ pageId, memberId, role }: { pageId: string; memberId: string; role: "admin" | "editor" }) => ({
      pageId: pageId as never,
      memberId: memberId as never,
      role,
    }),
  );
}

export function useRemovePageMemberMutation() {
  return useConvexMutationHook(
    api.pageMembers.removeMember,
    ({ pageId, memberId }: { pageId: string; memberId: string }) => ({
      pageId: pageId as never,
      memberId: memberId as never,
    }),
  );
}

export function useTransferOwnershipMutation() {
  return useConvexMutationHook(
    api.pageMembers.transferOwnership,
    ({ pageId, newOwnerUserId }: { pageId: string; newOwnerUserId: string }) => ({
      pageId: pageId as never,
      newOwnerUserId: newOwnerUserId as never,
    }),
  );
}
