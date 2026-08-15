"use client";

import { useStartExternalMatchAction } from "@/features/api/jobsApi";
import { Link as LinkIcon, Sparkles, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function ExternalMatchForm() {
  const router = useRouter();
  const start = useStartExternalMatchAction();
  const [jdText, setJdText] = useState("");
  const [jdUrl, setJdUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("text/") && !file.name.endsWith(".md") && !file.name.endsWith(".txt")) {
      toast.error("Upload a .txt or .md file, or paste the job description.");
      return;
    }
    const text = await file.text();
    setJdText(text);
  };

  const analyze = async () => {
    if (!jdText.trim() && !jdUrl.trim()) {
      toast.error("Paste a job description or add a job URL.");
      return;
    }
    setLoading(true);
    try {
      const session = await start({
        jdText: jdText.trim() || undefined,
        jdUrl: jdUrl.trim() || undefined,
      });
      router.push(`/jobs/match/${session.id}`);
    } catch (err) {
      console.error("External match failed:", err);
      toast.error(err instanceof Error ? err.message : "Could not analyze that job.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-6 px-4 py-8 text-white sm:px-6">
      <div>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neon-purple">
          <Sparkles className="size-3.5" />
          Check My Match
        </p>
        <h1 className="mt-2 text-3xl font-extrabold">Any job, same match coach</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/65">
          Paste a JD, drop a text file, or add a job URL. Qelsa normalizes the role, then opens the same AI Match chat you get on jobs already in Qelsa.
        </p>
      </div>

      <div className="rounded-[20px] border border-glass-border bg-white/[0.03] p-5">
        <label className="mb-2 block text-sm font-semibold text-white">Job description</label>
        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder="Paste the full job description…"
          className="min-h-48 w-full rounded-xl border border-glass-border bg-white/[0.04] p-4 text-sm text-white placeholder:text-white/40 focus:border-neon-cyan focus:outline-none"
        />

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/5">
            <Upload className="size-4" />
            Upload JD file
            <input type="file" accept=".txt,.md,text/plain" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
          </label>
          <div className="flex flex-[2] items-center gap-2 rounded-full border border-glass-border bg-white/[0.04] px-4">
            <LinkIcon className="size-4 shrink-0 text-white/45" />
            <input
              value={jdUrl}
              onChange={(e) => setJdUrl(e.target.value)}
              placeholder="https://company.com/jobs/…"
              className="h-11 w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={() => void analyze()}
          disabled={loading}
          className="mt-5 w-full rounded-full bg-gradient-to-r from-neon-purple to-neon-pink py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
        >
          {loading ? "Analyzing match…" : "Analyze Match"}
        </button>
      </div>
    </div>
  );
}
