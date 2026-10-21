"use client";

import { api } from "@/lib/convexApi";
import { uploadFileToR2 } from "@/lib/r2Upload";
import { useMutation } from "convex/react";
import { Check, Download, FileText, Loader2, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { AgentResumeDocument } from "./agentArtifacts";

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "qelsa-resume"
  );
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function ResumeDocumentActions({
  resume,
  jobTitle,
  company,
}: {
  resume: AgentResumeDocument;
  jobTitle?: string;
  company?: string | null;
}) {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const syncMetadata = useMutation(api.files.syncMetadata);
  const createResume = useMutation(api.resumes.create);
  const updateProfile = useMutation(api.users.updateProfile);
  const [busy, setBusy] = useState<string | null>(null);
  const [makeDefault, setMakeDefault] = useState(false);
  const [saved, setSaved] = useState<"pdf" | "docx" | null>(null);
  const titleBase = [resume.name, jobTitle ? `— ${jobTitle}` : "— Tailored resume"].join(" ");
  const title = company ? `${titleBase} · ${company}`.slice(0, 120) : titleBase.slice(0, 120);

  const build = async (format: "pdf" | "docx") => {
    if (format === "pdf") {
      const { renderResumePdf } = await import("./ResumePdfDocument");
      return await renderResumePdf(resume);
    }
    const { renderResumeDocx } = await import("./resumeDocx");
    return await renderResumeDocx(resume);
  };

  const handleDownload = async (format: "pdf" | "docx") => {
    setBusy(`download-${format}`);
    try {
      const blob = await build(format);
      download(blob, `${slugify(title)}.${format}`);
    } catch (error) {
      console.error("Resume export failed", error);
      toast.error("Could not create that file. Try the other format.");
    } finally {
      setBusy(null);
    }
  };

  const handleSave = async (format: "pdf" | "docx") => {
    setBusy(`save-${format}`);
    setSaved(null);
    try {
      const blob = await build(format);
      const file = new File([blob], `${slugify(title)}.${format}`, {
        type:
          format === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const storageId = await uploadFileToR2(generateUploadUrl, syncMetadata, file);
      const created: any = await createResume({ title, storageId });
      const resumeId = created?.resume?.id ?? created?.id;
      if (makeDefault && resumeId) {
        await updateProfile({ updates: { default_resume_id: String(resumeId) } });
      }
      setSaved(format);
      toast.success(
        makeDefault
          ? "Resume saved and set as your default."
          : "Resume saved to your profile. Choose it from Resume & Media.",
      );
    } catch (error) {
      console.error("Resume save failed", error);
      toast.error("Could not save the resume. Try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-2.5 rounded-xl border border-sky-400/20 bg-sky-400/[0.05] p-3">
      <div>
        <p className="text-[12px] font-semibold text-white/85">Download or save this tailored resume</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-white/40">
          Generated from your Qelsa profile. Review it before sending.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void handleDownload("pdf")}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.05] px-3 py-2 text-[11px] font-semibold text-white/75 transition-colors hover:border-white/30 hover:text-white disabled:opacity-50"
        >
          {busy === "download-pdf" ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
          Download PDF
        </button>
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void handleDownload("docx")}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.05] px-3 py-2 text-[11px] font-semibold text-white/75 transition-colors hover:border-white/30 hover:text-white disabled:opacity-50"
        >
          {busy === "download-docx" ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
          Download DOCX
        </button>
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void handleSave("pdf")}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-sky-400/25 bg-sky-400/[0.09] px-3 py-2 text-[11px] font-semibold text-sky-200 transition-colors hover:bg-sky-400/[0.15] disabled:opacity-50"
        >
          {busy === "save-pdf" ? <Loader2 className="size-3.5 animate-spin" /> : saved === "pdf" ? <Check className="size-3.5" /> : <Save className="size-3.5" />}
          Save PDF to profile
        </button>
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void handleSave("docx")}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-sky-400/25 bg-sky-400/[0.09] px-3 py-2 text-[11px] font-semibold text-sky-200 transition-colors hover:bg-sky-400/[0.15] disabled:opacity-50"
        >
          {busy === "save-docx" ? <Loader2 className="size-3.5 animate-spin" /> : saved === "docx" ? <Check className="size-3.5" /> : <Save className="size-3.5" />}
          Save DOCX to profile
        </button>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-[11px] text-white/50">
        <input
          type="checkbox"
          checked={makeDefault}
          onChange={(event) => setMakeDefault(event.target.checked)}
          className="size-3.5 accent-sky-400"
        />
        Set as my default resume when saving
      </label>
      <p className="flex items-center gap-1 text-[10px] text-white/30">
        <FileText className="size-3" />
        Saved files appear in Profile → Resume &amp; Media.
      </p>
    </div>
  );
}
