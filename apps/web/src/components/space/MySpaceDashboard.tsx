"use client";

import {
  CompanyLogo,
  MatchRing,
  displayCompanyName,
  displayLocation,
  matchScore,
  timeAgo,
} from "@/components/job/jobBrowseShared";
import { cn } from "@/components/ui/utils";
import { formatCity } from "@/constants/city";
import { useAuth } from "@/contexts/AuthContext";
import { useGetDashboardSummaryQuery, type DashboardSummary } from "@/features/api/dashboardApi";
import { useGetExperiencesQuery } from "@/features/api/experiencesApi";
import { useMatchTiersQuery } from "@/features/api/jobsApi";
import { useGetMyResumesQuery } from "@/features/api/resumeApi";
import { useGetUserSkillsQuery } from "@/features/api/userSkillsApi";
import { GOAL_EXPERIENCE_OPTIONS, goalTimelineLabel, hasCareerGoal } from "@/lib/careerGoal";
import type { CareerGoal } from "@/types/careerGoal";
import type { Job } from "@/types/job";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Plus,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, type ReactNode } from "react";

type MatchTier = "ready" | "almost" | "growth";
type MatchRowData = { job: Job; tier: MatchTier };
type ChecklistItem = { id: string; label: string; done: boolean; href: string };
type HeroState = "profile" | "goal" | "no-matches" | "matches";
type HeroContent = {
  eyebrow: string;
  title: string;
  body: string;
  primaryLabel: string;
  primaryHref: string;
  secondary?: { label: string; href?: string; prompt?: string };
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  applied: { label: "In review", className: "border-neon-cyan/25 bg-neon-cyan/[0.08] text-neon-cyan" },
  viewed: { label: "Viewed", className: "border-neon-cyan/20 bg-neon-cyan/[0.06] text-neon-cyan/80" },
  shortlisted: { label: "Shortlisted", className: "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-300" },
  sorted: { label: "Shortlisted", className: "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-300" },
  hold: { label: "On hold", className: "border-amber-400/25 bg-amber-400/[0.08] text-amber-300" },
  rejected: { label: "Not selected", className: "border-rose-400/20 bg-rose-400/[0.06] text-rose-300" },
  cancelled: { label: "Withdrawn", className: "border-white/10 bg-white/[0.03] text-white/40" },
};

function statusMeta(status: string) {
  return STATUS_META[status] ?? { label: status.replace(/_/g, " "), className: "border-white/10 bg-white/[0.03] text-white/45" };
}

