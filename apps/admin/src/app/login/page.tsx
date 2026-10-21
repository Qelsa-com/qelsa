"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminAuth } from "@/contexts/AuthContext";
import { authClient } from "@/lib/auth-client";
import { ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type LoginMode = "otp" | "password";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = authClient.useSession();
  const { isAdmin, isLoading } = useAdminAuth();

  const [mode, setMode] = useState<LoginMode>("otp");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notAdmin = searchParams.get("error") === "not_admin";

  // An admin who already has a session skips the form entirely.
  useEffect(() => {
    if (!isPending && !isLoading && session && isAdmin) {
      router.replace("/");
    }
  }, [session, isAdmin, isPending, isLoading, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const sendOtp = async () => {
    if (!email.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim(),
        type: "sign-in",
      });
      if (result.error) {
        setError(result.error.message ?? "Could not send the code.");
        return;
      }
      setOtpSent(true);
      setCooldown(30);
    } catch {
      setError("Could not send the code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await authClient.signIn.emailOtp({
        email: email.trim(),
        otp: otp.trim(),
      });
      if (result.error) {
        setError(result.error.message ?? "That code is not valid.");
        return;
      }
      router.replace("/");
    } catch {
      setError("Could not verify that code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const signInWithPassword = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await authClient.signIn.email({ email: email.trim(), password });
      if (result.error) {
        setError(result.error.message ?? "Sign in failed");
        return;
      }
      router.replace("/");
    } catch {
      setError("Sign in failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (mode === "otp") {
      if (otpSent) await verifyOtp();
      else await sendOtp();
      return;
    }
    await signInWithPassword();
  };

  const canSubmit = mode === "otp" ? (otpSent ? Boolean(otp.trim()) : Boolean(email.trim())) : Boolean(email.trim() && password);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#06060f] px-6 text-white">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-neon-purple/20">
            <ShieldCheck className="h-6 w-6 text-neon-cyan" />
          </div>
          <h1 className="text-2xl font-bold">Qelsa Admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in with an admin account to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-glass-border glass p-6">
          {error && <p className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-rose-300">{error}</p>}

          {mode === "otp" && otpSent && (
            <p className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">If this email has admin access, a verification code was sent. Check the inbox for {email}.</p>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (otpSent) {
                    setOtpSent(false);
                    setOtp("");
                  }
                }}
                placeholder="admin@qelsa.ai"
              />
            </div>

            {mode === "otp" && otpSent && (
              <div className="space-y-2">
                <Label htmlFor="otp">Verification code</Label>
                <Input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" />
              </div>
            )}

            {mode === "password" && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" />
              </div>
            )}
          </div>

          <Button type="submit" className="mt-6 w-full rounded-full bg-gradient-to-r from-neon-purple to-neon-pink text-white hover:opacity-90" disabled={isSubmitting || !canSubmit}>
            {isSubmitting ? (mode === "otp" ? (otpSent ? "Verifying…" : "Sending code…") : "Signing in…") : mode === "otp" ? (otpSent ? "Verify and sign in" : "Email me a code") : "Sign in"}
          </Button>

          {mode === "otp" && otpSent && (
            <button
              type="button"
              disabled={isSubmitting || cooldown > 0}
              onClick={() => void sendOtp()}
              className="mt-3 w-full text-center text-xs text-muted-foreground transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setMode((current) => (current === "otp" ? "password" : "otp"));
              setError(null);
            }}
            className="mt-4 w-full text-center text-xs text-muted-foreground transition-colors hover:text-white"
          >
            {mode === "otp" ? "Use a password instead" : "Use an email code instead"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#06060f] text-sm text-muted-foreground">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
