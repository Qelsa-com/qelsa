"use client";

/**
 * JobDetail
 *
 * Figma "Job Detail" frame (Qelsa-Screen, node 191:50111) converted to the repo's
 * conventions and wired to live data:
 *  - shadcn-style primitives (Card, Button, Badge, Dialog, Input)
 *  - lucide-react icons; repo tokens (neon-*, .glass, glass-border)
 *  - RTK Query: useGetJobByIdQuery / useGetSimilarJobsQuery / useToggleSaveJobMutation
 *
 * The "How you fit this role" section reuses the existing, data-wired
 * CompetencyTable (job.competency). The Figma's Experience/Education match bars
 * have no backing data in the model and were intentionally dropped.
 */

import { experienceChip, matchScore, salaryText } from "@/components/job/jobBrowseShared";
import { experienceMonths } from "@/components/profile/profileFormat";
import { formatCity } from "@/constants/city";
import { useAuth } from "@/contexts/AuthContext";
import { useGetEducationsQuery } from "@/features/api/educationsApi";
import { useGetExperiencesQuery } from "@/features/api/experiencesApi";
import { useGetJobByIdQuery, useGetMatchByJobQuery, useGetSimilarJobsQuery, useIsJobSavedQuery, useRecordJobViewMutation, useToggleSaveJobMutation } from "@/features/api/jobsApi";
import { useGetMyResumesQuery } from "@/features/api/resumeApi";
import { toastUnknownError } from "@/lib/errors";
import { jobDescriptionToHtml } from "@/lib/jobDescription";
import { Job } from "@/types/job";
import DOMPurify from "dompurify";
import { ArrowLeft, Bookmark, BookmarkCheck, BookOpen, Briefcase, Building2, CheckCircle2, FileText, HelpCircle, Info, Linkedin, Link as LinkIcon, MessageCircle, Share2, Twitter } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { QuickApplyModal } from "../QuickApplyModal";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { CompetencyTable } from "./CompetencyMatch";
import { JobAiSummary } from "./JobAiSummary";
import { MatchChatDrawer } from "./MatchChatDrawer";
import { JobDetailSkeleton, SimilarJobCardSkeleton } from "./jobSkeletons";

/* -------------------------------- helpers --------------------------------- */

/** Primary-action fill — defined once as `.gradient-primary` in globals.css. */
const GRADIENT = "gradient-primary";
const CHIP = "border border-glass-border bg-white/[0.04] rounded-full";

// Feed jobs send experience as a short code; Qelsa-posted jobs send `experience` in years.
function experienceLabel(job: Job): string | null {
  const chip = experienceChip(job);
  if (!chip) return null;
  return chip.replace(" yrs", " Year");
}

/** `work_type` is null on feed jobs — the employment type lives in other_info.types there. */
function jobTypeLabel(job: Job): string | null {
  if (job.work_type) return job.work_type;
  const types = (job.other_info?.types ?? []) as { name?: string }[];
  const names = types.map((t) => t?.name).filter(Boolean) as string[];
  return names.length ? names.join(", ") : null;
}

/** `workplace_type` is only set on Qelsa-posted jobs; feed jobs only carry the has_remote flag. */
function workplaceLabel(job: Job): string | null {
  if (job.workplace_type) return job.workplace_type.charAt(0).toUpperCase() + job.workplace_type.slice(1);
  return job.has_remote ? "Remote" : null;
}

/**
 * The similar-jobs endpoint may send the match score under a few names
 * (`fitScore` is a UI-only field; the API commonly uses snake_case). Read them
 * all defensively and normalise to a rounded 0–100 number.
 */
function similarMatch(job: Job): number | null {
  const fromCompetency = matchScore(job);
  if (fromCompetency != null) return fromCompetency;
  const bag = job as Record<string, unknown>;
  const raw = job.fitScore ?? bag.fit_score ?? bag.match_score ?? bag.matchScore ?? bag.similarity;
  const n = typeof raw === "string" ? Number(raw) : raw;
  return typeof n === "number" && Number.isFinite(n) ? Math.round(n) : null;
}

/** 1240 -> "1.2k", so a busy posting doesn't blow out the metric tile. */
function formatCount(value: number): string {
  if (value < 1000) return `${value}`;
  if (value < 1_000_000) return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0).replace(/\.0$/, "")}k`;
  return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
}

function formatPosted(job: Job): string | null {
  const raw = job.published_date ?? job.createdAt;
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  if (days < 30) return `Posted ${days} days ago`;
  return `Posted ${date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}