export function MySpaceDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const { data: experiences } = useGetExperiencesQuery(undefined, { skip: !isAuthenticated });
  const { data: skills } = useGetUserSkillsQuery(undefined, { skip: !isAuthenticated });
  const { data: resumes } = useGetMyResumesQuery(undefined, { skip: !isAuthenticated });
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummaryQuery({ skip: !isAuthenticated });
  const { data: matchData, isLoading: matchesLoading } = useMatchTiersQuery(undefined, { skip: !isAuthenticated });

  const firstName = user?.name?.trim().split(/\s+/)[0] || "there";
  const goal = user?.career_goal ?? null;
  const goalReady = hasCareerGoal(goal);
  const hasProfile = Boolean(user?.has_profile);
  const profileDataLoading = resumes === undefined || skills === undefined || experiences === undefined;
  const location = user?.city ? formatCity(user.city) : null;

  const targetRoles = useMemo(() => {
    if (!goal) return [];
    const roleSet = new Set<string>();
    for (const role of [goal.target_role, ...(goal.target_roles ?? [])]) {
      const trimmed = role?.trim();
      if (trimmed) roleSet.add(trimmed);
    }
    return Array.from(roleSet);
  }, [goal]);
  const targetRole = targetRoles[0] ?? null;

  const checklist = useMemo<ChecklistItem[]>(
    () => [
      {
        id: "resume",
        label: "Add a resume",
        done: Boolean(resumes?.length),
        href: "/profile/edit?section=media",
      },
      {
        id: "headline",
        label: "Write a headline",
        done: Boolean(user?.headline?.trim()),
        href: "/profile/edit?section=summary",
      },
      {
        id: "summary",
        label: "Add a professional summary",
        done: Boolean(user?.professional_summary?.trim() || user?.about?.trim()),
        href: "/profile/edit?section=summary",
      },
      {
        id: "experience",
        label: "Add work experience",
        done: Boolean(experiences?.length),
        href: "/profile/work-experience",
      },
      {
        id: "skills",
        label: "Add your skills",
        done: Boolean(skills?.length),
        href: "/profile/skills",
      },
      {
        id: "goal",
        label: "Set a career goal",
        done: goalReady,
        href: "/goals",
      },
    ],
    [experiences, goalReady, resumes, skills, user],
  );
  const completedCount = checklist.filter((item) => item.done).length;
  const profilePercent = checklist.length ? Math.round((completedCount / checklist.length) * 100) : 0;
  const profileComplete = !profileDataLoading && completedCount === checklist.length;
  const nextProfileItems = checklist.filter((item) => !item.done).slice(0, 3);

  const rankedMatches = useMemo<MatchRowData[]>(() => {
    if (!matchData) return [];
    return [
      ...matchData.ready.map((job) => ({ job, tier: "ready" as const })),
      ...matchData.almost.map((job) => ({ job, tier: "almost" as const })),
      ...(matchData.growth ?? []).map((job) => ({ job, tier: "growth" as const })),
    ].slice(0, 3);
  }, [matchData]);

  const bestMatch = rankedMatches[0];
  const bestScore = bestMatch ? matchScore(bestMatch.job) : null;
  const bestTitle = bestMatch?.job.job_title?.name ?? bestMatch?.job.title ?? null;
  const bestCompany = bestMatch ? displayCompanyName(bestMatch.job.page?.name ?? bestMatch.job.company_name) : null;
  const readyTotal = matchData?.readyTotal ?? 0;
  const nearTotal = matchData?.almostTotal ?? 0;
  const activeApplications = summary?.applicationCounts.active ?? 0;
  const noMatches = !matchesLoading && rankedMatches.length === 0;

  const heroState: HeroState = !hasProfile ? "profile" : !goalReady ? "goal" : noMatches ? "no-matches" : "matches";
  const askPrompt = targetRole
    ? `Review my profile and career goal for ${targetRole} roles. What are the three highest-impact things I should improve?`
    : "Review my profile and help me choose a career goal. What should I focus on next?";

  const goToAgent = (prompt: string) => router.push(`/agent?prompt=${encodeURIComponent(prompt)}`);
  const openJob = (job: Job) => router.push(`/jobs/${job.id}`);

  const hero: HeroContent =
    heroState === "profile"
      ? {
          eyebrow: "Get started",
          title: "Let's build your profile.",
          body: "Add a resume or fill in your experience. Qelsa uses it to match you with roles and show you what to build.",
          primaryLabel: "Build profile",
          primaryHref: "/profile",
          secondary: {
            label: "Ask Qelsa",
            prompt: "Help me build a strong profile for the roles I want. What should I add first?",
          },
        }
      : heroState === "goal"
        ? {
            eyebrow: "One step left",
            title: "Where do you want to go next?",
            body: "Set the role you're aiming for. We'll rank jobs against it and turn your skill gaps into a plan.",
            primaryLabel: "Set career goal",
            primaryHref: "/goals",
            secondary: {
              label: "Ask Qelsa",
              prompt: "Help me choose a career goal based on my experience and skills. Ask me questions and recommend a target role.",
            },
          }
        : heroState === "no-matches"
          ? {
              eyebrow: "Your next move",
              title: "No strong matches yet.",
              body: `We're scanning new roles for ${targetRole ?? "your goal"}. Broaden your goal or browse everything open right now.`,
              primaryLabel: "Browse all jobs",
              primaryHref: "/jobs/all",
              secondary: { label: "Update goal", href: "/goals" },
            }
          : {
              eyebrow: "Your next move",
              title: matchesLoading
                ? "Finding roles that fit you."
                : readyTotal > 0
                  ? `${readyTotal} strong ${readyTotal === 1 ? "match" : "matches"} ready for you.`
                  : nearTotal > 0
                    ? `${nearTotal} near ${nearTotal === 1 ? "match" : "matches"} to explore.`
                    : `${rankedMatches.length} ${rankedMatches.length === 1 ? "role fits" : "roles fit"} your goal.`,
              body: matchesLoading
                ? "Matching your profile and goal against open roles. This only takes a moment."
                : "Matched to your profile and career goal. Open a role to see your fit and next steps.",
              primaryLabel: "See matches",
              primaryHref: "/jobs/smart-matches",
              secondary: { label: "Ask Qelsa", prompt: askPrompt },
            };

  const headerSubtitle =
    goalReady && targetRole
      ? `Aiming for ${targetRole} roles${location ? ` · ${location}` : ""}`
      : "Plan your next move with Qelsa.";

  return (
    <div className="min-h-screen w-full bg-[#06060f]">
      <div className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">My Space</p>
            <h1 className="mt-1.5 text-[26px] font-semibold tracking-tight text-white sm:text-[30px]">
              Welcome back, {firstName}.
            </h1>
            <p className="mt-1 text-sm text-white/45">{headerSubtitle}</p>
          </div>
          <span
            className={cn(
              "inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium",
              profileComplete
                ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300"
                : "border-white/[0.09] bg-white/[0.03] text-white/50",
            )}
          >
            {profileComplete ? <CheckCircle2 className="size-3.5" /> : <span className="size-1.5 rounded-full bg-neon-cyan" />}
            {profileDataLoading ? "Profile —" : profileComplete ? "Profile complete" : `Profile ${profilePercent}%`}
          </span>
        </header>

        <section className="relative mt-6 overflow-hidden rounded-[24px] border border-white/[0.09] bg-[#0a0a14] p-5 sm:p-7">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(34,211,238,0.10),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(124,47,243,0.14),transparent_55%)]" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 max-w-2xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">{hero.eyebrow}</p>
              <h2 className="mt-2 text-[22px] font-semibold leading-tight tracking-tight text-white sm:text-[26px]">
                {hero.title}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/50">{hero.body}</p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => router.push(hero.primaryHref)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#7c2ff3] to-[#d73e9d] px-4 py-2 text-xs font-semibold text-white transition-[filter] hover:brightness-110"
                >
                  {hero.primaryLabel}
                  <ArrowRight className="size-3.5" />
                </button>
                {hero.secondary ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (hero.secondary?.href) router.push(hero.secondary.href);
                      else if (hero.secondary?.prompt) goToAgent(hero.secondary.prompt);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.03] px-4 py-2 text-xs font-medium text-white/65 transition-colors hover:border-white/20 hover:text-white"
                  >
                    {hero.secondary.label}
                    {hero.secondary.href ? <ArrowRight className="size-3.5" /> : <ArrowUpRight className="size-3.5" />}
                  </button>
                ) : null}
              </div>

              {heroState === "matches" ? (
                <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/[0.07] pt-4">
                  <HeroStat label="Strong matches" value={matchesLoading ? null : readyTotal} />
                  <HeroStat label="Near matches" value={matchesLoading ? null : nearTotal} />
                  <HeroStat label="Active applications" value={summaryLoading ? null : activeApplications} />
                </div>
              ) : (
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <SetupStep
                    label="Profile"
                    done={hasProfile}
                    active={heroState === "profile"}
                    onClick={() => router.push("/profile")}
                  />
                  <span className="text-white/20">→</span>
                  <SetupStep
                    label="Career goal"
                    done={goalReady}
                    active={heroState === "goal"}
                    onClick={() => router.push("/goals")}
                  />
                </div>
              )}
            </div>

            {heroState === "matches" && bestScore != null ? (
              <div className="hidden items-center gap-4 md:flex md:flex-col md:items-end">
                <HeroRing value={bestScore} />
                <div className="min-w-0 md:text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">Best match</p>
                  <p className="mt-1 line-clamp-2 max-w-[220px] text-sm font-medium leading-snug text-white/85">{bestTitle}</p>
                  <p className="mt-0.5 max-w-[220px] truncate text-xs text-white/40">{bestCompany}</p>
                </div>
              </div>
            ) : (
              <div className="hidden size-24 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.025] md:flex">
                {heroState === "no-matches" ? (
                  <Search className="size-8 text-white/25" />
                ) : (
                  <Target className="size-9 text-neon-cyan/60" />
                )}
              </div>
            )}
          </div>
        </section>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]">
          <div className="flex flex-col gap-5">
            <TopMatchesCard
              rows={rankedMatches}
              loading={matchesLoading}
              hasProfile={hasProfile}
              goalReady={goalReady}
              onOpenJob={openJob}
              onSeeAll={() => router.push("/jobs/smart-matches")}
              onBuildProfile={() => router.push("/profile")}
              onSetGoal={() => router.push("/goals")}
              onBrowseJobs={() => router.push("/jobs/all")}
            />
            <ApplicationsCard
              summary={summary}
              loading={summaryLoading}
              onViewAll={() => router.push("/jobs/my-jobs/applied")}
              onSaved={() => router.push("/jobs/my-jobs/saved")}
              onOpenJob={(jobId) => router.push(`/jobs/${jobId}`)}
              onFindJobs={() => router.push("/jobs/smart-matches")}
            />
          </div>

          <div className="flex flex-col gap-5">
            <GoalCard
              goal={goal}
              targetRoles={targetRoles}
              onEdit={() => router.push("/goals")}
              onExplore={() => router.push("/jobs/smart-matches")}
            />
            {!profileComplete ? (
              <ProfileStrengthCard
                percent={profilePercent}
                completedCount={completedCount}
                total={checklist.length}
                items={nextProfileItems}
                loading={profileDataLoading}
                onViewProfile={() => router.push("/profile")}
                onOpenItem={(href) => router.push(href)}
              />
            ) : null}
          </div>
        </div>

        <AgentStrip targetRole={targetRole} onPrompt={goToAgent} />
      </div>
    </div>
  );
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[20px] border border-white/[0.08] bg-white/[0.025] p-5", className)}>
      {children}
    </section>
  );
}

