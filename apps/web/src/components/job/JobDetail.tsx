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

import { CompanyLogo, displayCompanyName, displayLocation, experienceChip, matchScore, salaryText } from "@/components/job/jobBrowseShared";
import { experienceMonths } from "@/components/profile/profileFormat";
import { useAuth } from "@/contexts/AuthContext";
import { useGetEducationsQuery } from "@/features/api/educationsApi";
import { useGetExperiencesQuery } from "@/features/api/experiencesApi";
import { useCreateJobApplicationMutation } from "@/features/api/jobApplicationsApi";
import { RESERVED_JOB_SLUGS, useGetJobByIdQuery, useGetMatchByJobQuery, useGetSimilarJobsQuery, useIsJobSavedQuery, useRecordJobViewMutation, useToggleSaveJobMutation } from "@/features/api/jobsApi";
import { useGetMyResumesQuery } from "@/features/api/resumeApi";
import { toastUnknownError } from "@/lib/errors";
import { toast } from "sonner";
import { jobDescriptionToHtml } from "@/lib/jobDescription";
import { Job } from "@/types/job";
import DOMPurify from "dompurify";
import { ArrowLeft, ArrowUpRight, Bookmark, BookmarkCheck, BookOpen, Briefcase, Building2, CheckCircle2, FileText, Linkedin, Link as LinkIcon, MessageCircle, Pencil, Share2, Twitter, Users } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { goBackJobs } from "@/lib/jobNavigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { QuickApplyModal } from "../QuickApplyModal";
import { ExternalApplyConfirmModal } from "./ExternalApplyConfirmModal";
import { ResumeSelectModal } from "./ResumeSelectModal";
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

/** Same readiness number as job cards and the details header. */
function similarMatch(job: Job): number | null {
  return matchScore(job);
}

