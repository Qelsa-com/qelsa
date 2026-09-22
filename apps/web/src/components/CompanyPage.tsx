"use client";

import { SkillOverflowTags } from "@/components/skills/SkillOverflowTags";
import { formatCity } from "@/constants/city";
import { skillRoleSubtitle } from "@/constants/skills";
import { useAuth } from "@/contexts/AuthContext";
import { useGetJobsQuery } from "@/features/api/jobsApi";
import { useGetCompanySizesQuery } from "@/features/api/onboardingApi";
import { useGetPageByIdQuery, useUpdatePageMutation } from "@/features/api/pagesApi";
import { toastUnknownError } from "@/lib/errors";
import { Job } from "@/types/job";
import {
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  Calendar,
  Check,
  CheckCircle,
  Copy,
  DollarSign,
  ExternalLink,
  Globe,
  GraduationCap,
  Heart,
  Laptop,
  MapPin,
  MessageSquare,
  PenLine,
  Plus,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CompanyPageSkeleton } from "./pageSkeletons";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";

function getCultureIcon(tag: string) {
  const lower = tag.toLowerCase();
  if (lower.includes("remote") || lower.includes("hybrid") || lower.includes("flex")) return Globe;
  if (lower.includes("owner") || lower.includes("lead") || lower.includes("impact")) return Sparkles;
  if (lower.includes("learn") || lower.includes("grow") || lower.includes("mentor")) return GraduationCap;
  if (lower.includes("salar") || lower.includes("comp") || lower.includes("pay") || lower.includes("equity")) return DollarSign;
  if (lower.includes("health") || lower.includes("well") || lower.includes("care")) return Heart;
  if (lower.includes("action") || lower.includes("speed") || lower.includes("craft")) return Zap;
  if (lower.includes("team") || lower.includes("people") || lower.includes("collab")) return Users;
  if (lower.includes("tech") || lower.includes("code") || lower.includes("eng")) return Laptop;
  return ShieldCheck;
}

const PRESET_CULTURE_TAGS = [
  "Remote-first",
  "Ownership Mindset",
  "Continuous Learning",
  "Transparent Salaries",
  "Bias for Action",
  "Work-Life Harmony",
  "High Autonomy",
  "Collaborative Culture",
];