function PanelHeader({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/45">
          <Icon className="size-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-[11px] text-white/35">{subtitle}</p> : null}
        </div>
      </div>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-white/40 transition-colors hover:text-neon-cyan"
        >
          {actionLabel}
          <ArrowRight className="size-3" />
        </button>
      ) : null}
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <p className="text-xl font-semibold tabular-nums text-white sm:text-2xl">{value == null ? "—" : value}</p>
      <p className="mt-0.5 text-[10px] font-medium text-white/35 sm:text-[11px]">{label}</p>
    </div>
  );
}

function SetupStep({
  label,
  done,
  active,
  onClick,
}: {
  label: string;
  done: boolean;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors",
        done
          ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300"
          : active
            ? "border-neon-cyan/30 bg-neon-cyan/[0.08] text-neon-cyan"
            : "border-white/[0.1] bg-white/[0.03] text-white/45",
      )}
    >
      <span
        className={cn(
          "flex size-3.5 items-center justify-center rounded-full border",
          done
            ? "border-emerald-400/40 bg-emerald-400/15"
            : active
              ? "border-neon-cyan/50"
              : "border-white/20",
        )}
      >
        {done ? <Check className="size-2.5" /> : active ? <span className="size-1.5 rounded-full bg-current" /> : null}
      </span>
      {label}
    </button>
  );
}