function heroBadgesFor(job: Job): string[] {
  return [experienceLabel(job), jobTypeLabel(job), salaryText(job), workplaceLabel(job), formatPosted(job)].filter((b): b is string => Boolean(b));
}

const interviewQuestions = [
  "Explain the difference between controlled and uncontrolled components in React.",
  "How would you optimize a React application's performance?",
  "Describe your experience with state management libraries like Redux or Zustand.",
];

export function JobDetail() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [showQuickApplyModal, setShowQuickApplyModal] = useState(false);
  const [matchOpen, setMatchOpen] = useState(false);

  const { data: job, error, isLoading } = useGetJobByIdQuery(id!, { skip: !id });
  const { data: similarJobs, isLoading: isSimilarLoading } = useGetSimilarJobsQuery(id!, { skip: !id });
  const { data: myResumes } = useGetMyResumesQuery(undefined, { skip: !isAuthenticated });
  const { data: experiences } = useGetExperiencesQuery(undefined, { skip: !isAuthenticated });
  const { data: educations } = useGetEducationsQuery(undefined, { skip: !isAuthenticated });
  const { data: matchSession } = useGetMatchByJobQuery(id, { skip: !isAuthenticated || !id });
  const [toggleSaveJob] = useToggleSaveJobMutation();
  const { data: savedFromServer } = useIsJobSavedQuery(id, { skip: !isAuthenticated || !id });
  const [optimisticSaved, setOptimisticSaved] = useState<boolean | null>(null);
  const saved = optimisticSaved ?? savedFromServer ?? false;

  // Only drop optimistic state once the server agrees — reconnects briefly
  // return undefined and were resetting the button back to "Save job".
  useEffect(() => {
    if (optimisticSaved !== null && savedFromServer === optimisticSaved) {
      setOptimisticSaved(null);
    }
  }, [savedFromServer, optimisticSaved]);

  const handleSave = () => {
    if (!id) return;
    const next = !saved;
    setOptimisticSaved(next);
    void toggleSaveJob(id)
      .then((nowSaved) => {
        if (typeof nowSaved === "boolean") setOptimisticSaved(nowSaved);
      })
      .catch((err) => {
        setOptimisticSaved(null);
        toastUnknownError(err, "Could not save this job. Try again.");
      });
  };
  const [recordJobView] = useRecordJobViewMutation();
  const recordedViewFor = useRef<string | null>(null);

  // Count this visit once the viewer is known. Views are unique per (job, user)
  // server-side, so a reload or a revisit refreshes the timestamp rather than
  // inflating the total; signed-out visits are not counted at all.
  useEffect(() => {
    if (!id || !job || !isAuthenticated) return;
    if (recordedViewFor.current === id) return;
    recordedViewFor.current = id;
    void recordJobView(id).catch(() => {
      if (recordedViewFor.current === id) recordedViewFor.current = null;
    });
  }, [id, isAuthenticated, job, recordJobView]);

  if (!id || isLoading) return <JobDetailSkeleton />;
  if (error) return <p className="p-6 text-white/70 lg:p-8">Error loading job.</p>;
  if (!job) return <p className="p-6 text-white/70 lg:p-8">No job found.</p>;

  const companyName = job.page?.name || job.company_name || "Company";
  const title = job.job_title?.name ?? job.title;
  const description = DOMPurify.sanitize(jobDescriptionToHtml(job.description || ""));
  const applied = job.has_applied ?? job.applications?.some((a) => a.user_id === user?.id) ?? false;
  const competency = job.competency;

  const dailySkills = (job.job_skills ?? []).map((s) => s.skill?.name ?? s.title).filter(Boolean);
  const skillsSubtitle = competency ? `You match ${competency.matchedCount} of ${competency.totalCount} skills listed here.` : "The skills this role uses day to day.";

  const userYears = (experiences ?? []).reduce((sum, exp) => sum + experienceMonths(exp), 0) / 12;
  const experienceMatch = job.experience != null ? (userYears >= job.experience ? Math.min(100, 75 + Math.round((userYears - job.experience) * 4)) : Math.round((userYears / Math.max(job.experience, 0.5)) * 100)) : userYears > 0 ? 72 : null;
  const educationMatch = (educations?.length ?? 0) > 0 ? 68 : null;

  const companyMeta = [job.page?.industry || job.page?.primaryIndustry, job.page?.company_size?.label, job.page?.founded_year ? `Founded ${job.page.founded_year}` : job.page?.foundedYear ? `Founded ${job.page.foundedYear}` : null]
    .filter(Boolean)
    .join(" • ");

  const gapSkillNames = (competency?.competencies ?? [])
    .filter((item) => (item.status || "").toLowerCase() === "gap" || !item.matched)
    .map((item) => item.skill_name)
    .filter(Boolean);

  const overallMatch = matchSession?.analysis?.overall;
  const metrics = [
    // Readiness is the deterministic skill-vs-skill match; the AI composite
    // (whole profile) is shown separately as AI Fit.
    { label: "Readiness Score", value: competency ? `${competency.readiness}%` : "—" },
    ...(overallMatch != null ? [{ label: "AI Fit", value: `${overallMatch}%` }] : []),
    { label: "Views", value: formatCount(job.view_count ?? 0) },
    { label: "Applications", value: `${job.application_count ?? job.applications?.length ?? 0}` },
  ];

  const handleApply = () => {
    if (job.application_url) {
      window.open(job.application_url, "_blank", "noopener,noreferrer");
      return;
    }
    if (isAuthenticated) setShowQuickApplyModal(true);
    else router.push(`/auth?actionType=profile&returnUrl=${encodeURIComponent(`/jobs/${id}`)}`);
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const share = {
    copy: () => navigator.clipboard?.writeText(shareUrl),
    linkedin: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank"),
    twitter: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`, "_blank"),
    whatsapp: () => window.open(`https://wa.me/?text=${encodeURIComponent(`${title} — ${shareUrl}`)}`, "_blank"),
  };

  // The mobile frame has a single share control; use the native sheet where the
  // browser offers it and fall back to copying the link.
  const handleMobileShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) navigator.share({ title, url: shareUrl }).catch(() => {});
    else share.copy();
  };

  return (
    <div className="text-white">
      {/* Mobile header bar (Figma 721:264). Desktop keeps the breadcrumb below. */}
      <div className="flex h-16 items-center justify-between border-b border-white/[0.12] bg-white/[0.06] px-4 lg:hidden">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} aria-label="Back" className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.03]">
            <ArrowLeft className="size-5" />
          </button>
          <span className="text-lg font-bold text-white">Job Detail</span>
        </div>
        <button onClick={handleMobileShare} aria-label="Share job" className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.03]">
          <Share2 className="size-5" />
        </button>
      </div>

      {/* Content. Tighter padding on a phone; the lg values are the desktop
          layout unchanged. Clearance for the fixed mobile tab bar comes from
          Layout, so there's no extra bottom padding to add here. */}
      <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 pb-8 pt-4 sm:px-6 lg:gap-6 lg:px-20 lg:pb-12 lg:pt-8">
        {/* Breadcrumb + share sit on one row above the card. Desktop only —
            the mobile frame uses the header bar above instead. */}
        <div className="hidden w-full items-center justify-between lg:flex">
          <button onClick={() => router.push("/jobs/smart_matches")} className="flex w-fit items-center gap-2 text-sm text-white/70 transition-colors hover:text-neon-cyan">
            <ArrowLeft className="size-4" />
            Back to jobs
          </button>
          <div className="glass-strong flex w-fit items-center gap-2 rounded-full p-2">
            {isAuthenticated && (
              <ShareButton onClick={handleSave} active={saved}>
                {saved ? <BookmarkCheck className="size-[18px]" /> : <Bookmark className="size-[18px]" />}
              </ShareButton>
            )}
            <ShareButton onClick={share.copy}>
              <LinkIcon className="size-[18px]" />
            </ShareButton>
            <ShareButton onClick={share.linkedin}>
              <Linkedin className="size-[18px]" />
            </ShareButton>
            <ShareButton onClick={share.twitter}>
              <Twitter className="size-[18px]" />
            </ShareButton>
            <ShareButton onClick={share.whatsapp}>
              <MessageCircle className="size-[18px]" />
            </ShareButton>
          </div>
        </div>

        {/* Job Hero */}
        <Card className="gap-3 rounded-xl border-glass-border bg-white/[0.03] p-4 lg:gap-6 lg:rounded-[20px] lg:p-8">
          {/* Company on one line, actions on the next — a phone can't fit both. */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-0">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-glass-border bg-white/[0.04] lg:size-16">
                {job.company_logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={job.company_logo} alt={companyName} className="size-full object-cover" />
                ) : (
                  <Building2 className="size-6 text-white/80 lg:size-8" />
                )}
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="cursor-pointer text-sm font-bold text-white hover:text-neon-cyan" onClick={() => job.page?.id && router.push(`/pages/${job.page.id}`)}>
                    {companyName}
                  </span>
                  {job.page?.name && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-neon-green">
                      <CheckCircle2 className="size-3.5" />
                      Verified
                    </span>
                  )}
                  {job.city && <span className="text-xs text-white/45">{formatCity(job.city)}</span>}
                </div>
              </div>
            </div>
            {/* Desktop keeps these in the hero; the mobile frame moves them to a
                full-width row at the end of the page (Figma 721:285). */}
            <div className="hidden w-full items-center gap-3 lg:flex lg:w-auto">
              {/* Saving a job needs an account — hidden while signed out. */}
              {isAuthenticated && (
                <Button type="button" variant="outline" onClick={handleSave} className="h-auto flex-1 rounded-full border-[1.5px] border-white/20 bg-transparent px-4 py-3 text-sm text-white hover:bg-white/5 lg:flex-none lg:px-6 lg:py-3.5">
                  {saved ? "Saved" : "Save job"}
                </Button>
              )}
              {applied ? (
                <span className="flex-1 rounded-full border border-neon-green/30 bg-neon-green/10 px-4 py-3 text-center text-sm font-semibold text-neon-green lg:flex-none lg:px-6 lg:py-3.5 lg:text-base">Applied</span>
              ) : (
                <Button onClick={handleApply} className={`h-auto flex-1 rounded-full px-4 py-3 text-sm font-semibold text-white lg:flex-none lg:px-6 lg:py-3.5 lg:text-base ${GRADIENT} hover:opacity-90`}>
                  Apply now
                </Button>
              )}
            </div>
          </div>

          <h1 className="text-2xl font-bold leading-8 text-white lg:text-[32px] lg:leading-10">{title}</h1>

          <div className="flex gap-3">
            {metrics.map((m) => (
              <div key={m.label} className="flex min-w-0 flex-1 flex-col gap-1 rounded-xl border border-glass-border bg-white/[0.03] p-3 lg:gap-1.5 lg:rounded-2xl lg:p-4">
                <span className="text-xs leading-tight text-white/45 lg:leading-4">{m.label}</span>
                <span className="text-lg font-bold text-white lg:text-2xl">{m.value}</span>
              </div>
            ))}
          </div>

          {heroBadgesFor(job).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {heroBadgesFor(job).map((b) => (
                <span key={b} className={`${CHIP} px-2.5 py-1.5 text-xs font-semibold text-white/70`}>
                  {b}
                </span>
              ))}
            </div>
          )}
        </Card>

        {/* Two columns on desktop; the sidebar drops below the content on a phone. */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
          {/* Left */}
          <div className="flex min-w-0 flex-1 flex-col gap-4 lg:gap-6">
            <Card className="flex-col items-start gap-3 rounded-[20px] border-neon-cyan/40 bg-white/[0.03] p-4 lg:flex-row lg:items-center lg:gap-4 lg:p-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-[20px] border border-glass-border bg-white/[0.04]">
                <FileText className="size-5 text-neon-cyan" />
              </div>
              <div className="flex w-full flex-1 flex-col gap-1 lg:w-auto">
                <span className="text-sm font-semibold text-white">Profile & Resume Match Intelligence</span>
                <span className="text-sm leading-5 text-white/70">See how your profile and resume align with this role, where the gaps are, and what to do next.</span>
              </div>
              <Button variant="outline" onClick={() => setMatchOpen(true)} className="h-auto w-full shrink-0 rounded-full border-neon-cyan/50 bg-transparent px-4 py-2.5 text-sm font-semibold text-neon-cyan hover:bg-neon-cyan/10 lg:w-auto">
                Check Match Details
              </Button>
            </Card>

            <JobAiSummary jobId={String(job.id)} summary={job.ai_summary} />

            {/* Job Description */}
            {description && (
              <SectionCard icon={<FileText className="size-5 text-neon-cyan" />} title="Job Description">
                <div
                  className="break-words text-sm leading-[22px] text-white/70 max-lg:overflow-x-auto [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_li]:leading-[22px] [&_strong]:font-semibold [&_strong]:text-white [&_h1]:mb-3 [&_h1]:text-base [&_h1]:font-semibold [&_h1]:text-white [&_h2]:mb-3 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-white [&_h3]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-white [&_a]:text-neon-cyan [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              </SectionCard>
            )}

            {/* Required Skills */}
            {dailySkills.length > 0 && (
              <SectionCard icon={<Briefcase className="size-5 text-neon-cyan" />} title="What this role uses daily">
                <p className="text-sm leading-[22px] text-white/70">{skillsSubtitle}</p>
                <div className="flex flex-wrap gap-2">
                  {dailySkills.map((s, i) => (
                    <span key={`${s}-${i}`} className="rounded-full border border-neon-cyan/40 bg-transparent px-2.5 py-1.5 text-xs text-neon-cyan">
                      {s}
                    </span>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* How you fit this role — reuses the data-wired competency panel.
                The ring shows the skill-based readiness; the AI composite stays
                in the chat/AI Fit metric so the two scores don't conflate. */}
            {competency && <CompetencyTable competency={competency} experienceMatch={matchSession?.analysis?.experience_match ?? experienceMatch} educationMatch={matchSession?.analysis?.education_match ?? educationMatch} />}

            {/* About the Company */}
            <SectionCard icon={<BookOpen className="size-5 text-neon-purple" />} title="About the Company">
              {/*
                Two shapes, one DOM. On a phone this is a 2-column grid: the logo
                takes the first cell and the name/Verified block sits beside it,
                while the description and the button span the full width below —
                so the copy gets the whole card instead of a ~200px gutter next
                to the logo.

                From lg it is the desktop row again: the wrapper below flips to
                `contents` on mobile (its children become grid items) and back to
                the flex-1 column at lg, and the name block does the reverse. Both
                boxes disappear at the size where the other one is doing the work,
                so the desktop rendering is byte-for-byte what it was.
              */}
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-3 lg:flex lg:gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-glass-border bg-white/[0.04] lg:size-16 lg:rounded-2xl">
                  {job.company_logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={job.company_logo} alt={companyName} className="size-full object-cover" />
                  ) : (
                    <Building2 className="size-6 text-white/80 lg:size-8" />
                  )}
                </div>
                <div className="contents lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:gap-2">
                  <div className="flex min-w-0 flex-col gap-1 lg:contents">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-bold text-white">{companyName}</p>
                      {job.page?.name && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-neon-green">
                          <CheckCircle2 className="size-3.5" />
                          Verified
                        </span>
                      )}
                    </div>
                    {companyMeta && <p className="text-xs text-white/45">{companyMeta}</p>}
                  </div>
                  <p className="col-span-2 text-sm leading-[22px] text-white/70">{job.page?.description || "Company description not available."}</p>
                  {job.page?.id && (
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/pages/${job.page!.id}`)}
                      className="col-span-2 mt-1 h-auto w-full rounded-full border-[1.5px] border-white/20 bg-transparent px-4 py-3 text-sm text-white hover:bg-white/5 sm:w-fit lg:px-6 lg:py-3.5"
                    >
                      Visit Company Page
                    </Button>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* Interview Questions (static placeholder, as before) */}
            <SectionCard icon={<HelpCircle className="size-5 text-neon-purple" />} title="AI-Generated Interview Questions">
              <div className="flex flex-col gap-3">
                {interviewQuestions.map((q) => (
                  <div key={q} className="rounded-2xl border border-glass-border bg-white/[0.03] p-4 text-sm text-white">
                    {q}
                  </div>
                ))}
              </div>
              <span className={`${CHIP} w-fit px-4 py-2.5 text-sm font-semibold text-neon-purple`}>View All Questions (5)</span>
            </SectionCard>

            {gapSkillNames.length > 0 && (
              <SectionCard icon={<Info className="size-5 text-neon-pink" />} title="Insider Intel: Hiring Insights">
                <p className="text-sm leading-[22px] text-white/70">
                  This hiring team is prioritizing {gapSkillNames.slice(0, 3).join(", ")}
                  {gapSkillNames.length > 3 ? ", and related skills" : ""}. Showing clear evidence of those in your resume and interviews will help you stand out.
                </p>
              </SectionCard>
            )}
          </div>

          {/* Right */}
          <div className="w-full lg:w-80 lg:shrink-0">
            <SectionCard title="Similar Jobs" titleSize="text-base lg:text-lg">
              {isSimilarLoading ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 4 }, (_, i) => (
                    <SimilarJobCardSkeleton key={i} />
                  ))}
                </div>
              ) : !similarJobs || similarJobs.length === 0 ? (
                <p className="text-sm text-white/45">No similar jobs found.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {similarJobs.slice(0, 4).map((j) => {
                    const sName = j.page?.name || j.company_name;
                    const salary = salaryText(j);
                    const match = similarMatch(j);
                    return (
                      <div key={j.id} onClick={() => router.push(`/jobs/${j.id}`)} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-glass-border bg-white/[0.03] p-4 transition-colors hover:border-neon-cyan/30">
                        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/[0.04]">
                          {j.company_logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={j.company_logo} alt={sName ?? "Company"} className="size-full object-cover" />
                          ) : (
                            <Briefcase className="size-5 text-white/70" />
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className="text-sm font-semibold leading-tight text-white">{j.job_title?.name ?? j.title}</span>
                          <span className="text-xs leading-snug text-white/45">
                            {sName}
                            {sName && j.city ? " • " : ""}
                            {j.city && formatCity(j.city)}
                          </span>
                          <span className="text-xs text-white/45">{salary ?? "Salary not disclosed"}</span>
                        </div>
                        {match != null && <span className="shrink-0 text-sm font-semibold text-neon-cyan">{match}% match</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:hidden">
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <Button type="button" variant="outline" onClick={handleSave} className="h-auto flex-1 rounded-full border-[1.5px] border-white/20 bg-transparent px-6 py-3.5 text-sm text-white hover:bg-white/5">
                {saved ? "Saved" : "Save job"}
              </Button>
            )}
            {applied ? (
              <span className="flex-1 rounded-full border border-neon-green/30 bg-neon-green/10 px-6 py-3.5 text-center text-base font-semibold text-neon-green">Applied</span>
            ) : (
              <Button onClick={handleApply} className={`h-auto flex-1 rounded-full px-6 py-3.5 text-base font-semibold text-white ${GRADIENT} hover:opacity-90`}>
                Apply now
              </Button>
            )}
          </div>
        </div>
      </div>

      <MatchChatDrawer isOpen={matchOpen} onClose={() => setMatchOpen(false)} jobId={String(job.id)} jobTitle={title} company={companyName} />

      <QuickApplyModal
        isOpen={showQuickApplyModal}
        onClose={() => setShowQuickApplyModal(false)}
        job={job}
        companyName={companyName}
        screeningQuestions={job.questionSets ? job.questionSets?.[0]?.questions : []}
        // Must not close the modal: it stays open to show the success screen,
        // which closes itself from its own CTAs.
        onSubmit={() => {}}
        resumes={myResumes ?? []}
      />
    </div>
  );
}

/* ------------------------------ sub-components ----------------------------- */

function ShareButton({ children, onClick, active }: { children: React.ReactNode; onClick?: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex size-9 items-center justify-center rounded-[20px] transition-colors lg:size-10 ${active ? "bg-neon-cyan text-white" : "border border-glass-border bg-white/[0.03] text-white/80 hover:text-white"}`}
    >
      {children}
    </button>
  );
}

function SectionCard({ icon, title, titleSize = "text-lg lg:text-xl", children }: { icon?: React.ReactNode; title: string; titleSize?: string; children: React.ReactNode }) {
  return (
    <Card className="gap-3 rounded-xl border-glass-border bg-white/[0.03] p-4 lg:gap-4 lg:rounded-[20px] lg:p-6">
      <div className="flex items-center gap-3">
        {icon && <span className="shrink-0">{icon}</span>}
        <h3 className={`${titleSize} font-bold text-white lg:font-semibold`}>{title}</h3>
      </div>
      {children}
    </Card>
  );
}

export default JobDetail;
