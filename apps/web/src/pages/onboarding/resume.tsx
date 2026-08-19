"use client";

import type { ResumeDraft } from "@/features/api/resumeApi";
import { useConfirmProfileMutation, useParseResumeMutation, useUploadResumeMutation } from "@/features/api/resumeApi";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const ACCEPTED_EXT = [".pdf", ".docx"];
const ACCEPTED_MIME = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const errorMessage = (err: unknown, fallback: string) => {
  const m = (err as { data?: { message?: string }; message?: string })?.data?.message || (err as { message?: string })?.message;
  if (!m) return fallback;
  // Convex wraps thrown Errors as "[Request ...] Server Error: Uncaught Error: <msg>".
  const cleaned = m.replace(/^\[.*?\]\s*/, "").replace(/^Server Error:\s*/i, "").replace(/^Uncaught Error:\s*/i, "").trim();
  return cleaned || fallback;
};

type Phase = "upload" | "reading" | "review";

export default function ResumeOnboardingPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [phase, setPhase] = useState<Phase>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [draft, setDraft] = useState<ResumeDraft | null>(null);

  const [uploadResume, { isLoading: isUploading }] = useUploadResumeMutation();
  const [parseResume] = useParseResumeMutation();
  const [confirmProfile, { isLoading: isSaving }] = useConfirmProfileMutation();

  const validateAndSet = (candidate: File) => {
    const name = candidate.name.toLowerCase();
    const extOk = ACCEPTED_EXT.some((ext) => name.endsWith(ext));
    const mimeOk = ACCEPTED_MIME.includes(candidate.type);
    if (!extOk && !mimeOk) {
      toast.error("Please upload a PDF or DOCX file.");
      return;
    }
    if (candidate.size > MAX_BYTES) {
      toast.error("That file is over 10 MB. Please upload a smaller one.");
      return;
    }
    setFile(candidate);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) validateAndSet(dropped);
  };

  const handleReadResume = async () => {
    if (!file) return;
    setPhase("reading");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name);
      const { resume } = await uploadResume(formData).unwrap();
      const { draft: parsed } = await parseResume(resume.id).unwrap();
      setDraft(parsed);
      setPhase("review");
    } catch (err) {
      toast.error(errorMessage(err, "We couldn't read that resume. Please try again."));
      setPhase("upload");
    }
  };

  const handleConfirm = async () => {
    if (!draft) return;
    try {
      await confirmProfile(draft).unwrap();
      router.push("/onboarding/status");
    } catch (err) {
      toast.error(errorMessage(err, "Could not save your profile. Please try again."));
    }
  };

  const formatSize = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

  if (phase === "reading") return <ReadingScreen />;
  if (phase === "review" && draft) return <ReviewScreen draft={draft} setDraft={setDraft} onConfirm={handleConfirm} saving={isSaving} />;

  // ---------- Phase: upload ----------
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10" style={{ background: "var(--background)" }}>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[540px] w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-purple/10 blur-[130px]" />
      </div>

      <div className="w-full max-w-[560px] text-center">
        <Image src="/qelsa-logo.svg" alt="Qelsa" width={91} height={29} priority unoptimized className="mx-auto mb-6 h-[21px] w-auto" />
        <h1 className="text-4xl font-bold text-white">Start with your resume</h1>
        <p className="mt-3 text-[15px] text-gray-500">We read it and fill your profile automatically. Usually under 10 seconds.</p>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(e) => {
            const chosen = e.target.files?.[0];
            if (chosen) validateAndSet(chosen);
            e.target.value = "";
          }}
        />

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`mt-8 flex min-h-[290px] flex-col items-center justify-center rounded-3xl border border-dashed p-8 transition-colors ${
            dragging ? "border-neon-cyan bg-neon-cyan/5" : "border-white/15 bg-white/[0.02]"
          }`}
        >
          {!file ? (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.04]">
                <UploadIcon />
              </div>
              <p className="mt-5 text-[15px] text-white">Drag and drop your resume here</p>
              <p className="my-2 text-sm text-gray-500">or</p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="cursor-pointer rounded-full border border-white/12 bg-white/[0.04] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
              >
                Browse files
              </button>
              <p className="mt-5 text-xs text-gray-500">PDF or DOCX · Max 10 MB</p>
            </>
          ) : (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-neon-cyan/30 bg-neon-cyan/10">
                <FileIcon />
              </div>
              <p className="mt-5 text-[15px] font-medium text-white">{file.name}</p>
              <p className="mt-1 text-sm text-gray-500">{formatSize(file.size)}</p>
              <button type="button" onClick={() => setFile(null)} className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white">
                <CloseIcon /> Remove
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={handleReadResume}
          disabled={!file || isUploading}
          className={`mt-6 flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full text-[15px] font-medium transition-opacity disabled:cursor-not-allowed ${
            file ? "bg-gradient-to-r from-neon-purple to-neon-pink text-white hover:opacity-90" : "bg-white/[0.04] text-gray-500"
          }`}
        >
          {file ? "Read my resume" : "Select a file to continue"}
          {file && <ArrowRight />}
        </button>

        <button
          type="button"
          onClick={() => router.push("/onboarding/status")}
          className="mt-4 cursor-pointer text-sm text-gray-500 transition-colors hover:text-white"
        >
          Maybe I&apos;ll do this later
        </button>
      </div>
    </div>
  );
}