function HeroRing({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  return (
    <div className="relative size-24 shrink-0 sm:size-28">
      <svg className="size-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id="dashboard-match-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="url(#dashboard-match-gradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold tracking-tight text-white sm:text-2xl">{clamped}%</span>
        <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-white/35">Match</span>
      </div>
    </div>
  );
}

function TopMatchesCard({
  rows,
  loading,
  hasProfile,
  goalReady,
  onOpenJob,
  onSeeAll,
  onBuildProfile,
  onSetGoal,
  onBrowseJobs,
}: {
  rows: MatchRowData[];
  loading: boolean;
  hasProfile: boolean;
  goalReady: boolean;
  onOpenJob: (job: Job) => void;
  onSeeAll: () => void;
  onBuildProfile: () => void;
  onSetGoal: () => void;
  onBrowseJobs: () => void;
}) {
  const empty = !hasProfile
    ? { title: "Add your profile to unlock matches.", body: "A resume or a few experience details is all Qelsa needs to start ranking roles.", action: "Build profile", onAction: onBuildProfile }
    : !goalReady
      ? { title: "Set a goal to see roles matched to you.", body: "Tell Qelsa what you're aiming for and we'll rank open roles against it.", action: "Set goal", onAction: onSetGoal }
      : { title: "No matches yet. We're scanning new roles.", body: "Check back soon, or browse everything open right now.", action: "Browse all jobs", onAction: onBrowseJobs };

  return (
    <Panel>
      <PanelHeader
        icon={Sparkles}
        title="Top matches"
        subtitle="Roles aligned to your goal"
        actionLabel={rows.length > 0 ? "See all" : undefined}
        onAction={rows.length > 0 ? onSeeAll : undefined}
      />
      {loading ? (
        <MatchRowsSkeleton />
      ) : rows.length > 0 ? (
        <div className="mt-3 divide-y divide-white/[0.06]">
          {rows.map((row) => (
            <MatchRow key={String(row.job.id)} row={row} onClick={() => onOpenJob(row.job)} />
          ))}
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-white/[0.08] px-4 py-8 text-center">
          <Search className="size-5 text-white/25" />
          <p className="mt-2 text-sm font-medium text-white/70">{empty.title}</p>
          <p className="mt-1 max-w-[280px] text-xs leading-relaxed text-white/35">{empty.body}</p>
          <button type="button" onClick={empty.onAction} className="mt-3 text-xs font-semibold text-neon-cyan transition-opacity hover:opacity-80">
            {empty.action} →
          </button>
        </div>
      )}
    </Panel>
  );
}

function MatchRow({ row, onClick }: { row: MatchRowData; onClick: () => void }) {
  const { job, tier } = row;
  const score = matchScore(job);
  const title = job.job_title?.name ?? job.title;
  const company = displayCompanyName(job.page?.name ?? job.company_name);
  const jobLocation = displayLocation(job);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 py-3 text-left transition-colors first:pt-1 last:pb-1"
    >
      <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04]">
        <CompanyLogo job={job} fallback={<Building2 className="size-4 text-white/35" />} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white/90 transition-colors group-hover:text-white">{title}</p>
        <p className="mt-0.5 truncate text-xs text-white/40">
          {company}
          {jobLocation ? ` · ${jobLocation}` : ""}
        </p>
      </div>
      {score != null ? <MatchRing value={score} label={tier === "ready" ? "Match" : "Near"} /> : null}
      <ChevronRight className="size-4 shrink-0 text-white/15 transition-colors group-hover:text-white/50" />
    </button>
  );
}

