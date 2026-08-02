"use client";

/**
 * JobDetailPageRedesign
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

import { formatCity } from "@/constants/city";
import { useAuth } from "@/contexts/AuthContext";
import { useGetJobByIdQuery, useGetSimilarJobsQuery, useToggleSaveJobMutation } from "@/features/api/jobsApi";
import { useGetMyResumesQuery } from "@/features/api/resumeApi";
import { Job } from "@/types/job";
import DOMPurify from "dompurify";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Building2,
  FileText,
  HelpCircle,
  Link as LinkIcon,
  Linkedin,
  MessageCircle,
  Shield,
  Twitter,
  Upload,
  Zap,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { QuickApplyModal } from "../QuickApplyModal";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { CompetencyTable } from "./CompetencyMatch";

/* -------------------------------- helpers --------------------------------- */

const GRADIENT = "bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink";
const CHIP = "border border-glass-border bg-white/[0.04] rounded-full";

// Feed jobs send experience as a short code; Qelsa-posted jobs send `experience` in years.
const EXPERIENCE_LEVEL_LABELS: Record<string, string> = {
  EN: "Entry level",
  MI: "Mid level",
  SE: "Senior level",
  EX: "Executive",
};

function experienceLabel(job: Job): string | null {
  if (job.experience_level) return EXPERIENCE_LEVEL_LABELS[job.experience_level] ?? job.experience_level;
  if (job.experience != null) return job.experience === 0 ? "No experience required" : `${job.experience}+ years`;
  return null;
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

function formatMoney(value: number, currency?: string | null): string {
  const cur = currency || "USD";
  // Group digits the way the currency is normally written (₹7,92,000 vs $120,000)
  // rather than by the viewer's locale.
  const locale = cur === "INR" ? "en-IN" : "en-US";
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${cur} ${value.toLocaleString(locale)}`;
  }
}

function formatSalary(job: Job): string | null {
  const { salary_min: min, salary_max: max, salary, salary_currency: cur } = job;
  if (min != null && max != null) return min === max ? formatMoney(min, cur) : `${formatMoney(min, cur)} - ${formatMoney(max, cur)}`;
  if (min != null) return `${formatMoney(min, cur)}+`;
  if (max != null) return `Up to ${formatMoney(max, cur)}`;
  if (salary != null) return formatMoney(salary, cur);
  return null;
}

/**
 * The similar-jobs endpoint may send the match score under a few names
 * (`fitScore` is a UI-only field; the API commonly uses snake_case). Read them
 * all defensively and normalise to a rounded 0–100 number.
 */
function similarMatch(job: Job): number | null {
  const bag = job as Record<string, unknown>;
  const raw = job.fitScore ?? bag.fit_score ?? bag.match_score ?? bag.matchScore ?? bag.similarity;
  const n = typeof raw === "string" ? Number(raw) : raw;
  return typeof n === "number" && Number.isFinite(n) ? Math.round(n) : null;
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
  return [experienceLabel(job), jobTypeLabel(job), formatSalary(job), workplaceLabel(job), formatPosted(job)].filter((b): b is string => Boolean(b));
}

const interviewQuestions = [
  "Explain the difference between controlled and uncontrolled components in React.",
  "How would you optimize a React application's performance?",
  "Describe your experience with state management libraries like Redux or Zustand.",
];

/* --------------------------------- page ----------------------------------- */

export function JobDetailPageRedesign() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [showQuickApplyModal, setShowQuickApplyModal] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const { data: job, error, isLoading } = useGetJobByIdQuery(id!, { skip: !id });
  const { data: similarJobs, isLoading: isSimilarLoading } = useGetSimilarJobsQuery(id!, { skip: !id });
  const { data: myResumes } = useGetMyResumesQuery(undefined, { skip: !isAuthenticated });
  const [toggleSaveJob] = useToggleSaveJobMutation();

  if (!id || isLoading) return <p className="p-6 text-white/70 lg:p-8">Loading job...</p>;
  if (error) return <p className="p-6 text-white/70 lg:p-8">Error loading job.</p>;
  if (!job) return <p className="p-6 text-white/70 lg:p-8">No job found.</p>;

  const companyName = job.page?.name || job.company_name || "Company";
  const title = job.job_title?.name ?? job.title;
  const description = DOMPurify.sanitize(job.description || "");
  const applied = job.applications?.some((a) => a.user_id === user?.id) ?? false;
  const competency = job.competency;

  const dailySkills = (job.job_skills ?? []).map((s) => s.skill?.name ?? s.title).filter(Boolean);
  const skillsSubtitle = competency
    ? `You match ${competency.matchedCount} of ${competency.totalCount} skills listed here. The ones you know are a strong starting point.`
    : "The skills this role uses day to day.";

  const metrics = [
    { label: "Readiness Score", value: competency ? `${competency.readiness}%` : "—" },
    { label: "Applications", value: `${job.applications?.length ?? 0}` },
    { label: "Priority", value: job.resource === "qelsa" ? "High" : "Medium" },
  ];

  const handleApply = () => {
    if (job.resource === "qelsa") {
      if (isAuthenticated) setShowQuickApplyModal(true);
      else router.push(`/auth?actionType=profile&returnUrl=${encodeURIComponent(`/jobs/${id}`)}`);
    } else if (job.application_url) {
      window.open(job.application_url, "_blank");
    }
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const share = {
    copy: () => navigator.clipboard?.writeText(shareUrl),
    linkedin: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank"),
    twitter: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`, "_blank"),
    whatsapp: () => window.open(`https://wa.me/?text=${encodeURIComponent(`${title} — ${shareUrl}`)}`, "_blank"),
  };

  return (
    <div className="text-white">
      {/* Content. Tighter padding on a phone; the lg values are the desktop
          layout unchanged. Clearance for the fixed mobile tab bar comes from
          Layout, so there's no extra bottom padding to add here. */}
      <div className="relative mx-auto flex max-w-[1280px] flex-col gap-4 px-4 pb-8 pt-4 sm:px-6 lg:gap-6 lg:px-20 lg:pb-12 lg:pt-8">
        {/* Breadcrumb */}
        <button onClick={() => router.push("/jobs/smart_matches")} className="flex w-fit items-center gap-2 text-sm text-white/70 transition-colors hover:text-neon-cyan">
          <ArrowLeft className="size-4" />
          Back to Jobs
        </button>

        {/* Share / bookmark pill. It floats over the hero on desktop; on a phone
            there is no room to float, so it sits in the flow under the
            breadcrumb. Absolute positioning ignores DOM order, so the desktop
            placement is unaffected by where this sits in the markup. */}
        <div className="glass-strong flex w-fit items-center gap-1.5 self-end rounded-full p-1.5 lg:absolute lg:right-20 lg:top-[46px] lg:gap-2 lg:p-2">
          {isAuthenticated && (
            <ShareButton onClick={() => toggleSaveJob(job.id)}>{job.is_bookmarked ? <BookmarkCheck className="size-[18px] text-neon-cyan" /> : <Bookmark className="size-[18px]" />}</ShareButton>
          )}
          <ShareButton onClick={share.copy}><LinkIcon className="size-[18px]" /></ShareButton>
          <ShareButton onClick={share.linkedin}><Linkedin className="size-[18px]" /></ShareButton>
          <ShareButton onClick={share.twitter}><Twitter className="size-[18px]" /></ShareButton>
          <ShareButton onClick={share.whatsapp}><MessageCircle className="size-[18px]" /></ShareButton>
        </div>

        {/* Job Hero */}
        <Card className="gap-5 rounded-[20px] border-glass-border bg-white/[0.03] p-5 lg:gap-6 lg:p-8">
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
                <span className="cursor-pointer text-sm font-semibold text-white/70 hover:text-neon-cyan" onClick={() => job.page?.id && router.push(`/pages/${job.page.id}`)}>
                  {companyName}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {job.page?.name && <span className="rounded-full border border-neon-green/20 bg-neon-green/10 px-2 py-1 text-xs font-semibold text-neon-green">Verified</span>}
                  {job.city && <span className="text-xs text-white/45">{formatCity(job.city)}</span>}
                </div>
              </div>
            </div>
            <div className="flex w-full items-center gap-3 lg:w-auto">
              {/* Saving a job needs an account — hidden while signed out. */}
              {isAuthenticated && (
                <Button variant="outline" onClick={() => toggleSaveJob(job.id)} className="h-auto flex-1 rounded-full border-[1.5px] border-white/20 bg-transparent px-4 py-3 text-sm text-white hover:bg-white/5 lg:flex-none lg:px-6 lg:py-3.5">
                  {job.is_bookmarked ? "Saved" : "Save job"}
                </Button>
              )}
              {applied ? (
                <span className="flex-1 rounded-full border border-neon-green/30 bg-neon-green/10 px-4 py-3 text-center text-sm font-semibold text-neon-green lg:flex-none lg:px-6 lg:py-3.5 lg:text-base">Applied</span>
              ) : (
                <Button onClick={handleApply} className={`h-auto flex-1 rounded-full px-4 py-3 text-sm font-semibold text-white lg:flex-none lg:px-6 lg:py-3.5 lg:text-base ${GRADIENT} hover:opacity-90`}>
                  {job.resource === "qelsa" ? "Quick Apply" : "Apply now"}
                </Button>
              )}
            </div>
          </div>

          <h1 className="text-2xl font-bold leading-8 text-white lg:text-[32px] lg:leading-10">{title}</h1>

          <div className="flex gap-2 lg:gap-3">
            {metrics.map((m) => (
              <div key={m.label} className="flex min-w-0 flex-1 flex-col gap-1.5 rounded-2xl border border-glass-border bg-white/[0.03] p-3 lg:p-4">
                <span className="text-[11px] leading-tight text-white/45 lg:text-xs lg:leading-4">{m.label}</span>
                <span className="text-xl font-bold text-white lg:text-2xl">{m.value}</span>
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
            {/* AI Summary */}
            <Card className="flex-col items-start gap-3 rounded-[20px] border-glass-border bg-white/[0.03] p-4 lg:flex-row lg:items-center lg:gap-4 lg:p-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-[20px] border border-glass-border bg-white/[0.04]">
                <Zap className="size-5 text-neon-cyan" />
              </div>
              <div className="flex w-full flex-1 flex-col gap-1 lg:w-auto">
                <span className="text-xs font-semibold text-white">AI summary</span>
                <span className="text-sm leading-5 text-white/70">Get a quick AI-powered summary of all job requirements, skills, and qualifications</span>
              </div>
              <Button className={`h-auto w-full shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold text-white lg:w-auto ${GRADIENT} hover:opacity-90`}>Summarize Requirements</Button>
            </Card>

            {/* Job Description */}
            {description && (
              <SectionCard icon={<FileText className="size-5 text-neon-cyan" />} title="Job Description">
                {/* Employer-authored HTML — long unbroken strings must not push the page sideways. */}
                <div className="break-words text-sm leading-[22px] text-white/70 max-lg:overflow-x-auto" dangerouslySetInnerHTML={{ __html: description }} />
              </SectionCard>
            )}

            {/* Required Skills */}
            {dailySkills.length > 0 && (
              <SectionCard icon={<Briefcase className="size-5 text-neon-cyan" />} title="What this role uses daily">
                <p className="text-sm leading-[22px] text-white/70">{skillsSubtitle}</p>
                <div className="flex flex-wrap gap-2">
                  {dailySkills.map((s, i) => (
                    <span key={`${s}-${i}`} className={`${CHIP} px-2.5 py-1.5 text-xs text-white/70`}>
                      {s}
                    </span>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* How you fit this role — reuses the data-wired competency panel */}
            {competency && <CompetencyTable competency={competency} />}

            {/* Resume upload (mock analysis, matching prior behaviour) */}
            <Card className="items-stretch gap-6 rounded-[20px] border-glass-border bg-white/[0.03] p-4 lg:gap-8 lg:p-6">
              <div className="flex items-center gap-3">
                <Zap className="size-5 shrink-0 text-neon-cyan" />
                <h3 className="text-lg font-semibold text-white lg:text-xl">AI Resume Fit Analysis</h3>
              </div>
              <div className="flex flex-col items-center gap-5 lg:gap-6">
                <div className="flex size-24 items-center justify-center rounded-full border border-glass-border bg-white/[0.04] lg:size-[120px]">
                  <FileText className="size-10 text-neon-cyan lg:size-12" />
                </div>
                <div className="flex flex-col items-center gap-3 text-center">
                  <p className="text-xl font-bold text-white lg:text-2xl">See how well you match this role</p>
                  <p className="max-w-[480px] text-sm leading-[22px] text-white/70">Upload a new resume or use your existing one to get a detailed AI-powered fit analysis.</p>
                </div>
                {/* Stacked full-width buttons on a phone; side by side from sm up. */}
                <div className="flex w-full flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:gap-4">
                  <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                    <DialogTrigger asChild>
                      <Button className={`h-auto w-full rounded-full px-6 py-3.5 text-base font-semibold text-white sm:w-auto ${GRADIENT} hover:opacity-90`}>
                        <Upload className="mr-2 size-4" />
                        Upload New Resume
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass border-glass-border">
                      <DialogHeader>
                        <DialogTitle>Upload Your Resume</DialogTitle>
                        <DialogDescription>Upload your resume to get AI-powered insights on how well you match this job.</DialogDescription>
                      </DialogHeader>
                      <div className="rounded-lg border-2 border-dashed border-glass-border p-6 text-center lg:p-8">
                        <Upload className="mx-auto mb-2 size-8 text-white/45" />
                        <p className="mb-2 text-sm text-white/45">Drop your resume here or click to browse</p>
                        <Button variant="outline">Choose File</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" disabled={!myResumes?.length} className="h-auto w-full rounded-full border-glass-border bg-white/[0.04] px-6 py-3.5 text-base font-semibold text-white hover:bg-white/10 disabled:opacity-50 sm:w-auto">
                    Use Existing Resume
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 text-center">
                <Shield className="size-3.5 shrink-0 text-white/45" />
                <span className="text-xs text-white/45">Your resume is analyzed privately and never shared without your consent.</span>
              </div>
            </Card>

            {/* About the Company */}
            <SectionCard icon={<Building2 className="size-5 text-neon-cyan" />} title="About the Company">
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
                <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-glass-border bg-white/[0.04] lg:size-16">
                  {job.company_logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={job.company_logo} alt={companyName} className="size-full object-cover" />
                  ) : (
                    <Building2 className="size-6 text-white/80 lg:size-8" />
                  )}
                </div>
                <div className="contents lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:gap-2">
                  <div className="flex min-w-0 flex-col gap-1 lg:contents">
                    <p className="text-lg font-bold text-white">{companyName}</p>
                    {job.page?.name && (
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-neon-green/20 bg-neon-green/10 px-2 py-1 text-xs font-semibold text-neon-green">Verified</span>
                      </div>
                    )}
                  </div>
                  <p className="col-span-2 text-sm leading-[22px] text-white/70">{job.page?.description || "Company description not available."}</p>
                  {job.page?.id && (
                    <Button variant="outline" onClick={() => router.push(`/pages/${job.page!.id}`)} className="col-span-2 mt-1 h-auto w-full rounded-full border-[1.5px] border-white/20 bg-transparent px-4 py-3 text-sm text-white hover:bg-white/5 sm:w-fit lg:px-6 lg:py-3.5">
                      Visit Company Page
                    </Button>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* Interview Questions (static placeholder, as before) */}
            <SectionCard icon={<HelpCircle className="size-5 text-neon-cyan" />} title="AI-Generated Interview Questions">
              <div className="flex flex-col gap-3">
                {interviewQuestions.map((q) => (
                  <div key={q} className="rounded-2xl border border-glass-border bg-white/[0.03] p-4 text-sm text-white">
                    {q}
                  </div>
                ))}
              </div>
              <span className={`${CHIP} w-fit px-4 py-2.5 text-sm font-semibold text-neon-purple`}>View All Questions (5)</span>
            </SectionCard>
          </div>

          {/* Right */}
          <div className="w-full lg:w-80 lg:shrink-0">
            <SectionCard title="Similar Jobs" titleSize="text-base lg:text-lg">
              {isSimilarLoading ? (
                <p className="text-sm text-white/45">Loading similar jobs...</p>
              ) : !similarJobs || similarJobs.length === 0 ? (
                <p className="text-sm text-white/45">No similar jobs found.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {similarJobs.map((j) => {
                    const sName = j.page?.name || j.company_name;
                    const salary = formatSalary(j);
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
      </div>

      <QuickApplyModal
        isOpen={showQuickApplyModal}
        onClose={() => setShowQuickApplyModal(false)}
        job={job}
        companyName={companyName}
        screeningQuestions={job.questionSets ? job.questionSets?.[0]?.questions : []}
        onSubmit={() => setShowQuickApplyModal(false)}
        resumes={myResumes}
      />
    </div>
  );
}

/* ------------------------------ sub-components ----------------------------- */

function ShareButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex size-9 items-center justify-center rounded-[20px] border border-glass-border bg-white/[0.03] text-white/80 transition-colors hover:text-white lg:size-10">
      {children}
    </button>
  );
}

function SectionCard({ icon, title, titleSize = "text-lg lg:text-xl", children }: { icon?: React.ReactNode; title: string; titleSize?: string; children: React.ReactNode }) {
  return (
    <Card className="gap-4 rounded-[20px] border-glass-border bg-white/[0.03] p-4 lg:p-6">
      <div className="flex items-center gap-3">
        {icon && <span className="shrink-0">{icon}</span>}
        <h3 className={`${titleSize} font-semibold text-white`}>{title}</h3>
      </div>
      {children}
    </Card>
  );
}

export default JobDetailPageRedesign;
