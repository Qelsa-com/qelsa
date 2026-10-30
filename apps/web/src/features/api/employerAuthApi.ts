"use client";

import { employerAuthClient } from "@/lib/employerAuthClient";
import { withUnwrap } from "@/lib/convexHooks";
import { useState } from "react";

/**
 * Employer auth actions intentionally use a separate client/proxy from the
 * candidate flow. The shared Convex session remains the same after sign-in, so
 * the rest of the app does not need a second auth provider.
 */

export function useEmployerRequestOtpMutation() {
  const [isLoading, setIsLoading] = useState(false);
  const trigger = (body: { email: string }) => {
    setIsLoading(true);
    const promise = employerAuthClient.emailOtp
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

export function useEmployerVerifyOtpMutation() {
  const [isLoading, setIsLoading] = useState(false);
  const trigger = (body: { email: string; code: string }) => {
    setIsLoading(true);
    const promise = employerAuthClient.signIn
      .emailOtp({ email: body.email, otp: body.code })
      .then(({ error, data }) => {
        if (error) throw { data: { message: error.message } };
        return { message: "ok", user: data?.user };
      })
      .finally(() => setIsLoading(false));
    return withUnwrap(promise);
  };
  return [trigger, { isLoading }] as const;
}

export function useEmployerGoogleLoginMutation() {
  const [isLoading, setIsLoading] = useState(false);
  const trigger = (returnUrl?: string) => {
    setIsLoading(true);
    const callbackUrl = new URL("/employer/auth", window.location.origin);
    if (returnUrl) callbackUrl.searchParams.set("returnUrl", returnUrl);
    const promise = employerAuthClient.signIn
      .social({
        provider: "google",
        callbackURL: callbackUrl.toString(),
        errorCallbackURL: new URL("/employer/auth?authError=1", window.location.origin).toString(),
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
