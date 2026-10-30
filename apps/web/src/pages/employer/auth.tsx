"use client";

import { useEmployerGoogleLoginMutation, useEmployerRequestOtpMutation, useEmployerVerifyOtpMutation } from "@/features/api/employerAuthApi";
import { useGetProfileQuery, useSetAccountTypeMutation } from "@/features/api/authApi";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/convexApi";
import { homeForAccount } from "@/lib/onboarding";
import { clearResumeDraft } from "@/lib/resumeDraft";
import { safeReturnUrl } from "@/lib/returnUrl";
import type { User } from "@/types/user";
import { useConvex } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../../components/ui/input-otp";

type Step = "method" | "email" | "otp";

const PRIMARY_BTN =
  "flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full gradient-primary text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40";
const SECONDARY_BTN =
  "flex h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-white/12 bg-white/[0.02] text-[15px] font-medium text-white transition-colors hover:bg-white/[0.06]";
const QUIET_LINK = "cursor-pointer text-sm text-muted-foreground transition-colors hover:text-white";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OAUTH_PENDING_KEY = "qelsa.employer.oauth.pending";

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message;
  if (err && typeof err === "object") {
    const value = err as { data?: { message?: unknown }; message?: unknown };
    if (typeof value.data?.message === "string") return value.data.message;
    if (typeof value.message === "string") return value.message;
  }
  return fallback;
}

