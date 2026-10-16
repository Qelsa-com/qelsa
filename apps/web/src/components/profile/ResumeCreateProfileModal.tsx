"use client";

import { ResumeParsing } from "@/components/onboarding/ResumeParsing";
import { ResumeReview } from "@/components/onboarding/ResumeReview";
import { useAuth } from "@/contexts/AuthContext";
import { useApplyParsedProfileMutation, useParseResume } from "@/features/api/onboardingApi";
import { toastUnknownError } from "@/lib/errors";
import { emptyParsedProfile, type ParsedProfile } from "@/lib/resumeDraft";
import { Sparkles, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".doc", ".png", ".jpg", ".jpeg", ".webp"];

export interface ResumeCreateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFile?: File | null;
  onSuccess?: () => void;
}

export function ResumeCreateProfileModal({
  isOpen,
  onClose,
  initialFile,
  onSuccess,
}: ResumeCreateProfileModalProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"idle" | "upload" | "parsing" | "review">("idle");
  const [dragOver, setDragOver] = useState(false);
  const [profile, setProfile] = useState<ParsedProfile>(emptyParsedProfile());
  const [storageId, setStorageId] = useState<string | undefined>();
  const [filename, setFilename] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const [parseResume] = useParseResume();
  const [applyProfile] = useApplyParsedProfileMutation();

  const handleStartParsing = useCallback(
    async (selectedFile: File) => {
      const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf(".")).toLowerCase();
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        toast.error("Please upload a PDF, DOCX, PNG, or JPG file.");
        setStep("upload");
        return;
      }
      if (selectedFile.size > MAX_BYTES) {
        toast.error("File size must be 10MB or less.");
        setStep("upload");
        return;
      }

      setStep("parsing");

      try {
        const result = await parseResume(selectedFile).unwrap();
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
    },
    [parseResume],
  );

  useEffect(() => {
    if (!isOpen) {
      setStep("idle");
      setProfile(emptyParsedProfile());
      setStorageId(undefined);
      setFilename(undefined);
      return;
    }

    if (initialFile) {
      void handleStartParsing(initialFile);
    } else {
      setStep("upload");
    }
  }, [isOpen, initialFile, handleStartParsing]);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      void handleStartParsing(dropped);
    }
  };

  const handleFinish = useCallback(async () => {
    setSaving(true);
    try {
      await applyProfile({
        profile,
        storage_id: storageId,
        filename,
      }).unwrap();
      toast.success("Profile created from your resume successfully!");
      onSuccess?.();
      onClose();
    } catch (err) {
      toastUnknownError(err, "Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [applyProfile, profile, storageId, filename, onSuccess, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#0a0a0c]">
      {/* Overlay dismiss / close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="fixed right-4 top-4 sm:right-6 sm:top-6 z-40 flex size-9 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/60 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white"
      >
        <X className="size-4" />
      </button>

      {/* Upload step */}
      {step === "upload" && (
        <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-purple/10 blur-[130px]" />
          </div>

          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 border border-white/10">
                <Sparkles className="h-5 w-5 text-neon-purple" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Create your profile from resume</h2>
                <p className="text-xs sm:text-sm text-white/60">Upload your resume to extract skills, experience & education</p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleStartParsing(f);
              }}
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
                dragOver
                  ? "border-neon-purple bg-neon-purple/10"
                  : "border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex size-14 items-center justify-center rounded-full bg-white/[0.05] border border-white/10 text-white/70 mb-3">
                <Upload className="size-6" />
              </div>
              <p className="text-sm font-medium text-white">
                Drag and drop your resume here, or <span className="text-neon-cyan underline">browse</span>
              </p>
              <p className="mt-1 text-xs text-white/45">Supports PDF, DOCX, PNG, JPG (up to 10MB)</p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full bg-gradient-to-r from-[#7c2ff3] to-[#d73e9d] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Choose file
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parsing step */}
      {step === "parsing" && (
        <ResumeParsing showLogo={true} />
      )}

      {/* Review step */}
      {step === "review" && (
        <ResumeReview
          profile={profile}
          lockedEmail={user?.email}
          onChange={setProfile}
          onBack={() => setStep("upload")}
          onContinue={handleFinish}
          isSaving={saving}
        />
      )}
    </div>
  );
}
