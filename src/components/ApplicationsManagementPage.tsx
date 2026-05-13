import { useEditBulkStatusMutation, useGetJobApplicationsQuery } from "@/features/api/jobApplicationsApi";
import { useEditJobMutation, useGetJobByIdQuery } from "@/features/api/jobsApi";
import { JobApplication } from "@/types/jobApplication";
import {
  Archive,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  Home,
  Mail,
  MapPin,
  MessageSquare,
  MoreVertical,
  Phone,
  Send,
  Share2,
  Star,
  Target,
  User,
  UserCheck,
  Users,
  UserX,
  XCircle,
  Zap,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { CandidateNLPSearch } from "./CandidateNLPSearch";
import PdfPreview from "./PdfPreview";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { ScrollArea } from "./ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";

export function ApplicationsManagementPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [selectedApplication, setSelectedApplication] = useState<JobApplication>(null);
  const [selectedApplications, setSelectedApplications] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState("recent");
  const [savedView, setSavedView] = useState("all");
  const [showMessageComposer, setShowMessageComposer] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState("");
  const [messageText, setMessageText] = useState("");
  const [nlpSearchQuery, setNlpSearchQuery] = useState("");
  const [nlpFilters, setNlpFilters] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: currentJobPosting } = useGetJobByIdQuery(id);
  const { data: applicants, error, isLoading } = useGetJobApplicationsQuery({ jobId: id });
  const [editJob] = useEditJobMutation();
  const [editBulkStatus] = useEditBulkStatusMutation();

  const filteredApplications = useMemo(() => {
    let filtered = (applicants ?? []).filter((application) => {
      // if (savedView === "new-week") return application.applied_days_ago <= 7 && application.status === "new";
      // if (savedView === "strong-match") return application.matchScore >= 90;
      // if (savedView === "needs-followup") return application.applied_days_ago > 7 && application.status === "reviewed";
      return true;
    });

    // Apply NLP filters if any exist
    if (nlpFilters.length > 0) {
      filtered = filtered.filter((application) => {
        return nlpFilters.every((filter) => {
          const lowerLabel = filter.label.toLowerCase();

          // switch (filter.category) {
          //   case "skill":
          //     return application.keySkills.some((skill) => skill.toLowerCase().includes(lowerLabel) || lowerLabel.includes(skill.toLowerCase()));

          //   case "experience":
          //     const yearsMatch = filter.label.match(/(\d+)/);
          //     if (yearsMatch) {
          //       const requiredYears = parseInt(yearsMatch[1]);
          //       return application.yearsExperience >= requiredYears;
          //     }
          //     return true;

          //   case "location":
          //     return application.location.toLowerCase().includes(lowerLabel);

          //   case "education":
          //     return application.education.some((edu) => edu.degree.toLowerCase().includes(lowerLabel) || lowerLabel.includes(edu.degree.toLowerCase()));

          //   default:
          //     // For other categories, search across all fields
          //     const searchString = `${application.name} ${application.currentRole} ${application.keySkills.join(" ")} ${application.location}`.toLowerCase();
          //     return searchString.includes(lowerLabel);
          // }
        });
      });
    }

    return filtered;
  }, [nlpFilters, applicants]);

  const sortedApplications = useMemo(() => {
    return [...filteredApplications].sort((a, b) => {
      // if (sortBy === "rating") return b.rating - a.rating;
      // if (sortBy === "match") return b.matchScore - a.matchScore;
      return a.applied_days_ago - b.applied_days_ago; // Most recent first
    });
  }, [filteredApplications]);

  const handleNLPSearch = useCallback((query: string, filters: any[]) => {
    setIsSearching(true);
    setNlpSearchQuery(query);
    setNlpFilters(filters);

    // Simulate search delay
    setTimeout(() => {
      setIsSearching(false);
    }, 300);
  }, []);

  const handleClearNLPSearch = useCallback(() => {
    setNlpSearchQuery("");
    setNlpFilters([]);
    setIsSearching(false);
  }, []);

  // Health metrics
  const applyRate = 23.4; // percentage
  const completionRate = 67.8; // percentage
  const medianResponseTime = 2.3; // days

  const handleBulkAction = useCallback(
    async (action: string) => {
      try {
        await editBulkStatus({
          applicationIds: selectedApplications,
          new_status: action,
        }).unwrap();

        setSelectedApplications([]);
      } catch (error) {
        console.error("Error performing bulk action:", error);
      }
    },
    [selectedApplications, editBulkStatus]
  );

  const handleApplicationStatus = async (action, applicationId) => {
    try {
      await editBulkStatus({
        applicationIds: [applicationId],
        new_status: action,
      }).unwrap();
    } catch (error) {
      console.error("Error performing bulk action:", error);
    }
  };

  const handleSendMessage = useCallback(() => {
    console.log("Sending message:", messageText);
    setShowMessageComposer(false);
    setMessageText("");
  }, [messageText]);

  const messageTemplates = {
    thanks: "Thank you for your application! We've received your materials and will review them carefully. We'll be in touch soon.",
    phoneScreen: "We were impressed by your application! We'd like to schedule a brief phone screening. Are you available this week?",
    rejection:
      "Thank you for your interest in this position. After careful consideration, we've decided to move forward with other candidates whose experience more closely matches our current needs. We appreciate the time you took to apply and wish you the best in your job search.",
  };

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "shortlisted":
        return "border-neon-purple/30 text-neon-purple bg-neon-purple/10";
      case "interview":
        return "border-neon-green/30 text-neon-green bg-neon-green/10";
      case "rejected":
        return "border-destructive/30 text-destructive bg-destructive/10";
      case "reviewed":
        return "border-neon-yellow/30 text-neon-yellow bg-neon-yellow/10";
      default:
        return "border-muted-foreground/30 text-muted-foreground bg-muted/10";
    }
  }, []);

  const getSourceColor = useCallback((source: string) => {
    switch (source) {
      case "Qelsa":
        return "border-neon-cyan/30 text-neon-cyan bg-neon-cyan/10";
      case "Referral":
        return "border-neon-green/30 text-neon-green bg-neon-green/10";
      default:
        return "border-muted-foreground/30 text-muted-foreground bg-muted/10";
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background">
      {/* Header */}
      <div className="glass-strong border-b border-glass-border">
        <div className="max-w-[1800px] mx-auto px-6 py-6">
          <Button variant="ghost" onClick={() => router.push("/jobs/posted")} className="mb-4 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Posted Jobs
          </Button>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{currentJobPosting?.title}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {currentJobPosting?.location}
                </span>
                <span>•</span>
                <span>{applicants?.length} applications</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="glass border-glass-border">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" className="glass border-glass-border">
                <Share2 className="w-4 h-4 mr-2" />
                Share List
              </Button>
            </div>
          </div>

          {/* Health Signals */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass border-glass-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Apply Rate</span>
                {applyRate < 30 && (
                  <Badge variant="outline" className="text-xs border-neon-yellow/30 text-neon-yellow">
                    Low
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">{applyRate}%</p>
                {applyRate < 30 && (
                  <Button size="sm" variant="outline" className="text-xs border-neon-cyan/30 text-neon-cyan">
                    <Zap className="w-3 h-3 mr-1" />
                    Boost
                  </Button>
                )}
              </div>
            </Card>

            <Card className="glass border-glass-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Completion Rate</span>
                {completionRate < 70 && (
                  <Badge variant="outline" className="text-xs border-neon-yellow/30 text-neon-yellow">
                    Low
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">{completionRate}%</p>
              </div>
            </Card>
          </div>

          {/* Filters and Actions */}
          <div className="mt-6 flex items-center gap-3">
            <Select value={savedView} onValueChange={setSavedView}>
              <SelectTrigger className="w-48 glass border-glass-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass border-glass-border">
                <SelectItem value="all">All Applicants</SelectItem>
                <SelectItem value="new-week">New This Week</SelectItem>
                <SelectItem value="strong-match">Strong Match (&gt;90%)</SelectItem>
                <SelectItem value="needs-followup">Needs Follow-up</SelectItem>
              </SelectContent>
            </Select>

            {selectedApplications.length > 0 && (
              <>
                <Separator orientation="vertical" className="h-8" />
                <Badge variant="outline" className="border-neon-purple/30 text-neon-purple">
                  {selectedApplications.length} selected
                </Badge>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("sorted")}>
                  <Star className="w-4 h-4 mr-2" />
                  Shortlist
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("rejected")}>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("message")}>
                  <Send className="w-4 h-4 mr-2" />
                  Message
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("archive")}>
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Two-Pane Layout */}
      <div className="max-w-[1800px] mx-auto px-6 py-8">
        {/* NLP Search Bar - Full Width */}
        <div className="mb-6">
          <CandidateNLPSearch onSearch={handleNLPSearch} onClear={handleClearNLPSearch} isLoading={isSearching} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Applicants List */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Applicants</h2>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36 glass border-glass-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass border-glass-border">
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="rating">Ratings</SelectItem>
                  <SelectItem value="match">Best Match</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Empty State or Candidate List */}
            {sortedApplications.length === 0 && nlpFilters.length > 0 ? (
              <Card className="glass border-glass-border p-12 flex flex-col items-center justify-center text-center">
                <Users className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No candidates match your filters</h3>
                <p className="text-sm text-muted-foreground mb-4">Try adjusting your search criteria or clearing filters</p>
                <Button variant="outline" size="sm" onClick={handleClearNLPSearch}>
                  Clear Filters
                </Button>
              </Card>
            ) : (
              <ScrollArea className="h-[calc(100vh-32rem)]">
                <div className="space-y-3">
                  {isSearching ? (
                    // Loading shimmer
                    <>
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="glass border-glass-border p-4 animate-pulse">
                          <div className="flex items-start gap-3">
                            <div className="w-4 h-4 bg-muted/20 rounded" />
                            <div className="flex-1 space-y-3">
                              <div className="h-4 bg-muted/20 rounded w-3/4" />
                              <div className="h-3 bg-muted/20 rounded w-1/2" />
                              <div className="flex gap-2">
                                <div className="h-5 bg-muted/20 rounded w-16" />
                                <div className="h-5 bg-muted/20 rounded w-16" />
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </>
                  ) : (
                    sortedApplications.map((application) => (
                      <Card
                        key={application.id}
                        className={`glass border-glass-border p-4 cursor-pointer transition-all hover:border-neon-cyan/50 ${
                          selectedApplication?.id === application.id ? "border-neon-cyan/50 bg-neon-cyan/5" : ""
                        }`}
                        onClick={() => setSelectedApplication(application)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedApplications.includes(application.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedApplications([...selectedApplications, application.id]);
                              } else {
                                setSelectedApplications(selectedApplications.filter((id) => id !== application.id));
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold truncate">{application.user.name}</h3>
                              <Badge variant="outline" className={`text-xs ${getStatusColor(application.status)}`}>
                                {application.status.replace("-", " ")}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">{/* <span>{application.yearsExperience}y exp</span> */}</div>

                            <div className="flex flex-wrap gap-1 mb-2">
                              {application.user.skills.slice(0, 3).map((skill, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs border-neon-purple/30 text-neon-purple">
                                  {skill.title}
                                </Badge>
                              ))}
                              {application.user.skills.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{application.user.skills.length - 3}
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Applied {Math.floor((Date.now() - new Date(application.createdAt).getTime()) / (1000 * 60 * 60 * 24))}d ago</span>
                              <div className="flex items-center gap-1">
                                <Target className="w-3 h-3 text-neon-cyan" />
                                {/* <span className="text-neon-cyan">{application.matchScore}%</span> */}
                              </div>
                            </div>
                          </div>

                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Right: Applicant Detail with Profile/Resume Tabs */}
          <div className="lg:col-span-2">
            {selectedApplication ? (
              <Card className="glass border-glass-border">
                {/* Sticky Actions Bar */}
                <div className="sticky top-0 z-10 glass-strong border-b border-glass-border p-4">
                  <div className="flex gap-2">
                    <Button className="gradient-animated flex-1">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                    <Button variant="outline" className="flex-1 border-neon-purple/30 text-neon-purple" onClick={() => handleApplicationStatus("sorted", selectedApplication.id)}>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Shortlist
                    </Button>
                    <Button variant="outline" className="flex-1 border-destructive/30 text-destructive" onClick={() => handleApplicationStatus("rejected", selectedApplication.id)}>
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass border-glass-border">
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          Download Resume
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share2 className="w-4 h-4 mr-2" />
                          Share Profile
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleApplicationStatus("rejected", selectedApplication.id)}>
                          <UserX className="w-4 h-4 mr-2" />
                          Reject
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <Tabs defaultValue="profile" className="w-full">
                  <TabsList className="w-full glass-strong border-b border-glass-border rounded-none">
                    <TabsTrigger value="profile" className="flex-1 data-[state=active]:bg-neon-cyan/20">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </TabsTrigger>
                    <TabsTrigger value="resume" className="flex-1 data-[state=active]:bg-neon-purple/20">
                      <FileText className="w-4 h-4 mr-2" />
                      Resume
                    </TabsTrigger>
                  </TabsList>

                  {/* Profile Tab */}
                  <TabsContent value="profile" className="mt-0">
                    <ScrollArea className="h-[calc(100vh-28rem)]">
                      <div className="p-6 space-y-6">
                        {/* AI Summary (Top) */}
                        <div className="glass-strong rounded-lg p-4 border border-neon-purple/30">
                          <div className="flex items-center gap-2 mb-3">
                            <Zap className="w-5 h-5 text-neon-purple" />
                            <h3 className="font-semibold">AI Summary</h3>
                            <Badge variant="outline" className="text-xs border-neon-purple/30 text-neon-purple">
                              Generated
                            </Badge>
                          </div>
                          {/* <p className="text-sm text-muted-foreground mb-3">
                            <strong className="text-foreground">Strong fit for this role.</strong> {selectedApplicant.name} has {selectedApplicant.yearsExperience} years of relevant experience and
                            matches {selectedApplication.mustHavesMatched} of {selectedApplication.mustHavesTotal} must-have requirements.
                            {selectedApplication.matchScore >= 90
                              ? " Excellent technical alignment with the job description. Highly recommended for interview."
                              : " Good foundation with some skill gaps. Consider for phone screening to assess cultural fit and growth potential."}
                          </p> */}
                          {/* <div className="flex items-center gap-2 text-xs">
                            <Badge variant="outline" className="border-neon-green/30 text-neon-green">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              {selectedApplication.mustHavesMatched} must-haves matched
                            </Badge>
                            {selectedApplication.mustHavesMatched < selectedApplication.mustHavesTotal && (
                              <Badge variant="outline" className="border-neon-yellow/30 text-neon-yellow">
                                {selectedApplication.mustHavesTotal - selectedApplication.mustHavesMatched} gaps
                              </Badge>
                            )}
                            <Badge variant="outline" className="border-neon-cyan/30 text-neon-cyan">
                              {selectedApplication.matchScore}% overall match
                            </Badge> 
                          </div> */}
                        </div>

                        {/* Contact and Basics */}
                        <div>
                          <h3 className="font-semibold mb-3">Contact & Basic Info</h3>
                          <div className="glass-strong rounded-lg p-4 space-y-3">
                            <div>
                              <h4 className="text-lg font-semibold">{selectedApplication?.user?.name}</h4>
                              <p className="text-sm text-muted-foreground">{selectedApplication.user?.headline}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-neon-cyan flex-shrink-0" />
                                <span className="truncate">{selectedApplication.user?.email}</span>
                              </div>
                              {selectedApplication.user?.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-neon-cyan flex-shrink-0" />
                                  <span>{selectedApplication.user?.phone}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-neon-cyan flex-shrink-0" />
                                <span>{selectedApplication.user?.work_preference}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-neon-cyan flex-shrink-0" />
                                <span>Applied {Math.floor((Date.now() - new Date(selectedApplication.createdAt).getTime()) / (1000 * 60 * 60 * 24))}d ago</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-neon-cyan flex-shrink-0" />
                                {/* <span>{selectedApplication.user?.yearsExperience} years experience</span> */}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Must-Haves Matched Checklist */}
                        <div>
                          <h3 className="font-semibold mb-3">Must-Haves Matched</h3>
                          <div className="glass-strong rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm text-muted-foreground">JD Requirements</span>
                              <Badge variant="outline" className="border-neon-green/30 text-neon-green">
                                {/* {selectedApplicant.mustHavesMatched}/{selectedApplicant.mustHavesTotal} */}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              {/* {currentJobPosting.mustHaves.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                  {idx < selectedApplicant.mustHavesMatched ? (
                                    <CheckCircle2 className="w-4 h-4 text-neon-green flex-shrink-0" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                  )}
                                  <span className={idx < selectedApplicant.mustHavesMatched ? "" : "text-muted-foreground"}>{item}</span>
                                </div>
                              ))} */}
                            </div>
                          </div>
                        </div>

                        {/* Screening Questions */}
                        {selectedApplication.job_application_answers && selectedApplication.job_application_answers.length > 0 && (
                          <div>
                            <h3 className="font-semibold mb-3">Screening Questions</h3>
                            <div className="glass-strong rounded-lg p-4">
                              <div className="space-y-4">
                                {selectedApplication.job_application_answers.map((sq, idx) => (
                                  <div key={idx} className="pb-4 last:pb-0 border-b last:border-b-0 border-glass-border">
                                    <div className="flex items-start gap-2 mb-2">
                                      <FileText className="w-4 h-4 text-neon-purple flex-shrink-0 mt-0.5" />
                                      <p className="text-sm font-medium text-muted-foreground">{sq.question}</p>
                                    </div>
                                    <div className="ml-6">
                                      <div className="flex items-start gap-2">
                                        {/* {sq.isIdeal ? (
                                          <CheckCircle2 className="w-4 h-4 text-neon-green flex-shrink-0 mt-0.5" />
                                        ) : (
                                          <AlertCircle className="w-4 h-4 text-neon-yellow flex-shrink-0 mt-0.5" />
                                        )} */}
                                        <p className="text-sm">{sq.answer}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Qelsa Profile Snapshot */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">Qelsa Profile</h3>
                            <Button variant="ghost" size="sm" className="text-xs text-neon-cyan hover:text-neon-cyan">
                              View Full Profile
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </Button>
                          </div>

                          {/* Experience */}
                          <div className="glass-strong rounded-lg p-4 mb-3">
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                              <Briefcase className="w-4 h-4 text-neon-cyan" />
                              Experience
                            </h4>
                            <div className="space-y-3">
                              {selectedApplication.user?.experiences.slice(0, 1).map((exp, idx) => (
                                <div key={idx} className="pb-3 border-b border-glass-border">
                                  <p className="font-medium text-sm">{exp.title}</p>
                                  <p className="text-xs text-muted-foreground">{exp.company_name}</p>
                                </div>
                              ))}
                              {selectedApplication.user.experiences.length > 1 && (
                                <Button variant="ghost" size="sm" className="w-full text-xs text-neon-cyan">
                                  Show more experience
                                  <ChevronRight className="w-3 h-3 ml-1" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Education */}
                          <div className="glass-strong rounded-lg p-4 mb-3">
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                              <GraduationCap className="w-4 h-4 text-neon-cyan" />
                              Education
                            </h4>
                            <div className="space-y-3">
                              {selectedApplication.user?.educations.slice(0, 1).map((edu, idx) => (
                                <div key={idx} className="pb-3 border-b border-glass-border">
                                  <p className="font-medium text-sm">{edu.degree?.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {edu.institution} • {edu.end_year}
                                  </p>
                                </div>
                              ))}
                              {selectedApplication.user.educations.length > 1 && (
                                <Button variant="ghost" size="sm" className="w-full text-xs text-neon-cyan">
                                  Show more education
                                  <ChevronRight className="w-3 h-3 ml-1" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Job Preferences */}
                          {selectedApplication.user && (
                            <div className="glass-strong rounded-lg p-4">
                              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Target className="w-4 h-4 text-neon-cyan" />
                                Job Preferences
                              </h4>
                              <div className="space-y-3 text-sm">
                                {/* {selectedApplication.user.jobTypes && (
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Job Type</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {selectedApplication.user.jobTypes.map((type, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs border-neon-purple/30 text-neon-purple">
                                          {type}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )} */}
                                {selectedApplication.user.work_preference && (
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Work Arrangement</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      <Badge variant="outline" className="text-xs border-neon-cyan/30 text-neon-cyan">
                                        <Home className="w-3 h-3 mr-1" />
                                        {selectedApplication.user.work_preference}
                                      </Badge>
                                    </div>
                                  </div>
                                )}
                                {(selectedApplication.user.expected_min_salary || selectedApplication.user.expected_max_salary) && (
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-neon-green flex-shrink-0" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Desired Salary</p>
                                      <p className="font-medium text-sm text-neon-green">
                                        {selectedApplication.user.expected_min_salary} - {selectedApplication.user.expected_max_salary}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-glass-border">
                                  {selectedApplication.user.want_to_relocate !== undefined && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Willing to Relocate</p>
                                      <p className="font-medium text-sm">{selectedApplication.user.want_to_relocate ? "Yes" : "No"}</p>
                                    </div>
                                  )}
                                  {/* {selectedApplication.user.noticePeriod && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Notice Period</p>
                                      <p className="font-medium text-sm">{selectedApplication.user.noticePeriod}</p>
                                    </div>
                                  )} */}
                                </div>

                                {/* {selectedApplication.user.culturalPreferences && (
                                  <div className="pt-3 border-t border-glass-border space-y-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Heart className="w-4 h-4 text-neon-pink" />
                                      <h5 className="text-sm font-semibold">Cultural Preferences</h5>
                                    </div>

                                    {selectedApplication.user.culturalPreferences.cultureAttributes && (
                                      <div>
                                        <div className="flex flex-wrap gap-1.5">
                                          {selectedApplication.user.culturalPreferences.cultureAttributes.map((attr, idx) => (
                                            <Badge key={idx} variant="outline" className="text-xs border-neon-cyan/30 text-neon-cyan">
                                              {attr}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )} */}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Matched Skills */}
                        <div>
                          <h3 className="font-semibold mb-3">Skills Match Analysis</h3>
                          <div className="space-y-3">
                            {/* Exact Matches */}
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="w-4 h-4 text-neon-green" />
                                <span className="text-sm font-medium">Exact Matches</span>
                                <Badge variant="outline" className="text-xs border-neon-green/30 text-neon-green">
                                  {/* {selectedApplication.keySkills.slice(0, 3).length} */}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {/* {selectedApplication.keySkills.slice(0, 3).map((skill, idx) => (
                                  <Badge key={idx} variant="outline" className="border-neon-green/30 text-neon-green">
                                    {skill}
                                  </Badge>
                                ))} */}
                              </div>
                            </div>

                            {/* Adjacent Skills */}
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Target className="w-4 h-4 text-neon-cyan" />
                                <span className="text-sm font-medium">Adjacent Skills</span>
                                <Badge variant="outline" className="text-xs border-neon-cyan/30 text-neon-cyan">
                                  {/* {selectedApplication.keySkills.length - 3} */}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {/* {selectedApplication.keySkills.slice(3).map((skill, idx) => (
                                  <Badge key={idx} variant="outline" className="border-neon-cyan/30 text-neon-cyan">
                                    {skill}
                                  </Badge>
                                ))} */}
                              </div>
                            </div>

                            {/* Missing */}
                            {/* {selectedApplication.mustHavesMatched < selectedApplication.mustHavesTotal && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <XCircle className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm font-medium text-muted-foreground">Missing</span>
                                  <Badge variant="outline" className="text-xs">
                                    {selectedApplication.mustHavesTotal - selectedApplication.mustHavesMatched}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {currentJobPosting?.mustHaves.slice(selectedApplication.mustHavesMatched).map((skill, idx) => (
                                    <Badge key={idx} variant="outline" className="text-muted-foreground">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )} */}
                          </div>
                        </div>

                        {/* Application Timeline */}
                        <div>
                          <h3 className="font-semibold mb-3">Application Timeline</h3>
                          <div className="glass-strong rounded-lg p-4 space-y-3">
                            {selectedApplication.jobApplicationLogs.map((event, idx) => (
                              <div key={idx} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className={`w-2 h-2 rounded-full ${idx === 0 ? "bg-neon-green" : "bg-muted-foreground/30"}`} />
                                  {idx < selectedApplication.jobApplicationLogs.length - 1 && <div className="w-px h-full bg-muted-foreground/20 my-1" />}
                                </div>
                                <div className="flex-1 pb-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-medium">{event.new_status}</p>
                                    <span className="text-xs text-muted-foreground">{event.createdAt}</span>
                                  </div>
                                  {/* {event.note && <p className="text-xs text-muted-foreground">{event.note}</p>} */}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Notes Section */}
                        <div>
                          <h3 className="font-semibold mb-3">Team Notes</h3>
                          <div className="glass-strong rounded-lg p-4">
                            <Textarea placeholder="Add notes, @mention team members, or add labels..." rows={3} className="mb-3 glass border-glass-border resize-none" />
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="cursor-pointer text-xs border-neon-purple/30 text-neon-purple">
                                + Add Label
                              </Badge>
                              <Button size="sm" variant="ghost" className="text-xs">
                                @ Mention
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* Resume Tab */}
                  <TabsContent value="resume" className="mt-0">
                    <ScrollArea className="h-[calc(100vh-28rem)]">
                      <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Sidebar Summary */}
                          <div className="lg:col-span-1 space-y-4">
                            <div className="glass-strong rounded-lg p-4 sticky top-0">
                              <h4 className="text-sm font-semibold mb-3">JD Match Summary</h4>
                              <div className="space-y-2 mb-4">
                                {/* {currentJobPosting.mustHaves.slice(0, 4).map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-xs">
                                    {idx < selectedApplicant.mustHavesMatched ? (
                                      <CheckCircle2 className="w-3 h-3 text-neon-green flex-shrink-0" />
                                    ) : (
                                      <XCircle className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                    )}
                                    <span className={idx < selectedApplicant.mustHavesMatched ? "text-foreground" : "text-muted-foreground"}>{item}</span>
                                  </div>
                                ))} */}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full border-neon-cyan/30 text-neon-cyan"
                                onClick={async () => {
                                  try {
                                    const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${selectedApplication.resume?.file_url}`;
                                    if (!url) return;
                                    const res = await fetch(url);
                                    if (!res.ok) throw new Error("Failed to download file");
                                    const blob = await res.blob();
                                    const filename = "resume.pdf";
                                    const blobUrl = window.URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = blobUrl;
                                    a.download = filename;
                                    document.body.appendChild(a);
                                    a.click();
                                    a.remove();
                                    window.URL.revokeObjectURL(blobUrl);
                                  } catch (err) {
                                    console.error("Download error:", err);
                                  }
                                }}
                              >
                                <Download className="w-3 h-3 mr-2" />
                                Download Resume
                              </Button>
                            </div>
                          </div>

                          {/* Resume Viewer */}

                          <div className="lg:col-span-2">
                            <div className="glass-strong rounded-lg p-6">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-semibold">Resume</h4>
                              </div>

                              <PdfPreview pdfUrl={`${process.env.NEXT_PUBLIC_API_BASE_URL}${selectedApplication.resume?.file_url}`} />
                              
                              {/* Resume Content Preview */}
                              {/* <iframe src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${selectedApplication.resume?.file_url}`} width="100%" height="90vh" style={{ border: "none" }} /> */}
                              {/* <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                                <div style={{ height: "90vh" }}>
                                  <Viewer fileUrl={`${process.env.NEXT_PUBLIC_API_BASE_URL}${selectedApplication.resume?.file_url}`} />
                                </div>
                              </Worker> */}
                              {/* {ReactPDF.render(<PdfPreview />, `${process.env.NEXT_PUBLIC_API_BASE_URL}${selectedApplication.resume?.file_url}`)} */}
                            </div>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </Card>
            ) : (
              <Card className="glass border-glass-border p-12 flex flex-col items-center justify-center text-center h-[calc(100vh-24rem)]">
                <Users className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select an applicant</h3>
                <p className="text-sm text-muted-foreground">Choose an applicant from the list to view their details</p>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Message Composer (Optional - shows when clicking Message) */}
      {showMessageComposer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="glass-strong border-glass-border p-6 max-w-2xl w-full">
            <h3 className="font-semibold mb-4">Send Message</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Template</label>
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
                <label className="text-sm font-medium mb-2 block">Message</label>
                <Textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type your message..." rows={6} className="glass border-glass-border resize-none" />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSendMessage} className="gradient-animated flex-1">
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
                <Button variant="outline" onClick={() => setShowMessageComposer(false)} className="border-glass-border">
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