export default function EmployerAuthPage() {
  const router = useRouter();
  const convex = useConvex();
  const returnUrl = safeReturnUrl(typeof router.query.returnUrl === "string" ? router.query.returnUrl : undefined);

  const [step, setStep] = useState<Step>("method");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [oauthPending, setOauthPending] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  const [googleLogin, { isLoading: isGoogleLoading }] = useEmployerGoogleLoginMutation();
  const [requestOtp, { isLoading: isSendingOtp }] = useEmployerRequestOtpMutation();
  const [verifyOtp, { isLoading: isVerifying }] = useEmployerVerifyOtpMutation();
  const [saveAccountType] = useSetAccountTypeMutation();
  const { data: session, isPending: isSessionPending, refetch: refetchSession } = authClient.useSession();
  const { data: rawProfile } = useGetProfileQuery(undefined, { skip: !session });
  const profile = (rawProfile as User | null | undefined) ?? null;
  const finalizingRef = useRef(false);

  const clearOauthPending = useCallback(() => {
    if (typeof window !== "undefined") sessionStorage.removeItem(OAUTH_PENDING_KEY);
    setOauthPending(false);
  }, []);

  // OAuth callback failures redirect here with `?error=...`.
  useEffect(() => {
    if (!router.isReady) return;
    const rawError = typeof router.query.error === "string" ? router.query.error : null;
    if (!rawError) return;
    const description =
      typeof router.query.error_description === "string" ? router.query.error_description : null;
    setError(
      rawError === "state_mismatch"
        ? "That sign-in was interrupted or already used. Please try again."
        : description || "Sign-in didn't complete. Please try again.",
    );
    clearOauthPending();
    const { error: _error, error_description: _description, authError: _authError, ...rest } = router.query;
    void router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
  }, [clearOauthPending, router, router.isReady, router.query.error, router.query.error_description]);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(OAUTH_PENDING_KEY) === "1") {
      setOauthPending(true);
    }
  }, []);

  useEffect(() => {
    if (!oauthPending || isSessionPending || session) return;
    clearOauthPending();
  }, [clearOauthPending, isSessionPending, oauthPending, session]);

  useEffect(() => {
    if (!resendIn) return;
    const id = setInterval(() => setResendIn((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  useEffect(() => {
    if (!session) finalizingRef.current = false;
  }, [session]);

  const signOutWithError = useCallback(async (message: string) => {
    setIsFinishing(false);
    clearOauthPending();
    setError(message);
    clearResumeDraft();
    await authClient.signOut().catch(() => undefined);
    setStep("method");
  }, [clearOauthPending]);

  const finishSession = useCallback(async () => {
    if (!session || !profile || finalizingRef.current) return;
    finalizingRef.current = true;

    const accountEmail = profile.email?.trim().toLowerCase() ?? "";
    try {
      const check = await convex.query(api.employerAuth.validateEmail, { email: accountEmail });
      if (!check.allowed) {
        await signOutWithError(check.message ?? "Use your company email address to sign in as an employer.");
        return;
      }

      if (profile.account_type === "seeker") {
        await signOutWithError("This email is registered as a candidate account. Use candidate sign-in, or sign in with a different work email.");
        return;
      }

      if (profile.account_type === "recruiter") {
        if (!profile.onboarding_completed) {
          clearOauthPending();
          router.replace(returnUrl ? `/onboarding?returnUrl=${encodeURIComponent(returnUrl)}` : "/onboarding");
          return;
        }
        clearOauthPending();
        router.replace(returnUrl ?? homeForAccount(profile));
        return;
      }

      await saveAccountType({ account_type: "recruiter" }).unwrap();
      clearOauthPending();
      router.replace(returnUrl ? `/onboarding?returnUrl=${encodeURIComponent(returnUrl)}` : "/onboarding");
    } catch (err) {
      await signOutWithError(errorMessage(err, "We couldn't finish setting up your employer account. Please try again."));
    }
  }, [clearOauthPending, convex, profile, returnUrl, router, saveAccountType, session, signOutWithError]);

  useEffect(() => {
    void finishSession();
  }, [finishSession]);

  const handleGoogle = async () => {
    setError(null);
    if (typeof window !== "undefined") sessionStorage.setItem(OAUTH_PENDING_KEY, "1");
    try {
      await googleLogin(returnUrl).unwrap();
      setOauthPending(true);
    } catch (err) {
      clearOauthPending();
      setError(errorMessage(err, "Google sign-in failed. Please try again."));
    }
  };

  const handleSendCode = async () => {
    const trimmed = email.trim().toLowerCase();
    setError(null);
    if (!EMAIL_RE.test(trimmed)) {
      setError("Enter a valid work email address.");
      return;
    }

    setIsCheckingEmail(true);
    try {
      const check = await convex.query(api.employerAuth.validateEmail, { email: trimmed });
      if (!check.allowed) {
        setError(check.message ?? "Use your company email address to continue.");
        return;
      }
      const result = await requestOtp({ email: trimmed }).unwrap();
      setEmail(trimmed);
      setCode("");
      setStep("otp");
      setResendIn(result.cooldownSeconds ?? 30);
    } catch (err) {
      setError(errorMessage(err, "Could not send the code. Please try again."));
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0 || isSendingOtp) return;
    setError(null);
    try {
      const result = await requestOtp({ email }).unwrap();
      setCode("");
      setResendIn(result.cooldownSeconds ?? 30);
    } catch (err) {
      setError(errorMessage(err, "Could not resend the code. Please try again."));
    }
  };

  const handleVerify = async (submitted = code) => {
    if (submitted.length !== 6) return;
    setError(null);
    setIsFinishing(true);
    try {
      await verifyOtp({ email, code: submitted }).unwrap();
      // The employer client established the cookie. Refresh the shared auth
      // client so Convex picks up the session without a second full-page
      // "checking" pass.
      await refetchSession({ query: { disableCookieCache: true } });
    } catch (err) {
      setIsFinishing(false);
      setCode("");
      setError(errorMessage(err, "That code didn't work. Please try again."));
    }
  };

  const googleBusy = isGoogleLoading || oauthPending;
  const otpBusy = isVerifying || isFinishing;
  const isBusy = googleBusy || isSendingOtp || isCheckingEmail || otpBusy;
  const cardMotion = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
    transition: { duration: 0.25 },
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10" style={{ background: "var(--background)" }}>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-purple/10 blur-[130px]" />
        <div className="absolute bottom-0 right-0 h-[320px] w-[320px] rounded-full bg-neon-cyan/[0.06] blur-[110px]" />
      </div>

      <button
        type="button"
        onClick={() => router.push(returnUrl ?? "/employers")}
        className={`absolute left-4 top-4 z-10 flex items-center gap-2 sm:left-8 sm:top-8 ${QUIET_LINK}`}
      >
        <ArrowLeft /> Back
      </button>

      <Image src="/qelsa-logo.svg" alt="Qelsa" width={91} height={29} priority unoptimized className="mb-8 h-[21px] w-auto" />

      <div className="w-full max-w-[460px]">
        <AnimatePresence mode="wait">
          {step === "method" ? (
            <motion.div key="method" {...cardMotion} className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neon-cyan">For employers</p>
              <h1 className="mt-3 text-3xl font-bold text-white">Hire with your company email.</h1>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                Sign in or create an employer account. We only accept work email addresses.
              </p>

              {error ? <ErrorBanner message={error} /> : null}

              <button type="button" onClick={handleGoogle} disabled={isBusy} aria-busy={googleBusy} className={`mt-7 ${PRIMARY_BTN}`}>
                {googleBusy ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <GoogleMark />}
                {googleBusy ? "Connecting to Google…" : "Continue with Google"}
              </button>

              <button type="button" onClick={() => setStep("email")} disabled={isBusy} className={`mt-3 ${SECONDARY_BTN}`}>
                <MailIcon />
                Use work email instead
              </button>

              <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3.5 text-xs leading-relaxed text-white/45">
                <ShieldIcon />
                <p>Gmail, Yahoo, Outlook, iCloud, and disposable inboxes cannot be used for employer accounts.</p>
              </div>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Looking for a job?{" "}
                <Link href="/auth" className="font-medium text-neon-cyan hover:text-white">
                  Candidate sign in
                </Link>
              </p>
            </motion.div>
          ) : step === "email" ? (
            <motion.div key="email" {...cardMotion} className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
              <button
                type="button"
                onClick={() => {
                  setStep("method");
                  setError(null);
                }}
                className={`flex items-center gap-2 ${QUIET_LINK}`}
              >
                <ArrowLeft /> Back
              </button>

              <h1 className="mt-5 text-3xl font-bold text-white">Use your work email.</h1>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                We&apos;ll send a one-time code to verify your company inbox.
              </p>

              {error ? <ErrorBanner message={error} /> : null}

              <label htmlFor="employer-email" className="mt-7 block text-sm text-muted-foreground">
                Work email
              </label>
              <input
                id="employer-email"
                type="email"
                autoFocus
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleSendCode()}
                className="mt-2 h-14 w-full rounded-full border border-white/12 bg-white/[0.04] px-6 text-[15px] text-white outline-none transition-colors placeholder:text-muted-foreground focus:border-neon-purple"
              />

              <button
                type="button"
                onClick={handleSendCode}
                disabled={!email.trim() || isBusy}
                className={`mt-4 ${PRIMARY_BTN}`}
              >
                {isCheckingEmail || isSendingOtp ? "Checking…" : "Send me a code"}
                {!isCheckingEmail && !isSendingOtp ? <ArrowRight /> : null}
              </button>

              <p className="mt-4 text-center text-xs leading-relaxed text-white/40">
                Personal addresses are rejected. Use the email your company gave you.
              </p>
            </motion.div>
          ) : (
            <motion.div key="otp" {...cardMotion} className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError(null);
                }}
                className={`flex items-center gap-2 ${QUIET_LINK}`}
              >
                <ArrowLeft /> Change email
              </button>

              <div className="mt-5 flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-neon-cyan/30 bg-neon-cyan/10">
                  <MailIcon className="h-7 w-7 text-neon-cyan" />
                </div>
                <h1 className="mt-5 text-3xl font-bold text-white">Check your inbox</h1>
                <p className="mt-2 text-[15px] text-muted-foreground">
                  6-digit code sent to <span className="font-medium text-white">{email}</span>
                </p>

                {error ? <ErrorBanner message={error} className="mt-5 w-full text-left" /> : null}

                <div className="mt-6">
                  <InputOTP
                    maxLength={6}
                    value={code}
                    autoFocus
                    onChange={(value) => {
                      setCode(value);
                      if (value.length === 6) handleVerify(value);
                    }}
                  >
                    <InputOTPGroup className="gap-2">
                      {[0, 1, 2].map((index) => (
                        <OtpSlot key={index} index={index} />
                      ))}
                    </InputOTPGroup>
                    <span className="mx-2 h-px w-3 bg-white/25" />
                    <InputOTPGroup className="gap-2">
                      {[3, 4, 5].map((index) => (
                        <OtpSlot key={index} index={index} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <button
                  type="button"
                  onClick={() => handleVerify()}
                  disabled={code.length !== 6 || isBusy}
                  aria-busy={otpBusy}
                  className={`mt-6 ${PRIMARY_BTN}`}
                >
                  {otpBusy ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : null}
                  {isVerifying ? "Verifying…" : isFinishing ? "Signing in…" : "Verify and continue"}
                  {!otpBusy ? <ArrowRight /> : null}
                </button>

                <p className="mt-5 text-sm text-muted-foreground">
                  Didn&apos;t get it?{" "}
                  {resendIn > 0 ? (
                    <span>Resend in {resendIn}s</span>
                  ) : (
                    <button type="button" onClick={handleResend} disabled={isSendingOtp} className="cursor-pointer font-medium text-neon-purple transition-opacity hover:opacity-80 disabled:cursor-not-allowed">
                      {isSendingOtp ? "Sending…" : "Resend now"}
                    </button>
                  )}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-6 text-center text-xs leading-relaxed text-gray-500">
          By continuing, you agree to Qelsa&apos;s{" "}
          <Link href="/terms" className="text-gray-400 underline underline-offset-2 hover:text-white">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-gray-400 underline underline-offset-2 hover:text-white">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function ErrorBanner({ message, className = "" }: { message: string; className?: string }) {
  return (
    <div className={`mt-5 rounded-2xl border border-red-400/25 bg-red-500/[0.08] px-4 py-3 text-sm leading-relaxed text-red-200 ${className}`} role="alert">
      {message}
    </div>
  );
}

function OtpSlot({ index }: { index: number }) {
  return (
    <InputOTPSlot
      index={index}
      className="h-12 w-12 rounded-full border border-white/15 bg-white/[0.04] text-lg text-white first:rounded-l-full last:rounded-r-full data-[active=true]:border-neon-purple data-[active=true]:ring-0"
    />
  );
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function ArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function MailIcon({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0 text-neon-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
