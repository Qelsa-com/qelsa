"use client";

import { ApplicationsHubSkeleton } from "@/components/job/jobSkeletons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCity } from "@/constants/city";
import { useAuth } from "@/contexts/AuthContext";
import { useEditJobMutation, useGetPostedJobsQuery } from "@/features/api/jobsApi";
import {
  Briefcase,
  Eye,
  FileText,
  MoreVertical,
  PauseCircle,
  Pencil,
  PlayCircle,
  Plus,
  Search,
  Share2,
  Star,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return String(num);
}

const statusBadgeStyles: Record<string, { label: string; className: string }> = {
  open: { label: "Active", className: "bg-neon-green/15 text-neon-green" },
  paused: { label: "Paused", className: "bg-neon-yellow/15 text-neon-yellow" },
  closed: { label: "Closed", className: "bg-white/10 text-white/50" },
};

export function ApplicationsHub() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: postedJobs = [], isLoading: isJobsLoading } = useGetPostedJobsQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [editJob] = useEditJobMutation();

  const activeJobsCount = useMemo(
    () => postedJobs.filter((j) => j.status === "open").length,
    [postedJobs],
  );

  const totalViews = useMemo(
    () => postedJobs.reduce((sum, j) => sum + (j.view_count ?? 0), 0),
    [postedJobs],
  );

  const totalApplications = useMemo(
    () => postedJobs.reduce((sum, j) => sum + (j.application_count ?? 0), 0),
    [postedJobs],
  );

  const totalShortlisted = useMemo(
    () => postedJobs.reduce((sum, j) => sum + (j.shortlisted_count ?? 0), 0),
    [postedJobs],
  );

  const filteredJobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return postedJobs;
    return postedJobs.filter((job) => {
      const title = (job.title || job.job_title?.name || "").toLowerCase();
      const company = (job.company_name || job.page?.name || "").toLowerCase();
      const city = (job.city?.name || "").toLowerCase();
      const skills = (job.job_skills ?? []).map((s) => (s.skill?.name || s.title || "").toLowerCase());
      return title.includes(q) || company.includes(q) || city.includes(q) || skills.some((s) => s.includes(q));
    });
  }, [postedJobs, searchQuery]);

  const handleChangeStatus = async (jobId: string | number, status: "open" | "paused" | "closed") => {
    try {
      await editJob({ jobId, body: { status } }).unwrap();
      const actionLabel = status === "open" ? "resumed" : status === "paused" ? "paused" : "closed";
      toast.success(`Job ${actionLabel} successfully`);
    } catch (error) {
      console.error("Failed to update job status:", error);
      toast.error("Failed to update job status");
    }
  };

  const handleShare = async (jobId: string | number) => {
    const url = `${window.location.origin}/jobs/${jobId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Job link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  if (authLoading || isJobsLoading) {
    return <ApplicationsHubSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#06060f]">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-20">
        {/* Header */}
        <div className="flex flex-col gap-1 mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">Applications</h1>
          <p className="text-sm sm:text-base text-white/60">Manage and track all applications</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs font-medium text-white/50">Active jobs</div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold text-white">{activeJobsCount}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs font-medium text-white/50">Views</div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold text-white">{formatCompactNumber(totalViews)}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs font-medium text-white/50">Applications</div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold text-white">{formatCompactNumber(totalApplications)}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs font-medium text-white/50">Shortlisted</div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold text-white">{formatCompactNumber(totalShortlisted)}</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posted jobs..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-white/40 transition-colors focus:border-neon-cyan/50 focus:bg-white/[0.06] focus:outline-none"
          />
        </div>

        {/* Job Cards */}
        {filteredJobs.length > 0 ? (
          <div className="flex flex-col gap-4">
            {filteredJobs.map((job) => {
              const title = job.job_title?.name ?? job.title ?? "Untitled Role";
              const company = job.company_name || job.page?.name || "Company";
              const location = job.city ? formatCity(job.city) : job.workplace_type ?? null;
              const postedDate = job.createdAt || job.published_date
                ? new Date(job.createdAt || job.published_date).toLocaleDateString()
                : null;
              const metaParts = [company, location, postedDate ? `Posted ${postedDate}` : null].filter(Boolean);
              const badge = statusBadgeStyles[job.status] ?? statusBadgeStyles.open;
              const skills = (job.job_skills ?? [])
                .map((s) => s.skill?.name ?? s.title)
                .filter((name): name is string => Boolean(name))
                .slice(0, 8);

              return (
                <div
                  key={job.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 transition-all hover:border-white/20"
                >
                  {/* Top row: Title + Status + Action menu */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-bold text-white">{title}</h2>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                          aria-label="Job actions"
                        >
                          <MoreVertical className="size-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass-strong border-glass-border w-48">
                        <DropdownMenuItem
                          onClick={() => router.push(`/jobs/${job.id}/applications`)}
                          className="cursor-pointer gap-2.5 text-sm"
                        >
                          <FileText className="size-4 text-neon-cyan" />
                          View Applications
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/jobs/edit/${job.id}`)}
                          className="cursor-pointer gap-2.5 text-sm"
                        >
                          <Pencil className="size-4" />
                          Edit Job
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleShare(job.id)}
                          className="cursor-pointer gap-2.5 text-sm"
                        >
                          <Share2 className="size-4" />
                          Share Job Link
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        {job.status === "open" ? (
                          <DropdownMenuItem
                            onClick={() => handleChangeStatus(job.id, "paused")}
                            className="cursor-pointer gap-2.5 text-sm text-neon-yellow"
                          >
                            <PauseCircle className="size-4" />
                            Pause Job
                          </DropdownMenuItem>
                        ) : job.status === "paused" ? (
                          <DropdownMenuItem
                            onClick={() => handleChangeStatus(job.id, "open")}
                            className="cursor-pointer gap-2.5 text-sm text-neon-green"
                          >
                            <PlayCircle className="size-4" />
                            Resume Job
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Sub row: Meta */}
                  {metaParts.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/50">
                      {metaParts.map((part, pIdx) => (
                        <span key={pIdx} className="flex items-center gap-2">
                          {pIdx > 0 && <span className="text-white/30">•</span>}
                          <span>{part}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Skills row */}
                  {skills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/70"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Divider */}
                  <div className="my-5 h-px w-full bg-white/[0.08]" />

                  {/* Metrics and CTA row */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-1.5 text-xs text-white/60">
                        <Eye className="size-4 text-white/45" />
                        <span>{(job.view_count ?? 0).toLocaleString()} views</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-white/60">
                        <FileText className="size-4 text-white/45" />
                        <span>{(job.application_count ?? 0).toLocaleString()} applications</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-white/60">
                        <Star className="size-4 text-white/45" />
                        <span>{(job.shortlisted_count ?? 0).toLocaleString()} shortlisted</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => router.push(`/jobs/${job.id}/applications`)}
                      className="cursor-pointer text-sm font-semibold text-neon-cyan hover:underline"
                    >
                      View applications
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6 rounded-2xl border border-white/10 bg-white/[0.02] text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/5 border border-white/10">
              <Briefcase className="h-10 w-10 text-white/40" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {searchQuery ? "No matching jobs found" : "No jobs posted yet"}
            </h2>
            <p className="text-white/60 max-w-md mb-6 text-sm sm:text-base">
              {searchQuery
                ? "Try adjusting your search query or clear the filter to see all posted jobs."
                : "Post a job to start receiving candidate applications and evaluating them with AI match scores."}
            </p>
            {searchQuery ? (
              <Button
                variant="outline"
                onClick={() => setSearchQuery("")}
                className="rounded-full border-white/20 text-white hover:bg-white/10"
              >
                Clear search
              </Button>
            ) : (
              <Button
                onClick={() => router.push("/jobs/create-job")}
                className="rounded-full gradient-primary px-6 py-3 font-bold text-white border-0 shadow-lg hover:shadow-neon-purple/20 transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                Post a job
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