/** 1240 -> "1.2k", so a busy posting doesn't blow out the metric tile. */
function formatCount(value: number): string {
  if (value < 1000) return `${value}`;
  if (value < 1_000_000) return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0).replace(/\.0$/, "")}k`;
  return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
}

function ApplyNowLabel({ external }: { external: boolean }) {
  return (
    <>
      <span className="flex items-center gap-2">
        Apply now
        {external ? <ArrowUpRight className="size-4" aria-hidden /> : null}
      </span>
    </>
  );
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

/* TODO: restore AI-Generated Interview Questions once the feature is wired.
const interviewQuestions = [
  "What is the difference between useMemo and useCallback in React?",
  "How does the virtual DOM work in React, and why is it useful?",
  "Explain the difference between controlled and uncontrolled components in React.",
  "How would you optimize a React application's performance?",
  "Describe your experience with state management libraries like Redux or Zustand.",
];
*/

export function JobDetail() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const isReserved = Boolean(id && RESERVED_JOB_SLUGS.has(id));

  const [showQuickApplyModal, setShowQuickApplyModal] = useState(false);
  const [showExternalConfirmModal, setShowExternalConfirmModal] = useState(false);
  const [justApplied, setJustApplied] = useState(false);
  const [createJobApplication, { isLoading: isApplyingExternal }] = useCreateJobApplicationMutation();
  const [matchOpen, setMatchOpen] = useState(false);
  const [resumeSelectOpen, setResumeSelectOpen] = useState(false);
  const [selectedMatchSessionId, setSelectedMatchSessionId] = useState<string | undefined>(undefined);

  const { data: job, error, isLoading } = useGetJobByIdQuery(isReserved ? undefined : id!, { skip: !id || isReserved });
  const isOwner = Boolean(
    job?.is_owner ||
    (user?.id && job?.owner_id && String(job.owner_id) === String(user.id)) ||
    (user?.active_page_id && job?.page_id && String(job.page_id) === String(user.active_page_id)) ||
    (user?.account_type === "recruiter" && job?.owner_id && String(job.owner_id) === String(user.id))
  );

  const { data: similarJobs, isLoading: isSimilarLoading } = useGetSimilarJobsQuery(isReserved ? undefined : id!, { skip: !id || isReserved || isOwner });
  const { data: myResumes } = useGetMyResumesQuery(undefined, { skip: !isAuthenticated || isOwner });
  const { data: experiences } = useGetExperiencesQuery(undefined, { skip: !isAuthenticated || isOwner });
  const { data: educations } = useGetEducationsQuery(undefined, { skip: !isAuthenticated || isOwner });
  const { data: matchSession } = useGetMatchByJobQuery(isReserved ? undefined : id, { skip: !isAuthenticated || !id || isReserved || isOwner });

  const matchedResumeIds = useMemo(() => {
    if (!matchSession || !id) return [];
    const stored = typeof window !== "undefined" ? localStorage.getItem(`qelsa_job_match_${id}_resume`) : null;
    if (stored) return [stored];
    if (user?.default_resume_id) return [String(user.default_resume_id)];
    if (myResumes?.[0]?.id) return [String(myResumes[0].id)];
    return [];
  }, [matchSession, id, user?.default_resume_id, myResumes]);

  const handleStartMatchFromModal = (resumeId: string) => {
    if (typeof window !== "undefined" && id) {
      localStorage.setItem(`qelsa_job_match_${id}_resume`, resumeId);
    }
    setSelectedMatchSessionId(undefined);
    setResumeSelectOpen(false);
    setMatchOpen(true);
  };

  const handleViewMatchFromModal = (_resumeId: string) => {
    setSelectedMatchSessionId(matchSession?.id);
    setResumeSelectOpen(false);
    setMatchOpen(true);
  };
  const [toggleSaveJob] = useToggleSaveJobMutation();
  const { data: savedFromServer } = useIsJobSavedQuery(isReserved ? undefined : id, { skip: !isAuthenticated || !id || isReserved || isOwner });
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

  const isRecruiter = isAuthenticated && user?.account_type === "recruiter";
  const sectionScrollLock = useRef(false);
  const [activeSection, setActiveSection] = useState("job-overview");
  const [tabStickyTop, setTabStickyTop] = useState(() => (isRecruiter ? 0 : 64));
  const pageSections = useMemo(() => {
    const items: { id: string; label: string }[] = [{ id: "job-overview", label: "Overview" }];
    if (job?.description?.trim()) items.push({ id: "job-description", label: "Job description" });
    if ((job?.job_skills ?? []).some((skill) => skill.skill?.name || skill.title)) {
      items.push({ id: "job-skills", label: "Skills" });
    }
    if (job && !isOwner && job.competency) items.push({ id: "how-you-fit", label: "Readiness score" });
    items.push({ id: "job-company", label: "About company" });
    return items;
  }, [job, isOwner]);

  useEffect(() => {
    const applyStickyTop = () => {
      const header = [...document.querySelectorAll("header")].find((el) => {
        const rect = el.getBoundingClientRect();
        return rect.height > 0 && rect.top <= 1;
      });
      const next = header ? Math.round(header.getBoundingClientRect().height) : 0;
      setTabStickyTop((prev) => (prev === next ? prev : next));
    };
    applyStickyTop();
    window.addEventListener("resize", applyStickyTop);
    return () => window.removeEventListener("resize", applyStickyTop);
  }, [isRecruiter]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      if (sectionScrollLock.current) return;
      // The section whose top has passed the sticky nav + tab row is current.
      // Before any section reaches that line, Overview stays selected.
      const marker = sectionScrollOffset() + 12;
      let current = "job-overview";
      for (const section of pageSections) {
        const el = document.getElementById(section.id);
        if (el && el.getBoundingClientRect().top <= marker) current = section.id;
      }
      setActiveSection((prev) => (prev === current ? prev : current));
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };
    const unlock = () => {
      sectionScrollLock.current = false;
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scrollend", unlock);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scrollend", unlock);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pageSections]);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    sectionScrollLock.current = true;
    const unlock = () => {
      sectionScrollLock.current = false;
    };
    if (sectionId === "job-overview") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.setTimeout(unlock, 900);
      return;
    }
    const el = document.getElementById(sectionId);
    if (!el) {
      unlock();
      return;
    }
    // Clear the sticky site nav and the section tab row.
    const top = el.getBoundingClientRect().top + window.scrollY - sectionScrollOffset();
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    window.setTimeout(unlock, 900);
  };

  if (!id || isLoading) return <JobDetailSkeleton />;
  if (error) return <p className="p-6 text-white/70 lg:p-8">Error loading job.</p>;
  if (!job) return <p className="p-6 text-white/70 lg:p-8">No job found.</p>;

  const companyName = displayCompanyName(job.page?.name || job.company_name);
  const locationLabel = displayLocation(job);
  const title = job.job_title?.name ?? job.title;
  const description = DOMPurify.sanitize(jobDescriptionToHtml(job.description || ""));
  const applied = Boolean(job.has_applied || (user?.id && job.applications?.some((a) => a.user_id === user.id)) || justApplied);
  const competency = job.competency;

  const dailySkills = (job.job_skills ?? []).map((s) => s.skill?.name ?? s.title).filter(Boolean);
  const skillsSubtitle = isOwner
    ? "The skills this role uses day to day."
    : competency
    ? `You match ${competency.matchedCount} of ${competency.totalCount} skills listed here.`
    : "The skills this role uses day to day.";

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

  const metrics: { label: string; value: React.ReactNode }[] = isOwner
    ? [
        {
          label: "Job Status",
          value: (
            <span className="inline-flex items-center gap-1.5 capitalize">
              <span
                className={`size-2 rounded-full ${
                  job.status === "paused"
                    ? "bg-amber-400"
                    : job.status === "closed"
                    ? "bg-red-400"
                    : "bg-neon-green"
                }`}
              />
              {job.status === "paused" ? "Paused" : job.status === "closed" ? "Closed" : "Active"}
            </span>
          ),
        },
        {
          label: "Workplace",
          value: job.workplace_type
            ? job.workplace_type.charAt(0).toUpperCase() + job.workplace_type.slice(1)
            : job.has_remote
            ? "Remote"
            : "On-site",
        },
        { label: "Views", value: formatCount(job.view_count ?? 0) },
        { label: "Applications", value: `${job.application_count ?? job.applications?.length ?? 0}` },
      ]
    : [
        { label: "Readiness score", value: competency ? `${competency.readiness}%` : "—" },
        { label: "Views", value: formatCount(job.view_count ?? 0) },
        { label: "Applications", value: `${job.application_count ?? job.applications?.length ?? 0}` },
      ];

  const isExternalApply = Boolean(job.application_url);

  const handleApply = () => {
    if (job.application_url) {
      window.open(job.application_url, "_blank", "noopener,noreferrer");
      setShowExternalConfirmModal(true);
      return;
    }
    if (isAuthenticated) setShowQuickApplyModal(true);
    else router.push(`/auth?actionType=profile&returnUrl=${encodeURIComponent(`/jobs/${id}`)}`);
  };

  const handleConfirmExternalApply = async () => {
    if (!isAuthenticated) {
      setShowExternalConfirmModal(false);
      router.push(`/auth?actionType=profile&returnUrl=${encodeURIComponent(`/jobs/${id}`)}`);
      return;
    }
    try {
      await createJobApplication({ id: job.id }).unwrap();
      setJustApplied(true);
      setOptimisticSaved(false);
      setShowExternalConfirmModal(false);
      toast.success("Application recorded!");
    } catch (error: unknown) {
      toastUnknownError(error, "Could not record application. Please try again.");
    }
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const share = {
    copy: async () => {
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(shareUrl);
          toast.success("Job link copied to clipboard!");
        } else if (typeof document !== "undefined") {
          const textArea = document.createElement("textarea");
          textArea.value = shareUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
          toast.success("Job link copied to clipboard!");
        }
      } catch {
        toast.error("Failed to copy link");
      }
    },
    linkedin: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank"),
    twitter: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`, "_blank"),
    whatsapp: () => window.open(`https://wa.me/?text=${encodeURIComponent(`${title} — ${shareUrl}`)}`, "_blank"),
  };

  // The mobile frame has a single share control; use the native sheet where the
  // browser offers it and fall back to copying the link.
  const handleMobileShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
      } catch {
        // Ignored if user dismissed the share sheet
      }
    } else {
      await share.copy();
    }
  };

  return (
    <div className="overflow-x-clip text-white">
      {/* Mobile header bar (Figma 721:264). Desktop keeps the breadcrumb below. */}
      <div className="flex h-16 items-center justify-between border-b border-white/[0.12] bg-white/[0.06] px-4 lg:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (isOwner ? router.push("/jobs/posted") : goBackJobs(router))}
            aria-label="Back"
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.03]"
          >
            <ArrowLeft className="size-5" />
          </button>
          <span className="text-lg font-bold text-white">{isOwner ? "Manage Job" : "Job Detail"}</span>
        </div>
        <button onClick={handleMobileShare} aria-label="Share job" className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.03]">
          <Share2 className="size-5" />
        </button>
      </div>

      {/* Content. Tighter padding on a phone; the lg values are the desktop
          layout unchanged. Extra bottom padding on mobile keeps the content clear of the fixed bottom bar. */}
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 pb-28 pt-4 sm:px-6 lg:gap-6 lg:px-8 lg:pb-12 lg:pt-8">
        {/* Breadcrumb + share sit on one row above the card. Desktop only —
            the mobile frame uses the header bar above instead. */}
        <div className="hidden w-full items-center justify-between lg:flex">
          {isOwner ? (
            <button onClick={() => router.push("/jobs/posted")} className="flex w-fit items-center gap-2 text-sm text-white/70 transition-colors hover:text-neon-cyan">
              <ArrowLeft className="size-4" />
              Back to Manage Jobs
            </button>
          ) : (
            <button onClick={() => goBackJobs(router)} className="flex w-fit items-center gap-2 text-sm text-white/70 transition-colors hover:text-neon-cyan">
              <ArrowLeft className="size-4" />
              Back to jobs
            </button>
          )}
          <div className="glass-strong flex w-fit items-center gap-2 rounded-full p-2">
            {!isOwner && isAuthenticated && !applied && (
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
              <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-glass-border bg-white/[0.04] lg:size-16">
                <CompanyLogo job={job} name={companyName} fallback={<Building2 className="size-6 text-white/80 lg:size-8" />} />
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
                </div>
                {locationLabel && <p className="block w-full text-xs text-white/45">{locationLabel}</p>}
              </div>
            </div>
            {/* Desktop keeps these in the hero; the mobile frame moves them to a
                full-width row at the end of the page (Figma 721:285). */}
            <div className="hidden w-full items-center gap-3 lg:flex lg:w-auto">
              {isOwner ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/jobs/create-job?jobId=${job.id}`)}
                    className="h-auto flex-1 rounded-full border-[1.5px] border-white/20 bg-transparent px-4 py-3 text-sm text-white hover:bg-white/5 lg:flex-none lg:px-6 lg:py-3.5"
                  >
                    <Pencil className="mr-2 size-4" />
                    Edit job
                  </Button>
                  <Button
                    type="button"
                    onClick={() => router.push(`/jobs/${job.id}/applications`)}
                    className={`h-auto flex-1 rounded-full px-4 py-3 text-sm font-semibold text-white lg:flex-none lg:px-6 lg:py-3.5 lg:text-base ${GRADIENT} hover:opacity-90`}
                  >
                    <Users className="mr-2 size-4" />
                    View applications ({job.application_count ?? job.applications?.length ?? 0})
                  </Button>
                </>
              ) : (
                <>
                  {/* Saving a job needs an account — hidden while signed out or already applied. */}
                  {isAuthenticated && !applied && (
                    <Button type="button" variant="outline" onClick={handleSave} className="h-auto flex-1 rounded-full border-[1.5px] border-white/20 bg-transparent px-4 py-3 text-sm text-white hover:bg-white/5 lg:flex-none lg:px-6 lg:py-3.5">
                      {saved ? "Saved" : "Save job"}
                    </Button>
                  )}
                  {applied ? (
                    <span className="flex-1 rounded-full border border-neon-green/30 bg-neon-green/10 px-4 py-3 text-center text-sm font-semibold text-neon-green lg:flex-none lg:px-6 lg:py-3.5 lg:text-base">Applied</span>
                  ) : (
                    <Button
                      onClick={handleApply}
                      aria-label={isExternalApply ? "Apply now (opens in a new tab)" : undefined}
                      className={`h-auto flex-1 rounded-full px-4 py-3 text-sm font-semibold text-white lg:flex-none lg:px-6 lg:py-3.5 lg:text-base ${GRADIENT} hover:opacity-90`}
                    >
                      <ApplyNowLabel external={isExternalApply} />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          <h1 className="text-2xl font-bold leading-8 text-white lg:text-[32px] lg:leading-10">{title}</h1>

          {/* 3 metric cards */}
          <div className="grid grid-cols-3 gap-3 lg:gap-4">
            {metrics.map((m) => (
              <div key={m.label} className="flex min-w-0 flex-col gap-1 rounded-xl border border-glass-border bg-white/[0.03] p-3 lg:gap-1.5 lg:rounded-2xl lg:p-4">
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

        <JobSectionTabs sections={pageSections} activeId={activeSection} onSelect={scrollToSection} stickyTop={tabStickyTop} />

        {/* Two columns on desktop; the sidebar drops below the content on a phone. */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
          {/* Left */}
          <div className="flex min-w-0 flex-1 flex-col gap-4 lg:gap-6">
            <div id="job-overview" className="flex scroll-mt-36 flex-col gap-4 lg:gap-6">
            {!isOwner && (
              <Card className="flex flex-col items-start gap-4 rounded-[20px] border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between lg:p-6">
                <div className="flex w-full flex-1 flex-col gap-1">
                  <h3 className="text-base font-semibold text-white">Resume Match Intelligence</h3>
                  <p className="text-sm leading-5 text-white/60">
                    See how you align with this role based on the JD, and uploaded resume
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setResumeSelectOpen(true)}
                  className="h-auto w-full shrink-0 rounded-full border-neon-cyan/50 bg-[#061820]/60 px-6 py-2.5 text-sm font-semibold text-neon-cyan hover:bg-neon-cyan/10 sm:w-auto"
                >
                  Check match
                </Button>
              </Card>
            )}

            {!isOwner && user?.account_type !== "recruiter" && (
              <JobAiSummary jobId={String(job.id)} summary={job.ai_summary} />
            )}
            </div>

            {/* Job Description */}
            {description && (
              <div id="job-description" className="scroll-mt-36">
              <SectionCard icon={<FileText className="size-5 text-neon-cyan" />} title="Job Description">
                <div
                  className="break-words text-sm leading-[22px] text-white/70 max-lg:overflow-x-auto [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_li]:leading-[22px] [&_strong]:font-semibold [&_strong]:text-white [&_h1]:mb-3 [&_h1]:text-base [&_h1]:font-semibold [&_h1]:text-white [&_h2]:mb-3 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-white [&_h3]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-white [&_a]:text-neon-cyan [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              </SectionCard>
              </div>
            )}

            {/* Required Skills */}
            {dailySkills.length > 0 && (
              <div id="job-skills" className="scroll-mt-36">
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
              </div>
            )}

            {/* How you fit this role. The ring is the readiness score. */}
            {!isOwner && competency && (
              <div id="how-you-fit" className="scroll-mt-36">
                <CompetencyTable competency={competency} experienceMatch={matchSession?.analysis?.experience_match ?? experienceMatch} educationMatch={matchSession?.analysis?.education_match ?? educationMatch} />
              </div>
            )}

            {/* About the Company */}
            <div id="job-company" className="scroll-mt-36">
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
                <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-glass-border bg-white/[0.04] lg:size-16">
                  <CompanyLogo job={job} name={companyName} fallback={<Building2 className="size-6 text-white/80 lg:size-8" />} />
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
            </div>

            {/* TODO: restore AI-Generated Interview Questions once the feature is wired.
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
            */}



          </div>

          {/* Right */}
          <div className="w-full lg:w-80 lg:shrink-0">
            {isOwner ? (
              <SectionCard title="Applicant Pipeline" titleSize="text-base lg:text-lg">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 rounded-2xl border border-glass-border bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/45">Total Applicants</span>
                      <span className="text-base font-bold text-white">{job.application_count ?? job.applications?.length ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/45">Total Views</span>
                      <span className="text-base font-bold text-white">{formatCount(job.view_count ?? 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/45">Job Status</span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold capitalize text-white">
                        <span
                          className={`size-2 rounded-full ${
                            job.status === "paused"
                              ? "bg-amber-400"
                              : job.status === "closed"
                              ? "bg-red-400"
                              : "bg-neon-green"
                          }`}
                        />
                        {job.status === "paused" ? "Paused" : job.status === "closed" ? "Closed" : "Active"}
                      </span>
                    </div>
                    {job.published_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/45">Posted On</span>
                        <span className="text-xs text-white/70">
                          {new Date(job.published_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </SectionCard>
            ) : (
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
                              {displayLocation(j)}
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
            )}
          </div>
        </div>

        {/* Mobile fixed floating bottom actions bar */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-glass-border bg-[#06060f]/90 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-lg lg:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            {isOwner ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/jobs/create-job?jobId=${job.id}`)}
                  className="h-auto flex-1 rounded-full border-[1.5px] border-white/20 bg-transparent px-5 py-3.5 text-sm font-semibold text-white hover:bg-white/5"
                >
                  <Pencil className="mr-2 size-4" />
                  Edit job
                </Button>
                <Button
                  type="button"
                  onClick={() => router.push(`/jobs/${job.id}/applications`)}
                  className={`h-auto flex-1 rounded-full px-5 py-3.5 text-sm font-semibold text-white ${GRADIENT} hover:opacity-90`}
                >
                  <Users className="mr-2 size-4" />
                  Applications ({job.application_count ?? job.applications?.length ?? 0})
                </Button>
              </>
            ) : (
              <>
                {isAuthenticated && !applied && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSave}
                    className="h-auto flex-1 rounded-full border-[1.5px] border-white/20 bg-transparent px-5 py-3.5 text-sm font-semibold text-white hover:bg-white/5"
                  >
                    {saved ? "Saved" : "Save job"}
                  </Button>
                )}
                {applied ? (
                  <span className="flex-1 rounded-full border border-neon-green/30 bg-neon-green/10 px-5 py-3.5 text-center text-sm font-semibold text-neon-green">
                    Applied
                  </span>
                ) : (
                  <Button
                    onClick={handleApply}
                    aria-label={isExternalApply ? "Apply now (opens in a new tab)" : undefined}
                    className={`h-auto flex-1 rounded-full px-5 py-3.5 text-base font-semibold text-white ${GRADIENT} hover:opacity-90 shadow-lg shadow-purple-500/20`}
                  >
                    <ApplyNowLabel external={isExternalApply} />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <MatchChatDrawer isOpen={matchOpen} onClose={() => setMatchOpen(false)} jobId={String(job.id)} jobTitle={title} company={companyName} existingSessionId={selectedMatchSessionId} />

      <ResumeSelectModal
        isOpen={resumeSelectOpen}
        onClose={() => setResumeSelectOpen(false)}
        resumes={myResumes ?? []}
        defaultResumeId={user?.default_resume_id}
        matchedResumeIds={matchedResumeIds}
        onMatch={handleStartMatchFromModal}
        onViewMatch={handleViewMatchFromModal}
      />

      <QuickApplyModal
        isOpen={showQuickApplyModal}
        onClose={() => setShowQuickApplyModal(false)}
        job={job}
        companyName={companyName}
        screeningQuestions={job.questionSets ? job.questionSets?.[0]?.questions : []}
        // Must not close the modal: it stays open to show the success screen,
        // which closes itself from its own CTAs.
        onSubmit={() => {
          setJustApplied(true);
          setOptimisticSaved(false);
        }}
        resumes={myResumes ?? []}
        defaultResumeId={user?.default_resume_id}
      />

      <ExternalApplyConfirmModal
        isOpen={showExternalConfirmModal}
        onClose={() => setShowExternalConfirmModal(false)}
        onConfirm={() => void handleConfirmExternalApply()}
        isLoading={isApplyingExternal}
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

/** Distance from the viewport top to just under the sticky section tabs. */
function sectionScrollOffset() {
  const header = [...document.querySelectorAll("header")].find((el) => {
    const rect = el.getBoundingClientRect();
    return rect.height > 0 && rect.top <= 1;
  });
  const nav = document.querySelector('nav[aria-label="Job sections"]');
  const headerHeight = header ? header.getBoundingClientRect().height : 0;
  const navHeight = nav?.getBoundingClientRect().height ?? 48;
  return headerHeight + navHeight + 8;
}

function JobSectionTabs({
  sections,
  activeId,
  onSelect,
  stickyTop,
}: {
  sections: { id: string; label: string }[];
  activeId: string;
  onSelect: (id: string) => void;
  stickyTop: number;
}) {
  return (
    <nav
      aria-label="Job sections"
      className="sticky z-30 -mx-4 border-b border-white/[0.08] bg-[#06060f] px-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
      style={{ top: stickyTop }}
    >
      <div className="flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sections.map((section) => {
          const active = section.id === activeId;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelect(section.id)}
              aria-current={active ? "true" : undefined}
              className={`shrink-0 border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
                active ? "border-neon-cyan text-neon-cyan" : "border-transparent text-white/55 hover:text-white"
              }`}
            >
              {section.label}
            </button>
          );
        })}
      </div>
    </nav>
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
