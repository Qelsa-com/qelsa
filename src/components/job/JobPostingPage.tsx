import { MultiSearchSelect } from "@/components/ui/multi-search-select";
import { SearchSelect } from "@/components/ui/search-select";
import { useLazySearchCompaniesQuery } from "@/features/api/companiesApi";
import { useCreateJobMutation } from "@/features/api/jobsApi";
import { useLazySearchJobTitlesQuery } from "@/features/api/jobTitlesApi";
import { useLazyGetSkillsQuery } from "@/features/api/seedApi";
import { useGetMyPagesQuery } from "@/features/api/pagesApi";
import { Job } from "@/types/job";
import { ScreeningQuestion } from "@/types/question";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit2,
  Eye,
  FileText,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  Plus,
  Save,
  Send,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ScreeningQuestionsBuilder } from "../ScreeningQuestionsBuilder";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Progress } from "../ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Separator } from "../ui/separator";
import { Textarea } from "../ui/textarea";

type PostingMode = "select" | "ai-copilot" | "manual";
type PostingStep = "input" | "review" | "questions" | "final-review" | "published";

export function JobPostingPage() {
  const [createJob, { isLoading, isSuccess, error }] = useCreateJobMutation();
  const { data: my_pages } = useGetMyPagesQuery();
  const router = useRouter();
  const [mode, setMode] = useState<PostingMode>("manual");
  const [step, setStep] = useState<PostingStep>("input");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPremium] = useState(false); // Set to true for premium users
  const [showScreeningQuestions, setShowScreeningQuestions] = useState(false);
  const [jobData, setJobData] = useState<{
    job_title: { id: number; name: string } | null;
    location: string;
    work_type: string;
    workplace_type: string;
    experience: number;
    salary: string | null;
    description: string;
    skills: { id: number; name: string }[];
    screening_questions: any[];
    page_id: number | null;
  }>({
    job_title: null,
    // company: "",
    location: "",
    work_type: "full-time",
    workplace_type: "on-site",
    experience: 0,
    salary: null,
    description: "",
    skills: [],
    screening_questions: [],
    page_id: null,
  });

  const [searchJobTitles, { data: jobTitleResults = [] }] = useLazySearchJobTitlesQuery();
  const [searchCompanies, { data: companyResults = [] }] = useLazySearchCompaniesQuery();
  const [searchSkills, { data: skillResults = [] }] = useLazyGetSkillsQuery();

  // AI Insights (mock data)
  const [aiInsights, setAiInsights] = useState({
    talentPoolSize: 2840,
    salaryBenchmark: "$120k - $160k",
    competitionLevel: "Medium",
    diversityScore: 85,
    clarityScore: 92,
    suggestions: ["Add remote work flexibility to attract 40% more candidates", "Mention learning opportunities to improve appeal", "Consider adding benefits section for better conversion"],
  });

  const [postMetrics, setPostMetrics] = useState({
    views: 0,
    applications: 0,
    avgTimeToApply: "0 days",
    conversionRate: 0,
  });

  const handleAIGenerate = () => { };

  const handleManualUpdate = (field: keyof Job, value: any) => {
    setJobData((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayAdd = (field: keyof Job, value: string) => {
    // if (!value.trim()) return;
    // setJobData((prev) => ({
    //   ...prev,
    //   [field]: [...((prev[field] as string[]) || []), value],
    // }));
  };

  const handleArrayRemove = (field: keyof Job, index: number) => {
    // setJobData((prev) => ({
    //   ...prev,
    //   [field]: (prev[field] as string[])?.filter((_, i) => i !== index) || [],
    // }));
  };

  const handleOptimize = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setAiInsights((prev) => ({
        ...prev,
        clarityScore: Math.min(100, prev.clarityScore + 5),
        suggestions: prev.suggestions.slice(0, -1),
      }));
      setIsGenerating(false);
    }, 1500);
  };

  const handleScreeningQuestionsChange = (questions: ScreeningQuestion[]) => {
    setJobData((prev) => ({
      ...prev,
      screening_questions: questions,
    }));
  };

  function transformJobPayload(formData: any) {
    const questions = formData.screening_questions.map((q: any) => {
      const base = { title: q.title, type: q.type, is_knockout: q.is_knockout, weight: q.weight ?? 0 };

      if (q.type === "multiple_choice") {
        return { ...base, options: q.options.map((opt: string) => ({ title: opt })) };
      }

      if (q.type === "scale") {
        return { ...base, min_value: q.min_value ?? 1, max_value: q.max_value ?? 5 };
      }

      return base;
    });

    return {
      job: {
        job_title: formData.job_title,
        company: formData.company,
        description: formData.description,
        location: formData.location,
        work_type: formData.work_type,
        salary: formData.salary,
        experience: formData.experience,
        resource: "qelsa",
        page_id: formData.page_id,
      },
      questionSet: {
        title: `Screening - ${new Date().toISOString()}`, // auto generate
      },
      questions,
      skills: formData.skills || [],
    };
  }

  const handlePublish = async () => {
    console.log("🚀 ~ handlePublish ~ jobData:", jobData);
    const newData = transformJobPayload(jobData);
    console.log("🚀 ~ handlePublish ~ newData:", newData);

    try {
      const result = await createJob(newData).unwrap();
      console.log("Created job:", result);

      setStep("published");
    } catch (err) {
      console.error("Job creation failed:", err);
    }
  };

  const handleSaveDraft = () => {
    console.log("Saving draft:", jobData);
  };


  // Published State
  if (step === "published") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background">
        <div className="glass-strong border-b border-glass-border">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Jobs
            </Button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-12">
          {/* Success Message */}
          <Card className="p-8 glass border-glass-border text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-neon-green/20 border-2 border-neon-green flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-neon-green" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Job Posted Successfully! 🎉</h2>
            <p className="text-muted-foreground mb-6">Your job posting is now live and visible to {aiInsights.talentPoolSize.toLocaleString()} potential candidates</p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button className="gradient-animated">
                <Eye className="w-4 h-4 mr-2" />
                View Live Post
              </Button>
              <Button variant="outline" className="border-neon-cyan/30 text-neon-cyan">
                Share on Social
              </Button>
            </div>
          </Card>

          {/* Real-time Metrics */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Real-time Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 glass border-glass-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-neon-cyan/20 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-neon-cyan" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{postMetrics.views}</p>
                    <p className="text-xs text-muted-foreground">Views</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 glass border-glass-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-neon-purple/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-neon-purple" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{postMetrics.applications}</p>
                    <p className="text-xs text-muted-foreground">Applications</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 glass border-glass-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-neon-pink/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-neon-pink" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{postMetrics.avgTimeToApply}</p>
                    <p className="text-xs text-muted-foreground">Avg. Time</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 glass border-glass-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-neon-green/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-neon-green" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{postMetrics.conversionRate}%</p>
                    <p className="text-xs text-muted-foreground">Conversion</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* AI Optimization Suggestions */}
          <Card className="p-6 glass border-glass-border">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-neon-yellow" />
              <h3 className="font-semibold">AI Recommendations to Boost Performance</h3>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-white/5 border border-glass-border">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Add Benefits Section</h4>
                    <p className="text-sm text-muted-foreground">Job posts with benefits listed get 35% more applications</p>
                  </div>
                  <Button size="sm" className="gradient-animated">
                    Add Now
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-glass-border">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Specify Salary Range</h4>
                    <p className="text-sm text-muted-foreground">Posts with transparent salary get 2.3x more quality applicants</p>
                  </div>
                  <Button size="sm" variant="outline" className="border-neon-cyan/30 text-neon-cyan">
                    Update
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-glass-border">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Make Title More Specific</h4>
                    <p className="text-sm text-muted-foreground">Try Senior Backend Engineer (Node.js) instead of generic title</p>
                  </div>
                  <Button size="sm" variant="outline" className="border-neon-cyan/30 text-neon-cyan">
                    Refine
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Questions Step
  if (step === "questions") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background">
        <div className="glass-strong border-b border-glass-border">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <Button variant="ghost" onClick={() => setStep("review")} className="mb-4 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Job Details
            </Button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">Screening Questions</h1>
                <p className="text-muted-foreground mt-2">Pre-screen candidates with smart questions and AI-powered evaluation</p>
              </div>

              <Badge className="bg-neon-cyan/20 text-neon-cyan border-0">{jobData.screening_questions?.length || 0} Questions</Badge>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8">
          <Card className="p-6 glass border-glass-border">
            <ScreeningQuestionsBuilder
              questions={jobData.screening_questions || []}
              onChange={handleScreeningQuestionsChange}
              jobTitle={jobData.job_title?.name ?? ""}
              jobDescription={jobData.description}
              isPremium={isPremium}
            />

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-glass-border">
              <Button variant="outline" onClick={handleSaveDraft} className="flex-1 border-neon-cyan/30 text-neon-cyan">
                <Save className="w-4 h-4 mr-2" />
                Save as Draft
              </Button>
              <Button onClick={() => setStep("final-review")} className="flex-1 gradient-animated">
                Continue to Final Review
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Final Review Step (before publishing)
  if (step === "final-review") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background">
        <div className="glass-strong border-b border-glass-border">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <Button variant="ghost" onClick={() => setStep("questions")} className="mb-4 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Questions
            </Button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">Final Review</h1>
                <p className="text-muted-foreground mt-2">Review everything before publishing your job</p>
              </div>

              <Badge className="bg-neon-green/20 text-neon-green border-0">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Ready to Publish
              </Badge>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="space-y-6">
            {/* Job Details Summary */}
            <Card className="p-6 glass border-glass-border">
              <h3 className="font-semibold mb-4">Job Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Position</p>
                  <p className="font-medium">{jobData.job_title?.name}</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Location</p>
                    <p className="font-medium text-sm">{jobData.location}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Type</p>
                    <p className="font-medium text-sm">{jobData.work_type}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Salary</p>
                    <p className="font-medium text-sm">{jobData.salary}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Questions Summary */}
            <Card className="p-6 glass border-glass-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Screening Questions</h3>
                <Badge className="bg-neon-cyan/20 text-neon-cyan border-0">{jobData.screening_questions?.length || 0} Questions</Badge>
              </div>
              {jobData.screening_questions && jobData.screening_questions.length > 0 ? (
                <div className="space-y-2">
                  {jobData.screening_questions?.slice(0, 3).map((q, idx) => (
                    <div key={q.id} className="p-3 rounded-lg bg-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-muted-foreground">{idx + 1}.</span>
                        {q.is_knockout && (
                          <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">
                            Knockout
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{q.title}</p>
                    </div>
                  ))}
                  {jobData.screening_questions.length > 3 && <p className="text-xs text-muted-foreground text-center py-2">+{jobData.screening_questions.length - 3} more questions</p>}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No screening questions added</p>
              )}
            </Card>

            {/* AI Insights */}
            <Card className="p-6 glass border-glass-border">
              <h3 className="font-semibold mb-4">AI Performance Insights</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-neon-cyan">{aiInsights.talentPoolSize.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Potential Candidates</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-neon-purple">{aiInsights.clarityScore}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Clarity Score</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-neon-green">{aiInsights.diversityScore}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Diversity Score</p>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSaveDraft} className="flex-1 border-neon-cyan/30 text-neon-cyan">
                <Save className="w-4 h-4 mr-2" />
                Save as Draft
              </Button>
              <Button onClick={handlePublish} className="flex-1 gradient-animated">
                <Send className="w-4 h-4 mr-2" />
                Publish Job Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mode Selection Screen
  if (mode === "select") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background">
        <div className="glass-strong border-b border-glass-border">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <Button variant="ghost" onClick={() => router.push("/jobs/smart_matches")} className="mb-4 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Jobs
            </Button>

            <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">Post A Job</h1>
            <p className="text-muted-foreground mt-2">Choose how youd like to create your job posting</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Co-Pilot Option */}
            <Card
              className="p-8 glass border-glass-border cursor-pointer hover:border-neon-purple/50 transition-all duration-300 hover:shadow-lg hover:shadow-neon-purple/10 hover:-translate-y-1"
              onClick={() => setMode("ai-copilot")}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl gradient-animated flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-black" />
                </div>

                <h3 className="text-xl font-semibold mb-2">AI Co-Pilot</h3>
                <Badge className="mb-4 bg-neon-purple/20 text-neon-purple border-0">Recommended • 2-3 min</Badge>

                <p className="text-muted-foreground text-sm mb-6">Describe your role in 1-2 sentences and let AI generate a complete job description with all the details.</p>

                <div className="space-y-2 text-sm text-left w-full">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-neon-green mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Smart salary suggestions</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-neon-green mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Talent pool insights</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-neon-green mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Bias & diversity check</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-neon-green mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Real-time optimization</span>
                  </div>
                </div>

                <Button className="w-full mt-6 gradient-animated">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start with AI
                </Button>
              </div>
            </Card>

            {/* Manual Entry Option */}
            <Card
              className="p-8 glass border-glass-border cursor-pointer hover:border-neon-cyan/50 transition-all duration-300 hover:shadow-lg hover:shadow-neon-cyan/10 hover:-translate-y-1"
              onClick={() => setMode("manual")}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-neon-cyan/20 border-2 border-neon-cyan/30 flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-neon-cyan" />
                </div>

                <h3 className="text-xl font-semibold mb-2">Manual Entry</h3>
                <Badge className="mb-4 bg-white/5 text-muted-foreground border-0">Classic • 5-10 min</Badge>

                <p className="text-muted-foreground text-sm mb-6">Fill out standard fields with full control over every detail. AI will assist you along the way.</p>

                <div className="space-y-2 text-sm text-left w-full">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-neon-cyan mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Complete customization</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-neon-cyan mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">AI suggestions as you type</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-neon-cyan mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Inline improvements</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-neon-cyan mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Template library</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-6 border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10">
                  <FileText className="w-4 h-4 mr-2" />
                  Manual Entry
                </Button>
              </div>
            </Card>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">Trusted by 10,000+ companies worldwide</p>
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-neon-green" />
                <span className="text-xs text-muted-foreground">GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-neon-yellow" />
                <span className="text-xs text-muted-foreground">90% Faster Posting</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-neon-cyan" />
                <span className="text-xs text-muted-foreground">3x More Applicants</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // AI Co-Pilot Mode
  if (mode === "ai-copilot") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background">
        <div className="glass-strong border-b border-glass-border">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <Button variant="ghost" onClick={() => (step === "input" ? setMode("select") : setStep("input"))} className="mb-4 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">AI Co-Pilot</h1>
                <p className="text-muted-foreground mt-2">{step === "input" ? "Describe your role and let AI do the rest" : "Review and refine your job posting"}</p>
              </div>

              {step === "review" && (
                <Badge className="bg-neon-green/20 text-neon-green border-0">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Ready to Publish
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8">
          {step === "input" ? (
            <>
              {/* AI Prompt Input */}
              <Card className="p-6 glass border-glass-border mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-neon-purple" />
                  <h3 className="font-semibold">Describe the Role</h3>
                </div>

                <Textarea
                  placeholder="Example: I need a backend engineer with 3+ years in Node.js & AWS to build scalable microservices for our career platform..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="glass border-glass-border min-h-32 mb-4"
                />

                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">💡 Tip: Include experience level, key skills, and main responsibilities</p>

                  <Button onClick={handleAIGenerate} disabled={!aiPrompt.trim() || isGenerating} className="gradient-animated">
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Job Description
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              {/* Preview Generated Content */}
              {jobData.job_title && (
                <Card className="p-6 glass border-glass-border">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold">Generated Job Description</h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handleAIGenerate} className="border-neon-purple/30 text-neon-purple">
                        <Wand2 className="w-3 h-3 mr-2" />
                        Regenerate
                      </Button>
                      <Button size="sm" onClick={() => setStep("review")} className="gradient-animated">
                        Continue to Review
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xl font-bold">{jobData.job_title?.name}</h4>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{jobData.location}</Badge>
                      <Badge variant="secondary">{jobData.work_type}</Badge>
                      <Badge variant="secondary">{jobData.experience}</Badge>
                      <Badge className="bg-neon-green/20 text-neon-green border-0">{jobData.salary}</Badge>
                    </div>

                    <Separator />

                    <div>
                      <h5 className="font-semibold mb-2">Description</h5>
                      <p className="text-muted-foreground text-sm">{jobData.description}</p>
                    </div>

                    <div>
                      <h5 className="font-semibold mb-2">Key Responsibilities</h5>
                      <ul className="space-y-1">
                        {/* {jobData.responsibilities?.map((item, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-neon-cyan mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))} */}
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-semibold mb-2">Requirements</h5>
                      <ul className="space-y-1">
                        {/* {jobData.requirements?.map((item, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-neon-purple mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))} */}
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-semibold mb-2">Required Skills</h5>
                      <div className="flex flex-wrap gap-2">
                        {jobData.skills?.map((skill) => (
                          <Badge key={skill.id} variant="secondary" className="text-xs">
                            {skill.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Job Preview */}
                <Card className="p-6 glass border-glass-border">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold">Final Review</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></div>
                        <span className="text-xs text-muted-foreground">AI Optimized</span>
                      </div>
                    </div>
                  </div>

                  {/* Editable Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Job Title</label>
                      <Input value={jobData.job_title?.name ?? ""} readOnly className="glass border-glass-border" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Location</label>
                        <Input value={jobData.location} onChange={(e) => handleManualUpdate("location", e.target.value)} className="glass border-glass-border" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Work Type</label>
                        <Select value={jobData.work_type} onValueChange={(value) => handleManualUpdate("work_type", value)}>
                          <SelectTrigger className="glass border-glass-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full-time">Full-time</SelectItem>
                            <SelectItem value="part-time">Part-time</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="internship">Internship</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Workplace Type</label>
                        <Select value={jobData.workplace_type} onValueChange={(value) => handleManualUpdate("workplace_type", value)}>
                          <SelectTrigger className="glass border-glass-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="on-site">On-site</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                            <SelectItem value="remote">Remote</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Description</label>
                      <Textarea value={jobData.description} onChange={(e) => handleManualUpdate("description", e.target.value)} className="glass border-glass-border min-h-24" />
                    </div>

                    <Separator />

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleSaveDraft} className="flex-1 border-neon-cyan/30 text-neon-cyan">
                        <Save className="w-4 h-4 mr-2" />
                        Save as Draft
                      </Button>
                      <Button onClick={() => setStep("questions")} className="flex-1 gradient-animated">
                        <HelpCircle className="w-4 h-4 mr-2" />
                        Add Screening Questions
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              {/* AI Insights Sidebar */}
              <div className="space-y-6">
                {/* Optimization Score */}
                <Card className="p-4 glass border-glass-border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm">Optimization Score</h4>
                    <span className="text-xl font-bold text-neon-purple">{aiInsights.clarityScore}%</span>
                  </div>
                  <Progress value={aiInsights.clarityScore} className="h-2 mb-4" />

                  <Button size="sm" onClick={handleOptimize} disabled={isGenerating} className="w-full gradient-animated">
                    {isGenerating ? "Optimizing..." : "Run AI Optimization"}
                  </Button>
                </Card>

                {/* Talent Pool */}
                <Card className="p-4 glass border-glass-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-neon-cyan" />
                    <h4 className="font-medium text-sm">Talent Pool</h4>
                  </div>
                  <p className="text-2xl font-bold mb-1">{aiInsights.talentPoolSize.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Available candidates</p>
                </Card>

                {/* Salary Benchmark */}
                <Card className="p-4 glass border-glass-border">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4 text-neon-green" />
                    <h4 className="font-medium text-sm">Salary Benchmark</h4>
                  </div>
                  <p className="text-xl font-bold mb-1">{aiInsights.salaryBenchmark}</p>
                  <p className="text-xs text-muted-foreground">Market average</p>
                </Card>

                {/* Diversity Score */}
                <Card className="p-4 glass border-glass-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-neon-purple" />
                    <h4 className="font-medium text-sm">Diversity Score</h4>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl font-bold">{aiInsights.diversityScore}%</span>
                    <Badge className="bg-neon-green/20 text-neon-green border-0 text-xs">Excellent</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">No bias detected</p>
                </Card>

                {/* AI Suggestions */}
                {aiInsights.suggestions.length > 0 && (
                  <Card className="p-4 glass border-glass-border">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="w-4 h-4 text-neon-yellow" />
                      <h4 className="font-medium text-sm">Suggestions</h4>
                    </div>
                    <div className="space-y-2">
                      {aiInsights.suggestions.map((suggestion, idx) => (
                        <div key={idx} className="p-2 rounded bg-white/5 border border-glass-border">
                          <p className="text-xs text-muted-foreground">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Manual Entry Mode
  if (mode === "manual") {
    // If in review step, show review interface
    if (step === "review") {
      return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-background">
          <div className="glass-strong border-b border-glass-border">
            <div className="max-w-5xl mx-auto px-6 py-6">
              <Button variant="ghost" onClick={() => setStep("input")} className="mb-4 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Edit
              </Button>

              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">Review & Publish</h1>
                  <p className="text-muted-foreground mt-2">Review your job posting and add screening questions</p>
                </div>

                <Badge className="bg-neon-green/20 text-neon-green border-0">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Ready
                </Badge>
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-6 py-8">
            <Card className="p-6 glass border-glass-border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold">Job Preview</h3>
                <Button size="sm" variant="outline" onClick={() => setStep("input")} className="border-neon-cyan/30 text-neon-cyan">
                  <Edit2 className="w-3 h-3 mr-2" />
                  Edit
                </Button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <h4 className="text-xl font-bold">{jobData.job_title?.name}</h4>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{jobData.location}</Badge>
                  <Badge variant="secondary">{jobData.work_type}</Badge>
                </div>

                <Separator />

                <div>
                  <h5 className="font-semibold mb-2">Description</h5>
                  <p className="text-muted-foreground text-sm">{jobData.description}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSaveDraft} className="flex-1 border-neon-cyan/30 text-neon-cyan">
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
                <Button onClick={() => setStep("questions")} className="flex-1 gradient-animated">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Add Screening Questions
                </Button>
              </div>
            </Card>
          </div>
        </div>
      );
    }

    // Default input form
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background">
        <div className="glass-strong border-b border-glass-border">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <Button variant="ghost" onClick={() => setMode("select")} className="mb-4 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">Post a Job</h1>
            <p className="text-muted-foreground mt-2">Fill out the job details with AI assistance</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="space-y-6">
            {/* AI Quick Fill Section */}
            <Card className="p-6 glass border-glass-border">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-neon-purple" />
                <h3 className="font-semibold">Describe the Role</h3>
              </div>

              <Textarea
                placeholder="Example: I need a backend engineer with 3+ years in Node.js & AWS to build scalable microservices for our career platform..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="glass border-glass-border min-h-32 mb-4"
              />

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Tip: Include experience level, key skills, and main responsibilities
                </p>

                <Button onClick={handleAIGenerate} disabled={!aiPrompt.trim() || isGenerating} className="gradient-animated">
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Job Description
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Manual Form */}
            <Card className="p-6 glass border-glass-border">
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="font-semibold mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Job Title *</label>
                      <SearchSelect
                        value={jobData.job_title}
                        onChange={(val) => setJobData((prev) => ({ ...prev, job_title: val }))}
                        onSearch={(q) => searchJobTitles(q)}
                        options={jobTitleResults}
                        placeholder="Search job title..."
                        searchPlaceholder="Type to search..."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Company *</label>
                      {/* <Input placeholder="e.g., Qelsa Technologies" value={jobData.company} onChange={(e) => handleManualUpdate("company", e.target.value)} className="glass border-glass-border" /> */}
                      <Select value={jobData.page_id?.toString()} onValueChange={(value) => handleManualUpdate("page_id", Number(value))}>
                        <SelectTrigger className="glass border-glass-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {my_pages?.map((page) => (
                            <SelectItem key={page.id} value={page.id.toString()}>
                              {page.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Location *</label>
                      <Input placeholder="e.g., San Francisco, CA" value={jobData.location} onChange={(e) => handleManualUpdate("location", e.target.value)} className="glass border-glass-border" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Work Type *</label>
                      <Select value={jobData.work_type} onValueChange={(value) => handleManualUpdate("work_type", value)}>
                        <SelectTrigger className="glass border-glass-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Workplace Type *</label>
                      <Select value={jobData.workplace_type} onValueChange={(value) => handleManualUpdate("workplace_type", value)}>
                        <SelectTrigger className="glass border-glass-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="on-site">On-site</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                          <SelectItem value="remote">Remote</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Experience *</label>
                      <Select value={String(jobData.experience)} onValueChange={(value) => handleManualUpdate("experience", Number(value))}>
                        <SelectTrigger className="glass border-glass-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0 years</SelectItem>
                          <SelectItem value="1">1 years</SelectItem>
                          <SelectItem value="2">2 years</SelectItem>
                          <SelectItem value="3">3 years</SelectItem>
                          <SelectItem value="5">5 years</SelectItem>
                          <SelectItem value="7">7 years</SelectItem>
                          <SelectItem value="10">10 years</SelectItem>
                          <SelectItem value="12">12 years</SelectItem>
                          <SelectItem value="15">15 years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Salary Range</label>
                      <Input placeholder="e.g., $80k - $120k" value={jobData.salary} onChange={(e) => handleManualUpdate("salary", e.target.value)} className="glass border-glass-border" />
                    </div>
                  </div>

                  {/* Skills Section */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Required Skills</label>
                    <MultiSearchSelect
                      value={jobData.skills}
                      onChange={(skills) => setJobData((prev) => ({ ...prev, skills }))}
                      onSearch={(q) => searchSkills(q || undefined)}
                      options={skillResults}
                      placeholder="Search and select skills..."
                      searchPlaceholder="Type to search skills..."
                    />
                  </div>
                </div>

                <Separator />

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Job Description *</label>
                    <Button size="sm" variant="ghost" className="text-neon-purple text-xs">
                      <Wand2 className="w-3 h-3 mr-1" />
                      AI Improve
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Describe the role, responsibilities, and what makes this position unique..."
                    value={jobData.description}
                    onChange={(e) => handleManualUpdate("description", e.target.value)}
                    className="glass border-glass-border min-h-32"
                  />
                  {jobData.description && jobData.description.length < 100 && (
                    <p className="text-xs text-neon-yellow mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      AI suggests adding more details (min 100 characters for better reach)
                    </p>
                  )}
                </div>

                <Separator />

                {/* Screening Questions Section */}
                <div>
                  <div className="flex items-center justify-between cursor-pointer p-4 rounded-lg hover:bg-white/5 transition-all" onClick={() => setShowScreeningQuestions(!showScreeningQuestions)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-neon-purple/20 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-neon-purple" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Add Screening Questions</h3>
                        <p className="text-sm text-muted-foreground">
                          {jobData.screening_questions && jobData.screening_questions.length > 0
                            ? `${jobData.screening_questions.length} question${jobData.screening_questions.length !== 1 ? "s" : ""} added`
                            : "Pre-screen candidates with smart questions"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {jobData.screening_questions && jobData.screening_questions.length > 0 && (
                        <Badge className="bg-neon-purple/20 text-neon-purple border-0">{jobData.screening_questions.length}</Badge>
                      )}
                      <Button variant="ghost" size="sm" className="text-neon-cyan">
                        {showScreeningQuestions ? (
                          <>
                            <X className="w-4 h-4 mr-1" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {showScreeningQuestions && (
                    <div className="mt-4 p-4 rounded-lg border border-glass-border bg-white/5">
                      <ScreeningQuestionsBuilder
                        questions={jobData.screening_questions || []}
                        onChange={handleScreeningQuestionsChange}
                        jobTitle={jobData.job_title?.name ?? ""}
                        jobDescription={jobData.description}
                        isPremium={isPremium}
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={handleSaveDraft} className="flex-1 border-neon-cyan/30 text-neon-cyan">
                    <Save className="w-4 h-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button onClick={handlePublish} disabled={!jobData.job_title || !jobData.description} className="flex-1 gradient-animated">
                    <Send className="w-4 h-4 mr-2" />
                    Post
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
