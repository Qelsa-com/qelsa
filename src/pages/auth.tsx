import { useGoogleLoginMutation } from "@/features/api/authApi";
import { useGoogleLogin } from "@react-oauth/google";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";

export default function AuthPage() {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [googleLogin, { isLoading: isGoogleLoading }] = useGoogleLoginMutation();

  const googleOAuthLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const userInfo = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      }).then((r) => r.json());
      handleGoogleLogin(userInfo);
    },
    onError: () => toast.error("Google sign-in failed"),
  });

  // Get query params from Next.js
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const jobTitle = searchParams.get("jobTitle") || undefined;
  const jobCompany = searchParams.get("jobCompany") || undefined;
  const actionType = searchParams.get("actionType") || undefined;
  const returnUrl = searchParams.get("returnUrl") || undefined;

  // // Redirect if already authenticated
  // useEffect(() => {
  //   if (isAuthenticated) {
  //     router.push("/onboarding/resume-upload", {
  //       state: { jobTitle, jobCompany, returnUrl },
  //     });
  //   }
  // }, [isAuthenticated, router, jobTitle, jobCompany, returnUrl]);

  const getActionText = () => {
    switch (actionType) {
      case "apply":
        return "apply to this job";
      case "save":
        return "save this job";
      case "follow":
        return "follow this company";
      case "share":
        return "share this job";
      default:
        return "create your account";
    }
  };

  const handleSendOtp = async () => {
    if (!emailOrPhone) {
      toast.error(`Please enter your ${authMethod}`);
      return;
    }

    // Validate email/phone format
    if (authMethod === "email" && !emailOrPhone.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (authMethod === "phone" && emailOrPhone.replace(/\D/g, "").length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);

    // Mock OTP send
    setTimeout(() => {
      setIsLoading(false);
      setShowOtpInput(true);
      setResendTimer(30);
      toast.success(`OTP sent to your ${authMethod}`);

      // Start resend timer
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 1500);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }

    setIsLoading(true);

    try {
      // Mock OTP verification
      // await quickAuth?.(emailOrPhone, otp, authMethod);
      toast.success("Verified successfully!");

      // Navigate to resume upload
      router.push("/onboarding/resume-upload");
    } catch (error) {
      toast.error("Invalid OTP. Please try again.");
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (decodedCredential: any) => {
    const { name, email, picture } = decodedCredential;
    const { data } = await googleLogin({ name, email, picture });
    console.log("🚀 ~ handleGoogleLogin ~ data:", data);

    if (data && data.user) {
      setTimeout(async () => {
        toast.success("Signed in with Google!");
        router.push(returnUrl || "/");
      }, 500);
    } else {
      toast.error("Google sign-in failed");
      setIsLoading(false);
      return;
    }
  };

  const handleResendOtp = () => {
    if (resendTimer > 0) return;
    handleSendOtp();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="glass-strong border-glass-border rounded-2xl p-8">
          {returnUrl && (
            <button onClick={() => router.push(returnUrl)} className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
          )}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full glass-strong border-2 border-neon-cyan/30 mb-4">
              <Mail className="w-8 h-8 text-neon-cyan" />
            </div>
            <h1 className="text-3xl bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent mb-2">Continue to {getActionText()}</h1>
            <p className="text-muted-foreground">
              {jobTitle ? (
                <>
                  Create your Qelsa profile to apply for <span className="text-white">{jobTitle}</span>
                  {jobCompany && (
                    <>
                      {" "}
                      at <span className="text-neon-cyan">{jobCompany}</span>
                    </>
                  )}
                </>
              ) : (
                "Create your Qelsa profile in seconds"
              )}
            </p>
          </div>
          {/* Google Sign In */}
          <Button type="button" onClick={() => googleOAuthLogin()} className="w-full glass border-glass-border hover:bg-white/10 h-12 mb-6" disabled={isGoogleLoading}>
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </>
            )}
          </Button>{/* Divider */}
          {/* <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-glass-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="glass px-3 text-muted-foreground">Or use</span>
            </div>
          </div> */}
          {/* Email/Phone Tabs */}
          {/* <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as "email" | "phone")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 glass mb-6">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-4">
              {!showOtpInput ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      className="glass border-glass-border h-12"
                      disabled={isLoading}
                      onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                    />
                  </div>
                  <Button onClick={handleSendOtp} className="w-full gradient-animated h-12" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        Get OTP
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Enter 6-digit OTP</Label>
                    <p className="text-sm text-muted-foreground mb-4">We sent a code to {emailOrPhone}</p>
                    <div className="flex justify-center">
                      <InputOTP value={otp} onChange={setOtp} maxLength={6}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} className="glass border-glass-border" />
                          <InputOTPSlot index={1} className="glass border-glass-border" />
                          <InputOTPSlot index={2} className="glass border-glass-border" />
                          <InputOTPSlot index={3} className="glass border-glass-border" />
                          <InputOTPSlot index={4} className="glass border-glass-border" />
                          <InputOTPSlot index={5} className="glass border-glass-border" />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>

                  <Button onClick={handleVerifyOtp} className="w-full gradient-animated h-12" disabled={isLoading || otp.length !== 6}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify & Continue"
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0}
                    className="w-full text-sm text-center text-muted-foreground hover:text-neon-cyan transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowOtpInput(false);
                      setOtp("");
                    }}
                    className="w-full text-sm text-center text-muted-foreground hover:text-white transition-colors"
                  >
                    Change {authMethod}
                  </button>
                </>
              )}
            </TabsContent>

            <TabsContent value="phone" className="space-y-4">
              {!showOtpInput ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      className="glass border-glass-border h-12"
                      disabled={isLoading}
                      onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                    />
                  </div>
                  <Button onClick={handleSendOtp} className="w-full gradient-animated h-12" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        Get OTP
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Enter 6-digit OTP</Label>
                    <p className="text-sm text-muted-foreground mb-4">We sent a code to {emailOrPhone}</p>
                    <div className="flex justify-center">
                      <InputOTP value={otp} onChange={setOtp} maxLength={6}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} className="glass border-glass-border" />
                          <InputOTPSlot index={1} className="glass border-glass-border" />
                          <InputOTPSlot index={2} className="glass border-glass-border" />
                          <InputOTPSlot index={3} className="glass border-glass-border" />
                          <InputOTPSlot index={4} className="glass border-glass-border" />
                          <InputOTPSlot index={5} className="glass border-glass-border" />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>

                  <Button onClick={handleVerifyOtp} className="w-full gradient-animated h-12" disabled={isLoading || otp.length !== 6}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify & Continue"
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0}
                    className="w-full text-sm text-center text-muted-foreground hover:text-neon-cyan transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowOtpInput(false);
                      setOtp("");
                    }}
                    className="w-full text-sm text-center text-muted-foreground hover:text-white transition-colors"
                  >
                    Change {authMethod}
                  </button>
                </>
              )}
            </TabsContent>
          </Tabs> */}
          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            By continuing, you agree to Qelsa&apos;s{" "}
            <button type="button" className="text-neon-cyan hover:underline">
              Terms of Service
            </button>{" "}
            and{" "}
            <button type="button" className="text-neon-cyan hover:underline">
              Privacy Policy
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