export function CompanyPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { user } = useAuth();

  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "jobs">("overview");
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "jobs" || tab === "overview") setActiveTab(tab);
  }, []);

  const {
    data: pageData,
    isLoading,
    error,
  } = useGetPageByIdQuery(id ?? "", {
    skip: !id,
  });

  const { data: pageJobs } = useGetJobsQuery({ page_id: id }, { skip: !id });
  const [updatePage, { isLoading: isUpdating }] = useUpdatePageMutation();

  if (isLoading) return <CompanyPageSkeleton />;

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-bold text-destructive">Failed to load company page</h2>
        <p className="mt-2 text-sm text-muted-foreground">Please check the link or try again later.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/pages")}>
          Back to Pages
        </Button>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-bold text-white">Company page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you are looking for does not exist or has been removed.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/pages")}>
          Back to Pages
        </Button>
      </div>
    );
  }

  const jobs: Job[] = (pageJobs?.length ? pageJobs : pageData.jobs) ?? [];
  const isOwner = Boolean(pageData.can_manage || pageData.owner?.id == user?.id);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleFollowCompany = () => {
    setIsFollowing((prev) => !prev);
    toast.success(isFollowing ? "Unfollowed company" : "Following company");
  };

  const hasAboutOrCulture =
    Boolean(pageData.description?.trim()) ||
    Boolean(pageData.culture_statement?.trim()) ||
    Boolean(pageData.culture_tags && pageData.culture_tags.length > 0);

  return (
    <div className="min-h-screen pb-16">
      {/* Hero Header */}
      <div className="relative border-b border-white/[0.08] pb-0 pt-10">
        {/* Cyan Radial Glow Background */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-[340px] w-[640px] -translate-x-1/2 rounded-full bg-neon-cyan/[0.12] blur-[120px]" />

        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            {/* Identity Cluster */}
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start text-center sm:text-left">
              {/* Circular Logo (136px) */}
              <div className="relative size-32 sm:size-36 shrink-0 rounded-full border-4 border-[#06060f] bg-[#12121c] p-1 shadow-2xl ring-2 ring-white/10 overflow-hidden flex items-center justify-center">
                {pageData.logo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={pageData.logo}
                    alt={pageData.name}
                    className="size-full rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center rounded-full bg-gradient-to-br from-neon-purple to-neon-pink">
                    <span className="text-4xl font-extrabold text-white">
                      {pageData.name?.charAt(0)?.toUpperCase() || "C"}
                    </span>
                  </div>
                )}
              </div>

              {/* Title, Tagline, Stats */}
              <div className="flex flex-col">
                <div className="flex items-center gap-3 justify-center sm:justify-start">
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                    {pageData.name}
                  </h1>
                </div>

                {pageData.tagline && (
                  <p className="mt-1 text-base text-white/70">
                    {pageData.tagline}
                  </p>
                )}

                {pageData.headquarters && (
                  <div className="mt-2 flex items-center justify-center sm:justify-start gap-1.5 text-sm text-white/60">
                    <MapPin className="size-4 text-white/50" />
                    <span>{pageData.headquarters}</span>
                  </div>
                )}

                {/* Follower Avatars + Open Roles Badge */}
                <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2 overflow-hidden">
                      <div className="size-6 rounded-full border-2 border-[#06060f] bg-gradient-to-br from-neon-cyan to-neon-purple" />
                      <div className="size-6 rounded-full border-2 border-[#06060f] bg-gradient-to-br from-neon-purple to-neon-pink" />
                      <div className="size-6 rounded-full border-2 border-[#06060f] bg-gradient-to-br from-neon-pink to-neon-cyan" />
                    </div>
                    <span className="font-medium text-white/80">1.2k Followers</span>
                  </div>

                  <span className="text-white/30">•</span>

                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-0.5 text-xs font-medium text-white/80">
                    {jobs.length} Open role{jobs.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center sm:justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
              >
                <Share2 className="size-4 text-white/70" />
                <span>Share profile</span>
              </button>

              {isOwner && (
                <button
                  type="button"
                  onClick={() => router.push(`/pages/${pageData.id}/edit`)}
                  className="flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
                >
                  <PenLine className="size-4 text-white/70" />
                  <span>Edit profile</span>
                </button>
              )}

              {!isOwner && (
                <>
                  <button
                    type="button"
                    onClick={() => toast.info("Messaging will be available soon.")}
                    className="flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
                  >
                    <MessageSquare className="size-4 text-white/70" />
                    <span>Message</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFollowCompany}
                    className={`flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium transition-all ${
                      isFollowing
                        ? "border border-white/20 bg-white/10 text-white"
                        : "gradient-primary text-white shadow-md hover:opacity-90"
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="size-4" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <Users className="size-4" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-8 flex gap-8 border-b border-white/[0.08]">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`relative pb-3 text-sm font-semibold transition-colors ${
                activeTab === "overview" ? "text-neon-cyan" : "text-white/60 hover:text-white"
              }`}
            >
              Overview
              {activeTab === "overview" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-neon-cyan" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("jobs")}
              className={`relative pb-3 text-sm font-semibold transition-colors ${
                activeTab === "jobs" ? "text-neon-cyan" : "text-white/60 hover:text-white"
              }`}
            >
              Jobs ({jobs.length})
              {activeTab === "jobs" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-neon-cyan" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (2 Cols) */}
            <div className="lg:col-span-2 space-y-6">
              {!hasAboutOrCulture ? (
                /* Empty State Card (matching media_1790093060840.png) */
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7 backdrop-blur-sm">
                  <h3 className="text-xl font-bold text-white">
                    Tell people what you&apos;re about
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">
                    Introduce your company to candidates. Share your mission, what you build, and why people love working here. A clear intro helps candidates decide if they&apos;re a fit before they apply.
                  </p>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => router.push(`/pages/${pageData.id}/edit?tab=about`)}
                      className="mt-6 flex items-center gap-2 rounded-full gradient-primary px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
                    >
                      <span>Add details</span>
                      <ArrowRight className="size-4" />
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* About Card */}
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-white">
                        About {pageData.name}
                      </h3>
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => router.push(`/pages/${pageData.id}/edit?tab=about`)}
                          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
                        >
                          <PenLine className="size-3.5" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>

                    <p className="mt-4 text-[15px] leading-relaxed text-white/80 whitespace-pre-line">
                      {pageData.description || (
                        <span className="italic text-white/40">No description provided yet.</span>
                      )}
                    </p>

                    {pageData.specialties && pageData.specialties.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {pageData.specialties.map((spec: string) => (
                          <span
                            key={spec}
                            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-white/80"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Company Culture Card */}
                  {(pageData.culture_statement ||
                    (pageData.culture_tags && pageData.culture_tags.length > 0) ||
                    isOwner) && (
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white">
                          Company Culture
                        </h3>
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => router.push(`/pages/${pageData.id}/edit?tab=culture`)}
                            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
                          >
                            <PenLine className="size-3.5" />
                            <span>Edit</span>
                          </button>
                        )}
                      </div>

                      {pageData.culture_statement && (
                        <p className="mt-4 text-[15px] italic leading-relaxed text-white/90">
                          &quot;{pageData.culture_statement}&quot;
                        </p>
                      )}

                      {pageData.culture_tags && pageData.culture_tags.length > 0 && (
                        <div className="mt-5 flex flex-wrap gap-2.5">
                          {pageData.culture_tags.map((tag: string) => {
                            const Icon = getCultureIcon(tag);
                            return (
                              <span
                                key={tag}
                                className="flex items-center gap-2 rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-3.5 py-1.5 text-xs font-medium text-neon-cyan"
                              >
                                <Icon className="size-3.5 text-neon-cyan" />
                                <span>{tag}</span>
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {!pageData.culture_statement &&
                        (!pageData.culture_tags || pageData.culture_tags.length === 0) && (
                          <p className="mt-4 text-sm text-white/40 italic">
                            Share your culture and work principles to attract like-minded candidates.
                          </p>
                        )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right Rail (1 Col) */}
            <div className="space-y-6">
              {/* Company Details Card */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-bold text-white">Company Details</h3>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => router.push(`/pages/${pageData.id}/edit?tab=details`)}
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-medium text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
                    >
                      <PenLine className="size-3" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                <div className="divide-y divide-white/[0.06] text-sm">
                  {/* Website */}
                  <div className="pb-3.5">
                    <span className="text-xs text-white/50">Website</span>
                    <div className="mt-1">
                      {pageData.website ? (
                        <a
                          href={pageData.website.startsWith("http") ? pageData.website : `https://${pageData.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-neon-cyan hover:underline"
                        >
                          <span>{pageData.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
                          <ExternalLink className="size-3" />
                        </a>
                      ) : (
                        <span className="text-white/40 italic">Not set</span>
                      )}
                    </div>
                  </div>

                  {/* Industry */}
                  <div className="py-3.5">
                    <span className="text-xs text-white/50">Industry</span>
                    <div className="mt-1 font-medium text-white/90">
                      {pageData.industry || <span className="text-white/40 italic font-normal">Not set</span>}
                    </div>
                  </div>

                  {/* Company Size */}
                  <div className="py-3.5">
                    <span className="text-xs text-white/50">Size</span>
                    <div className="mt-1 font-medium text-white/90">
                      {pageData.company_size?.label || pageData.companySize || <span className="text-white/40 italic font-normal">Not set</span>}
                    </div>
                  </div>

                  {/* Headquarters */}
                  <div className="py-3.5">
                    <span className="text-xs text-white/50">Headquarters</span>
                    <div className="mt-1 font-medium text-white/90">
                      {pageData.headquarters || <span className="text-white/40 italic font-normal">Not set</span>}
                    </div>
                  </div>

                  {/* Founded */}
                  <div className="pt-3.5">
                    <span className="text-xs text-white/50">Founded</span>
                    <div className="mt-1 font-medium text-white/90">
                      {pageData.founded_year || pageData.foundedYear || <span className="text-white/40 italic font-normal">Not set</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Open Positions Card */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-sm">
                <div className="flex size-10 items-center justify-center rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan mb-4">
                  <Briefcase className="size-5" />
                </div>
                <h4 className="text-lg font-bold text-white">
                  {jobs.length} Open role{jobs.length === 1 ? "" : "s"}
                </h4>
                <p className="mt-1 text-xs text-white/60 leading-relaxed">
                  {jobs.length > 0
                    ? "Explore current openings and join our growing team."
                    : "No open roles currently posted."}
                </p>
                {jobs.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab("jobs")}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/[0.08]"
                  >
                    <span>View all roles</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                ) : isOwner ? (
                  <button
                    type="button"
                    onClick={() => router.push("/jobs/create-job")}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl gradient-primary py-2.5 text-xs font-semibold text-white shadow transition-opacity hover:opacity-90"
                  >
                    <span>Post a job</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {activeTab === "jobs" && (
          <div className="space-y-6">
            {jobs.length === 0 ? (
              /* Empty Jobs State (matching media_1790093060834.png) */
              <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-20 text-center backdrop-blur-sm">
                <div className="flex size-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60">
                  <Briefcase className="size-7" />
                </div>
                <h3 className="mt-5 text-2xl font-bold tracking-tight text-white">
                  No open roles yet
                </h3>
                <p className="mt-2.5 max-w-md text-sm leading-relaxed text-white/60">
                  When you&apos;re ready to grow your team, this is where your jobs will live. Post your first role and start connecting with the right people.
                </p>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => router.push("/jobs/create-job")}
                    className="mt-7 flex items-center gap-2 rounded-full gradient-primary px-7 py-3 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
                  >
                    <span>Post a job</span>
                    <ArrowRight className="size-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">
                    Open Positions at {pageData.name}
                  </h3>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => router.push("/jobs/create-job")}
                      className="flex items-center gap-2 rounded-full gradient-primary px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
                    >
                      <Plus className="size-3.5" />
                      <span>Post a role</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {jobs.map((job: Job) => (
                    <div
                      key={job.id}
                      onClick={() => router.push(`/jobs/${job.id}`)}
                      className="group cursor-pointer rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition-all hover:border-neon-cyan/40 hover:bg-white/[0.04]"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-start justify-between">
                          <h4 className="text-lg font-semibold text-white group-hover:text-neon-cyan transition-colors">
                            {job.title}
                          </h4>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-white/60">
                          {job.city && (
                            <div className="flex items-center gap-1">
                              <MapPin className="size-3.5" />
                              <span>{formatCity(job.city)}</span>
                            </div>
                          )}
                          {job.work_type && (
                            <div className="flex items-center gap-1">
                              <Briefcase className="size-3.5" />
                              <span>{job.work_type}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="size-3.5" />
                            <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="mt-3">
                          <SkillOverflowTags
                            skills={(job.job_skills ?? [])
                              .map((skill) => skill.skill?.name ?? skill.title)
                              .filter((name): name is string => Boolean(name))}
                            subtitle={skillRoleSubtitle(
                              job.job_title?.name ?? job.title,
                              job.company_name || job.page?.name || pageData.name,
                            )}
                            sectionLabel="Skills used"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="border border-white/10 bg-[#0d0d18] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white">
              <Share2 className="size-5 text-neon-cyan" />
              Share {pageData.name}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3 py-3">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Check out ${pageData.name} on Qelsa: ${shareUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.06]"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-7 text-green-500">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span className="text-xs text-white/70">WhatsApp</span>
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.06]"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-7 text-blue-500">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              <span className="text-xs text-white/70">LinkedIn</span>
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.06]"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-7 text-blue-600">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="text-xs text-white/70">Facebook</span>
            </a>
          </div>

          <div className="mt-2 space-y-2">
            <span className="text-xs text-white/60">Or copy link</span>
            <div className="flex items-center gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="border-white/10 bg-white/[0.04] text-xs text-white"
              />
              <Button
                onClick={handleCopyLink}
                className="gradient-primary text-white shrink-0 hover:opacity-90"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
