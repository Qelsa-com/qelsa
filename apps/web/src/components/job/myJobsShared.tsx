"use client";

/**
 * Shared shell for the "my jobs" tracking pages (Saved / In Progress / Applied).
 *
 * All three screens share the same chrome: a "Back to jobs" breadcrumb, the
 * "Job opportunities" title block, search input, primary tabs (Smart Matches | All Jobs | My Jobs),
 * metric cards (Total Applied | Viewed), and the sub-tab filter pills (Saved | In Progress | Applied).
 *
 * Reference: saved-jobs-screen.png (Linear QEL-53)
 */

import { SkillOverflowTags } from "@/components/skills/SkillOverflowTags";
import { formatCity } from "@/constants/city";
import { MAX_VISIBLE_SKILLS, skillRoleSubtitle } from "@/constants/skills";
import { useAuth } from "@/contexts/AuthContext";
import { useGetAppliedJobsQuery, useGetInProgressJobsQuery, useGetSavedJobsQuery } from "@/features/api/jobsApi";
import { Job } from "@/types/job";
import { JobApplication, JobApplicationStatus } from "@/types/jobApplication";
import { ArrowLeft, Building2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { navigateBackFromMyJobs } from "@/lib/jobNavigation";
import { ReactNode, useMemo } from "react";
import { experienceChip, MatchRing, matchScore, salaryText, TabButton, timeAgo, workplaceChip, workTypeChip } from "./jobBrowseShared";

export type MyJobsTab = "saved" | "in_progress" | "applied";

export const MY_JOBS_TABS: { id: MyJobsTab; label: string; href: string }[] = [
  { id: "saved", label: "Saved", href: "/jobs/my-jobs/saved" },
  { id: "in_progress", label: "In Progress", href: "/jobs/my-jobs/inProgress" },
  { id: "applied", label: "Applied", href: "/jobs/my-jobs/applied" },
];

/** Statuses that can only be reached after a recruiter opened the application. */
export const SEEN_STATUSES: JobApplicationStatus[] = ["viewed", "sorted", "hold", "rejected"];

export function wasViewed(application: JobApplication): boolean {
  if (SEEN_STATUSES.includes(application.status)) return true;
  return (application.jobApplicationLogs ?? []).some((log) => SEEN_STATUSES.includes(log.new_status));
}

interface MyJobsHeaderProps {
  activeTab: MyJobsTab;
  query: string;
  setQuery: (v: string) => void;
  onSearch: () => void;
  searchPlaceholder?: string;
  /** Optional metric cards shown under the title. */
  stats?: { label: string; value: string | number }[];
  /** Optional per-tab counts. Automatically computed from queries if omitted. */
  counts?: Partial<Record<MyJobsTab, number>>;
}

export function MyJobsHeader({
  activeTab,
  query,
  setQuery,
  onSearch,
  searchPlaceholder = "Search jobs by title, skill, or company...",
  stats,
  counts = {},
}: MyJobsHeaderProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const { data: appliedData } = useGetAppliedJobsQuery(undefined, { skip: !isAuthenticated });
  const { data: savedData } = useGetSavedJobsQuery(undefined, { skip: !isAuthenticated });
  const { data: inProgressData } = useGetInProgressJobsQuery(undefined, { skip: !isAuthenticated });

  const applications = useMemo(() => (appliedData ?? []).filter((row) => row.job), [appliedData]);
  const defaultTotalApplied = applications.length;
  const defaultViewed = useMemo(() => applications.filter(wasViewed).length, [applications]);

  const defaultSavedCount = (savedData ?? []).length;
  const defaultInProgressCount = (inProgressData ?? []).length;

  const resolvedStats = stats ?? [
    { label: "Total Applied", value: defaultTotalApplied },
    { label: "Viewed", value: defaultViewed },
  ];

  const resolvedCounts: Record<MyJobsTab, number | undefined> = {
    saved: counts.saved ?? defaultSavedCount,
    in_progress: counts.in_progress ?? defaultInProgressCount,
    applied: counts.applied ?? defaultTotalApplied,
  };

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      {/* Breadcrumb */}
      <button onClick={() => navigateBackFromMyJobs(router)} className="flex w-fit items-center gap-2 text-sm text-white/70 transition-colors hover:text-white">
        <ArrowLeft className="size-4" />
        Back to jobs
      </button>

      {/* Title row */}
      <div className="flex flex-wrap items-start justify-between gap-5 sm:gap-4">
        <div className="flex flex-col gap-2 sm:gap-3">
          <h1 className="text-[30px] font-extrabold text-white sm:text-4xl md:text-5xl">Job opportunities</h1>
          <p className="text-sm text-white/70 sm:text-lg">Find your next career move with AI-powered matching</p>
        </div>
        {/* Posting and managing are recruiter-only — hidden for candidates. */}
        {isAuthenticated && user?.account_type === "recruiter" && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => router.push("/jobs/create-job")}
              className="rounded-full gradient-primary px-4 py-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 sm:px-6 sm:py-3 sm:text-sm"
            >
              Post job
            </button>
            <button
              onClick={() => router.push("/jobs/posted")}
              className="rounded-full border border-white/20 px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-white/5 sm:px-6 sm:py-3 sm:text-sm"
            >
              <span className="sm:hidden">Manage</span>
              <span className="hidden sm:inline">Manage job post</span>
            </button>
          </div>
        )}
      </div>

      {/* Full-width Search */}
      <div className="flex h-11 items-center gap-2.5 rounded-xl border border-glass-border bg-white/[0.04] px-4 sm:h-14 sm:gap-3 sm:rounded-[28px] sm:px-5">
        <Search className="size-4 shrink-0 text-white/45 sm:size-5" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          placeholder={searchPlaceholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/45 focus:outline-none sm:text-[15px]"
        />
      </div>

      {/* Primary tabs row: Smart Matches | All Jobs | My Jobs */}
      <div className="flex items-center gap-2 sm:gap-0">
        <TabButton active={false} label="Smart Matches" onClick={() => router.push("/jobs/smart-matches")} />
        <TabButton active={false} label="All Jobs" onClick={() => router.push("/jobs/all")} />
        <TabButton active={true} label="My Jobs" onClick={() => router.push("/jobs/my-jobs/saved")} />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {resolvedStats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-1 rounded-2xl border border-glass-border bg-white/[0.03] p-5">
            <span className="text-xs text-white/45">{stat.label}</span>
            <span className="text-3xl font-bold text-white">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Sub-tabs / filter pills row */}
      <div className="flex flex-wrap items-center gap-3">
        {MY_JOBS_TABS.map((tab) => {
          const active = tab.id === activeTab;
          const count = resolvedCounts[tab.id];
          return (
            <button
              key={tab.id}
              onClick={() => router.push(tab.href)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border border-neon-cyan/50 bg-neon-cyan/15 text-neon-cyan"
                  : "border border-glass-border bg-transparent text-white/70 hover:border-white/30 hover:text-white"
              }`}
            >
              {count == null ? tab.label : `${tab.label} (${count})`}
            </button>
          );
        })}
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

/** The job's skill pills. Overflow opens a modal of every skill on the role. */
export function SkillChips({ job, max = MAX_VISIBLE_SKILLS }: { job: Job; max?: number }) {
  const skills = (job.job_skills ?? []).map((s) => s.skill?.name ?? s.title).filter((name): name is string => Boolean(name));
  if (skills.length === 0) return null;

  return (
    <SkillOverflowTags
      skills={skills}
      max={max}
      subtitle={skillRoleSubtitle(job.job_title?.name ?? job.title, job.page?.name || job.company_name)}
      sectionLabel="Skills used"
    />
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
  const savedAgo = job.saved_at ? timeAgo(job.saved_at) : null;

  return (
    <JobCardShell>
      <JobCardHeading job={job} score={matchScore(job)} trailing={menu} />
      <SkillChips job={job} />
      <div className="h-px w-full bg-white/[0.12]" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <TermChips job={job} />
        </div>
        <div className="flex items-center gap-3">
          {savedAgo && <span className="text-xs text-white/45">Saved {savedAgo}</span>}
          <CardAction label={actionLabel} onClick={onAction} />
        </div>
      </div>
    </JobCardShell>
  );
}
