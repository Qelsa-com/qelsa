import { formatCity } from "@/constants/city";
import { jobSkillTypeLabel, proficiencyLabel } from "@/constants/skills";
import {
  useAddApplicationNoteMutation,
  useEditBulkStatusMutation,
  useGetJobApplicationDetailQuery,
  useGetJobApplicationsQuery,
  useMarkApplicationViewedMutation,
  useSearchJobApplicantsNatural,
  useSearchJobApplicantsQuery,
} from "@/features/api/jobApplicationsApi";
import { useGetJobByIdQuery } from "@/features/api/jobsApi";
import { AlertTriangle, Archive, ArrowLeft, ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Download, Lock, Mail, MessageCircle, Phone, Send, Share2, Star, Users, XCircle } from "lucide-react";
import { JobApplicationAnswer } from "@/types/jobApplicationAnswers";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { CandidateNLPSearch } from "./CandidateNLPSearch";
import { ApplicantDetailSkeleton, CandidateRowSkeleton } from "./job/jobSkeletons";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";

const statusMeta: Record<string, { label: string; className: string }> = {
  applied: { label: "New", className: "bg-neon-cyan/15 text-neon-cyan" },
  viewed: { label: "Under Review", className: "bg-amber-500/15 text-amber-400" },
  sorted: { label: "Shortlisted", className: "bg-neon-green/15 text-neon-green" },
  rejected: { label: "Rejected", className: "bg-red-500/15 text-red-500" },
  hold: { label: "On Hold", className: "bg-neon-yellow/15 text-neon-yellow" },
};

const competencyTypeStyles: Record<string, string> = {
  core: "bg-orange-500/10 text-orange-500",
  preferred: "bg-neon-yellow/10 text-neon-yellow",
  nice_to_have: "bg-white/4 text-white/45",
};

/**
 * Reads the knockout / requirement-evaluation signal off a screening answer.
 * Tolerates a few field-name variants the API may use; `meets` is null when the
 * question isn't evaluated (open-ended answers), which hides the status row.
 */
