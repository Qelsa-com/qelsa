import { jobSkillTypeLabel, JobSkillType, proficiencyBadgeLabel } from "@/constants/skills";
import { Competency, CompetencyItem } from "@/types/competency";
import { ChevronRight, Sparkles, Zap } from "lucide-react";

function statusOf(item: CompetencyItem): "match" | "exceeds" | "gap" {
  const s = (item.status || "").toLowerCase();
  if (s === "exceeds") return "exceeds";
  if (s === "gap") return "gap";
  if (s === "match") return "match";
  return item.matched ? "match" : "gap";
}

/** On the candidate's profile, with or without a level (older payloads lack `has_skill`). */
function hasCandidate(item: CompetencyItem) {
  return item.has_skill ?? (!!item.candidate_proficiency || item.matched);
}

function typeBadgeClass(t?: JobSkillType) {
  if (t === "core") return "border-amber-500/40 bg-amber-500/10 text-amber-400";
  if (t === "preferred") return "border-amber-500/40 bg-amber-500/10 text-amber-400";
  return "border-white/10 bg-white/[0.04] text-white/60";
}

/** Compact match indicator for job list / similar cards. Renders nothing when competency is absent. */
export function CompetencySummary({ competency, className = "" }: { competency?: Competency | null; className?: string }) {
  if (!competency) return null;
  const { readiness, matchedCount, totalCount, competencies } = competency;
  const missing = (competencies || []).filter((c) => !hasCandidate(c)).map((c) => c.skill_name);

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-glass-border overflow-hidden">
          <div className="h-full rounded-full bg-neon-cyan" style={{ width: `${Math.max(0, Math.min(100, readiness))}%` }} />
        </div>
        <span className="text-xs font-semibold text-neon-cyan">{readiness}%</span>
        <span className="inline-flex items-center rounded border border-neon-cyan/30 text-[10px] text-neon-cyan px-1.5 py-0.5 whitespace-nowrap">
          {matchedCount}/{totalCount} skills
        </span>
      </div>
      {missing.length > 0 && (
        <p className="text-[11px] text-muted-foreground truncate">
          You&apos;re missing: {missing.slice(0, 3).join(", ")}
          {missing.length > 3 ? "…" : ""}
        </p>
      )}
    </div>
  );
}