function ApplicationsCard({
  summary,
  loading,
  onViewAll,
  onSaved,
  onOpenJob,
  onFindJobs,
}: {
  summary: DashboardSummary | undefined;
  loading: boolean;
  onViewAll: () => void;
  onSaved: () => void;
  onOpenJob: (jobId: string) => void;
  onFindJobs: () => void;
}) {
  const counts = summary?.applicationCounts;
  const latest = summary?.latestApplications ?? [];

  return (
    <Panel>
      <PanelHeader
        icon={Briefcase}
        title="Applications"
        subtitle={counts ? `${counts.total} total` : undefined}
        actionLabel={counts?.total ? "View all" : undefined}
        onAction={counts?.total ? onViewAll : undefined}
      />
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Metric label="Active" value={loading ? null : (counts?.active ?? 0)} tone="cyan" />
        <Metric label="Shortlisted" value={loading ? null : (counts?.shortlisted ?? 0)} tone="emerald" />
        <Metric label="Closed" value={loading ? null : (counts?.closed ?? 0)} tone="muted" />
      </div>

      {loading ? (
        <ApplicationRowsSkeleton />
      ) : latest.length > 0 ? (
        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">Latest</p>
          <div className="mt-2 space-y-2">
            {latest.slice(0, 2).map((application) => (
              <ApplicationRow
                key={application.id}
                application={application}
                onOpen={() => application.jobId && onOpenJob(application.jobId)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-dashed border-white/[0.08] px-3 py-3">
          <p className="text-xs text-white/40">No applications yet.</p>
          <button type="button" onClick={onFindJobs} className="shrink-0 text-xs font-semibold text-neon-cyan transition-opacity hover:opacity-80">
            Find a role →
          </button>
        </div>
      )}

      {summary && summary.savedCount > 0 ? (
        <button
          type="button"
          onClick={onSaved}
          className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-white/35 transition-colors hover:text-white/60"
        >
          Saved roles · {summary.savedCount}
          <ArrowRight className="size-3" />
        </button>
      ) : null}
    </Panel>
  );
}

function Metric({ label, value, tone }: { label: string; value: number | null; tone: "cyan" | "emerald" | "muted" }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5">
      <p
        className={cn(
          "text-lg font-semibold tabular-nums",
          tone === "cyan" ? "text-neon-cyan" : tone === "emerald" ? "text-emerald-300" : "text-white/55",
        )}
      >
        {value == null ? "—" : value}
      </p>
      <p className="mt-0.5 text-[10px] font-medium text-white/35">{label}</p>
    </div>
  );
}

function ApplicationRow({
  application,
  onOpen,
}: {
  application: DashboardSummary["latestApplications"][number];
  onOpen: () => void;
}) {
  const meta = statusMeta(application.status);
  const company = displayCompanyName(application.companyName);
  const ago = timeAgo(application.appliedAt);
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!application.jobId}
      className="group flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-left transition-colors enabled:hover:border-white/[0.12] enabled:hover:bg-white/[0.04] disabled:cursor-default"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-white/85">{application.jobTitle ?? "Role no longer available"}</p>
        <p className="mt-0.5 truncate text-[10px] text-white/35">
          {company}
          {ago ? ` · ${ago}` : ""}
        </p>
      </div>
      <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-medium", meta.className)}>
        {meta.label}
      </span>
    </button>
  );
}

function GoalCard({
  goal,
  targetRoles,
  onEdit,
  onExplore,
}: {
  goal: CareerGoal | null;
  targetRoles: string[];
  onEdit: () => void;
  onExplore: () => void;
}) {
  const experienceLabel = goal
    ? GOAL_EXPERIENCE_OPTIONS.find((option) => option.value === goal.experience_level)?.label
    : undefined;
  const meta = goal
    ? [goalTimelineLabel(goal.timeline), experienceLabel, goal.industries?.slice(0, 2).join(" · ")]
        .filter(Boolean)
        .join(" · ")
    : "";
  const goalSkills = goal?.skills ?? [];
  const extraRoles = targetRoles.slice(1);

  return (
    <Panel>
      <PanelHeader icon={Target} title="Your goal" actionLabel={goal ? "Edit" : "Set goal"} onAction={onEdit} />
      {goal ? (
        <div className="mt-4">
          <p className="text-lg font-semibold leading-snug text-white">{targetRoles[0] ?? goal.target_role}</p>
          {meta ? <p className="mt-1 text-xs text-white/40">{meta}</p> : null}
          {extraRoles.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {extraRoles.slice(0, 3).map((role) => (
                <span
                  key={role}
                  className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/50"
                >
                  {role}
                </span>
              ))}
              {extraRoles.length > 3 ? (
                <span className="px-1 py-0.5 text-[10px] text-white/30">+{extraRoles.length - 3}</span>
              ) : null}
            </div>
          ) : null}
          {goalSkills.length > 0 ? (
            <div className="mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">Skills to build</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {goalSkills.slice(0, 5).map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md border border-neon-cyan/15 bg-neon-cyan/[0.06] px-2 py-1 text-[10px] font-medium text-neon-cyan/80"
                  >
                    {skill}
                  </span>
                ))}
                {goalSkills.length > 5 ? (
                  <span className="px-1 py-1 text-[10px] text-white/30">+{goalSkills.length - 5}</span>
                ) : null}
              </div>
            </div>
          ) : null}
          <button
            type="button"
            onClick={onExplore}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-white/50 transition-colors hover:text-neon-cyan"
          >
            Explore matched roles
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-white/[0.08] px-3 py-4">
          <p className="text-xs leading-relaxed text-white/45">Set a goal to rank jobs against what you want next.</p>
          <button type="button" onClick={onEdit} className="mt-2 text-xs font-semibold text-neon-cyan transition-opacity hover:opacity-80">
            Set your goal →
          </button>
        </div>
      )}
    </Panel>
  );
}

