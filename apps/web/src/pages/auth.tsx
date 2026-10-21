"use client";

import { useGetProfileQuery, useGoogleLoginMutation, useRequestOtpMutation, useResendOtpMutation, useSetAccountTypeMutation, useVerifyOtpMutation } from "@/features/api/authApi";
import { authClient } from "@/lib/auth-client";
import { toastUnknownError } from "@/lib/errors";
import { clearResumeDraft } from "@/lib/resumeDraft";
import { safeReturnUrl } from "@/lib/returnUrl";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../components/ui/input-otp";

type Step = "method" | "email" | "otp";

// Shared button styles. Tailwind v4's preflight no longer sets `cursor: pointer`
// on <button>, so it has to be opted into explicitly.
const PRIMARY_BTN =
  "flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full gradient-primary text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40";

const SECONDARY_BTN =
  "flex h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-white/12 bg-white/[0.02] text-[15px] font-medium text-white transition-colors hover:bg-white/[0.06]";

const QUIET_LINK = "cursor-pointer text-sm text-muted-foreground transition-colors hover:text-white";

export default function AuthPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("method");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const finishingRef = useRef(false);

  const [googleLogin, { isLoading: isGoogleLoading }] = useGoogleLoginMutation();
  const [requestOtp, { isLoading: isSendingOtp }] = useRequestOtpMutation();
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [saveAccountType] = useSetAccountTypeMutation();
  const { data: session } = authClient.useSession();
  const { data: profile } = useGetProfileQuery(undefined, { skip: !session });

  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const returnUrl = safeReturnUrl(searchParams.get("returnUrl"));
  const isSwitching = searchParams.get("switch") === "true" || searchParams.get("logout") === "true";

  // Resend cooldown ticker.
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  useEffect(() => {
    if (isSwitching) {
      clearResumeDraft();
      void authClient.signOut();
    }
  }, [isSwitching]);

  /**
   * Candidates now land on My Space immediately after sign-in. There is no
   * candidate onboarding step anymore; employer onboarding still runs through
   * its own /employer/auth flow.
   */
  const finishAuth = useCallback(() => {
    router.replace(returnUrl || "/");
  }, [router, returnUrl]);

  useEffect(() => {
    if (isSwitching || !session || !profile) return;

    if (profile.account_type) {
      finishAuth();
      return;
    }

    // Older/new OTP users may not have an account_type yet. Stamp them as
    // candidates before landing on My Space so matching and navigation are
    // consistent. `setAccountType` also marks candidate onboarding complete.
    if (finishingRef.current) return;
    finishingRef.current = true;
    saveAccountType({ account_type: "seeker" })
      .unwrap()
      .then(() => finishAuth())
      .catch((err) => {
        finishingRef.current = false;
        toastUnknownError(err, "Could not finish setting up your account. Please try again.");
      });
  }, [finishAuth, isSwitching, profile, saveAccountType, session]);

  const handleSendCode = async () => {
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      const res = await requestOtp({ email: trimmed }).unwrap();
      setEmail(trimmed);
      setCode("");
      setStep("otp");
      setResendIn(res.cooldownSeconds ?? 30);
    } catch (err) {
      toastUnknownError(err, "Could not send the code. Please try again.");
    }
  };

  const handleResend = async () => {
    if (resendIn > 0 || isResending) return;
    try {
      const res = await resendOtp({ email }).unwrap();
      setCode("");
      setResendIn(res.cooldownSeconds ?? 30);
      toast.success("A new code is on its way.");
    } catch (err) {
      toastUnknownError(err, "Could not resend the code. Please try again.");
    }
  };

  const handleVerify = async (submitted = code) => {
    if (submitted.length !== 6) return;
    try {
      await verifyOtp({ email, code: submitted }).unwrap();
      // The session/profile effect finishes the handoff to My Space.
    } catch (err) {
      setCode("");
      toastUnknownError(err, "That code didn't work. Please try again.");
    }
  };

  const handleGoogle = async () => {
    try {
      await googleLogin().unwrap();
    } catch (err) {
      toastUnknownError(err, "Google sign-in failed. Please try again.");
    }
  };

  const cardMotion = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
    transition: { duration: 0.25 },
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10" style={{ background: "var(--background)" }}>
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[540px] w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-purple/10 blur-[130px]" />
      </div>

      <button
        type="button"
        onClick={() => {
          if (returnUrl) {
            router.push(returnUrl);
            return;
          }
          router.push(typeof window !== "undefined" && sessionStorage.getItem("qelsa.resumeDraft") ? "/start" : "/candidates");
        }}
        className={`absolute left-4 top-4 z-10 flex items-center gap-2 sm:left-8 sm:top-8 ${QUIET_LINK}`}
      >
        <ArrowLeft /> Back
      </button>

      {/* Swap public/qelsa-logo.svg for the official export to update the mark
          everywhere — no code change needed. */}
      <Image src="/qelsa-logo.svg" alt="Qelsa" width={91} height={29} priority unoptimized className="mb-8 h-[21px] w-auto" />

      <div className="w-full max-w-[460px]">
        <AnimatePresence mode="wait">
          {/* ---------- Step 1: choose a method ---------- */}
          {step === "method" ? (
            <motion.div key="method" {...cardMotion} className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
              <h2 className="text-3xl font-bold text-white">Good to have you here.</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-gray-500">Sign in or create your account — takes 30 seconds.</p>

              <button
                type="button"
                onClick={() => handleGoogle()}
                disabled={isGoogleLoading}
                className={`mt-7 ${PRIMARY_BTN}`}
              >
                <GoogleMark />
                {isGoogleLoading ? "Signing in…" : "Continue with Google"}
              </button>

              <button
                type="button"
                onClick={() => setStep("email")}
                className={`mt-3 ${SECONDARY_BTN}`}
              >
                <MailIcon />
                Use email instead
              </button>

              <p className="mt-6 text-center text-xs leading-relaxed text-gray-500">
                By continuing, you agree to Qelsa&apos;s{" "}
                <Link href="/terms" className="text-gray-400 text-xs underline underline-offset-2 hover:text-white">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-gray-400 text-xs underline underline-offset-2 hover:text-white">
                  Privacy Policy
                </Link>
              </p>

              <p className="mt-4 text-center text-xs text-gray-500">
                Hiring?{" "}
                <Link href="/employer/auth" className="text-neon-cyan underline underline-offset-2 hover:text-white">
                  Employer sign in
                </Link>
              </p>
            </motion.div>
          ) : null}

          {/* ---------- Step 2: email ---------- */}
          {step === "email" && (
            <motion.div key="email" {...cardMotion} className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
              <h2 className="text-3xl font-bold text-white">Good to have you here.</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-gray-500">Sign in or create your account — takes 30 seconds.</p>

              <label htmlFor="email" className="mt-7 block text-sm text-muted-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoFocus
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                className="mt-2 h-14 w-full rounded-full border border-white/12 bg-white/[0.04] px-6 text-[15px] text-white outline-none transition-colors placeholder:text-muted-foreground focus:border-neon-purple"
              />

              <button
                type="button"
                onClick={handleSendCode}
                disabled={!email.trim() || isSendingOtp}
                className={`mt-4 ${PRIMARY_BTN}`}
              >
                {isSendingOtp ? "Sending…" : "Send me a code"}
                {!isSendingOtp && <ArrowRight />}
              </button>

              <button type="button" onClick={() => setStep("method")} className={`mt-5 w-full text-center ${QUIET_LINK}`}>
                Other sign-in options
              </button>
            </motion.div>
          )}

          {/* ---------- Step 3/4: the code ---------- */}
          {step === "otp" && (
            <motion.div key="otp" {...cardMotion} className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setCode("");
                }}
                className={`flex items-center gap-2 ${QUIET_LINK}`}
              >
                <ArrowLeft /> Change email
              </button>

              <div className="mt-5 flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-neon-cyan/30 bg-neon-cyan/10">
                  <MailIcon className="h-7 w-7 text-neon-cyan" />
                </div>

                <h2 className="mt-5 text-3xl font-bold text-white">Check your inbox</h2>
                <p className="mt-2 text-[15px] text-muted-foreground">
                  6-digit code sent to <span className="font-medium text-white">{email}</span>
                </p>

                <div className="mt-6">
                  <InputOTP
                    maxLength={6}
                    value={code}
                    autoFocus
                    onChange={(value) => {
                      setCode(value);
                      // Submit as soon as the last digit lands.
                      if (value.length === 6) handleVerify(value);
                    }}
                  >
                    <InputOTPGroup className="gap-2">
                      {[0, 1, 2].map((i) => (
                        <OtpSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                    <span className="mx-2 h-px w-3 bg-white/25" />
                    <InputOTPGroup className="gap-2">
                      {[3, 4, 5].map((i) => (
                        <OtpSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <button
                  type="button"
                  onClick={() => handleVerify()}
                  disabled={code.length !== 6 || isVerifying}
                  className={`mt-6 ${PRIMARY_BTN}`}
                >
                  {isVerifying ? "Verifying…" : "Verify email"}
                  {!isVerifying && <ArrowRight />}
                </button>

                <p className="mt-5 text-sm text-muted-foreground">
                  Didn&apos;t get it?{" "}
                  {resendIn > 0 ? (
                    <span>Resend in {resendIn}s</span>
                  ) : (
                    <button type="button" onClick={handleResend} disabled={isResending} className="cursor-pointer font-medium text-neon-purple transition-opacity hover:opacity-80 disabled:cursor-not-allowed">
                      {isResending ? "Sending…" : "Resend now"}
                    </button>
                  )}
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

/** Circular code box, styled to match the rest of the flow. */
function OtpSlot({ index }: { index: number }) {
  return (
    <InputOTPSlot
      index={index}
      className="h-12 w-12 rounded-full border border-white/15 bg-white/[0.04] text-lg text-white first:rounded-l-full last:rounded-r-full data-[active=true]:border-neon-purple data-[active=true]:ring-0"
    />
  );
}

/* ---------- Inline icons (keeps this page free of icon-set churn) ---------- */

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
