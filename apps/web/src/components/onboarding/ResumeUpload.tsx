"use client";

import { FileText, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { ArrowRightIcon } from "./OnboardingShell";
import { PRIMARY_BTN } from "./styles";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT =
  ".pdf,.docx,.png,.jpg,.jpeg,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/webp";

export function ResumeUpload({
  file,
  onFile,
  onContinue,
  disabled,
}: {
  file: File | null;
  onFile: (file: File | null) => void;
  onContinue: () => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const takeFile = (next: File | undefined) => {
    if (!next) return;
    const name = next.name.toLowerCase();
    const allowed =
      name.endsWith(".pdf") ||
      name.endsWith(".docx") ||
      name.endsWith(".png") ||
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg") ||
      name.endsWith(".webp");
    if (!allowed) {
      setError("Use a PDF, DOCX, PNG, or JPG.");
      return;
    }
    if (next.size > MAX_BYTES) {
      setError("File is larger than 10 MB.");
      return;
    }
    setError(null);
    onFile(next);
  };

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-10" style={{ background: "var(--background)" }}>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-24 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-neon-purple/10 blur-[130px]" />
      </div>

      <p className="bg-gradient-to-r from-neon-cyan to-neon-pink bg-clip-text text-2xl font-semibold text-transparent">Qelsa</p>
      <h1 className="mt-10 text-center text-4xl font-bold text-white">Start with your resume</h1>
      <p className="mt-3 max-w-md text-center text-[15px] text-muted-foreground">
        We read it and fill your profile automatically. Usually under 10 seconds.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(event) => takeFile(event.target.files?.[0])}
      />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          takeFile(event.dataTransfer.files?.[0]);
        }}
        className={`mt-10 flex w-full max-w-xl flex-col items-center rounded-3xl border border-dashed px-8 py-14 text-center transition-colors ${
          dragOver || file ? "border-neon-cyan/70 bg-neon-cyan/5" : "border-white/15 bg-white/[0.02]"
        }`}
      >
        {file ? (
          <>
            <FileText className="h-10 w-10 text-neon-cyan" />
            <p className="mt-4 text-lg font-medium text-white">{file.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            <button
              type="button"
              onClick={() => onFile(null)}
              className="mt-4 flex cursor-pointer items-center gap-1 text-sm text-muted-foreground hover:text-white"
            >
              <X className="h-3.5 w-3.5" /> Remove
            </button>
          </>
        ) : (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
              <Upload className="h-7 w-7 text-white" />
            </div>
            <p className="mt-5 text-lg text-white">Drag and drop your resume here</p>
            <p className="mt-3 text-sm text-muted-foreground">or</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-4 cursor-pointer rounded-full border border-white/15 bg-white/[0.04] px-6 py-2.5 text-sm text-white hover:bg-white/[0.08]"
            >
              Browse files
            </button>
            <p className="mt-4 text-sm text-muted-foreground">PDF, DOCX, PNG, or JPG · Max 10 MB</p>
          </>
        )}
      </div>

      {error ? <p className="mt-4 text-sm text-neon-pink">{error}</p> : null}

      <button
        type="button"
        onClick={onContinue}
        disabled={!file || disabled}
        className={`mt-10 w-full max-w-xl ${PRIMARY_BTN} ${!file ? "opacity-40" : ""}`}
      >
        {file ? "Read my resume" : "Select a file to continue"}
        {file ? <ArrowRightIcon /> : null}
      </button>
    </div>
  );
}