const screeningEval = (answer: JobApplicationAnswer): { knockout: boolean; meets: boolean | null } => {
  const bag = answer as Record<string, unknown>;
  const knockout = Boolean(answer.is_knockout ?? bag.knockout ?? bag.is_knockout_question);
  const rawMeets = answer.meets_requirement ?? bag.meets ?? bag.is_match ?? bag.passed;
  let meets: boolean | null = null;
  if (typeof rawMeets === "boolean") meets = rawMeets;
  else if (typeof bag.does_not_meet === "boolean") meets = !bag.does_not_meet;
  return { knockout, meets };
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

const appliedAgo = (date?: string | Date) => {
  if (!date) return "—";
  const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

const formatRelativeTime = (timestamp?: number) => {
  if (!timestamp) return "";
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
};

const monthYear = (date?: string | number | Date) => (date ? new Date(date).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "");

// Total experience spans the earliest start date to the latest end date (or now, if a role is current).
const yearsOfExperience = (experiences?: { start_date?: string | number | Date; end_date?: string | number | Date; is_current?: boolean }[]) => {
  if (!experiences?.length) return null;
  const starts = experiences
    .map((e) => (e.start_date ? new Date(e.start_date).getTime() : NaN))
    .filter((t) => !Number.isNaN(t));
  if (!starts.length) return null;
  const earliest = Math.min(...starts);
  const hasCurrent = experiences.some((e) => e.is_current || !e.end_date);
  const ends = experiences
    .map((e) => (e.end_date ? new Date(e.end_date).getTime() : Date.now()))
    .filter((t) => !Number.isNaN(t));
  const latest = hasCurrent ? Date.now() : Math.max(...ends);
  const years = Math.floor((latest - earliest) / (1000 * 60 * 60 * 24 * 365));
  return years > 0 ? years : null;
};

const looksLikeNl = (query: string) => {
  const trimmed = query.trim();
  if (trimmed.length >= 48) return true;
  if (trimmed.split(/\s+/).filter(Boolean).length >= 5) return true;
  return /\b(find|show me|looking for|candidates who|applicants who|strongest|best fit|match(?:es)? this role|don't necessarily|doesn'?t necessarily|built|scalable)\b/i.test(
    trimmed,
  );
};

export function ApplicationsManagementPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [selectedApplicationId, setSelectedApplicationId] = useState<string | number | null>(null);
  const [selectedApplications, setSelectedApplications] = useState<Array<string | number>>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [readinessFilter, setReadinessFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [nlResult, setNlResult] = useState<{
    mode: "keyword" | "natural";
    chips: Array<{ id: string; label: string; category: "skill" | "experience" | "location" | "education" | "status" | "readiness" | "other" }>;
    hits: Array<{ application_id: string; score: number; explanation: string; reasons: string[]; gaps: string[] }>;
  } | null>(null);
  const [showMessageComposer, setShowMessageComposer] = useState(false);
  const [showNoteComposer, setShowNoteComposer] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState("");
  const [messageText, setMessageText] = useState("");

  const { data: currentJobPosting } = useGetJobByIdQuery(id);
  const { data: applicants, isLoading: isListLoading } = useGetJobApplicationsQuery({ jobId: id });
  const [editBulkStatus] = useEditBulkStatusMutation();
  const [markViewed] = useMarkApplicationViewedMutation();
  const [addNote, { isLoading: isSavingNote }] = useAddApplicationNoteMutation();
  const [searchNatural, { isLoading: isNlLoading }] = useSearchJobApplicantsNatural();

  const handleSelectApplication = useCallback(
    (appId: string | number, currentStatus?: string) => {
      setSelectedApplicationId(appId);
      if (currentStatus === "applied") {
        void markViewed({ applicationId: appId });
      }
    },
    [markViewed],
  );

  const minYears = experienceFilter === "all" ? undefined : Number(experienceFilter);
  const minReadiness = readinessFilter === "all" ? undefined : Number(readinessFilter);
  const statusArg = statusFilter === "all" ? undefined : statusFilter;

  const { data: keywordSearch, isLoading: isKeywordLoading } = useSearchJobApplicantsQuery(
    id && submittedQuery.trim()
      ? { jobId: id, query: submittedQuery, status: statusArg, min_years: minYears, min_readiness: minReadiness }
      : undefined,
  );

  const runNaturalSearch = useCallback(
    async (query: string) => {
      if (!id || !query.trim() || !looksLikeNl(query)) {
        setNlResult(null);
        return;
      }
      try {
        const result = await searchNatural({
          jobId: id,
          query,
          status: statusArg,
          min_years: minYears,
          min_readiness: minReadiness,
        }).unwrap();
        setNlResult(result);
      } catch {
        setNlResult(null);
      }
    },
    [id, minReadiness, minYears, searchNatural, statusArg],
  );

  const handleSearchSubmit = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      setSubmittedQuery(trimmed);
      setNlResult(null);
      if (!trimmed) return;
      void runNaturalSearch(trimmed);
    },
    [runNaturalSearch],
  );

  const {
    data: selectedApplication,
    isFetching: isDetailLoading,
    error: detailError,
  } = useGetJobApplicationDetailQuery({ jobId: id!, applicationId: selectedApplicationId! }, { skip: !id || selectedApplicationId == null });

  // 403 (not the job owner) / 404 (missing or wrong job) come back on the detail call.
  const detailErrorStatus = detailError && "status" in detailError ? detailError.status : undefined;

  const searchHits = (nlResult?.hits ?? keywordSearch?.hits) as
    | Array<{ application_id: string; score: number; explanation: string; reasons: string[]; gaps: string[] }>
    | undefined;
  const searchChips = (nlResult?.chips ?? keywordSearch?.chips ?? []) as Array<{
    id: string;
    label: string;
    category: "skill" | "experience" | "location" | "education" | "status" | "readiness" | "other";
  }>;
  const hitById = useMemo(() => new Map((searchHits ?? []).map((hit) => [String(hit.application_id), hit])), [searchHits]);

  const filteredApplications = useMemo(() => {
    let filtered = applicants ?? [];

    if (statusFilter !== "all") {
      filtered = filtered.filter((application) => application.status === statusFilter);
    }
    if (readinessFilter !== "all") {
      filtered = filtered.filter((application) => (application.readiness ?? 0) >= Number(readinessFilter));
    }
    if (experienceFilter !== "all") {
      filtered = filtered.filter((application) => (application.years_experience ?? 0) >= Number(experienceFilter));
    }

    if (submittedQuery.trim()) {
      if (!searchHits) return filtered;
      const byId = new Map(filtered.map((application) => [String(application.id), application]));
      return searchHits
        .map((hit) => byId.get(String(hit.application_id)))
        .filter((application): application is NonNullable<typeof application> => Boolean(application));
    }

    return filtered;
  }, [applicants, experienceFilter, readinessFilter, searchHits, statusFilter, submittedQuery]);

  const sortedApplications = useMemo(
    () => (submittedQuery.trim() ? filteredApplications : [...filteredApplications].sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())),
    [filteredApplications, submittedQuery],
  );

  const shortlistedCount = useMemo(() => (applicants ?? []).filter((a) => a.status === "sorted").length, [applicants]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setSubmittedQuery("");
    setNlResult(null);
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

  const handleApplicationStatus = async (action: string, applicationId: string | number) => {
    try {
      await editBulkStatus({ applicationIds: [applicationId], new_status: action }).unwrap();
    } catch (error) {
      console.error("Error performing bulk action:", error);
    }
  };

  const handleSaveNote = useCallback(async () => {
    if (!selectedApplicationId || !noteText.trim() || isSavingNote) return;
    try {
      await addNote({
        applicationId: selectedApplicationId,
        text: noteText.trim(),
      }).unwrap();
      setNoteText("");
      setShowNoteComposer(false);
    } catch (error) {
      console.error("Failed to add note:", error);
    }
  }, [addNote, isSavingNote, noteText, selectedApplicationId]);

  const currentIndex = useMemo(
    () => sortedApplications.findIndex((a) => String(a.id) === String(selectedApplicationId)),
    [sortedApplications, selectedApplicationId]
  );
  const totalCandidates = sortedApplications.length;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < totalCandidates - 1;

  const handlePrevCandidate = useCallback(() => {
    if (hasPrev) {
      const prevApp = sortedApplications[currentIndex - 1];
      handleSelectApplication(prevApp.id, prevApp.status);
    }
  }, [hasPrev, sortedApplications, currentIndex, handleSelectApplication]);

  const handleNextCandidate = useCallback(() => {
    if (hasNext) {
      const nextApp = sortedApplications[currentIndex + 1];
      handleSelectApplication(nextApp.id, nextApp.status);
    }
  }, [hasNext, sortedApplications, currentIndex, handleSelectApplication]);

  const handleSendMessage = useCallback(() => {
    console.log("Sending message:", messageText);
    setShowMessageComposer(false);
    setMessageText("");
  }, [messageText]);

  const handleDownloadResume = () => {
    try {
      const path = selectedApplication?.resume?.file_url;
      if (!path) return;
      const downloadUrl =
        path.startsWith("http://") || path.startsWith("https://")
          ? path
          : `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}${path}`;
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
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
  const selectedListRow = (applicants ?? []).find((application) => String(application.id) === String(selectedApplicationId));
  const candidateYears = yearsOfExperience(selectedApplication?.user?.experiences) ?? selectedListRow?.years_experience ?? null;
  const selectedHit = selectedApplicationId != null ? hitById.get(String(selectedApplicationId)) : undefined;

  return (
    <div className="min-h-screen">
      <div className="flex flex-col gap-8 px-4 sm:px-6 lg:px-20 pt-8 sm:pt-12 pb-20">
        {/* Header, Stats & Filter bar - hidden on mobile when viewing candidate details */}
        <div className={`${mobileDetailOpen ? "hidden lg:flex" : "flex"} flex-col gap-8`}>
          {/* Header */}
          <button onClick={() => router.push("/jobs/posted")} className="flex w-fit items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to job posts
          </button>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-2 sm:gap-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">Applications</h1>
              <p className="text-sm sm:text-base text-white/60">
                {[jobTitle, currentJobPosting?.city && formatCity(currentJobPosting.city)].filter(Boolean).join(" · ")}
                {applicants ? ` - ${applicants.length} applicants` : ""}
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-1 rounded-full border border-white/12 p-1">
              <span className="rounded-full bg-neon-cyan/15 px-5 py-2.5 text-sm font-semibold text-neon-cyan">List View</span>
              <span className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white/35" title="Table view is a PRO feature">
                <Lock className="w-3.5 h-3.5" />
                Table View
                <span className="rounded bg-neon-purple px-1.5 py-0.5 text-[9px] font-extrabold text-white">PRO</span>
              </span>
            </div>
          </div>

          {/* Stats - 3 columns */}
          <div className="grid grid-cols-3 gap-3 sm:gap-5">
            <div className="flex h-20 sm:h-[92px] items-center rounded-2xl border border-white/12 bg-white/4 p-3 sm:p-5">
              <div className="flex flex-col gap-0.5 sm:gap-1">
                <p className="text-xs sm:text-[13px] text-white/50">Total Views</p>
                <p className="text-xl sm:text-[28px] font-semibold text-white">
                  {currentJobPosting?.view_count ?? "—"}
                </p>
              </div>
            </div>
            <div className="flex h-20 sm:h-[92px] items-center rounded-2xl border border-white/12 bg-white/4 p-3 sm:p-5">
              <div className="flex flex-col gap-0.5 sm:gap-1">
                <p className="text-xs sm:text-[13px] text-white/50">Applications</p>
                <p className="text-xl sm:text-[28px] font-semibold text-white">{applicants?.length ?? 0}</p>
              </div>
            </div>
            <div className="flex h-20 sm:h-[92px] items-center rounded-2xl border border-white/12 bg-white/4 p-3 sm:p-5">
              <div className="flex flex-col gap-0.5 sm:gap-1">
                <p className="text-xs sm:text-[13px] text-white/50">Shortlisted</p>
                <p className="text-xl sm:text-[28px] font-semibold text-white">{shortlistedCount}</p>
              </div>
            </div>
          </div>

          {/* Filter bar */}
          <div className="flex flex-col gap-4">
            <CandidateNLPSearch
              query={searchQuery}
              onQueryChange={setSearchQuery}
              onSubmit={handleSearchSubmit}
              onClear={handleClearSearch}
              chips={searchChips}
              isLoading={isNlLoading || Boolean(submittedQuery.trim() && isKeywordLoading)}
              className="rounded-[28px] bg-white/4"
              placeholder="Search applicants..."
            />

            <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-auto w-auto gap-1.5 rounded-full border-white/12 bg-transparent pl-4 sm:pl-5 pr-3 sm:pr-4 py-2 sm:py-3 text-xs sm:text-[13px] font-medium text-white/70">
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

                <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                  <SelectTrigger className="h-auto w-auto gap-1.5 rounded-full border-white/12 bg-transparent pl-4 sm:pl-5 pr-3 sm:pr-4 py-2 sm:py-3 text-xs sm:text-[13px] font-medium text-white/70">
                    <SelectValue placeholder="Experience" />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-glass-border">
                    <SelectItem value="all">Any experience</SelectItem>
                    <SelectItem value="1">1+ years</SelectItem>
                    <SelectItem value="3">3+ years</SelectItem>
                    <SelectItem value="5">5+ years</SelectItem>
                    <SelectItem value="8">8+ years</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={readinessFilter} onValueChange={setReadinessFilter}>
                  <SelectTrigger className="h-auto w-auto gap-1.5 rounded-full border-white/12 bg-transparent pl-4 sm:pl-5 pr-3 sm:pr-4 py-2 sm:py-3 text-xs sm:text-[13px] font-medium text-white/70">
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

              <div className="hidden sm:flex items-center gap-3">
                <button className="flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-bold text-white hover:bg-white/5 transition-colors">
                  <Download className="w-[18px] h-[18px]" />
                  Export CSV
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      disabled={selectedApplications.length === 0}
                      className="flex items-center gap-2 rounded-full gradient-primary px-5 py-3 text-sm font-bold text-white transition-opacity disabled:opacity-40"
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
        </div>

        {/* Split panel on desktop, toggled view on mobile */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Left: candidates list (hidden on mobile when mobileDetailOpen is true) */}
          <div className={`${mobileDetailOpen ? "hidden lg:flex" : "flex"} w-full lg:w-[410px] xl:w-[440px] shrink-0 flex-col gap-3 rounded-[20px] border border-white/12 bg-white/4 p-4 lg:max-h-[843px] lg:overflow-y-auto`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white/90">Candidates</p>
              <span className="text-xs text-white/40">
                {sortedApplications.length} {sortedApplications.length === 1 ? "applicant" : "applicants"}
              </span>
            </div>

            {isListLoading ? (
              <div className="flex flex-col gap-2.5" role="status" aria-label="Loading candidates">
                {Array.from({ length: 6 }, (_, i) => (
                  <CandidateRowSkeleton key={i} />
                ))}
              </div>
            ) : sortedApplications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/12 bg-white/2 p-8 text-center">
                <Users className="w-10 h-10 text-white/30" />
                <p className="text-sm text-white/60">{submittedQuery.trim() ? "No candidates match your search" : "No candidates match your filters"}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {sortedApplications.map((application) => {
                  const isSelected = selectedApplicationId === application.id;
                  const readiness = application.readiness;
                  const tone = readinessStyles(readiness ?? 0);
                  const meta = statusMeta[application.status] ?? { label: "Withdrawn", className: "bg-white/8 text-white/50" };

                  return (
                    <div
                      key={application.id}
                      onClick={() => {
                        handleSelectApplication(application.id, application.status);
                        setMobileDetailOpen(true);
                      }}
                      className={`group relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-xl border p-3.5 sm:p-4 transition-all ${
                        isSelected
                          ? "border-neon-cyan/40 bg-white/[0.07] shadow-[0px_0px_14px_0px_rgba(14,165,233,0.15)]"
                          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                      }`}
                    >
                      {isSelected && <span className="absolute inset-y-0 left-0 w-1 bg-neon-cyan" />}

                      <Checkbox
                        className="hidden lg:flex shrink-0 border-white/30 data-[state=checked]:bg-neon-cyan data-[state=checked]:text-black"
                        checked={selectedApplications.includes(application.id)}
                        onCheckedChange={(checked) => {
                          setSelectedApplications((prev) => (checked ? [...prev, application.id] : prev.filter((selectedId) => selectedId !== application.id)));
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />

                      {application.profile_image ? (
                        <img
                          src={application.profile_image}
                          alt={application.applicant_name}
                          className="size-10 shrink-0 rounded-full object-cover border border-white/10"
                        />
                      ) : (
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-neon-purple to-pink-500 text-xs font-bold text-white shadow-sm">
                          {initials(application.applicant_name)}
                        </div>
                      )}

                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm sm:text-[15px] font-semibold text-white">{application.applicant_name}</p>
                          {readiness != null && (
                            <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${tone.bg} ${tone.text}`}>
                              {readiness}% readiness
                            </span>
                          )}
                        </div>
                        {application.headline ? (
                          <p className="truncate text-xs sm:text-[13px] text-white/60">{application.headline}</p>
                        ) : application.skills?.length > 0 ? (
                          <p className="truncate text-xs sm:text-[13px] text-white/60">{application.skills.map((s) => s.name).join(", ")}</p>
                        ) : null}
                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <p className="min-w-0 truncate text-xs text-white/40">
                            Applied {appliedAgo(application.applied_at)}
                            {application.years_experience != null ? ` · ${application.years_experience} yrs` : ""}
                            {application.location ? ` · ${application.location}` : ""}
                          </p>
                          <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap ${meta.className}`}>
                            {meta.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: detail */}
          <div className={`${mobileDetailOpen ? "flex" : "hidden lg:flex"} min-w-0 flex-1 flex-col gap-4 rounded-[20px] border border-white/12 bg-white/4 p-4 sm:p-5 w-full`}>
            {/* Mobile top bar navigation */}
            <div className="flex flex-col gap-3 lg:hidden pb-2">
              <button
                onClick={() => setMobileDetailOpen(false)}
                className="flex w-fit items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white transition-colors"
              >
                <ChevronLeft className="size-4" />
                Applications
              </button>

              {totalCandidates > 0 && (
                <div className="flex items-center justify-between border-y border-white/10 py-2.5">
                  <button
                    onClick={handlePrevCandidate}
                    disabled={!hasPrev}
                    className="flex size-8 items-center justify-center rounded-full border border-white/12 bg-white/4 text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Previous candidate"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="text-xs sm:text-sm font-medium text-white/70">
                    Candidate {currentIndex >= 0 ? currentIndex + 1 : 1} of {totalCandidates}
                  </span>
                  <button
                    onClick={handleNextCandidate}
                    disabled={!hasNext}
                    className="flex size-8 items-center justify-center rounded-full border border-white/12 bg-white/4 text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Next candidate"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              )}
            </div>

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
              <ApplicantDetailSkeleton />
            ) : (
              <>
                {/* Profile top */}
                <div className="flex flex-col items-center text-center lg:flex-row lg:items-center lg:text-left gap-4">
                  <div className="flex size-20 lg:size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-neon-purple to-pink-500 lg:bg-neon-purple text-xl lg:text-lg font-bold text-white lg:text-[#06060f]">
                    {initials(selectedApplication.user?.name)}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col items-center lg:items-start gap-1">
                    <p className="text-xl lg:text-lg font-bold text-white">{selectedApplication.user?.name}</p>
                    {selectedApplication.user?.headline && <p className="text-sm text-white/70">{selectedApplication.user.headline}</p>}
                    <div className="flex items-center gap-2 text-[13px] text-white/50">
                      {selectedApplication.user?.city && <span>{formatCity(selectedApplication.user.city)}</span>}
                      {selectedApplication.user?.city && candidateYears != null && <span>·</span>}
                      {candidateYears != null && <span>{candidateYears} yrs exp</span>}
                    </div>
                    <div className="block lg:hidden mt-1">
                      <button
                        disabled
                        title="There is no public candidate profile route yet"
                        className="flex cursor-not-allowed items-center gap-1 text-xs font-semibold text-neon-cyan opacity-90"
                      >
                        View qelsa profile
                        <ArrowRight className="size-3" />
                      </button>
                    </div>
                  </div>
                  <div className="hidden lg:block">
                    <button
                      disabled
                      title="There is no public candidate profile route yet"
                      className="flex cursor-not-allowed items-center gap-1.5 rounded-full gradient-primary px-4 py-2 text-xs font-medium text-white opacity-50"
                    >
                      View qelsa profile
                      <ArrowRight className="size-3" />
                    </button>
                  </div>
                </div>

                {selectedHit?.explanation ? (
                  <div className="rounded-xl border border-neon-cyan/25 bg-neon-cyan/5 p-4">
                    <p className="text-[13px] font-semibold text-white/80">Why this match</p>
                    <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-white/65">{selectedHit.explanation}</p>
                  </div>
                ) : null}

                {/* Summary */}
                {selectedApplication.user?.professional_summary && (
                  <div className="flex flex-col gap-2.5">
                    <p className="text-[13px] font-semibold text-white/80">Summary</p>
                    <div className="rounded-[10px] border border-white/8 border-l-2 border-l-neon-purple bg-white/4 px-4 py-3">
                      <p className="text-xs leading-relaxed text-white/75">{selectedApplication.user.professional_summary}</p>
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-85 ${
                            (statusMeta[selectedApplication.status] ?? { className: "bg-white/8 text-white/50" }).className
                          }`}
                        >
                          <span>{(statusMeta[selectedApplication.status] ?? { label: "Withdrawn" }).label}</span>
                          <ChevronDown className="size-3 opacity-60" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass-strong border-glass-border">
                        <DropdownMenuItem
                          onClick={() => handleApplicationStatus("viewed", selectedApplication.id)}
                          className="cursor-pointer text-xs flex items-center gap-2"
                        >
                          <span className="size-2 rounded-full bg-amber-400" />
                          Under review
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleApplicationStatus("sorted", selectedApplication.id)}
                          className="cursor-pointer text-xs flex items-center gap-2"
                        >
                          <span className="size-2 rounded-full bg-neon-green" />
                          Shortlisted
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleApplicationStatus("rejected", selectedApplication.id)}
                          className="cursor-pointer text-xs flex items-center gap-2"
                        >
                          <span className="size-2 rounded-full bg-red-500" />
                          Rejected
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleApplicationStatus("hold", selectedApplication.id)}
                          className="cursor-pointer text-xs flex items-center gap-2"
                        >
                          <span className="size-2 rounded-full bg-neon-yellow" />
                          On hold
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="h-px w-full bg-white/12" />

                {/* Competency framework */}
                {selectedApplication.competency && (
                  <div className="rounded-xl border border-white/8 bg-white/3 p-4">
                    <div className="flex items-center justify-between pb-3">
                      <p className="text-[13px] font-semibold text-white/80">Competency framework</p>
                    </div>

                    {/* Mobile card layout */}
                    <div className="flex flex-col gap-2.5 md:hidden">
                      {selectedApplication.competency.competencies.map((competency) => {
                        const isGap = competency.status === "gap" || !competency.matched;
                        const matchLabel = competency.status === "exceeds" ? "↑ Exceeds" : competency.matched ? "✓ Match" : "× Gap";
                        return (
                          <div key={competency.skill_id} className="flex flex-col gap-2 rounded-xl border border-white/8 bg-white/3 p-3.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[13px] font-semibold text-white">{competency.skill_name}</span>
                              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${competencyTypeStyles[competency.type] ?? competencyTypeStyles.preferred}`}>
                                {jobSkillTypeLabel(competency.type)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-white/60">
                                Req: <span className="font-medium text-white/80">{proficiencyLabel(competency.required_proficiency)}</span>
                              </span>
                              <span className={`font-semibold ${isGap ? "text-[#ef4444]" : "text-neon-green"}`}>{matchLabel}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop table layout */}
                    <div className="hidden md:block overflow-x-auto">
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

                    <div className="flex items-start justify-between pt-3 text-xs">
                      <p className="text-white/40">{selectedApplication.competency.totalCount} competencies</p>
                      <p className="font-semibold text-neon-green">
                        {selectedApplication.competency.matchedCount} of {selectedApplication.competency.totalCount} matched
                      </p>
                    </div>
                  </div>
                )}

                {/* Cover letter */}
                <div className="flex flex-col gap-2.5">
                  <p className="text-[13px] font-semibold text-white/80">Cover Letter</p>
                  <div className="rounded-xl border border-white/8 bg-white/4 p-4">
                    {selectedApplication.cover_letter ? (
                      <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-white/80">
                        {selectedApplication.cover_letter}
                      </p>
                    ) : (
                      <p className="text-[13px] text-white/40">No cover letter provided.</p>
                    )}
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
                      {selectedApplication.job_application_answers.map((answer, idx) => {
                        const { knockout, meets } = screeningEval(answer);
                        return (
                          <div key={idx} className="flex flex-col gap-2 rounded-xl border border-white/8 bg-white/4 px-4 py-3.5">
                            <div className="flex items-start justify-between gap-3">
                              <p className="flex-1 text-[13px] font-semibold text-white leading-snug">{answer.question}</p>
                              {knockout && (
                                <span className="flex shrink-0 items-center gap-1 rounded bg-[#2a1720] border border-red-500/20 px-2 py-0.5 text-[11px] font-medium text-[#f87171]">
                                  <AlertTriangle className="size-3 text-[#f87171]" />
                                  Knockout
                                </span>
                              )}
                            </div>
                            <p className="text-[13px] text-white/60">{answer.answer}</p>
                            {meets !== null && (
                              <div className="flex items-center gap-1.5 pt-0.5">
                                <span className={`size-2 shrink-0 rounded-full ${meets ? "bg-neon-green" : "bg-[#ef4444]"}`} />
                                <span className={`text-xs font-semibold ${meets ? "text-neon-green" : "text-[#ef4444]"}`}>
                                  {meets ? "Meets requirement" : "Does not meet requirement"}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="h-px w-full bg-white/12" />
                  </>
                )}

                {/* Notes */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold text-white/80">Notes</p>
                    <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[11px] font-medium text-white/60">
                      {selectedApplication.notes?.length ?? 0}
                    </span>
                  </div>

                  {(!selectedApplication.notes || selectedApplication.notes.length === 0) ? (
                    <div className="rounded-xl border border-white/8 bg-white/4 px-3.5 py-3">
                      <p className="text-[13px] text-white/40">No notes yet.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {selectedApplication.notes.map((note) => (
                        <div key={note.id} className="flex flex-col gap-2 rounded-xl border border-white/8 bg-white/4 p-3.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-neon-cyan/20 text-xs font-bold text-neon-cyan">
                                {initials(note.author_name)}
                              </div>
                              <span className="text-[13px] font-semibold text-white">{note.author_name}</span>
                            </div>
                            <span className="text-xs text-white/40">{formatRelativeTime(note.created_at)}</span>
                          </div>
                          <p className="text-[13px] leading-relaxed text-white/70 pl-9 whitespace-pre-wrap">{note.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {showNoteComposer && (
                    <div className="flex flex-col gap-3 rounded-xl border border-neon-cyan/40 bg-white/5 p-4">
                      <p className="text-[13px] font-semibold text-white/80">Add a note</p>
                      <Textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Write your note about this candidate..."
                        rows={3}
                        className="resize-none border-white/10 bg-white/3 text-[13px] text-white placeholder:text-white/40"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-white/40">Visible to:</span>
                        <span className="rounded-full border border-white/10 bg-white/4 px-2.5 py-1 text-xs font-medium text-white/50">Team only</span>
                        <div className="flex-1" />
                        <button
                          onClick={() => {
                            setShowNoteComposer(false);
                            setNoteText("");
                          }}
                          className="rounded-full border border-white/20 px-5 py-2 text-xs font-bold text-white/80 hover:bg-white/5 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveNote}
                          disabled={!noteText.trim() || isSavingNote}
                          className="rounded-full gradient-primary px-5 py-2 text-xs font-bold text-white transition-opacity disabled:opacity-50"
                        >
                          {isSavingNote ? "Saving..." : "Save Note"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 lg:flex lg:flex-row gap-2.5 pt-2">
                  <button
                    onClick={() => setShowNoteComposer((v) => !v)}
                    className="flex h-11 items-center justify-center gap-2 rounded-[10px] lg:rounded-full border border-white/12 bg-white/4 px-4 text-xs lg:text-sm font-semibold text-white hover:bg-white/8 transition-colors"
                  >
                    ✎ {showNoteComposer ? "Close Notes" : "Add Notes"}
                  </button>
                  <button
                    onClick={() => setShowMessageComposer(true)}
                    className="flex h-11 items-center justify-center gap-2 rounded-[10px] lg:rounded-full border border-white/12 bg-white/4 px-4 text-xs lg:text-sm font-semibold text-white hover:bg-white/8 transition-colors"
                  >
                    <MessageCircle className="size-4" />
                    Message
                  </button>
                  <button
                    onClick={handleDownloadResume}
                    disabled={!selectedApplication.resume?.file_url}
                    className="flex h-11 items-center justify-center gap-2 rounded-[10px] lg:rounded-full border border-white/12 bg-white/4 px-4 text-xs lg:text-sm font-semibold text-white hover:bg-white/8 transition-colors disabled:opacity-40"
                  >
                    <Download className="size-4" />
                    Resume
                  </button>
                  <button
                    onClick={() => navigator.clipboard?.writeText(window.location.href)}
                    className="flex h-11 items-center justify-center gap-2 rounded-[10px] lg:rounded-full border border-white/12 bg-white/4 px-4 text-xs lg:text-sm font-semibold text-white hover:bg-white/8 transition-colors"
                  >
                    <Share2 className="size-4" />
                    Share
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Pagination — the API returns the full list, so paging is a shell */}
        <div className={`${mobileDetailOpen ? "hidden lg:flex" : "flex"} items-center justify-between pt-5`}>
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

        {/* Footer — mirrors ProfileFooter (Figma 653:3765); the page container
            already supplies the horizontal padding. */}
        <div className="flex flex-col gap-8 pb-10 pt-20">
          <div className="h-px w-full bg-white/[0.12]" />
          <div className="flex flex-col items-center justify-between gap-4 text-xs text-white/50 sm:flex-row">
            <p>© {new Date().getFullYear()} Qelsa. All rights reserved.</p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <Link href="/privacy" className="transition-colors hover:text-white/70">
                Privacy Policy
              </Link>
              <Link href="/terms" className="transition-colors hover:text-white/70">
                Terms of Service
              </Link>
              <Link href="/cookies" className="transition-colors hover:text-white/70">
                Cookie Policy
              </Link>
            </div>
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
                <Button onClick={handleSendMessage} className="flex-1 rounded-full gradient-primary font-bold text-white border-0">
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
