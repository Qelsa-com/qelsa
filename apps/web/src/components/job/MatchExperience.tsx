"use client";

import { MatchChatThread } from "@/components/job/MatchChatThread";
import { ArrowLeft, Check, Minus, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";

type Analysis = {
  overall: number;
  headline: string;
  strong: string[];
  partial: string[];
  missing: string[];
  experience_match: number;
  education_match: number;
  domain_match: number;
  responsibilities_match: number;
  resume_evidence: string[];
  actions: string[];
  can_apply: string;
};

export type MatchSession = {
  id: string;
  source: "qelsa" | "external";
  job_id?: string;
  title: string;
  company?: string;
  location?: string;
  analysis: Analysis;
};

function ringColor(score: number) {
  if (score >= 85) return "#10b981";
  if (score >= 70) return "#00d4ff";
  return "#f59e0b";
}

function MatchRing({ value }: { value: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, value)) / 100);
  const color = ringColor(value);
  return (
    <div className="relative size-[112px] shrink-0">
      <svg className="size-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-white">{value}%</span>
        <span className="text-[10px] uppercase tracking-wide text-white/45">match</span>
      </div>
    </div>
  );
}

function Dimension({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/60">{label}</span>
        <span className="font-semibold text-white">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-neon-cyan" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function ChipList({
  icon,
  label,
  items,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  items: string[];
  tone: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-1.5 text-xs font-semibold ${tone}`}>
        {icon}
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className="rounded-full border border-glass-border bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/80">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function MatchExperience({ session }: { session: MatchSession }) {
  const router = useRouter();
  const analysis = session.analysis;

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 px-4 pb-28 pt-6 text-white sm:px-6 lg:px-10">
      <button
        onClick={() =>
          router.push(session.source === "qelsa" && session.job_id ? `/jobs/${session.job_id}` : "/jobs/match")
        }
        className="flex w-fit items-center gap-2 text-sm text-white/70 hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Back
      </button>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neon-purple">
            <Sparkles className="size-3.5" />
            Check My Match
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">{session.title}</h1>
          <p className="mt-1 text-sm text-white/60">
            {[session.company, session.location].filter(Boolean).join(" · ") || "External job"}
          </p>
        </div>
        <span className="rounded-full border border-glass-border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/50">
          {session.source === "qelsa" ? "Qelsa job" : "External JD"}
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(280px,380px)_1fr] lg:items-start">
        <aside className="flex flex-col gap-4 rounded-[20px] border border-glass-border bg-white/[0.03] p-5">
          <div className="flex items-center gap-4">
            <MatchRing value={analysis.overall} />
            <p className="text-sm leading-relaxed text-white/80">{analysis.headline}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Dimension label="Experience" value={analysis.experience_match} />
            <Dimension label="Education" value={analysis.education_match} />
            <Dimension label="Domain" value={analysis.domain_match} />
            <Dimension label="Responsibilities" value={analysis.responsibilities_match} />
          </div>

          <ChipList icon={<Check className="size-3.5" />} label="Strong matches" items={analysis.strong} tone="text-neon-green" />
          <ChipList icon={<Minus className="size-3.5" />} label="Partial matches" items={analysis.partial} tone="text-neon-yellow" />
          <ChipList icon={<X className="size-3.5" />} label="Missing skills" items={analysis.missing} tone="text-orange-400" />

          {analysis.resume_evidence.length > 0 && (
            <div className="space-y-2 border-t border-white/10 pt-3">
              <p className="text-xs font-semibold text-white/70">Resume evidence</p>
              <ul className="space-y-1.5 text-xs leading-relaxed text-white/60">
                {analysis.resume_evidence.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis.actions.length > 0 && (
            <div className="space-y-2 border-t border-white/10 pt-3">
              <p className="text-xs font-semibold text-white/70">What to do next</p>
              <ul className="space-y-1.5 text-xs leading-relaxed text-white/80">
                {analysis.actions.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs leading-relaxed text-white/55">{analysis.can_apply}</p>
        </aside>

        <section className="flex min-h-[520px] flex-col overflow-hidden rounded-[20px] border border-glass-border bg-white/[0.03]">
          <MatchChatThread sessionId={session.id} />
        </section>
      </div>
    </div>
  );
}
