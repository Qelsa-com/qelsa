"use client";

import { useParseResume } from "@/features/api/onboardingApi";
import { authClient } from "@/lib/auth-client";
import { toastUnknownError } from "@/lib/errors";
import { clearResumeDraft, emptyParsedProfile, type ParsedProfile, type ResumeDraft } from "@/lib/resumeDraft";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ResumeParsing } from "./ResumeParsing";
import { ResumeReview } from "./ResumeReview";
import { ResumeUpload } from "./ResumeUpload";

export function ResumeOnboardingFlow({
  lockedEmail,
  initial,
  onBack,
  onFinished,
  onSkip,
}: {
  lockedEmail?: string;
  initial?: ResumeDraft | null;
  onBack?: () => void;
  onFinished: (result: { profile: ParsedProfile; storageId?: string; filename?: string }) => Promise<void> | void;
  onSkip?: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"upload" | "parsing" | "review">(initial?.reviewed ? "review" : "upload");
  const [file, setFile] = useState<File | null>(null);
  const [profile, setProfile] = useState<ParsedProfile>(initial?.profile ?? emptyParsedProfile());
  const [storageId, setStorageId] = useState<string | undefined>(initial?.storageId);
  const [filename, setFilename] = useState<string | undefined>(initial?.filename);
  const [saving, setSaving] = useState(false);
  const [parseResume] = useParseResume();

  const handleSignOut = async () => {
    clearResumeDraft();
    await authClient.signOut();
    router.push("/auth");
  };

  const handleRead = async () => {
    if (!file) return;
    setStep("parsing");
    try {
      const result = await parseResume(file).unwrap();
      setProfile({
        ...emptyParsedProfile(),
        ...result.profile,
        experiences: result.profile.experiences ?? [],
        educations: result.profile.educations ?? [],
        skills: result.profile.skills ?? [],
      });
      setStorageId(result.storageId);
      setFilename(result.filename);
      setStep("review");
    } catch (err) {
      setStep("upload");
      toastUnknownError(err, "Could not read that resume. Try another PDF, DOCX, or image.");
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await onFinished({ profile, storageId, filename });
    } catch (err) {
      toastUnknownError(err, "Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (step === "parsing") return <ResumeParsing />;
  if (step === "review") {
    return (
      <ResumeReview
        profile={profile}
        lockedEmail={lockedEmail}
        onChange={setProfile}
        onBack={() => setStep("upload")}
        onContinue={handleFinish}
        isSaving={saving}
      />
    );
  }

  return (
    <ResumeUpload
      file={file}
      onFile={setFile}
      onContinue={handleRead}
      onSkip={onSkip}
      onBack={onBack}
      onSignOut={handleSignOut}
    />
  );
}
