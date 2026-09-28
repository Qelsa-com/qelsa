"use client";

import { useParseResume } from "@/features/api/onboardingApi";
import { toastUnknownError } from "@/lib/errors";
import { emptyParsedProfile, type ParsedProfile } from "@/lib/resumeDraft";
import { Award, BookOpen, Briefcase, FileUp, GraduationCap, Heart, Languages, Pencil, Sparkles, Tag, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { ResumeParsing } from "../onboarding/ResumeParsing";
import { ResumeReview } from "../onboarding/ResumeReview";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ProfileEmptyStateProps {
  userName?: string;
  /** Called after resume is reviewed + saved. Should persist the profile. */
  onResumeSaved: (result: { profile: ParsedProfile; storageId?: string; filename?: string }) => Promise<void> | void;
  /** Navigate to manually edit profile */
  onManualEdit: () => void;
  /** Called when the user wants to add a specific section manually */
  onAddSection?: (section: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Empty section card data                                            */
/* ------------------------------------------------------------------ */

const EMPTY_SECTIONS: { id: string; icon: typeof Briefcase; title: string; description: string }[] = [
  { id: "experience", icon: Briefcase, title: "Work Experience", description: "Show where you've worked and what you've accomplished." },
  { id: "skills", icon: Tag, title: "Skills & Expertise", description: "Highlight the skills that make you stand out to recruiters." },
  { id: "education", icon: GraduationCap, title: "Education", description: "Add your degrees and where you studied." },
  { id: "certifications", icon: Award, title: "Certifications", description: "Show your professional certifications and credentials." },
  { id: "languages", icon: Languages, title: "Languages", description: "Let recruiters know what languages you speak." },
  { id: "interests", icon: Heart, title: "Interests", description: "Share topics you're passionate about." },
];

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function ProfileEmptyState({ userName, onResumeSaved, onManualEdit, onAddSection }: ProfileEmptyStateProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<"idle" | "parsing" | "review">("idle");
  const [profile, setProfile] = useState<ParsedProfile>(emptyParsedProfile());
  const [storageId, setStorageId] = useState<string | undefined>();
  const [filename, setFilename] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [parseResume] = useParseResume();

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      setFile(selectedFile);
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
        setStep("idle");
        toastUnknownError(err, "Could not read that resume. Try another PDF, DOCX, or image.");
      }
    },
    [parseResume],
  );

  const handleFinish = useCallback(async () => {
    setSaving(true);
    try {
      await onResumeSaved({ profile, storageId, filename });
    } catch (err) {
      toastUnknownError(err, "Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [onResumeSaved, profile, storageId, filename]);

  /* Resume parsing screen */
  if (step === "parsing") return <ResumeParsing />;

  /* Resume review screen */
  if (step === "review") {
    return (
      <ResumeReview
        profile={profile}
        onChange={setProfile}
        onBack={() => setStep("idle")}
        onContinue={handleFinish}
        isSaving={saving}
      />
    );
  }

  /* Main empty state */
  return (
    <div className="space-y-6">
      {/* Resume upload card */}
      <section className="rounded-[16px] border border-white/12 bg-white/4 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.25)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-neon-purple/20 to-neon-pink/20">
            <Sparkles className="h-5 w-5 text-neon-purple" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Create your profile from a resume</h2>
            <p className="text-sm text-white/50">Review and edit everything before it is added to your profile</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7c2ff3] to-[#d73e9d] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Upload className="h-4 w-4" />
            Upload resume
          </button>
          <button
            type="button"
            onClick={onManualEdit}
            className="flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/4 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            <Pencil className="h-4 w-4" />
            Do it manually
          </button>
        </div>
      </section>

      {/* Empty section cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {EMPTY_SECTIONS.map((section) => (
          <EmptySectionCard
            key={section.id}
            icon={<section.icon className="h-5 w-5 text-white/30" />}
            title={section.title}
            description={section.description}
            onAdd={onAddSection ? () => onAddSection(section.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty section card                                                 */
/* ------------------------------------------------------------------ */

function EmptySectionCard({
  icon,
  title,
  description,
  onAdd,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onAdd?: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[16px] border border-dashed border-white/10 bg-white/[0.02] p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04]">{icon}</div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-white/40">{description}</p>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="mt-2 flex items-center gap-1 text-xs font-medium text-neon-cyan transition-opacity hover:opacity-80"
          >
            <span className="text-sm leading-none">+</span> Add
          </button>
        )}
      </div>
    </div>
  );
}
