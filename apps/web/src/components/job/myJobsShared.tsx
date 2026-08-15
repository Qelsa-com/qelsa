"use client";

/**
 * Shared shell for the "my jobs" tracking pages (Saved / In Progress / Applied).
 *
 * All three screens share the same chrome: a "Back to jobs" breadcrumb, the
 * "Track Applications" title block, a metric row, and the search + sub-tab row.
 * Only the list below it differs per tab, so the chrome lives here.
 *
 * Figma: Qelsa-Screen — saved (649:2560) / in progress (649:2727) / applied (649:2877).
 */

import { formatCity } from "@/constants/city";
import { Job } from "@/types/job";
import { ArrowLeft, Building2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { experienceChip, MatchRing, matchScore, salaryText, workplaceChip, workTypeChip } from "./jobBrowseShared";

export type MyJobsTab = "saved" | "in_progress" | "applied";

const TABS: { id: MyJobsTab; label: string; href: string }[] = [
  { id: "saved", label: "Saved", href: "/jobs/my-jobs/saved" },
  { id: "in_progress", label: "In Progress", href: "/jobs/my-jobs/inProgress" },
  { id: "applied", label: "Applied", href: "/jobs/my-jobs/applied" },
];

interface MyJobsHeaderProps {
  activeTab: MyJobsTab;
  subtitle: string;
  query: string;
  setQuery: (v: string) => void;
  onSearch: () => void;
  searchPlaceholder?: string;
  /** Metric cards shown under the title. */
  stats?: { label: string; value: string | number }[];
  /** Per-tab counts. A tab renders without a count until its page supplies one. */
  counts?: Partial<Record<MyJobsTab, number>>;
}

export function MyJobsHeader({ activeTab, subtitle, query, setQuery, onSearch, searchPlaceholder = "Search applications...", stats = [], counts = {} }: MyJobsHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <button onClick={() => router.push("/jobs/all")} className="flex w-fit items-center gap-2 text-sm text-white/70 transition-colors hover:text-white">
        <ArrowLeft className="size-4" />
        Back to jobs
      </button>

      {/* Title block */}
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-extrabold text-white md:text-5xl">Track Applications</h1>
        <p className="text-lg text-white/70">{subtitle}</p>
      </div>

      {/* Metric row */}
      {stats.length > 0 && (
        <div className="flex flex-wrap gap-5">
          {stats.map((stat) => (
            <div key={stat.label} className="flex min-w-[200px] flex-1 flex-col gap-1.5 rounded-2xl border border-glass-border bg-white/[0.03] p-4">
              <p className="text-xs text-white/45">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search + sub tabs */}
      <div className="flex flex-wrap items-center gap-4 py-3">
        <div className="flex h-12 w-full max-w-[577px] items-center gap-3 rounded-[24px] border border-glass-border px-5">
          <Search className="size-[18px] shrink-0 text-white/45" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            placeholder={searchPlaceholder}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/45 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {TABS.map((tab) => {
            const active = tab.id === activeTab;
            const count = counts[tab.id];
            return (
              <button
                key={tab.id}
                onClick={() => router.push(tab.href)}
                className={`rounded-full px-5 py-2.5 text-sm transition-colors ${
                  active ? "bg-neon-cyan/15 font-semibold text-neon-cyan" : "border border-glass-border font-medium text-white/50 hover:text-white/80"
                }`}
              >
                {count == null ? tab.label : `${tab.label} (${count})`}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- job card --------------------------------- */

/** Card container — the same 20px glass panel on all three tabs. */
export function JobCardShell({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4 rounded-[20px] border border-glass-border bg-white/[0.04] px-7 py-6 transition-colors hover:border-neon-cyan/30">{children}</div>;
}

/** Logo + title (with optional status badge) + company/location/posted, and the match ring. */
export function JobCardHeading({ job, score, badge, trailing }: { job: Job; score: number | null; badge?: ReactNode; trailing?: ReactNode }) {
  const title = job.job_title?.name ?? job.title;
  const company = job.page?.name || job.company_name;
  const logo = job.page?.logo || job.company_logo;

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-glass-border bg-white/[0.04]">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={company ?? "Company"} className="size-full object-cover" />
          ) : (
            <Building2 className="size-5 text-white/70" />
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {badge}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {company && <span className="font-medium text-white/70">{company}</span>}
            {job.city && (
              <>
                <span className="text-white/45">•</span>
                <span className="text-white/45">{formatCity(job.city)}</span>
              </>
            )}
            {job.published_date && (
              <>
                <span className="text-white/45">•</span>
                <span className="text-white/45">Posted {new Date(job.published_date).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {score != null && <MatchRing value={score} />}
        {trailing}
      </div>
    </div>
  );
}

/** The job's skill pills. */
export function SkillChips({ job, max = 6 }: { job: Job; max?: number }) {
  const skills = (job.job_skills ?? []).map((s) => s.skill?.name ?? s.title).filter(Boolean) as string[];
  if (skills.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {skills.slice(0, max).map((skill) => (
        <span key={skill} className="rounded-full border border-glass-border px-2.5 py-1 text-xs text-white/60">
          {skill}
        </span>
      ))}
      {skills.length > max && <span className="rounded-full border border-glass-border px-2.5 py-1 text-xs text-white/45">+{skills.length - max}</span>}
    </div>
  );
}

/** Experience / work type / workplace pills followed by the salary. */
export function TermChips({ job }: { job: Job }) {
  const terms = [experienceChip(job), workTypeChip(job), workplaceChip(job)].filter(Boolean) as string[];
  const salary = salaryText(job);

  return (
    <>
      {terms.map((term) => (
        <span key={term} className="rounded-md border border-glass-border bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-white/70">
          {term}
        </span>
      ))}
      {salary && <span className="text-sm font-semibold text-neon-cyan">{salary}</span>}
    </>
  );
}

/** The gradient pill action ("Apply now" / "Continue" / "View Application"). */
export function CardAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="gradient-primary rounded-full px-5 py-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90">
      {label}
    </button>
  );
}

/**
 * Card used by the Saved and In Progress tabs — identical layout, only the
 * action label differs (Figma: "Apply now" on saved, "Continue" on in progress).
 */
export function TrackedJobCard({ job, actionLabel, onAction, menu }: { job: Job; actionLabel: string; onAction: () => void; menu?: ReactNode }) {
  return (
    <JobCardShell>
      <JobCardHeading job={job} score={matchScore(job)} trailing={menu} />
      <SkillChips job={job} />
      <div className="h-px w-full bg-white/[0.12]" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <TermChips job={job} />
        </div>
        <CardAction label={actionLabel} onClick={onAction} />
      </div>
    </JobCardShell>
  );
}
