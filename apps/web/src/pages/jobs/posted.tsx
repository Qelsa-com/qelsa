import { PostedJobsSkeleton } from "@/components/job/jobSkeletons";
import { SkillOverflowTags } from "@/components/skills/SkillOverflowTags";
import { skillRoleSubtitle } from "@/constants/skills";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatCity } from "@/constants/city";
import { useDeleteJobMutation, useDuplicateJobMutation, useEditJobMutation, useGetPostedJobsQuery } from "@/features/api/jobsApi";
import Layout from "@/layout";
import { Briefcase, Calendar, Clock, Copy, FileText, MapPin, MoreVertical, PauseCircle, Pencil, PlayCircle, Plus, Search, Share2, Trash2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import { Input } from "../../components/ui/input";

type JobStatus = "open" | "paused" | "closed";

const statusLabels: Record<JobStatus, string> = {
  open: "Active",
  paused: "Paused",
  closed: "Closed",
};

const statusBadgeStyles: Record<JobStatus, string> = {
  open: "bg-neon-green/15 text-neon-green",
  paused: "bg-neon-yellow/15 text-neon-yellow",
  closed: "bg-white/8 text-white/45",
};

const workplaceDotColors: Record<string, string> = {
  hybrid: "bg-neon-purple",
  remote: "bg-neon-cyan",
  "on-site": "bg-neon-green",
};

const workplaceLabels: Record<string, string> = {
  hybrid: "Hybrid",
  remote: "Remote",
  "on-site": "On-site",
};

export default function Posted() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatus>("open");
  const { data: postedJobs = [], isLoading } = useGetPostedJobsQuery();
  const [deleteJob, { isLoading: isDeleting }] = useDeleteJobMutation();
  const [editJob] = useEditJobMutation();
  const [duplicateJob, { isLoading: isDuplicating }] = useDuplicateJobMutation();
  const [jobToDelete, setJobToDelete] = useState<{ id: string | number; title: string } | null>(null);
  const [jobToClose, setJobToClose] = useState<{ id: string | number; title: string } | null>(null);

  const filteredJobs = postedJobs.filter((job) => {
    const matchesSearch =
      (job.job_title?.name ?? job.title ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.job_skills ?? []).some((skill) => (skill.skill?.name ?? skill.title ?? "").toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openJobs = postedJobs.filter((job) => job.status === "open");
  const pausedJobs = postedJobs.filter((job) => job.status === "paused");
  const closedJobs = postedJobs.filter((job) => job.status === "closed");

  const totalApplications = postedJobs.reduce((sum, job) => sum + (job.application_count ?? job.applications?.length ?? 0), 0);

  const statusCounts: Record<JobStatus, number> = {
    open: openJobs.length,
    paused: pausedJobs.length,
    closed: closedJobs.length,
  };

  const handleChangeStatus = async (jobId: string | number, status: "open" | "paused" | "closed" | "draft") => {
    try {
      await editJob({ jobId, body: { status } }).unwrap();
      const actionLabel = status === "open" ? "resumed" : status === "paused" ? "paused" : "closed";
      toast.success(`Job ${actionLabel} successfully`);
    } catch (error) {
      console.error("Failed to update job:", error);
      toast.error("Failed to update job status");
    }
  };

  const handleConfirmDelete = async () => {
    if (!jobToDelete) return;
    try {
      await deleteJob(jobToDelete.id).unwrap();
      toast.success("Job post deleted successfully");
      setJobToDelete(null);
    } catch (error) {
      console.error("Failed to delete job:", error);
      toast.error("Failed to delete job post");
    }
  };

  const handleConfirmClose = async () => {
    if (!jobToClose) return;
    try {
      await handleChangeStatus(jobToClose.id, "closed");
      setJobToClose(null);
    } catch (error) {
      console.error("Failed to close job:", error);
    }
  };

  const handleDuplicateJob = async (jobId: string | number) => {
    try {
      await duplicateJob(jobId).unwrap();
      toast.success("Job post duplicated successfully");
    } catch (error) {
      console.error("Failed to duplicate job:", error);
      toast.error("Failed to duplicate job post");
    }
  };

  const handleShareJobLink = async (jobId: string | number) => {
    try {
      const url = `${window.location.origin}/jobs/${jobId}`;
      await navigator.clipboard.writeText(url);
      toast.success("Job link copied to clipboard");
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast.error("Failed to copy job link");
    }
  };

  return (
    <Layout activeSection={"jobs"}>
      <div className="min-h-screen">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-20 flex flex-col gap-8">
          {/* Page header */}
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-3">
                <h1 className="text-4xl lg:text-5xl font-extrabold text-white">Job posts</h1>
                <p className="text-lg text-white/70">Manage and track your job postings</p>
              </div>

              <Button
                onClick={() => router.push("/jobs/create-job")}
                className="rounded-full gradient-primary px-6 py-3 h-auto text-sm font-bold text-white border-0 shadow-lg hover:shadow-xl hover:shadow-neon-purple/30 transition-all duration-300"
              >
                <Plus className="w-4 h-4 mr-2" />
                Post job
              </Button>
            </div>

            {isLoading ? (
              <PostedJobsSkeleton />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="flex flex-col gap-1.5 rounded-2xl border border-white/12 bg-white/3 p-4">
                  <p className="text-xs text-white/45">Active jobs</p>
                  <p className="text-2xl font-bold text-white">{openJobs.length}</p>
                </div>
                <div className="flex flex-col gap-1.5 rounded-2xl border border-white/12 bg-white/3 p-4">
                  <p className="text-xs text-white/45">Paused</p>
                  <p className="text-2xl font-bold text-white">{pausedJobs.length}</p>
                </div>
                <div className="flex flex-col gap-1.5 rounded-2xl border border-white/12 bg-white/3 p-4">
                  <p className="text-xs text-white/45">Applications</p>
                  <p className="text-2xl font-bold text-white">{totalApplications}</p>
                </div>
                <div className="flex flex-col gap-1.5 rounded-2xl border border-white/12 bg-white/3 p-4">
                  <p className="text-xs text-white/45">Closed</p>
                  <p className="text-2xl font-bold text-white">{closedJobs.length}</p>
                </div>
              </div>
            )}
          </div>

          {!isLoading && (
            <>
              <div className="flex flex-col lg:flex-row lg:items-center gap-6 py-1">
                <div className="relative w-full lg:w-[577px]">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/45" />
                  <Input
                    type="text"
                    placeholder="Search posted jobs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 rounded-3xl border-white/12 bg-transparent pl-12 text-sm placeholder:text-white/45 focus-visible:border-neon-cyan"
                  />
                </div>

                <div className="flex items-center gap-3">
                  {(Object.keys(statusLabels) as JobStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`rounded-full px-5 py-2.5 text-sm transition-colors ${
                        statusFilter === status ? "bg-neon-cyan/15 font-semibold text-neon-cyan" : "border border-white/12 font-medium text-white/70 hover:bg-white/5"
                      }`}
                    >
                      {statusLabels[status]} ({statusCounts[status]})
                    </button>
                  ))}
                </div>
              </div>

              {/* Job listings */}
              <div className="flex flex-col gap-5 pt-2">
                {filteredJobs.map((job) => (
                  <div key={job.id} className="flex flex-col gap-4 rounded-[20px] border border-white/12 bg-white/4 px-7 py-6 transition-colors hover:border-neon-cyan/30">
                    {/* Title row */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-white">{job.job_title?.name ?? job.title}</h3>
                  <span className={`rounded-md px-2 py-[3px] text-[11px] font-semibold ${statusBadgeStyles[job.status as JobStatus] ?? statusBadgeStyles.closed}`}>
                    {statusLabels[job.status as JobStatus] ?? job.status}
                  </span>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex h-8 w-8 items-center justify-center rounded-md text-white/70 hover:bg-white/5">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[220px] rounded-xl border-white/12 bg-[#1a1a24] p-2">
                    <DropdownMenuItem
                      onClick={() => router.push(`/jobs/create-job?jobId=${job.id}`)}
                      className="cursor-pointer gap-3 rounded-md px-4 py-2.5 text-sm font-medium text-white/70 hover:text-white"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit Job Post
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDuplicateJob(job.id)}
                      disabled={isDuplicating}
                      className="cursor-pointer gap-3 rounded-md px-4 py-2.5 text-sm font-medium text-white/70 hover:text-white disabled:opacity-50"
                    >
                      <Copy className="w-4 h-4" />
                      Duplicate Job
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/jobs/${job.id}/applications`)} className="cursor-pointer gap-3 rounded-md px-4 py-2.5 text-sm font-medium text-white/70 hover:text-white">
                      <FileText className="w-4 h-4" />
                      View Applications
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShareJobLink(job.id)} className="cursor-pointer gap-3 rounded-md px-4 py-2.5 text-sm font-medium text-white/70 hover:text-white">
                      <Share2 className="w-4 h-4" />
                      Share Job Link
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/8" />
                    {job.status === "open" && (
                      <DropdownMenuItem onClick={() => handleChangeStatus(job.id, "paused")} className="cursor-pointer gap-3 rounded-md px-4 py-2.5 text-sm font-medium text-neon-yellow hover:text-neon-yellow/80">
                        <PauseCircle className="w-4 h-4" />
                        Pause Job
                      </DropdownMenuItem>
                    )}
                    {job.status === "paused" && (
                      <DropdownMenuItem onClick={() => handleChangeStatus(job.id, "open")} className="cursor-pointer gap-3 rounded-md px-4 py-2.5 text-sm font-medium text-neon-green hover:text-neon-green/80">
                        <PlayCircle className="w-4 h-4" />
                        Resume Job
                      </DropdownMenuItem>
                    )}
                    {job.status !== "closed" && (
                      <DropdownMenuItem
                        onClick={() => setJobToClose({ id: job.id, title: job.job_title?.name ?? job.title ?? "this job" })}
                        className="cursor-pointer gap-3 rounded-md px-4 py-2.5 text-sm font-medium text-red-500 hover:text-red-400"
                      >
                        <XCircle className="w-4 h-4" />
                        Close Job
                      </DropdownMenuItem>
                    )}
                    {job.status === "closed" && (
                      <DropdownMenuItem
                        onClick={() => handleChangeStatus(job.id, "open")}
                        className="cursor-pointer gap-3 rounded-md px-4 py-2.5 text-sm font-medium text-neon-green hover:text-neon-green/80"
                      >
                        <PlayCircle className="w-4 h-4" />
                        Reopen Job
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => setJobToDelete({ id: job.id, title: job.job_title?.name ?? job.title ?? "this job" })}
                      className="cursor-pointer gap-3 rounded-md px-4 py-2.5 text-sm font-medium text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Job
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3">
                {job.city && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-white/50" />
                    <span className="text-[13px] text-white/50">{formatCity(job.city)}</span>
                  </div>
                )}
                {job.workplace_type && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-white/25" />
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${workplaceDotColors[job.workplace_type] ?? "bg-white/40"}`} />
                      <span className="text-[13px] text-white/60">{workplaceLabels[job.workplace_type] ?? job.workplace_type}</span>
                    </div>
                  </>
                )}
                {job.work_type && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-white/25" />
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-white/50" />
                      <span className="text-[13px] text-white/50">{job.work_type}</span>
                    </div>
                  </>
                )}
                <span className="h-1 w-1 rounded-full bg-white/25" />
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-white/50" />
                  <span className="text-[13px] text-white/50">Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Skills */}
              <SkillOverflowTags
                skills={(job.job_skills ?? []).map((skill) => skill.skill?.name ?? skill.title).filter((name): name is string => Boolean(name))}
                subtitle={skillRoleSubtitle(job.job_title?.name ?? job.title, job.company_name || job.page?.name)}
                sectionLabel="Skills used"
              />

              <div className="h-px w-full bg-white/12" />

              {/* Metrics */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-white/60" />
                    <span className="text-[13px] text-white/60">{job.application_count ?? job.applications?.length ?? 0} applications</span>
                  </div>
                </div>

                <button onClick={() => router.push(`/jobs/${job.id}/applications`)} className="text-sm font-semibold text-neon-cyan underline">
                  View Applications
                </button>
              </div>
            </div>
          ))}

          {filteredJobs.length === 0 && (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white/4">
                <Briefcase className="h-12 w-12 text-white/45" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">No jobs found</h3>
              <p className="mb-4 text-white/70">{searchQuery ? "Try adjusting your search criteria" : "Start by posting your first job"}</p>
              {!searchQuery && (
                <Button onClick={() => router.push("/jobs/create-job")} className="rounded-full gradient-primary px-6 py-3 h-auto text-sm font-bold text-white border-0">
                  <Plus className="w-4 h-4 mr-2" />
                  Post Your First Job
                </Button>
              )}
            </div>
          )}

          {filteredJobs.length > 0 && (
            <div className="flex justify-center pt-8">
              <p className="text-sm text-white/45">
                Showing 1-{filteredJobs.length} of {filteredJobs.length} {statusLabels[statusFilter].toLowerCase()} jobs
              </p>
            </div>
          )}
        </div>
          </>
        )}
        </div>
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={jobToDelete !== null}
        onOpenChange={(open) => {
          if (isDeleting) return;
          if (!open) setJobToDelete(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl border border-white/12 bg-[#161622] p-6 text-white shadow-2xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-white">Delete job post?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-white/70">
              Are you sure you want to delete <span className="font-semibold text-white">{jobToDelete?.title ? `"${jobToDelete.title}"` : "this job post"}</span>? This will permanently delete the job posting, all candidate applications, and notes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <AlertDialogCancel
              disabled={isDeleting}
              className="rounded-full border border-white/15 bg-white/5 text-white hover:bg-white/10"
            >
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              className="rounded-full bg-red-600 font-semibold text-white hover:bg-red-700"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
            >
              {isDeleting ? "Deleting..." : "Delete job"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Close Confirmation Alert Dialog */}
      <AlertDialog
        open={jobToClose !== null}
        onOpenChange={(open) => {
          if (!open) setJobToClose(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl border border-white/12 bg-[#161622] p-6 text-white shadow-2xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-white">Close job post?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-white/70">
              Are you sure you want to close <span className="font-semibold text-white">{jobToClose?.title ? `"${jobToClose.title}"` : "this job post"}</span>? Closed jobs no longer accept applications. You can reopen this job anytime from the action menu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <AlertDialogCancel className="rounded-full border border-white/15 bg-white/5 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              className="rounded-full bg-red-600 font-semibold text-white hover:bg-red-700"
              onClick={handleConfirmClose}
            >
              Close job
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
