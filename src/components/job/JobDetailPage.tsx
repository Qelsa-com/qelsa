import { useAuth } from "@/contexts/AuthContext";
import { useGetJobByIdQuery, useToggleSaveJobMutation } from "@/features/api/jobsApi";
import { useGetMyResumesQuery } from "@/features/api/resumeApi";
import DOMPurify from "dompurify";
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  BrainCircuit,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  FileText,
  Globe,
  Home,
  MapPin,
  MessageCircle,
  Play,
  Send,
  Share2,
  TrendingUp,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { QuickApplyModal } from "../QuickApplyModal";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";

export function JobDetailPage() {
  const { user } = useAuth();
  const [isApplied, setIsApplied] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showSavedResumesDialog, setShowSavedResumesDialog] = useState(false);
  const [showChatWidget, setShowChatWidget] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null);
  const [selectedSkillsTab, setSelectedSkillsTab] = useState("match");
  const { data: my_resumes } = useGetMyResumesQuery();
  const [toggleSaveJob] = useToggleSaveJobMutation();

  const router = useRouter();
  const [showQuickApplyModal, setShowQuickApplyModal] = useState(false);

  const params = useParams<{ id: string }>();
  const id = params?.id;

  const {
    data: job,
    error,
    isLoading,
  } = useGetJobByIdQuery(id!, {
    skip: !id,
  });

  const jobDescription = DOMPurify.sanitize(job?.description || "");

  useEffect(() => {
    if (job) {
      console.log(job.applications);
      console.log(user.id);

      const hasApplied = job.applications?.some((application) => application.user_id === user?.id);
      setIsApplied(hasApplied || false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job]);

  if (!id || isLoading) return <p>Loading job...</p>;
  if (error) return <p>Error loading job.</p>;
  if (!job) return <p>No job found.</p>;

  const handleCompanyClick = () => {
    // console.log("Company clicked:", job.company);
    // onCompanyClick?.(job.company);
  };

  const getWorkTypeIcon = (workType: string) => {
    switch (workType) {
      case "Remote":
        return <Globe className="w-4 h-4" />;
      case "Hybrid":
        return <Home className="w-4 h-4" />;
      default:
        return <Briefcase className="w-4 h-4" />;
    }
  };

  const getSourceIcon = (platform: string) => {
    switch (platform) {
      case "Qelsa":
        return <div className="w-5 h-5 rounded bg-neon-cyan flex items-center justify-center text-black text-xs font-bold">Q</div>;
      case "LinkedIn":
        return <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white text-xs">in</div>;
      case "Indeed":
        return <div className="w-5 h-5 rounded bg-blue-700 flex items-center justify-center text-white text-xs">I</div>;
      case "Naukri":
        return <div className="w-5 h-5 rounded bg-purple-600 flex items-center justify-center text-white text-xs">N</div>;
      default:
        return <Building2 className="w-5 h-5" />;
    }
  };

  const handleSaveJob = () => {
    // setIsSaved(!isSaved);
  };

  const handleApplyJob = () => {
    setIsApplied(true);
  };

  const handleShareJob = () => {};

  const handleUploadResume = () => {
    // Mock resume analysis
    setTimeout(() => {
      setResumeAnalysis({
        overallMatch: 78,
        strongSkills: ["React", "JavaScript", "Node.js"],
        partialSkills: ["TypeScript", "AWS"],
        missingSkills: ["Docker", "Kubernetes"],
        recommendations: ["Add Docker containerization experience", "Complete AWS certification", "Build a TypeScript project"],
      });
      setShowUploadDialog(false);
    }, 2000);
  };

  const handleChatSubmit = () => {
    if (chatMessage.trim()) {
      // Handle chat message
      console.log("Chat message:", chatMessage);
      setChatMessage("");
    }
  };

  const mockSimilarJobs = [
    {
      id: "1",
      title: "Frontend Developer",
      company: "TechCorp",
      location: "San Francisco, CA",
      fitScore: 85,
      logo: "https://via.placeholder.com/40x40",
    },
    {
      id: "2",
      title: "React Developer",
      company: "StartupXYZ",
      location: "Remote",
      fitScore: 82,
      logo: "https://via.placeholder.com/40x40",
    },
    {
      id: "3",
      title: "Full Stack Engineer",
      company: "DevCompany",
      location: "New York, NY",
      fitScore: 79,
      logo: "https://via.placeholder.com/40x40",
    },
  ];

  const mockInterviewQuestions = [
    "Explain the difference between controlled and uncontrolled components in React.",
    "How would you optimize a React application's performance?",
    "Describe your experience with state management libraries like Redux or Zustand.",
    "How do you handle error boundaries in React applications?",
    "Explain the concept of hooks and when you would create custom hooks.",
  ];

  const mockLearningRecommendations = [
    {
      title: "Docker Fundamentals",
      duration: "3 hours",
      impact: "+15% match score",
      provider: "Qelsa Academy",
    },
    {
      title: "AWS Cloud Practitioner",
      duration: "8 hours",
      impact: "+12% match score",
      provider: "AWS Training",
    },
    {
      title: "TypeScript Mastery",
      duration: "5 hours",
      impact: "+10% match score",
      provider: "TypeScript Hub",
    },
  ];

  const applied = job.applications?.some((application) => {
    return application.user_id === user?.id;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background">
      {/* Header */}
      <div className="glass-strong border-b border-glass-border sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/jobs/smart_matches")} className="hover:bg-neon-cyan/10 hover:text-neon-cyan">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Jobs
            </Button>

            <div className="flex items-center gap-2 ml-auto">
              <Button variant="ghost" size="sm" onClick={handleShareJob} className="hover:bg-neon-purple/10 hover:text-neon-purple">
                <Share2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => toggleSaveJob(job.id)} className="hover:bg-neon-cyan/10 hover:text-neon-cyan">
                {job?.is_bookmarked ? <BookmarkCheck className="w-4 h-4 text-neon-cyan" /> : <Bookmark className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Core Information Section */}
        <Card className="glass border-glass-border p-8">
          <div className="flex items-start gap-6 mb-6">
            {job.company_logo && (
              <div className="relative flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={job.company_logo} alt={job.page?.name || job.company_name} className="w-16 h-16 rounded-xl object-cover border border-glass-border" />
                {/* {job.source.verified && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-neon-green rounded-full flex items-center justify-center">
                    <Shield className="w-3 h-3 text-black" />
                  </div>
                )} */}
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">{job.job_title?.name ?? job.title}</h1>
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-xl text-muted-foreground hover:text-neon-cyan hover:underline transition-colors cursor-pointer" onClick={handleCompanyClick}>
                      {job.page?.name || job.company_name}
                    </h2>
                    {/* {job.companyRating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm">{job.companyRating}</span>
                        {job.companyReviews && <span className="text-sm text-muted-foreground">({job.companyReviews} reviews)</span>}
                      </div>
                    )} */}
                  </div>
                </div>

                {/* {job.isFraudulent && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Fraud Alert</span>
                    </div>
                  </div>
                )} */}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-neon-cyan" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {getWorkTypeIcon(job.other_info?.types.map((type) => type.name))}
                  <span>{job.other_info?.types.map((type) => type.name)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-neon-purple" />
                  <span>{job.experience}</span>
                </div>
                {/* {job.salary && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-neon-green" />
                    <span>{job.salary}</span>
                  </div>
                )} */}
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getSourceIcon(job.resource)}
                  <span>{job.resource}</span>
                </div>
              </div>

              {/* Apply Button Section - Moved to Top */}
              <div className="mt-6 pt-6 border-t border-glass-border">
                {/* {job.isFeaturedEmployer && (
                  <Badge className="mb-3 bg-neon-purple/10 text-neon-purple border-neon-purple/30">
                    <Star className="w-3 h-3 mr-1" />
                    Featured Employer
                  </Badge>
                )} */}

                {/* {isApplied && (
                  <Badge className="mb-3 bg-neon-green/10 text-neon-green border-neon-green/30">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Applied {job.appliedDate && `on ${new Date(job.appliedDate).toLocaleDateString()}`}
                  </Badge>
                )} */}

                <div className="space-y-4">
                  {!isApplied ? (
                    <div>
                      {job.resource == "qelsa" ? (
                        <Button onClick={() => setShowQuickApplyModal(true)} className="w-full bg-neon-green hover:bg-neon-green/90 text-black font-medium">
                          <Zap className="w-4 h-4 mr-2" />
                          Quick Apply
                        </Button>
                      ) : (
                        <Button onClick={handleApplyJob} className="w-full bg-neon-cyan hover:bg-neon-cyan/90 text-black font-medium">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Apply
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center p-4 rounded-lg bg-neon-green/5 border border-neon-green/20">
                      <CheckCircle className="w-6 h-6 text-neon-green mx-auto mb-2" />
                      <p className="text-sm text-neon-green font-medium">Application submitted successfully!</p>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground text-center">By applying, you agree to share your profile with {job.page?.name || job.company_name}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Job Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-glass-border">
            {/* <div className="text-center">
              <div className="text-2xl font-bold text-neon-cyan">{job.views}</div>
              <div className="text-sm text-muted-foreground">Views</div>
            </div> */}
            {job.applications && (
              <div className="text-center">
                <div className="text-2xl font-bold text-neon-purple">{job.applications.length}</div>
                <div className="text-sm text-muted-foreground">Applicants</div>
              </div>
            )}
            {/* {job.fitScore && (
              <div className="text-center">
                <div className="text-2xl font-bold text-neon-green">{job.fitScore}%</div>
                <div className="text-sm text-muted-foreground">Match Score</div>
              </div>
            )} */}
            <div className="text-center">
              <div className="text-2xl font-bold text-neon-yellow">{job.resource === "Qelsa" ? "High" : "Medium"}</div>
              <div className="text-sm text-muted-foreground">Priority</div>
            </div>
          </div>
        </Card>

        {/* Job Summary Section */}
        {/* {job.fitScore && (
          <Card className="glass border-glass-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-5 h-5 text-neon-cyan" />
              <h3 className="text-lg font-semibold">Job Summary</h3>
            </div>

            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{job.aiSummary}</p>

            <div className="p-4 rounded-lg bg-neon-cyan/5 border border-neon-cyan/20">
              <p className="text-sm text-neon-cyan font-medium">💡 This role is best suited for candidates with strong React skills, 2+ years experience, and passion for user experience.</p>
            </div>
          </Card>
        )} */}

        {/* Resume Analysis */}
        {!resumeAnalysis && (
          <Card className="glass border-glass-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-neon-purple" />
                <h3 className="text-lg font-semibold">AI Resume Fit Analysis</h3>
              </div>

              <div className="flex gap-2">
                {/* Use Saved Resume Button */}
                {/* <Dialog open={showSavedResumesDialog} onOpenChange={setShowSavedResumesDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10">
                      <FileText className="w-4 h-4 mr-2" />
                      Use Saved Resume
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass border-glass-border">
                    <DialogHeader>
                      <DialogTitle>Choose Resume</DialogTitle>
                      <DialogDescription>Select a resume from your saved documents to analyze your match with this job.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                      {savedResumes.map((resume) => (
                        <div
                          key={resume.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-glass-border hover:border-neon-cyan/50 cursor-pointer transition-all"
                          onClick={() => {
                            handleUploadResume();
                            setShowSavedResumesDialog(false);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-neon-purple" />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{resume.name}</p>
                                {resume.isPrimary && (
                                  <Badge variant="outline" className="text-xs border-neon-green/30 text-neon-green">
                                    Primary
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">Uploaded {resume.uploadDate}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>

                    <Button variant="outline" className="w-full" onClick={() => setShowSavedResumesDialog(false)}>
                      Cancel
                    </Button>
                  </DialogContent>
                </Dialog> */}

                {/* Upload New Resume Button */}
                <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Resume
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass border-glass-border">
                    <DialogHeader>
                      <DialogTitle>Upload Your Resume</DialogTitle>
                      <DialogDescription>Upload your resume to get AI-powered insights on how well you match this job.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-glass-border rounded-lg p-8 text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">Drop your resume here or click to browse</p>
                        <Button variant="outline">Choose File</Button>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={handleUploadResume} className="flex-1">
                          Analyze Resume
                        </Button>
                        <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Get personalized insights on your resume match and receive recommendations to improve your application. Upload a new resume or use one previously saved in your profile.
            </p>
          </Card>
        )}

        {/* Resume Analysis Results */}
        {resumeAnalysis && (
          <Card className="glass border-glass-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-5 h-5 text-neon-purple" />
              <h3 className="text-lg font-semibold">Resume Analysis Results</h3>
              <Badge className="bg-neon-green/10 text-neon-green border-neon-green/30">{resumeAnalysis.overallMatch}% Match</Badge>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-neon-green mb-2">Strong Skills</h4>
                <div className="space-y-1">
                  {resumeAnalysis.strongSkills.map((skill: string) => (
                    <div key={skill} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-3 h-3 text-neon-green" />
                      <span>{skill}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-neon-yellow mb-2">Partial Skills</h4>
                <div className="space-y-1">
                  {resumeAnalysis.partialSkills.map((skill: string) => (
                    <div key={skill} className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="w-3 h-3 text-neon-yellow" />
                      <span>{skill}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-red-400 mb-2">Missing Skills</h4>
                <div className="space-y-1">
                  {resumeAnalysis.missingSkills.map((skill: string) => (
                    <div key={skill} className="flex items-center gap-2 text-sm">
                      <X className="w-3 h-3 text-red-400" />
                      <span>{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div>
              <h4 className="font-medium mb-3">Recommendations to Improve</h4>
              <div className="space-y-2">
                {resumeAnalysis.recommendations.map((rec: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <Zap className="w-4 h-4 text-neon-cyan mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Job Description */}
        <Card className="glass border-glass-border p-6">
          <h3 className="text-lg font-semibold mb-4">Job Description</h3>

          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-neon-cyan mb-3">About the Role</h4>
              <div className="text-sm text-muted-foreground leading-relaxed mb-4">
                <div dangerouslySetInnerHTML={{ __html: jobDescription }} />
              </div>

              {/* {job.responsibilities && job.responsibilities.length > 0 && (
                <ul className="space-y-2">
                  {job.responsibilities.map((responsibility, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <ChevronRight className="w-4 h-4 text-neon-cyan mt-0.5 flex-shrink-0" />
                      <span>{responsibility}</span>
                    </li>
                  ))}
                </ul>
              )} */}
            </div>

            <Separator />

            {job.job_skills && job.job_skills.length > 0 && (
              <>
                <div>
                  <h4 className="font-medium text-neon-purple mb-3">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {(job.job_skills || []).map((skill) => (
                      <Badge key={skill.id} variant="secondary" className="text-xs">
                        {skill.skill?.name ?? skill.title}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />
              </>
            )}

            <div>
              <h4 className="font-medium text-neon-pink mb-3">About {job.page?.name || job.company_name}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{job.page?.description || "Company description not available."}</p>
            </div>

            {/* {job.benefits && job.benefits.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-3">Benefits & Perks</h4>
                  <div className="grid md:grid-cols-2 gap-2">
                    {job.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-neon-green" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )} */}
          </div>
        </Card>

        {/* Ask Qelsa Chat Widget */}
        <Card className="glass border-glass-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageCircle className="w-5 h-5 text-neon-cyan" />
            <h3 className="text-lg font-semibold">Ask Qelsa</h3>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Get instant answers about this role, preparation tips, and more.</p>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setChatMessage("What are my chances for this role?")} className="text-xs">
                What are my chances?
              </Button>
              <Button variant="outline" size="sm" onClick={() => setChatMessage("How should I prepare for this role?")} className="text-xs">
                How should I prepare?
              </Button>
              <Button variant="outline" size="sm" onClick={() => setChatMessage("Suggest similar jobs for me")} className="text-xs">
                Similar jobs
              </Button>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Ask anything about this job..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleChatSubmit()}
                className="flex-1"
              />
              <Button onClick={handleChatSubmit} disabled={!chatMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* AI Interview Questions */}
        <Card className="glass border-glass-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BrainCircuit className="w-5 h-5 text-neon-purple" />
              <h3 className="text-lg font-semibold">AI-Generated Interview Questions</h3>
            </div>

            <Button variant="outline" size="sm" className="text-xs">
              <Play className="w-4 h-4 mr-2" />
              Practice with AI
            </Button>
          </div>

          <div className="space-y-3">
            {mockInterviewQuestions.slice(0, 3).map((question, index) => (
              <div key={index} className="p-3 rounded-lg bg-muted/50 border border-glass-border">
                <p className="text-sm">{question}</p>
              </div>
            ))}
          </div>

          <Button variant="ghost" className="w-full mt-4 text-neon-purple hover:bg-neon-purple/10">
            View All Questions ({mockInterviewQuestions.length})
          </Button>
        </Card>

        {/* Learning Recommendations */}
        <Card className="glass border-glass-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-5 h-5 text-neon-yellow" />
            <h3 className="text-lg font-semibold">Boost Your Match Score</h3>
          </div>

          <p className="text-sm text-muted-foreground mb-4">Complete these courses to improve your match score and application strength.</p>

          <div className="space-y-3">
            {mockLearningRecommendations.map((course, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-glass-border">
                <div>
                  <h4 className="font-medium text-sm">{course.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span>{course.duration}</span>
                    <span>•</span>
                    <span>{course.provider}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-neon-yellow">{course.impact}</div>
                  <Button variant="ghost" size="sm" className="text-xs mt-1">
                    Start Course
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Similar Jobs */}
        <Card className="glass border-glass-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-neon-cyan" />
            <h3 className="text-lg font-semibold">Similar Jobs You Might Like</h3>
          </div>

          <div className="space-y-3">
            {mockSimilarJobs.map((similarJob) => (
              <div key={similarJob.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border border-glass-border hover:border-neon-cyan/30 cursor-pointer transition-colors">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={similarJob.logo} alt={similarJob.company} className="w-10 h-10 rounded-lg object-cover" />
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{similarJob.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {similarJob.company} • {similarJob.location}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-neon-cyan">{similarJob.fitScore}% match</div>
                  <Button variant="ghost" size="sm" className="text-xs mt-1">
                    View Job
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button variant="ghost" className="w-full mt-4 text-neon-cyan hover:bg-neon-cyan/10">
            View All Similar Jobs
          </Button>
        </Card>
      </div>

      {/* Quick Apply Modal */}
      <QuickApplyModal
        isOpen={showQuickApplyModal}
        onClose={() => setShowQuickApplyModal(false)}
        job={job}
        companyName={job.page?.name || job.company_name}
        screeningQuestions={job.questionSets ? job.questionSets?.[0]?.questions : []}
        onSubmit={() => {
          setShowQuickApplyModal(false);
          handleApplyJob();
        }}
        resumes={my_resumes}
      />
    </div>
  );
}
