import { jobSkillTypeLabel, proficiencyLabel } from "@/constants/skills";
import { useEditBulkStatusMutation, useGetJobApplicationDetailQuery, useGetJobApplicationsQuery } from "@/features/api/jobApplicationsApi";
import { useGetJobByIdQuery } from "@/features/api/jobsApi";
import { AlertTriangle, Archive, ArrowLeft, ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Download, Lock, Mail, MessageCircle, Phone, Send, Share2, Star, Users, XCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { CandidateNLPSearch } from "./CandidateNLPSearch";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";

const statusMeta: Record<string, { label: string; className: string }> = {
  applied: { label: "New", className: "bg-neon-cyan/15 text-neon-cyan" },
  viewed: { label: "Viewed", className: "bg-neon-purple/15 text-neon-purple" },
  sorted: { label: "Shortlisted", className: "bg-neon-green/15 text-neon-green" },
  rejected: { label: "Rejected", className: "bg-red-500/15 text-red-500" },
  hold: { label: "On Hold", className: "bg-neon-yellow/15 text-neon-yellow" },
  cancelled: { label: "Cancelled", className: "bg-white/8 text-white/50" },
};

const competencyTypeStyles: Record<string, string> = {
  core: "bg-orange-500/10 text-orange-500",
  preferred: "bg-neon-yellow/10 text-neon-yellow",
  nice_to_have: "bg-white/4 text-white/45",
};

const readinessStyles = (readiness: number) => {
  if (readiness >= 80) return { text: "text-neon-green", bg: "bg-neon-green/10", muted: "text-neon-green/70" };
  if (readiness >= 70) return { text: "text-neon-cyan", bg: "bg-neon-cyan/10", muted: "text-neon-cyan/70" };
  return { text: "text-neon-yellow", bg: "bg-neon-yellow/10", muted: "text-neon-yellow/70" };
};

const initials = (name?: string) =>
  (name ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

const appliedAgo = (date?: string) => {
  if (!date) return "—";
  const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

const monthYear = (date?: Date) => (date ? new Date(date).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "");

// Total experience spans the earliest start date to the latest end date (or now, if a role is current).
const yearsOfExperience = (experiences?: { start_date: Date; end_date?: Date; is_current?: boolean }[]) => {
  if (!experiences?.length) return null;
  const starts = experiences.map((e) => new Date(e.start_date).getTime()).filter((t) => !Number.isNaN(t));
  if (!starts.length) return null;
  const earliest = Math.min(...starts);
  const hasCurrent = experiences.some((e) => e.is_current || !e.end_date);
  const ends = experiences.map((e) => (e.end_date ? new Date(e.end_date).getTime() : Date.now())).filter((t) => !Number.isNaN(t));
  const latest = hasCurrent ? Date.now() : Math.max(...ends);
  const years = Math.floor((latest - earliest) / (1000 * 60 * 60 * 24 * 365));
  return years > 0 ? years : null;
};

export function ApplicationsManagementPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const [selectedApplications, setSelectedApplications] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [readinessFilter, setReadinessFilter] = useState("all");
  const [showMessageComposer, setShowMessageComposer] = useState(false);
  const [showNoteComposer, setShowNoteComposer] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState("");
  const [messageText, setMessageText] = useState("");
  const [nlpFilters, setNlpFilters] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: currentJobPosting } = useGetJobByIdQuery(id);
  const { data: applicants } = useGetJobApplicationsQuery({ jobId: id });
  const [editBulkStatus] = useEditBulkStatusMutation();

  const {
    data: selectedApplication,
    isFetching: isDetailLoading,
    error: detailError,
  } = useGetJobApplicationDetailQuery({ jobId: id!, applicationId: selectedApplicationId! }, { skip: !id || selectedApplicationId == null });

  // 403 (not the job owner) / 404 (missing or wrong job) come back on the detail call.
  const detailErrorStatus = detailError && "status" in detailError ? detailError.status : undefined;

  const filteredApplications = useMemo(() => {
    let filtered = applicants ?? [];

    if (statusFilter !== "all") {
      filtered = filtered.filter((application) => application.status === statusFilter);
    }

    if (readinessFilter !== "all") {
      const threshold = Number(readinessFilter);
      filtered = filtered.filter((application) => (application.readiness ?? 0) >= threshold);
    }

    if (nlpFilters.length > 0) {
      filtered = filtered.filter((application) =>
        nlpFilters.every((filter) => {
          const lowerLabel = filter.label.toLowerCase();
          const haystack = `${application.applicant_name ?? ""} ${(application.skills ?? []).map((s) => s.name ?? "").join(" ")}`.toLowerCase();
          return haystack.includes(lowerLabel);
        })
      );
    }

    return filtered;
  }, [applicants, statusFilter, readinessFilter, nlpFilters]);

  const sortedApplications = useMemo(() => [...filteredApplications].sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime()), [filteredApplications]);

  const shortlistedCount = useMemo(() => (applicants ?? []).filter((a) => a.status === "sorted").length, [applicants]);

  const handleNLPSearch = useCallback((query: string, filters: any[]) => {
    setIsSearching(true);
    setNlpFilters(filters);
    setTimeout(() => setIsSearching(false), 300);
  }, []);

  const handleClearNLPSearch = useCallback(() => {
    setNlpFilters([]);
    setIsSearching(false);
  }, []);

  const handleBulkAction = useCallback(
    async (action: string) => {
      try {
        await editBulkStatus({ applicationIds: selectedApplications, new_status: action }).unwrap();
        setSelectedApplications([]);
      } catch (error) {
        console.error("Error performing bulk action:", error);
      }
    },
    [selectedApplications, editBulkStatus]
  );

  const handleApplicationStatus = async (action: string, applicationId: number) => {
    try {
      await editBulkStatus({ applicationIds: [applicationId], new_status: action }).unwrap();
    } catch (error) {
      console.error("Error performing bulk action:", error);
    }
  };

  const handleSendMessage = useCallback(() => {
    console.log("Sending message:", messageText);
    setShowMessageComposer(false);
    setMessageText("");
  }, [messageText]);

  const handleDownloadResume = async () => {
    try {
      const path = selectedApplication?.resume?.file_url;
      if (!path) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${path}`);
      if (!res.ok) throw new Error("Failed to download file");
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = "resume.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  const messageTemplates = {
    thanks: "Thank you for your application! We've received your materials and will review them carefully. We'll be in touch soon.",
    phoneScreen: "We were impressed by your application! We'd like to schedule a brief phone screening. Are you available this week?",
    rejection:
      "Thank you for your interest in this position. After careful consideration, we've decided to move forward with other candidates whose experience more closely matches our current needs. We appreciate the time you took to apply and wish you the best in your job search.",
  };

  const jobTitle = currentJobPosting?.job_title?.name ?? currentJobPosting?.title;
  const candidateYears = yearsOfExperience(selectedApplication?.user?.experiences);

  return (
    <div className="min-h-screen">
      <div className="flex flex-col gap-8 px-6 lg:px-20 pt-12 pb-20">
        {/* Header */}
        <div className="flex flex-col gap-8">
          <button onClick={() => router.push("/jobs/posted")} className="flex w-fit items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to job posts
          </button>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-3">
              <h1 className="text-4xl lg:text-5xl font-extrabold text-white">Applications</h1>
              <p className="text-base text-white/60">
                {[jobTitle, currentJobPosting?.location].filter(Boolean).join(" · ")}
                {applicants ? ` - ${applicants.length} applicants` : ""}
              </p>
            </div>

            <div className="flex items-center gap-1 rounded-full border border-white/12 p-1">
              <span className="rounded-full bg-neon-cyan/15 px-5 py-2.5 text-sm font-semibold text-neon-cyan">List View</span>
              <span className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white/35" title="Table view is a PRO feature">
                <Lock className="w-3.5 h-3.5" />
                Table View
                <span className="rounded bg-neon-purple px-1.5 py-0.5 text-[9px] font-extrabold text-white">PRO</span>
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="flex h-[92px] items-center rounded-2xl border border-white/12 bg-white/4 p-5">
              <div className="flex flex-col gap-1">
                <p className="text-[13px] text-white/50">Total Views</p>
                <p className="text-[28px] font-semibold text-white/40" title="Views are not returned by the API yet">
                  —
                </p>
              </div>
            </div>
            <div className="flex h-[92px] items-center rounded-2xl border border-white/12 bg-white/4 p-5">
              <div className="flex flex-col gap-1">
                <p className="text-[13px] text-white/50">Applications</p>
                <p className="text-[28px] font-semibold text-white">{applicants?.length ?? 0}</p>
              </div>
            </div>
            <div className="flex h-[92px] items-center rounded-2xl border border-white/12 bg-white/4 p-5">
              <div className="flex flex-col gap-1">
                <p className="text-[13px] text-white/50">Shortlisted</p>
                <p className="text-[28px] font-semibold text-white">{shortlistedCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col gap-4">
          <CandidateNLPSearch onSearch={handleNLPSearch} onClear={handleClearNLPSearch} isLoading={isSearching} className="rounded-[28px] bg-white/4" placeholder="Search applicants..." />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-auto w-auto gap-1.5 rounded-full border-white/12 bg-transparent pl-5 pr-4 py-3 text-[13px] font-medium text-white/70">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="glass-strong border-glass-border">
                  <SelectItem value="all">All statuses</SelectItem>
                  {Object.entries(statusMeta).map(([value, meta]) => (
                    <SelectItem key={value} value={value}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <button disabled className="flex cursor-not-allowed items-center gap-1.5 rounded-full border border-white/12 pl-5 pr-4 py-3 text-[13px] font-medium text-white/30" title="No experience field on the API yet">
                Experience
                <ChevronDown className="w-4 h-4" />
              </button>

              <Select value={readinessFilter} onValueChange={setReadinessFilter}>
                <SelectTrigger className="h-auto w-auto gap-1.5 rounded-full border-white/12 bg-transparent pl-5 pr-4 py-3 text-[13px] font-medium text-white/70">
                  <SelectValue placeholder="Readiness score" />
                </SelectTrigger>
                <SelectContent className="glass-strong border-glass-border">
                  <SelectItem value="all">Any readiness</SelectItem>
                  <SelectItem value="90">90% and above</SelectItem>
                  <SelectItem value="75">75% and above</SelectItem>
                  <SelectItem value="50">50% and above</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-bold text-white hover:bg-white/5 transition-colors">
                <Download className="w-[18px] h-[18px]" />
                Export CSV
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    disabled={selectedApplications.length === 0}
                    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-neon-purple to-neon-pink px-5 py-3 text-sm font-bold text-white transition-opacity disabled:opacity-40"
                  >
                    Bulk actions
                    {selectedApplications.length > 0 && <span className="rounded-full bg-white/20 px-1.5 text-xs">{selectedApplications.length}</span>}
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-strong border-glass-border">
                  <DropdownMenuItem onClick={() => handleBulkAction("sorted")} className="cursor-pointer">
                    <Star className="w-4 h-4 mr-2" />
                    Shortlist
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction("rejected")} className="cursor-pointer">
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction("hold")} className="cursor-pointer">
                    <Archive className="w-4 h-4 mr-2" />
                    Put on hold
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Split panel */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Left: candidates */}
          <div className="flex w-full lg:w-[380px] shrink-0 flex-col gap-3 rounded-[20px] border border-white/12 bg-white/4 p-4 lg:max-h-[843px] lg:overflow-y-auto">
            <p className="text-sm font-semibold text-white/80">Candidates</p>

            {sortedApplications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/12 bg-white/2 p-8 text-center">
                <Users className="w-10 h-10 text-white/30" />
                <p className="text-sm text-white/60">No candidates match your filters</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 rounded-2xl border border-white/12 bg-white/2 p-2">
                {sortedApplications.map((application) => {
                  const isSelected = selectedApplicationId === application.id;
                  const readiness = application.readiness;
                  const tone = readinessStyles(readiness ?? 0);
                  const meta = statusMeta[application.status] ?? statusMeta.cancelled;

                  return (
                    <div
                      key={application.id}
                      onClick={() => setSelectedApplicationId(application.id)}
                      className={`relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-xl border p-4 transition-all ${
                        isSelected ? "border-white/12 bg-white/4 shadow-[0px_0px_12px_0px_rgba(14,165,233,0.15)]" : "border-white/12 bg-white/4 hover:bg-white/6"
                      }`}
                    >
                      {isSelected && <span className="absolute inset-y-0 left-0 w-1 bg-neon-cyan" />}

                      <Checkbox
                        checked={selectedApplications.includes(application.id)}
                        onCheckedChange={(checked) => {
                          setSelectedApplications((prev) => (checked ? [...prev, application.id] : prev.filter((selectedId) => selectedId !== application.id)));
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />

                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-base font-semibold text-white">{application.applicant_name}</p>
                          {readiness != null && (
                            <span className={`flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 ${tone.bg}`}>
                              <span className={`text-[11px] font-semibold ${tone.text}`}>{readiness}%</span>
                              <span className={`text-[10px] font-medium ${tone.muted}`}>readiness</span>
                            </span>
                          )}
                        </div>
                        {application.skills?.length > 0 && <p className="truncate text-[13px] text-white/60">{application.skills.map((s) => s.name).join(", ")}</p>}
                        <p className="text-xs text-white/35">Applied {appliedAgo(application.applied_at)}</p>
                        <div>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.className}`}>{meta.label}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: detail */}
          <div className="flex min-w-0 flex-1 flex-col gap-4 rounded-[20px] border border-white/12 bg-white/4 p-5">
            {selectedApplicationId == null ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                <Users className="w-16 h-16 text-white/30" />
                <h3 className="text-lg font-semibold text-white">Select an applicant</h3>
                <p className="text-sm text-white/50">Choose an applicant from the list to view their details</p>
              </div>
            ) : detailErrorStatus === 403 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                <Lock className="w-16 h-16 text-white/30" />
                <h3 className="text-lg font-semibold text-white">You can’t view this applicant</h3>
                <p className="text-sm text-white/50">Only the job owner can open application details.</p>
              </div>
            ) : detailErrorStatus === 404 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                <AlertTriangle className="w-16 h-16 text-white/30" />
                <h3 className="text-lg font-semibold text-white">Application not found</h3>
                <p className="text-sm text-white/50">This application no longer exists or doesn’t belong to this job.</p>
              </div>
            ) : detailError ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                <AlertTriangle className="w-16 h-16 text-white/30" />
                <h3 className="text-lg font-semibold text-white">Couldn’t load applicant</h3>
                <p className="text-sm text-white/50">Something went wrong. Please try again.</p>
              </div>
            ) : !selectedApplication || isDetailLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-neon-cyan" />
                <p className="text-sm text-white/50">Loading applicant details…</p>
              </div>
            ) : (
              <>
                {/* Profile top */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-neon-purple text-lg font-bold text-[#06060f]">{initials(selectedApplication.user?.name)}</div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <p className="text-lg font-semibold text-white">{selectedApplication.user?.name}</p>
                    {selectedApplication.user?.headline && <p className="text-sm text-white/60">{selectedApplication.user.headline}</p>}
                    <div className="flex items-center gap-2 text-[13px] text-white/50">
                      {(selectedApplication.user?.location || selectedApplication.user?.city) && <span>{selectedApplication.user.location ?? selectedApplication.user.city}</span>}
                      {(selectedApplication.user?.location || selectedApplication.user?.city) && candidateYears != null && <span>•</span>}
                      {candidateYears != null && <span>{candidateYears} yrs</span>}
                    </div>
                  </div>
                  <button
                    disabled
                    title="There is no public candidate profile route yet"
                    className="flex cursor-not-allowed items-center gap-1.5 rounded-full bg-gradient-to-r from-neon-purple to-neon-pink px-4 py-2 text-xs font-medium text-white opacity-50"
                  >
                    View qelsa profile
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Summary */}
                {selectedApplication.user?.professional_summary && (
                  <div className="flex flex-col gap-4">
                    <p className="text-[13px] font-semibold text-white/80">Summary</p>
                    <div className="rounded-[10px] border border-white/8 bg-white/4 px-3.5 py-3">
                      <p className="text-xs leading-[18px] text-white/65">{selectedApplication.user.professional_summary}</p>
                    </div>
                  </div>
                )}

                <div className="h-px w-full bg-white/12" />

                {/* Contact */}
                <div className="flex flex-col gap-2.5">
                  <p className="text-[13px] font-semibold text-white/80">Contact</p>
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] border border-white/12 bg-white/4">
                      <Mail className="w-4 h-4 text-white/70" />
                    </div>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <p className="text-xs text-white/50">Email</p>
                      <p className="truncate text-sm text-white">{selectedApplication.user?.email}</p>
                    </div>
                  </div>
                  {selectedApplication.user?.phone && (
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] border border-white/12 bg-white/4">
                        <Phone className="w-4 h-4 text-white/70" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs text-white/50">Phone</p>
                        <p className="text-sm text-white">{selectedApplication.user.phone}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-px w-full bg-white/12" />

                {/* Skills */}
                {(selectedApplication.user?.skills?.length ?? 0) > 0 && (
                  <>
                    <div className="flex flex-col gap-2.5">
                      <p className="text-[13px] font-semibold text-white/80">Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedApplication.user.skills.map((userSkill, idx) => {
                          const required = currentJobPosting?.job_skills?.some((js) => js.skill?.id === userSkill.skill?.id);
                          return (
                            <span
                              key={idx}
                              className={`rounded-md border px-2.5 py-1 text-[11px] font-medium ${required ? "border-neon-green/40 text-neon-green" : "border-white/12 text-white/50"}`}
                            >
                              {userSkill.skill?.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div className="h-px w-full bg-white/12" />
                  </>
                )}

                {/* Application details */}
                <div className="flex flex-col gap-2.5">
                  <p className="text-[13px] font-semibold text-white/80">Application details</p>
                  <div className="flex items-center justify-between text-[13px]">
                    <p className="text-white/50">Applied</p>
                    <p className="text-white">{appliedAgo(selectedApplication.createdAt)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] text-white/50">Status</p>
                    <span className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${(statusMeta[selectedApplication.status] ?? statusMeta.cancelled).className}`}>
                      {(statusMeta[selectedApplication.status] ?? statusMeta.cancelled).label}
                    </span>
                  </div>
                </div>

                <div className="h-px w-full bg-white/12" />

                {/* Competency framework */}
                {selectedApplication.competency && (
                  <div className="rounded-xl border border-white/8 bg-white/3 p-4">
                    <div className="flex items-center justify-between pb-3">
                      <p className="text-[13px] font-semibold text-white/80">Competency framework</p>
                    </div>

                    <div className="overflow-x-auto">
                      <div className="min-w-[560px]">
                        <div className="flex items-center border-y border-white/12 py-2 text-[11px] font-semibold uppercase text-white/45">
                          <p className="flex-1">Skill</p>
                          <p className="w-[120px]">Proficiency</p>
                          <p className="w-[110px]">Type</p>
                          <p className="w-[120px]">Candidate</p>
                          <p className="w-[80px]">Match</p>
                        </div>

                        {selectedApplication.competency.competencies.map((competency) => {
                          const isGap = competency.status === "gap" || !competency.matched;
                          const matchLabel = competency.status === "exceeds" ? "↑ Exceeds" : competency.matched ? "✓ Match" : "✗ Gap";
                          return (
                            <div key={competency.skill_id} className="flex items-center border-b border-white/6 py-3">
                              <p className="flex-1 text-[13px] font-medium text-white">{competency.skill_name}</p>
                              <p className="w-[120px] text-[13px] text-white/70">{proficiencyLabel(competency.required_proficiency)}</p>
                              <div className="w-[110px]">
                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${competencyTypeStyles[competency.type] ?? competencyTypeStyles.preferred}`}>
                                  {jobSkillTypeLabel(competency.type)}
                                </span>
                              </div>
                              <p className={`w-[120px] text-[13px] font-semibold ${isGap ? "text-red-500" : "text-neon-green"}`}>{proficiencyLabel(competency.candidate_proficiency)}</p>
                              <p className={`w-[80px] text-[11px] font-semibold ${isGap ? "text-red-500" : "text-neon-green"}`}>{matchLabel}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-start justify-between pt-2 text-xs">
                      <p className="text-white/40">{selectedApplication.competency.totalCount} competencies</p>
                      <p className="font-semibold text-neon-green">
                        {selectedApplication.competency.matchedCount} of {selectedApplication.competency.totalCount} matched
                      </p>
                    </div>
                  </div>
                )}

                {/* Cover letter — no field on the API; shell only */}
                <div className="flex flex-col gap-2.5">
                  <p className="text-[13px] font-semibold text-white/80">Cover Letter</p>
                  <div className="rounded-xl border border-white/8 bg-white/4 p-4">
                    <p className="text-[13px] text-white/40">No cover letter provided.</p>
                  </div>
                </div>

                <div className="h-px w-full bg-white/12" />

                {/* Work experience */}
                {(selectedApplication.user?.experiences?.length ?? 0) > 0 && (
                  <>
                    <div className="flex flex-col gap-3">
                      <p className="text-[13px] font-semibold text-white/80">Work Experience</p>
                      {selectedApplication.user.experiences.map((experience, idx) => (
                        <div key={idx} className="flex flex-col gap-1">
                          <p className="text-[13px] font-semibold text-white">{experience.job_title?.name ?? experience.position}</p>
                          <p className="text-[13px] text-white/50">{[experience.company?.name, experience.employment_type].filter(Boolean).join(" · ")}</p>
                          <p className="text-xs text-white/35">
                            {monthYear(experience.start_date)} – {experience.is_current || !experience.end_date ? "Present" : monthYear(experience.end_date)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="h-px w-full bg-white/12" />
                  </>
                )}

                {/* Education */}
                {(selectedApplication.user?.educations?.length ?? 0) > 0 && (
                  <>
                    <div className="flex flex-col gap-3">
                      <p className="text-[13px] font-semibold text-white/80">Education</p>
                      {selectedApplication.user.educations.map((education, idx) => (
                        <div key={idx} className="flex flex-col gap-1">
                          <p className="text-[13px] font-semibold text-white">{education.degree?.name}</p>
                          <p className="text-[13px] text-white/50">{education.college?.name}</p>
                          <p className="text-xs text-white/35">{[education.start_year, education.end_year].filter(Boolean).join(" – ")}</p>
                        </div>
                      ))}
                    </div>
                    <div className="h-px w-full bg-white/12" />
                  </>
                )}

                {/* Screening questions */}
                {(selectedApplication.job_application_answers?.length ?? 0) > 0 && (
                  <>
                    <div className="flex flex-col gap-3">
                      <p className="text-[13px] font-semibold text-white/80">Screening Questions</p>
                      {selectedApplication.job_application_answers.map((answer, idx) => (
                        <div key={idx} className="flex flex-col gap-2 rounded-xl border border-white/8 bg-white/4 px-4 py-3">
                          <p className="text-[13px] font-medium text-white">{answer.question}</p>
                          <p className="text-[13px] text-white/50">{answer.answer}</p>
                        </div>
                      ))}
                    </div>
                    <div className="h-px w-full bg-white/12" />
                  </>
                )}

                {/* Notes — no endpoint; shell only */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold text-white/80">Notes</p>
                    <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[11px] font-medium text-white/60">0</span>
                  </div>

                  <div className="rounded-xl border border-white/8 bg-white/4 px-3.5 py-3">
                    <p className="text-[13px] text-white/40">No notes yet.</p>
                  </div>

                  {showNoteComposer && (
                    <div className="flex flex-col gap-3 rounded-xl border border-neon-cyan/40 bg-white/5 p-4">
                      <p className="text-[13px] font-semibold text-white/80">Add a note</p>
                      <Textarea disabled placeholder="Write your note about this candidate..." rows={3} className="resize-none border-white/10 bg-white/3 text-[13px]" />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-white/40">Visible to:</span>
                        <span className="rounded-full border border-white/10 bg-white/4 px-2.5 py-1 text-xs font-medium text-white/50">Team only</span>
                        <div className="flex-1" />
                        <button onClick={() => setShowNoteComposer(false)} className="rounded-full border border-white/20 px-6 py-3 text-sm font-bold text-white/80 hover:bg-white/5 transition-colors">
                          Cancel
                        </button>
                        <button disabled title="Notes have no API endpoint yet" className="cursor-not-allowed rounded-full bg-gradient-to-r from-neon-purple to-neon-pink px-6 py-3 text-sm font-bold text-white opacity-50">
                          Save Note
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => setShowNoteComposer((v) => !v)}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[10px] border border-white/12 bg-white/4 px-4 text-sm font-medium text-white hover:bg-white/8 transition-colors"
                  >
                    ✎ Add Notes
                  </button>
                  <button
                    onClick={() => setShowMessageComposer(true)}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/4 px-4 text-sm font-semibold text-white hover:bg-white/8 transition-colors"
                  >
                    <MessageCircle className="w-[18px] h-[18px]" />
                    Message
                  </button>
                  <button
                    onClick={handleDownloadResume}
                    disabled={!selectedApplication.resume?.file_url}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/4 px-4 text-sm font-semibold text-white hover:bg-white/8 transition-colors disabled:opacity-40"
                  >
                    <Download className="w-[18px] h-[18px]" />
                    Resume
                  </button>
                  <button
                    onClick={() => navigator.clipboard?.writeText(window.location.href)}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/4 px-4 text-sm font-semibold text-white hover:bg-white/8 transition-colors"
                  >
                    <Share2 className="w-[18px] h-[18px]" />
                    Share
                  </button>
                </div>

                {/* Status actions kept from the previous page — the design has no per-candidate shortlist/reject */}
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => handleApplicationStatus("sorted", selectedApplication.id)}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-neon-green/30 px-4 text-sm font-semibold text-neon-green hover:bg-neon-green/10 transition-colors"
                  >
                    <Star className="w-4 h-4" />
                    Shortlist
                  </button>
                  <button
                    onClick={() => handleApplicationStatus("rejected", selectedApplication.id)}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-red-500/30 px-4 text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Pagination — the API returns the full list, so paging is a shell */}
        <div className="flex items-center justify-between pt-5">
          <p className="text-sm text-white/50">
            Showing {sortedApplications.length} of {applicants?.length ?? 0} applicants
          </p>
          <div className="flex items-center gap-2">
            <button disabled className="flex size-8 cursor-not-allowed items-center justify-center rounded border border-white/12 text-white/30">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="flex size-8 items-center justify-center rounded bg-neon-cyan text-sm font-semibold text-[#06060f]">1</span>
            <button disabled className="flex size-8 cursor-not-allowed items-center justify-center rounded border border-white/12 text-white/30">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-8 text-[13px] text-white/30">
          <p>© {new Date().getFullYear()} Qelsa Job Platform. All rights reserved.</p>
          <div className="flex gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Help Center</span>
          </div>
        </div>
      </div>

      {/* Message composer */}
      {showMessageComposer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[20px] border border-white/12 bg-[#1a1a24] p-6">
            <h3 className="mb-4 font-semibold text-white">Send Message</h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">Template</label>
                <Select
                  value={messageTemplate}
                  onValueChange={(value) => {
                    setMessageTemplate(value);
                    setMessageText(messageTemplates[value as keyof typeof messageTemplates] || "");
                  }}
                >
                  <SelectTrigger className="glass border-glass-border">
                    <SelectValue placeholder="Choose a template..." />
                  </SelectTrigger>
                  <SelectContent className="glass border-glass-border">
                    <SelectItem value="thanks">Thanks for applying</SelectItem>
                    <SelectItem value="phoneScreen">Phone screen invite</SelectItem>
                    <SelectItem value="rejection">Rejection with feedback</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">Message</label>
                <Textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type your message..." rows={6} className="glass border-glass-border resize-none" />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSendMessage} className="flex-1 rounded-full bg-gradient-to-r from-neon-purple to-neon-pink font-bold text-white border-0">
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
                <Button variant="outline" onClick={() => setShowMessageComposer(false)} className="rounded-full border-white/20">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