function ProfileStrengthCard({
  percent,
  completedCount,
  total,
  items,
  loading,
  onViewProfile,
  onOpenItem,
}: {
  percent: number;
  completedCount: number;
  total: number;
  items: ChecklistItem[];
  loading: boolean;
  onViewProfile: () => void;
  onOpenItem: (href: string) => void;
}) {
  return (
    <Panel>
      <PanelHeader icon={TrendingUp} title="Profile strength" actionLabel="View profile" onAction={onViewProfile} />
      {loading ? (
        <ProfileStrengthSkeleton />
      ) : (
        <>
          <div className="mt-4 flex items-end justify-between">
            <p className="text-3xl font-semibold tracking-tight text-white">{percent}%</p>
            <p className="text-[11px] text-white/35">
              {completedCount} of {total} complete
            </p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple transition-[width] duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-4 space-y-0.5">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpenItem(item.href)}
                className="group flex w-full items-center gap-2.5 rounded-lg px-1.5 py-2 text-left transition-colors hover:bg-white/[0.04]"
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-white/[0.12] text-white/30 transition-colors group-hover:border-neon-cyan/40 group-hover:text-neon-cyan">
                  <Plus className="size-3" />
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-white/75">{item.label}</span>
                <ChevronRight className="size-3.5 shrink-0 text-white/15 transition-colors group-hover:text-white/45" />
              </button>
            ))}
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-white/30">A complete profile improves your match quality.</p>
        </>
      )}
    </Panel>
  );
}