function FitRing({ value, label = "Ready" }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const r = 50;
  const c = 2 * Math.PI * r;
  const strokeOffset = c * (1 - pct / 100);

  const gradientColors =
    pct >= 80
      ? { start: "#10b981", end: "#22c55e" }
      : pct >= 60
      ? { start: "#f59e0b", end: "#f97316" }
      : { start: "#f97316", end: "#ef4444" };

  return (
    <div className="relative size-32 shrink-0">
      <svg width="128" height="128" viewBox="0 0 120 120" className="-rotate-90">
        <defs>
          <linearGradient id="readiness-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradientColors.start} />
            <stop offset="100%" stopColor={gradientColors.end} />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" className="stroke-white/10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          stroke="url(#readiness-ring-grad)"
          strokeDasharray={c}
          strokeDashoffset={strokeOffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold text-white leading-none">{pct}%</span>
        <span className="mt-1 text-xs font-medium text-white/60">{label}</span>
      </div>
    </div>
  );
}

function MatchBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <span className="text-white/70">{label}</span>
        <span className="font-semibold text-neon-cyan">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full bg-neon-cyan transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function CompetencyRow({ item }: { item: CompetencyItem }) {
  const candidate = hasCandidate(item);
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap min-w-0">
        <span className="text-sm font-semibold text-white">{item.skill_name}</span>
        {candidate ? (
          <span className="inline-flex items-center rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs font-medium text-cyan-400">
            You: {proficiencyBadgeLabel(item.candidate_proficiency) || "On profile"}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs font-medium text-white/50">
            Not listed
          </span>
        )}
        <span className="inline-flex items-center rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs font-medium text-white/70">
          Target: {proficiencyBadgeLabel(item.required_proficiency) || "Any level"}
        </span>
      </div>
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium shrink-0 ${typeBadgeClass(item.type)}`}>
        {jobSkillTypeLabel(item.type)}
      </span>
    </div>
  );
}

function GroupHeader({ dotClass, label }: { dotClass: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`size-2 rounded-full ${dotClass}`} />
      <h5 className="text-sm font-semibold text-white">{label}</h5>
    </div>
  );
}

/** Full seeker-side "How you fit this role" panel for the job detail page. Renders nothing when competency is absent. */
export function CompetencyTable({
  competency,
  overallMatch,
  experienceMatch,
  educationMatch,
  onAskQelsa,
}: {
  competency?: Competency | null;
  overallMatch?: number | null;
  experienceMatch?: number | null;
  educationMatch?: number | null;
  onAskQelsa?: () => void;
}) {
  if (!competency) return null;
  const { readiness, matchedCount, totalCount, competencies = [] } = competency;

  const notListed = competencies.filter((c) => !hasCandidate(c));
  const withCandidate = competencies.filter(hasCandidate);
  const gaps = withCandidate.filter((c) => statusOf(c) === "gap");
  const strong = withCandidate.filter((c) => statusOf(c) !== "gap");

  const skillsMatch = totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 0;
  const resolvedExpMatch = experienceMatch != null ? Math.round(experienceMatch) : competency.experienceScore != null ? Math.round(competency.experienceScore) : 0;
  const resolvedEduMatch = educationMatch != null ? Math.round(educationMatch) : competency.educationScore != null ? Math.round(competency.educationScore) : 0;

  return (
    <div className="glass border border-glass-border rounded-2xl p-4 sm:p-6 lg:p-7 space-y-6">
      <div className="flex items-center gap-2">
        <Zap className="size-5 shrink-0 text-neon-purple" />
        <h3 className="text-lg lg:text-xl font-bold text-white">How you fit this role</h3>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
        <FitRing value={readiness} label="Ready" />
        <div className="flex-1 w-full space-y-3.5">
          <MatchBar label="Skills Match" value={skillsMatch} />
          <MatchBar label="Experience Match" value={resolvedExpMatch} />
          <MatchBar label="Education Match" value={resolvedEduMatch} />
        </div>
      </div>

      {/* Grouped competencies */}
      {strong.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-glass-border">
          <GroupHeader dotClass="bg-emerald-400" label="Where you're already strong" />
          <div className="divide-y divide-glass-border">
            {strong.map((c) => (
              <CompetencyRow key={c.skill_id} item={c} />
            ))}
          </div>
        </div>
      )}

      {gaps.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-glass-border">
          <GroupHeader dotClass="bg-amber-400" label={`${gaps.length} skill${gaps.length === 1 ? "" : "s"} to close the gap`} />
          <div className="divide-y divide-glass-border">
            {gaps.map((c) => (
              <CompetencyRow key={c.skill_id} item={c} />
            ))}
          </div>
        </div>
      )}

      {notListed.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-glass-border">
          <GroupHeader dotClass="bg-white/40" label="Not on your resume yet" />
          <div className="divide-y divide-glass-border">
            {notListed.map((c) => (
              <CompetencyRow key={c.skill_id} item={c} />
            ))}
          </div>
        </div>
      )}

      {/* Why these levels section */}
      {onAskQelsa ? (
        <div className="border-t border-glass-border pt-4">
          <button
            type="button"
            onClick={onAskQelsa}
            className="group flex w-full items-center gap-4 rounded-2xl border border-neon-purple/30 bg-neon-purple/[0.06] p-4 text-left transition-colors hover:bg-neon-purple/[0.1] sm:p-5"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-neon-purple/25 bg-neon-purple/20 text-neon-purple">
              <Sparkles className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-bold text-white">Ask Qelsa why</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-white/50">
                Explains each target level and how to reach it
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-white/35 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
