import { useCreateJobApplicationMutation } from "@/features/api/jobApplicationsApi";
import { useCreateResumeMutation } from "@/features/api/resumeApi";
import { Job } from "@/types/job";
import { ScreeningQuestion } from "@/types/question";
import { Resume } from "@/types/resume";
import { Check, CheckCircle2, FileText, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface QuickApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  companyName: string;
  screeningQuestions?: ScreeningQuestion[];
  onSubmit: () => void;
  resumes: Resume[];
}

type Step = "resume" | "questions" | "review" | "success";

const COVER_LETTER_MAX = 2000;
const STEP_LABELS = ["Resume & Cover Letter", "Screening Questions", "Review & Submit"];

export function QuickApplyModal({ isOpen, onClose, job, companyName, screeningQuestions = [], onSubmit, resumes }: QuickApplyModalProps) {
  const router = useRouter();

  const [step, setStep] = useState<Step>("resume");
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [coverLetter, setCoverLetter] = useState("");
  const [consented, setConsented] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [createResume] = useCreateResumeMutation();
  const [createJobApplication, { isLoading: isSubmitting }] = useCreateJobApplicationMutation();

  const [selectedResumeId, setSelectedResumeId] = useState<string | number | null>(resumes?.[0]?.id ?? null);
  const selectedResume = resumes?.find((r) => r.id === selectedResumeId);

  const hasScreeningQuestions = screeningQuestions.length > 0;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("resume");
      setAnswers({});
      setErrors({});
      setCoverLetter("");
      setConsented(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (resumes && resumes.length > 0) {
      setSelectedResumeId((prev) => prev ?? resumes[0].id ?? null);
    }
  }, [resumes]);

  /* ------------------------------ answer helpers ---------------------------- */

  const handleAnswerChange = (questionId: string, value: string | number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (errors[questionId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };

  const validateAnswers = () => {
    const next: Record<string, string> = {};
    screeningQuestions.forEach((question) => {
      if (question.required && (answers[question.id] === undefined || answers[question.id] === "")) {
        next[question.id] = "This question is required";
      }
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const answerDisplay = (question: ScreeningQuestion): string => {
    const value = answers[question.id];
    if (value === undefined || value === "") return "—";
    if (question.type === "yes_no") return value === "yes" ? "Yes" : "No";
    if (question.type === "multiple_choice") {
      const opt = question.options?.find((o) => (typeof o === "string" ? o : o.value) === value);
      if (!opt) return String(value);
      return String(typeof opt === "string" ? opt : opt.title);
    }
    return String(value);
  };

  /* ------------------------------ navigation -------------------------------- */

  const goNextFromResume = () => setStep(hasScreeningQuestions ? "questions" : "review");

  const goNextFromQuestions = () => {
    if (validateAnswers()) setStep("review");
    else toast.error("Please answer all required questions");
  };

  const handleBack = () => {
    if (step === "questions") setStep("resume");
    else if (step === "review") setStep(hasScreeningQuestions ? "questions" : "resume");
  };

  const handleSubmit = async () => {
    if (!selectedResumeId) {
      toast.error("Please select a resume");
      return;
    }
    try {
      await createJobApplication({
        id: job.id,
        applicationData: {
          resume_id: selectedResumeId,
          cover_letter: coverLetter || undefined,
          answers,
        },
      }).unwrap();
      onSubmit?.();
      setStep("success");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to submit application");
    }
  };

  /* -------------------------------- resume ---------------------------------- */

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF or DOC file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setIsUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append("title", file.name);
      formData.append("file", file);
      const created = await createResume(formData as any).unwrap();
      const newId = created?.data?.id;
      if (newId != null) setSelectedResumeId(newId);
      toast.success("Resume uploaded successfully");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save resume entry");
    } finally {
      setIsUploadingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
  };

  if (!isOpen) return null;

  const activeIndex = step === "resume" ? 0 : step === "questions" ? 1 : 2;
  const jobTitle = job.job_title?.name ?? job.title;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[24px] border border-glass-border bg-[#06060f] text-white">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 z-10 flex size-9 items-center justify-center rounded-full border border-glass-border bg-white/[0.04] text-white/70 transition-colors hover:text-white"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        {step === "success" ? (
          <SuccessScreen
            jobTitle={jobTitle ?? "this role"}
            companyName={companyName}
            onViewApplications={() => {
              onClose();
              router.push("/jobs/my-jobs/applied");
            }}
            onBrowseJobs={() => {
              onClose();
              router.push("/jobs/smart_matches");
            }}
          />
        ) : (
          <>
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col gap-10 px-6 pb-12 pt-10 sm:px-10">
                {/* Stepper */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-2">
                    {STEP_LABELS.map((label, i) => {
                      const done = i < activeIndex;
                      const active = i === activeIndex;
                      return (
                        <div key={label} className="flex items-center gap-2">
                          <div
                            className={`flex size-6 shrink-0 items-center justify-center rounded-[12px] text-xs font-bold ${
                              done || active ? "bg-neon-cyan text-[#06060f]" : "border border-glass-border bg-white/[0.04] text-white/45"
                            }`}
                          >
                            {done ? <Check className="size-3" /> : i + 1}
                          </div>
                          <span className={`text-sm ${active ? "font-semibold text-white" : done ? "font-medium text-white/45" : "font-medium text-white/45"}`}>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex h-1 gap-2">
                    {STEP_LABELS.map((label, i) => (
                      <div key={label} className={`h-full flex-1 rounded-[2px] ${i <= activeIndex ? "bg-neon-cyan" : "bg-white/[0.04]"}`} />
                    ))}
                  </div>
                </div>

                {/* Job context */}
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-white/45">Applying for</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-[28px] font-bold leading-tight text-white">{jobTitle}</h2>
                    <span className="rounded-md border border-glass-border bg-white/[0.03] px-2 py-1 text-xs font-semibold text-white/70">{companyName}</span>
                  </div>
                </div>

                {step === "resume" && (
                  <ResumeStep
                    resumes={resumes}
                    selectedResumeId={selectedResumeId}
                    onSelect={setSelectedResumeId}
                    onUploadClick={() => fileInputRef.current?.click()}
                    isUploading={isUploadingResume}
                    coverLetter={coverLetter}
                    onCoverLetterChange={setCoverLetter}
                    companyName={companyName}
                    formatDate={formatDate}
                  />
                )}

                {step === "questions" && (
                  <div className="flex flex-col gap-5 rounded-[20px] border border-glass-border bg-white/[0.04] p-6">
                    <h3 className="text-xl font-semibold text-white">Screening Questions</h3>
                    <div className="flex flex-col gap-8">
                      {screeningQuestions.map((question) => (
                        <QuestionField key={question.id} question={question} value={answers[question.id]} error={errors[question.id]} onChange={handleAnswerChange} />
                      ))}
                    </div>
                  </div>
                )}

                {step === "review" && (
                  <ReviewStep
                    selectedResume={selectedResume}
                    coverLetter={coverLetter}
                    screeningQuestions={screeningQuestions}
                    answerDisplay={answerDisplay}
                    consented={consented}
                    onConsentChange={setConsented}
                    onEditResume={() => setStep("resume")}
                    onEditQuestions={() => setStep("questions")}
                  />
                )}
              </div>
            </div>

            {/* Action bar */}
            <div className="flex items-center justify-between border-t border-glass-border bg-[#06060f]/95 px-6 py-5 backdrop-blur-[10px] sm:px-10">
              <button onClick={step === "resume" ? onClose : handleBack} disabled={isSubmitting} className="text-base font-semibold text-white/70 transition-colors hover:text-white disabled:opacity-50">
                {step === "resume" ? "Cancel" : "Back"}
              </button>

              {step === "resume" && (
                <button onClick={goNextFromResume} disabled={!selectedResumeId} className="gradient-animated rounded-full px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
                  {hasScreeningQuestions ? "Next: Screening Questions" : "Next: Review"}
                </button>
              )}
              {step === "questions" && (
                <button onClick={goNextFromQuestions} className="gradient-animated rounded-full px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90">
                  Next: Review
                </button>
              )}
              {step === "review" && (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !consented || !selectedResumeId}
                  className="gradient-animated inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting && <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </button>
              )}
            </div>
          </>
        )}

        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} disabled={isUploadingResume} className="hidden" />
      </div>
    </div>
  );
}

/* ------------------------------ sub-components ----------------------------- */

function RadioDot({ selected, size = 18 }: { selected: boolean; size?: number }) {
  if (selected) {
    return (
      <span className="flex shrink-0 items-center justify-center rounded-full border-2 border-neon-cyan" style={{ width: size, height: size }}>
        <span className="rounded-full bg-neon-cyan" style={{ width: size * 0.45, height: size * 0.45 }} />
      </span>
    );
  }
  return <span className="shrink-0 rounded-full border-[1.5px] border-white/20" style={{ width: size, height: size }} />;
}

function ResumeStep({
  resumes,
  selectedResumeId,
  onSelect,
  onUploadClick,
  isUploading,
  coverLetter,
  onCoverLetterChange,
  companyName,
  formatDate,
}: {
  resumes: Resume[];
  selectedResumeId: string | number | null;
  onSelect: (id: string | number) => void;
  onUploadClick: () => void;
  isUploading: boolean;
  coverLetter: string;
  onCoverLetterChange: (v: string) => void;
  companyName: string;
  formatDate: (d?: string) => string | null;
}) {
  return (
    <>
      {/* Resume card */}
      <div className="flex flex-col gap-5 rounded-[20px] border border-glass-border bg-white/[0.04] p-6">
        <h3 className="text-xl font-semibold text-white">Resume</h3>
        <div className="flex flex-col gap-3">
          {resumes.length === 0 && <p className="text-sm text-white/45">No saved resumes yet. Upload one to continue.</p>}
          {resumes.map((resume) => {
            const active = resume.id === selectedResumeId;
            const updated = formatDate(resume.updatedAt);
            return (
              <button
                key={resume.id}
                onClick={() => resume.id != null && onSelect(resume.id)}
                className={`flex items-center gap-4 rounded-[12px] border p-4 text-left transition-colors ${
                  active ? "border-neon-cyan bg-neon-cyan/[0.06]" : "border-glass-border bg-white/[0.02] hover:border-neon-cyan/40"
                }`}
              >
                <RadioDot selected={active} size={20} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-[15px] font-semibold text-white">{resume.title}</span>
                  {updated && <span className="text-[13px] text-white/45">Updated {updated}</span>}
                </div>
                {active && <CheckCircle2 className="size-5 shrink-0 text-neon-cyan" />}
              </button>
            );
          })}
        </div>
        <div className="pt-2">
          <button
            onClick={onUploadClick}
            disabled={isUploading}
            className="inline-flex items-center gap-2 rounded-full border border-glass-border px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-neon-cyan/40 disabled:opacity-50"
          >
            {isUploading ? <span className="size-[18px] animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Plus className="size-[18px]" />}
            {isUploading ? "Uploading..." : "Upload New Resume"}
          </button>
        </div>
      </div>

      {/* Cover letter card */}
      <div className="flex flex-col gap-5 rounded-[20px] border border-glass-border bg-white/[0.04] p-6">
        <h3 className="text-xl font-semibold text-white">Cover Letter (Optional)</h3>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-white/70">Introductory Letter</label>
          <textarea
            value={coverLetter}
            maxLength={COVER_LETTER_MAX}
            onChange={(e) => onCoverLetterChange(e.target.value)}
            placeholder={`Explain why you are a great fit for this role at ${companyName}...`}
            className="h-40 resize-none rounded-[12px] border border-glass-border bg-white/[0.02] p-4 text-sm text-white placeholder:text-white/45 focus:border-neon-cyan focus:outline-none"
          />
          <div className="flex justify-end text-xs text-white/45">
            {coverLetter.length} / {COVER_LETTER_MAX}
          </div>
        </div>
      </div>
    </>
  );
}

function QuestionField({
  question,
  value,
  error,
  onChange,
}: {
  question: ScreeningQuestion;
  value: string | number | undefined;
  error?: string;
  onChange: (id: string, value: string | number) => void;
}) {
  const label = (
    <div className="flex items-start gap-1 text-[15px]">
      <span className="font-semibold text-white">{question.title}</span>
      {question.required && <span className="font-normal text-neon-pink">*</span>}
    </div>
  );

  let input: React.ReactNode = null;

  if (question.type === "yes_no") {
    input = (
      <div className="flex gap-6">
        {["yes", "no"].map((v) => (
          <button key={v} onClick={() => onChange(question.id, v)} className="flex items-center gap-2">
            <RadioDot selected={value === v} />
            <span className="text-sm capitalize text-white/70">{v}</span>
          </button>
        ))}
      </div>
    );
  } else if (question.type === "multiple_choice") {
    input = (
      <div className="flex flex-col gap-2">
        {question.options?.map((option, index) => {
          const optValue = typeof option === "string" ? option : option.value;
          const optLabel = typeof option === "string" ? option : option.title;
          const active = value === optValue;
          return (
            <button
              key={(typeof option === "string" ? index : option.id) ?? index}
              onClick={() => onChange(question.id, optValue as string | number)}
              className={`flex items-center gap-3 rounded-[12px] border px-4 py-3 text-left transition-colors ${
                active ? "border-neon-cyan bg-neon-cyan/[0.06]" : "border-glass-border bg-white/[0.02] hover:border-neon-cyan/40"
              }`}
            >
              <RadioDot selected={active} size={20} />
              <span className={`flex-1 text-sm ${active ? "text-white" : "text-white/70"}`}>{optLabel}</span>
            </button>
          );
        })}
      </div>
    );
  } else if (question.type === "scale") {
    const min = question.min_value ?? 1;
    const max = question.max_value ?? 10;
    input = (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((v) => (
          <button
            key={v}
            onClick={() => onChange(question.id, v)}
            className={`size-10 rounded-[12px] border text-sm transition-colors ${
              value === v ? "border-neon-cyan bg-neon-cyan/[0.1] text-neon-cyan" : "border-glass-border bg-white/[0.02] text-white/70 hover:border-neon-cyan/40"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    );
  } else {
    const maxLength = question.max_length ?? 1000;
    const text = String(value ?? "");
    input = (
      <div className="flex flex-col gap-2">
        <textarea
          value={text}
          maxLength={maxLength}
          onChange={(e) => onChange(question.id, e.target.value)}
          placeholder="Type your answer here..."
          className="h-40 resize-none rounded-[12px] border border-glass-border bg-white/[0.02] p-4 text-sm text-white placeholder:text-white/45 focus:border-neon-cyan focus:outline-none"
        />
        <div className="flex justify-end text-xs text-white/45">
          {text.length} / {maxLength}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {label}
      {input}
      {error && <span className="text-xs text-neon-pink">{error}</span>}
    </div>
  );
}

function ReviewStep({
  selectedResume,
  coverLetter,
  screeningQuestions,
  answerDisplay,
  consented,
  onConsentChange,
  onEditResume,
  onEditQuestions,
}: {
  selectedResume?: Resume;
  coverLetter: string;
  screeningQuestions: ScreeningQuestion[];
  answerDisplay: (q: ScreeningQuestion) => string;
  consented: boolean;
  onConsentChange: (v: boolean) => void;
  onEditResume: () => void;
  onEditQuestions: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Resume */}
      <div className="flex flex-col gap-5 rounded-[20px] border border-glass-border bg-white/[0.04] p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Resume</h3>
          <button onClick={onEditResume} className="text-sm text-neon-cyan underline">
            Edit
          </button>
        </div>
        {selectedResume ? (
          <div className="flex items-center gap-3 rounded-[12px] bg-white/[0.02] p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-white/[0.04]">
              <FileText className="size-5 text-neon-cyan" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-white">{selectedResume.title}</p>
            </div>
            <CheckCircle2 className="size-5 shrink-0 text-neon-green" />
          </div>
        ) : (
          <p className="text-sm text-neon-pink">No resume selected.</p>
        )}
      </div>

      {/* Cover Letter */}
      {coverLetter.trim() && (
        <div className="flex flex-col gap-5 rounded-[20px] border border-glass-border bg-white/[0.04] p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Cover Letter</h3>
            <button onClick={onEditResume} className="text-sm text-neon-cyan underline">
              Edit
            </button>
          </div>
          <p className="line-clamp-3 text-sm leading-[22px] text-white/70">{coverLetter}</p>
        </div>
      )}

      {/* Screening Questions */}
      {screeningQuestions.length > 0 && (
        <div className="flex flex-col gap-5 rounded-[20px] border border-glass-border bg-white/[0.04] p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Screening Questions</h3>
            <button onClick={onEditQuestions} className="text-sm text-neon-cyan underline">
              Edit
            </button>
          </div>
          <div className="flex flex-col gap-5">
            {screeningQuestions.map((question) => (
              <div key={question.id} className="flex flex-col gap-1">
                <span className="text-[13px] text-white/45">{question.title}</span>
                <span className="text-[15px] font-semibold text-white">{answerDisplay(question)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Consent */}
      <button onClick={() => onConsentChange(!consented)} className="flex items-center gap-3 pt-2 text-left">
        <span className={`flex size-5 shrink-0 items-center justify-center rounded ${consented ? "bg-neon-cyan" : "border-[1.5px] border-white/20"}`}>
          {consented && <Check className="size-3.5 text-[#06060f]" />}
        </span>
        <span className="text-sm text-white/70">
          I confirm that the information provided is accurate and I agree to the <span className="text-neon-cyan underline">terms of use</span>
        </span>
      </button>
    </div>
  );
}

function SuccessScreen({
  jobTitle,
  companyName,
  onViewApplications,
  onBrowseJobs,
}: {
  jobTitle: string;
  companyName: string;
  onViewApplications: () => void;
  onBrowseJobs: () => void;
}) {
  const nextSteps = [
    "Your application is being reviewed by the hiring team",
    "You will receive an email notification about your application status",
    "If shortlisted, you will be contacted for the next steps",
  ];

  return (
    <div className="flex flex-col items-center gap-12 px-6 py-16 sm:px-10">
      <div className="flex w-full max-w-[560px] flex-col items-center gap-6">
        <div className="flex size-[120px] items-center justify-center rounded-full border-2 border-neon-cyan bg-neon-cyan/10">
          <div className="flex size-16 items-center justify-center rounded-[32px] bg-neon-cyan">
            <Check className="size-8 text-[#06060f]" strokeWidth={3} />
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="text-[32px] font-bold text-white">Application Submitted!</h2>
          <p className="text-lg leading-7 text-white/70">
            Your application for <span className="font-bold text-white">{jobTitle}</span> at {companyName} has been submitted successfully.
          </p>
        </div>
        <div className="flex w-full flex-col gap-4">
          <h3 className="text-lg font-bold text-white">What happens next?</h3>
          <div className="flex flex-col gap-3">
            {nextSteps.map((text, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-[14px] bg-neon-cyan text-[13px] font-bold text-[#06060f]">{i + 1}</div>
                <p className="flex-1 text-base leading-6 text-white/70">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-6">
        <button onClick={onViewApplications} className="gradient-animated rounded-full px-8 py-4 text-base font-bold text-white transition-opacity hover:opacity-90">
          View My Applications
        </button>
        <button onClick={onBrowseJobs} className="text-base font-semibold text-neon-cyan underline">
          Browse More Jobs
        </button>
      </div>
    </div>
  );
}
