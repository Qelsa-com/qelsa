"use client";

import { useState } from "react";
import { api } from "@/lib/convexApi";
import { authClient } from "@/lib/auth-client";
import { useConvexMutationHook, useConvexQueryHook, withUnwrap } from "@/lib/convexHooks";
import type { User } from "@/types/user";
import type { Education } from "@/types/education";
import type { Experience } from "@/types/experience";
import type { Certification } from "@/types/certification";
import type { UserSkill } from "@/types/userSkill";

export type AccountType = "seeker" | "recruiter";

export interface PublicProfile {
  user: User;
  experiences: Experience[];
  educations: Education[];
  certifications: Certification[];
  skills: UserSkill[];
}

export function useLoginMutation() {
  const [isLoading, setIsLoading] = useState(false);
  const trigger = (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    const promise = authClient.signIn
      .email(credentials)
      .then(({ error, data }) => {
        if (error) throw { data: { message: error.message } };
        return { user: data?.user as unknown as User };
      })
      .finally(() => setIsLoading(false));
    return withUnwrap(promise);
  };
  return [trigger, { isLoading }] as const;
}

export function useRegisterMutation() {
  const [isLoading, setIsLoading] = useState(false);
  const trigger = (body: { email: string; password: string; name?: string }) => {
    setIsLoading(true);
    const promise = authClient.signUp
      .email({
        email: body.email,
        password: body.password,
        name: body.name ?? body.email.split("@")[0],
      })
      .then(({ error }) => {
        if (error) throw { data: { message: error.message } };
      })
      .finally(() => setIsLoading(false));
    return withUnwrap(promise);
  };
  return [trigger, { isLoading }] as const;
}

export function useGetProfileQuery(_arg?: void, options?: { skip?: boolean }) {
  return useConvexQueryHook(api.users.me, {}, options);
}

export function useGetPublicProfileQuery(username?: string | null, options?: { skip?: boolean }) {
  const skip = options?.skip || !username;
  return useConvexQueryHook(api.users.publicProfile, skip ? undefined : { username }, { skip });
}

export function useUpdateProfileMutation() {
  return useConvexMutationHook(api.users.updateProfile, (updates) => ({ updates }));
}

export function useRequestOtpMutation() {
  const [isLoading, setIsLoading] = useState(false);
  const trigger = (body: { email: string }) => {
    setIsLoading(true);
    const promise = authClient.emailOtp
      .sendVerificationOtp({ email: body.email, type: "sign-in" })
      .then(({ error }) => {
        if (error) throw { data: { message: error.message } };
        return { message: "sent", cooldownSeconds: 30 };
      })
      .finally(() => setIsLoading(false));
    return withUnwrap(promise);
  };
  return [trigger, { isLoading }] as const;
}

export function useResendOtpMutation() {
  return useRequestOtpMutation();
}

export function useVerifyOtpMutation() {
  const [isLoading, setIsLoading] = useState(false);
  const trigger = (body: { email: string; code: string }) => {
    setIsLoading(true);
    const promise = authClient.signIn
      .emailOtp({ email: body.email, otp: body.code })
      .then(({ error, data }) => {
        if (error) throw { data: { message: error.message } };
        return {
          message: "ok",
          user: data?.user as unknown as User,
        };
      })
      .finally(() => setIsLoading(false));
    return withUnwrap(promise);
  };
  return [trigger, { isLoading }] as const;
}

export function useSetAccountTypeMutation() {
  return useConvexMutationHook(
    api.users.setAccountType,
    (input: { account_type: AccountType }) => ({
      account_type: input.account_type,
    }),
  );
}

export function useDeleteAccountMutation() {
  return useConvexMutationHook(api.users.deleteAccount, () => ({}));
}

export function useGoogleLoginMutation() {
  const [isLoading, setIsLoading] = useState(false);
  const trigger = () => {
    setIsLoading(true);
    const promise = authClient.signIn
      .social({
        provider: "google",
        callbackURL: typeof window !== "undefined" ? `${window.location.origin}/auth` : "/auth",
      })
      .then(({ error }) => {
        if (error) throw { data: { message: error.message } };
        return { ok: true };
      })
      .finally(() => setIsLoading(false));
    return withUnwrap(promise);
  };
  return [trigger, { isLoading }] as const;
}