function AgentStrip({ targetRole, onPrompt }: { targetRole: string | null; onPrompt: (prompt: string) => void }) {
  const prompts = [
    { label: "What should I improve?", prompt: targetRole ? `Review my profile and career goal for ${targetRole} roles. What are the three highest-impact things I should improve?` : "Review my profile and help me choose a career goal. What should I focus on next?" },
    { label: "Find roles for me", prompt: targetRole ? `Find jobs that match my profile and career goal for ${targetRole}.` : "Find jobs that match my profile and career goal." },
    { label: "Prep an application", prompt: "Help me prepare an application for a role that fits my profile and career goal." },
  ];

  return (
    <section className="relative mt-5 overflow-hidden rounded-[20px] border border-white/[0.08] bg-white/[0.025] p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,47,243,0.12),transparent_55%)]" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-neon-purple/20 bg-gradient-to-br from-neon-cyan/10 to-neon-purple/20 text-neon-cyan">
            <Bot className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Need a second opinion?</p>
            <p className="mt-0.5 text-xs text-white/40">Qelsa can review your fit, find roles, or prep an application.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {prompts.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onPrompt(item.prompt)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.09] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-white/60 transition-colors hover:border-neon-cyan/30 hover:text-white"
            >
              {item.label}
              <ArrowUpRight className="size-3" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function MatchRowsSkeleton() {
  return (
    <div className="mt-3 space-y-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 py-2">
          <div className="size-10 animate-pulse rounded-xl bg-white/[0.05]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/5 animate-pulse rounded bg-white/[0.06]" />
            <div className="h-2.5 w-1/3 animate-pulse rounded bg-white/[0.04]" />
          </div>
          <div className="size-11 animate-pulse rounded-full bg-white/[0.04]" />
        </div>
      ))}
    </div>
  );
}

function ApplicationRowsSkeleton() {
  return (
    <div className="mt-4 space-y-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="h-12 animate-pulse rounded-xl bg-white/[0.04]" />
      ))}
    </div>
  );
}

function ProfileStrengthSkeleton() {
  return (
    <div className="mt-4 space-y-3">
      <div className="h-8 w-24 animate-pulse rounded bg-white/[0.06]" />
      <div className="h-1.5 animate-pulse rounded-full bg-white/[0.06]" />
      <div className="space-y-2 pt-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-7 animate-pulse rounded bg-white/[0.04]" />
        ))}
      </div>
    </div>
  );
}
