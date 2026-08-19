"use client";

import { useParseResume } from "@/features/api/onboardingApi";
import { emptyParsedProfile, type ParsedProfile, type ResumeDraft } from "@/lib/resumeDraft";
import { useState } from "react";
import { toast } from "sonner";
import { ResumeParsing } from "./ResumeParsing";
import { ResumeReview } from "./ResumeReview";
import { ResumeUpload } from "./ResumeUpload";

export function ResumeOnboardingFlow({
  lockedEmail,
  initial,
  onBack,
  onFinished,
}: {
  lockedEmail?: string;
  initial?: ResumeDraft | null;
  onBack?: () => void;
  onFinished: (result: { profile: ParsedProfile; storageId?: string; filename?: string }) => Promise<void> | void;
}) {
  const [step, setStep] = useState<"upload" | "parsing" | "review">(initial?.reviewed ? "review" : "upload");
  const [file, setFile] = useState<File | null>(null);
  const [profile, setProfile] = useState<ParsedProfile>(initial?.profile ?? emptyParsedProfile());
  const [storageId, setStorageId] = useState<string | undefined>(initial?.storageId);
  const [filename, setFilename] = useState<string | undefined>(initial?.filename);
  const [saving, setSaving] = useState(false);
  const [parseResume] = useParseResume();

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
      toast.error((err as Error)?.message || "Could not read that resume. Try another PDF or DOCX.");
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await onFinished({ profile, storageId, filename });
    } catch (err) {
      toast.error((err as Error)?.message || "Could not save your profile.");
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
        onContinue={handleFinish}
        isSaving={saving}
      />
    );
  }

  return (
    <div>
      <ResumeUpload file={file} onFile={setFile} onContinue={handleRead} />
      {onBack ? (
        <button type="button" onClick={onBack} className="fixed bottom-6 left-1/2 -translate-x-1/2 text-sm text-muted-foreground hover:text-white">
          ← Back
        </button>
      ) : null}
    </div>
  );
}
