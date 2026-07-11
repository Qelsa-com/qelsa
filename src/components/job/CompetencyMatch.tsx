import { jobSkillTypeLabel, JobSkillType, proficiencyLabel } from "@/constants/skills";
import { Competency, CompetencyItem } from "@/types/competency";
import { Zap } from "lucide-react";
import { Badge } from "../ui/badge";

function statusOf(item: CompetencyItem): "match" | "exceeds" | "gap" {
  const s = (item.status || "").toLowerCase();
  if (s === "exceeds") return "exceeds";
  if (s === "gap") return "gap";
  if (s === "match") return "match";
  return item.matched ? "match" : "gap";
}

function hasCandidate(item: CompetencyItem) {
  return !!item.candidate_proficiency;
}

function typeBadgeClass(t?: JobSkillType) {
  if (t === "core") return "border-orange-500/40 text-orange-400";
  if (t === "preferred") return "border-neon-yellow/40 text-neon-yellow";
  return "border-glass-border text-muted-foreground";
}

/** Compact match indicator for job list / similar cards. Renders nothing when competency is absent. */
export function CompetencySummary({ competency, className = "" }: { competency?: Competency | null; className?: string }) {
  if (!competency) return null;
  const { readiness, matchedCount, totalCount, competencies } = competency;
  const missing = (competencies || []).filter((c) => statusOf(c) === "gap").map((c) => c.skill_name);

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-glass-border overflow-hidden">
          <div className="h-full rounded-full bg-neon-cyan" style={{ width: `${Math.max(0, Math.min(100, readiness))}%` }} />
        </div>
        <span className="text-xs font-semibold text-neon-cyan">{readiness}%</span>
        <Badge variant="outline" className="text-[10px] border-neon-cyan/30 text-neon-cyan whitespace-nowrap">
          {matchedCount}/{totalCount} skills
        </Badge>
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

function FitRing({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-32 h-32 flex-shrink-0">
      <svg width="128" height="128" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="12" className="stroke-white/10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          className="stroke-neon-cyan"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{pct}%</span>
        <span className="text-xs text-muted-foreground">Your fit</span>
      </div>
    </div>
  );
}

function MatchBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold text-neon-cyan">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-glass-border overflow-hidden">
        <div className="h-full rounded-full bg-neon-cyan" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function CompetencyRow({ item }: { item: CompetencyItem }) {
  const candidate = hasCandidate(item);
  return (
    <div className="flex items-center gap-3 flex-wrap py-2.5 border-b border-glass-border last:border-0">
      <span className="text-sm font-semibold text-white w-32 flex-shrink-0 truncate">{item.skill_name}</span>
      <div className="flex items-center gap-2 flex-wrap">
        {candidate ? (
          <Badge variant="outline" className="text-xs border-neon-cyan/40 text-neon-cyan">
            You: {proficiencyLabel(item.candidate_proficiency)}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs border-glass-border text-muted-foreground">
            Not listed
          </Badge>
        )}
        <Badge variant="outline" className="text-xs border-glass-border text-muted-foreground">
          Target: {proficiencyLabel(item.required_proficiency)}
        </Badge>
      </div>
      <Badge variant="outline" className={`text-xs ml-auto ${typeBadgeClass(item.type)}`}>
        {jobSkillTypeLabel(item.type)}
      </Badge>
    </div>
  );
}

function GroupHeader({ dotClass, label }: { dotClass: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${dotClass}`} />
      <h5 className="text-sm font-semibold text-white">{label}</h5>
    </div>
  );
}

/** Full seeker-side "How you fit this role" panel for the job detail page. Renders nothing when competency is absent. */
export function CompetencyTable({ competency }: { competency?: Competency | null }) {
  if (!competency) return null;
  const { readiness, matchedCount, totalCount, competencies = [] } = competency;

  // Group by resume presence + gap/strong
  const notListed = competencies.filter((c) => !hasCandidate(c));
  const withCandidate = competencies.filter(hasCandidate);
  const gaps = withCandidate.filter((c) => statusOf(c) === "gap");
  const strong = withCandidate.filter((c) => statusOf(c) !== "gap");

  const skillsMatch = totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 0;

  return (
    <div className="glass border border-glass-border rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-neon-purple" />
        <h3 className="text-xl font-bold text-white">How you fit this role</h3>
      </div>

      {/* Summary: ring + bars */}
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <FitRing value={readiness} />
        <div className="flex-1 w-full space-y-4">
          <MatchBar label="Skills Match" value={skillsMatch} />
        </div>
      </div>

      {/* Grouped competencies */}
      {gaps.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-glass-border">
          <GroupHeader dotClass="bg-orange-500" label={`${gaps.length} skill${gaps.length === 1 ? "" : "s"} to close the gap`} />
          <div>
            {gaps.map((c) => (
              <CompetencyRow key={c.skill_id} item={c} />
            ))}
          </div>
        </div>
      )}

      {strong.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-glass-border">
          <GroupHeader dotClass="bg-neon-cyan" label="Where you're already strong" />
          <div>
            {strong.map((c) => (
              <CompetencyRow key={c.skill_id} item={c} />
            ))}
          </div>
        </div>
      )}

      {notListed.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-glass-border">
          <GroupHeader dotClass="bg-muted-foreground" label="Not on your resume yet" />
          <div>
            {notListed.map((c) => (
              <CompetencyRow key={c.skill_id} item={c} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