/* ---------- Phase: reading ---------- */

const READING_MESSAGES = ["Reading your contact…", "Reading your experience…", "Reading your education…", "Reading your skills…"];

function ReadingScreen() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % READING_MESSAGES.length), 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-[420px] text-center">
        <Image src="/qelsa-logo.svg" alt="Qelsa" width={91} height={29} priority unoptimized className="mx-auto mb-8 h-[20px] w-auto" />
        <div className="mx-auto flex h-28 w-28 animate-pulse items-center justify-center rounded-full bg-gradient-to-br from-neon-purple to-neon-pink">
          <SparkleIcon />
        </div>
        <p className="mt-8 text-[17px] text-white">{READING_MESSAGES[idx]}</p>
        <div className="mx-auto mt-5 h-1 w-[300px] overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink" style={{ animation: "qelsaProgress 6s ease-in-out forwards" }} />
        </div>
        <p className="mt-4 text-sm text-gray-500">Takes under 10 seconds</p>
      </div>
      <style jsx>{`
        @keyframes qelsaProgress {
          0% { width: 8%; }
          60% { width: 75%; }
          100% { width: 92%; }
        }
      `}</style>
    </div>
  );
}

/* ---------- Phase: review ("Check your details") ---------- */

function ReviewScreen({ draft, setDraft, onConfirm, saving }: { draft: ResumeDraft; setDraft: (d: ResumeDraft) => void; onConfirm: () => void; saving: boolean }) {
  const set = (patch: Partial<ResumeDraft>) => setDraft({ ...draft, ...patch });

  const setExp = (i: number, patch: Partial<ResumeDraft["experience"][number]>) => {
    const experience = draft.experience.map((e, idx) => (idx === i ? { ...e, ...patch } : e));
    set({ experience });
  };
  const addExp = () => set({ experience: [...draft.experience, { company: "", role: "", start_date: "", end_date: "", description: "", responsibilities: [], tools: [] }] });
  const removeExp = (i: number) => set({ experience: draft.experience.filter((_, idx) => idx !== i) });

  const setEdu = (i: number, patch: Partial<ResumeDraft["education"][number]>) => {
    const education = draft.education.map((e, idx) => (idx === i ? { ...e, ...patch } : e));
    set({ education });
  };
  const addEdu = () => set({ education: [...draft.education, { degree: "", field_of_study: "", institution: "", start_year: null, end_year: null }] });
  const removeEdu = (i: number) => set({ education: draft.education.filter((_, idx) => idx !== i) });

  const [skillInput, setSkillInput] = useState("");
  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !draft.skills.includes(s)) set({ skills: [...draft.skills, s] });
    setSkillInput("");
  };
  const removeSkill = (s: string) => set({ skills: draft.skills.filter((x) => x !== s) });

  return (
    <div className="min-h-screen pb-28" style={{ background: "var(--background)" }}>
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/8 bg-[var(--background)]/80 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <Image src="/qelsa-logo.svg" alt="Qelsa" width={70} height={22} priority unoptimized className="h-[16px] w-auto" />
          <span className="text-sm text-gray-500">· Check your details</span>
        </div>
        <span className="text-sm text-gray-500">Click any field to edit</span>
      </div>

      <div className="mx-auto max-w-[640px] space-y-4 px-6 py-8">
        {/* Contact */}
        <Card title="Contact" icon="👤">
          <Field label="Full name" value={draft.full_name} onChange={(v) => set({ full_name: v })} big />
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Field label="Email" value={draft.email} onChange={(v) => set({ email: v })} />
            <Field label="Phone" value={draft.phone} onChange={(v) => set({ phone: v })} />
            <Field label="Location" value={draft.location} onChange={(v) => set({ location: v })} />
            <Field label="LinkedIn" value={draft.linkedin_url} onChange={(v) => set({ linkedin_url: v })} />
          </div>
        </Card>

        {/* Summary */}
        <Card title="Summary" icon="📄">
          <textarea
            value={draft.summary || ""}
            onChange={(e) => set({ summary: e.target.value })}
            placeholder="A brief professional summary highlighting what makes you stand out…"
            rows={3}
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-neon-purple"
          />
        </Card>

        {/* Work Experience */}
        <Card title="Work Experience" icon="💼" action={<AddButton onClick={addExp} />}>
          {draft.experience.length === 0 && <Empty text="No experience found — add a role." />}
          <div className="space-y-3">
            {draft.experience.map((exp, i) => (
              <div key={i} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-2">
                    <Inline value={exp.role} onChange={(v) => setExp(i, { role: v })} placeholder="Role / title" className="font-medium text-white" />
                    <Inline value={exp.company} onChange={(v) => setExp(i, { company: v })} placeholder="Company" className="text-sm text-gray-400" />
                    <div className="flex gap-2">
                      <Inline value={exp.start_date} onChange={(v) => setExp(i, { start_date: v })} placeholder="Start (e.g. Jan 2022)" className="text-xs text-gray-500" />
                      <span className="text-xs text-gray-600">—</span>
                      <Inline value={exp.end_date} onChange={(v) => setExp(i, { end_date: v })} placeholder="End / Present" className="text-xs text-gray-500" />
                    </div>
                    <textarea
                      value={exp.description || ""}
                      onChange={(e) => setExp(i, { description: e.target.value })}
                      placeholder="What you did…"
                      rows={2}
                      className="mt-1 w-full resize-none rounded-lg border border-white/8 bg-transparent px-3 py-2 text-sm text-gray-300 outline-none placeholder:text-gray-600 focus:border-neon-purple"
                    />
                  </div>
                  <button type="button" onClick={() => removeExp(i)} className="cursor-pointer text-gray-500 hover:text-white">
                    <CloseIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Education */}
        <Card title="Education" icon="🎓" action={<AddButton onClick={addEdu} />}>
          {draft.education.length === 0 && <Empty text="No education found — add one." />}
          <div className="space-y-3">
            {draft.education.map((ed, i) => (
              <div key={i} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-2">
                    <Inline value={ed.degree} onChange={(v) => setEdu(i, { degree: v })} placeholder="Degree (e.g. B.S.)" className="font-medium text-white" />
                    <Inline value={ed.field_of_study} onChange={(v) => setEdu(i, { field_of_study: v })} placeholder="Field of study" className="text-sm text-gray-400" />
                    <Inline value={ed.institution} onChange={(v) => setEdu(i, { institution: v })} placeholder="Institution" className="text-sm text-gray-400" />
                    <div className="flex gap-2">
                      <Inline value={ed.start_year ? String(ed.start_year) : ""} onChange={(v) => setEdu(i, { start_year: Number(v) || null })} placeholder="Start year" className="text-xs text-gray-500" />
                      <span className="text-xs text-gray-600">—</span>
                      <Inline value={ed.end_year ? String(ed.end_year) : ""} onChange={(v) => setEdu(i, { end_year: Number(v) || null })} placeholder="End year" className="text-xs text-gray-500" />
                    </div>
                  </div>
                  <button type="button" onClick={() => removeEdu(i)} className="cursor-pointer text-gray-500 hover:text-white">
                    <CloseIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Skills */}
        <Card title="Skills" icon="🏷️">
          <div className="flex flex-wrap gap-2">
            {draft.skills.map((s) => (
              <span key={s} className="flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-sm text-white">
                {s}
                <button type="button" onClick={() => removeSkill(s)} className="cursor-pointer text-gray-500 hover:text-white">
                  <CloseIcon />
                </button>
              </span>
            ))}
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              placeholder="+ Add skill"
              className="min-w-[120px] flex-1 rounded-full border border-dashed border-white/12 bg-transparent px-3 py-1.5 text-sm text-white outline-none placeholder:text-gray-600 focus:border-neon-purple"
            />
          </div>
        </Card>
      </div>

      {/* Sticky continue */}
      <div className="fixed inset-x-0 bottom-0 border-t border-white/8 bg-[var(--background)]/90 px-6 py-4 backdrop-blur">
        <div className="mx-auto max-w-[640px]">
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-neon-purple to-neon-pink text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Looks good, continue"}
            {!saving && <ArrowRight />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Small review-form primitives ---------- */

function Card({ title, icon, action, children }: { title: string; icon: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.015] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>{icon}</span>
          {title}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, big }: { label: string; value: string | null; onChange: (v: string) => void; big?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-gray-500">{label}</span>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2 text-white outline-none focus:border-neon-purple ${big ? "text-lg font-semibold" : "text-sm"}`}
      />
    </label>
  );
}

function Inline({ value, onChange, placeholder, className = "" }: { value: string | null; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <input
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 outline-none placeholder:text-gray-600 hover:border-white/10 focus:border-neon-purple ${className}`}
    />
  );
}

function Empty({ text }: { text: string }) {
  return <p className="mb-3 text-sm text-gray-600">{text}</p>;
}

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="cursor-pointer text-sm font-medium text-neon-purple transition-opacity hover:opacity-80">
      + Add
    </button>
  );
}

/* ---------- Icons ---------- */

function UploadIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400" aria-hidden>
      <path d="M12 16V4M6 10l6-6 6 6" />
      <path d="M4 20h16" />
    </svg>
  );
}
function FileIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-neon-cyan" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
function SparkleIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" />
    </svg>
  );
}
