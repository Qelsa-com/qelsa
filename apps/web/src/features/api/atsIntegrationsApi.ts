"use client";

import { api } from "@/lib/convexApi";
import { useConvexMutationHook, useConvexQueryHook } from "@/lib/convexHooks";

export function useListAtsIntegrationsQuery(options?: { skip?: boolean }) {
  return useConvexQueryHook(api.atsIntegrations.list, {}, options);
}

export function useConnectAtsBoardMutation() {
  return useConvexMutationHook(api.atsIntegrations.connectBoard, (input: { provider: string; subdomain: string }) => input);
}

export function useConnectAtsApiKeyMutation() {
  return useConvexMutationHook(api.atsIntegrations.connectApiKey, (input: { provider: string; apiKey: string; subdomain: string }) => input);
}

export function useConnectAtsOAuthMutation() {
  return useConvexMutationHook(api.atsIntegrations.connectOAuth, (input: { provider: string; clientId: string; clientSecret: string; subdomain?: string; refreshToken?: string; region?: string }) => input);
}

export function useReconnectAtsMutation() {
  return useConvexMutationHook(api.atsIntegrations.reconnect, (input: { provider: string; apiKey?: string; subdomain?: string; clientId?: string; clientSecret?: string; refreshToken?: string; region?: string }) => input);
}

export function useDisconnectAtsMutation() {
  return useConvexMutationHook(api.atsIntegrations.disconnect, (provider: string) => ({ provider }));
}

export function useRemoveAtsMutation() {
  return useConvexMutationHook(api.atsIntegrations.remove, (provider: string) => ({ provider }));
}

export function useUpdateAtsSyncSettingsMutation() {
  return useConvexMutationHook(api.atsIntegrations.updateSyncSettings, (input: { provider: string; syncJobs?: boolean; syncCandidates?: boolean }) => input);
}

export function useRequestAtsAccessMutation() {
  return useConvexMutationHook(api.atsIntegrations.requestAccess, (provider: string) => ({ provider }));
}
