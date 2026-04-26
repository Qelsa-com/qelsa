import { Award, Bookmark, BookOpen, BrainCircuit, CheckCircle2, ExternalLink, FileText, MessageCircle, Search, Send, Sparkles, Target, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Job } from "@/types/job";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Progress } from "../ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface JobAIAssistantProps {
  filteredJobs: Job[];
  onJobClick?: (job: Job) => void;
  onSaveJob?: (jobId: string) => void;
  onQuickApply?: (jobId: string) => void;
}

type AIMode = "compare" | "skills" | "interview" | "similar";

interface ComparisonResult {
  job: Job;
  pros: string[];
  cons: string[];
  overallScore: number;
}

interface SkillGapResult {
  skill: string;
  currentLevel: number;
  requiredLevel: number;
  priority: "high" | "medium" | "low";
  learningResources: string[];
}

interface InterviewPrepResult {
  category: string;
  questions: string[];
}

export function JobAIAssistant({ filteredJobs, onJobClick, onSaveJob, onQuickApply }: JobAIAssistantProps) {
  const [aiMode, setAIMode] = useState<AIMode>("compare");
  const [inputValue, setInputValue] = useState("");
  const [currentPlaceholder, setCurrentPlaceholder] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Rotating placeholders based on filtered jobs and mode
  const placeholders = {
    compare: [
      `Compare ${filteredJobs
        .slice(0, 3)
        .map((j) => j.company_name)
        .join(", ")}...`,
      "Which of these jobs offers the best growth potential?",
      "Compare salary and benefits across these roles...",
      "Which role has the best work-life balance?",
    ],
    skills: ["What skills am I missing for these roles?", "Show me the skill gaps for the UI/UX position...", "Which skills should I prioritize learning?", "Am I qualified for these positions?"],
    interview: [
      "Prepare me for the Frontend interview...",
      "What questions should I expect for this role?",
      "Give me interview tips for these companies...",
      "How should I answer behavioral questions?",
    ],
    similar: ["Find similar roles with better pay...", "Show me related positions at top companies...", "Recommend jobs based on my skills...", "What other roles match my profile?"],
  };

  // Rotate placeholders
  useEffect(() => {
    const modePlaceholders = placeholders[aiMode];
    let index = 0;

    const interval = setInterval(() => {
      setCurrentPlaceholder(modePlaceholders[index]);
      index = (index + 1) % modePlaceholders.length;
    }, 3000);

    setCurrentPlaceholder(modePlaceholders[0]);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiMode, filteredJobs]);

  const handleSubmit = () => {
    if (!inputValue.trim()) return;

    setIsAnalyzing(true);
    // Simulate AI processing
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResults(true);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  // Mock data generators for different modes
  const generateComparisonResults = (): ComparisonResult[] => {
    return filteredJobs.slice(0, 3).map((job) => ({
      job,
      pros: ["Strong tech stack alignment", "Excellent company culture", "Good career growth opportunities"],
      cons: ["Slightly lower salary range", "Longer commute time"],
      overallScore: job.fitScore || 75,
    }));
  };

  const generateSkillGapResults = (): SkillGapResult[] => {
    return [
      {
        skill: "GraphQL",
        currentLevel: 40,
        requiredLevel: 80,
        priority: "high",
        learningResources: ["GraphQL Fundamentals Course", "Apollo Client Tutorial"],
      },
      {
        skill: "TypeScript",
        currentLevel: 70,
        requiredLevel: 85,
        priority: "medium",
        learningResources: ["TypeScript Advanced Patterns", "Type System Deep Dive"],
      },
      {
        skill: "System Design",
        currentLevel: 50,
        requiredLevel: 75,
        priority: "high",
        learningResources: ["System Design Interview Prep", "Scalability Patterns"],
      },
      {
        skill: "Docker",
        currentLevel: 85,
        requiredLevel: 70,
        priority: "low",
        learningResources: [],
      },
    ];
  };

  const generateInterviewPrepResults = (): InterviewPrepResult[] => {
    return [
      {
        category: "Technical Questions",
        questions: [
          "Explain the virtual DOM and how React uses it",
          "What are React hooks and when would you use them?",
          "How do you optimize React application performance?",
          "Explain state management patterns in React",
        ],
      },
      {
        category: "Behavioral Questions",
        questions: ["Tell me about a challenging project you worked on", "How do you handle conflicting priorities?", "Describe a time you had to learn a new technology quickly"],
      },
      {
        category: "System Design",
        questions: ["Design a real-time chat application", "How would you scale a social media feed?", "Design a rate limiting system"],
      },
    ];
  };

  const renderResults = () => {
    if (!showResults) return null;

    switch (aiMode) {
      case "compare":
        return <ComparisonResults results={generateComparisonResults()} onJobClick={onJobClick} onSaveJob={onSaveJob} />;
      case "skills":
        return <SkillGapResults results={generateSkillGapResults()} />;
      case "interview":
        return <InterviewPrepResults results={generateInterviewPrepResults()} />;
      case "similar":
        return <SimilarJobsResults jobs={filteredJobs.slice(0, 4)} onJobClick={onJobClick} onSaveJob={onSaveJob} onQuickApply={onQuickApply} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Selector and Input */}
      <Card className="p-4 glass border-glass-border">
        <div className="flex flex-col gap-3">
          {/* Mode Selector */}
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-neon-cyan" />
            <Select value={aiMode} onValueChange={(value) => setAIMode(value as AIMode)}>
              <SelectTrigger className="w-48 glass border-glass-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compare">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Compare Jobs
                  </div>
                </SelectItem>
                <SelectItem value="skills">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Skill Gaps
                  </div>
                </SelectItem>
                <SelectItem value="interview">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Interview Prep
                  </div>
                </SelectItem>
                <SelectItem value="similar">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Similar Jobs
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {showResults && (
              <Button variant="ghost" size="sm" onClick={() => setShowResults(false)} className="ml-auto text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Input with rotating placeholder */}
          <div className="relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={currentPlaceholder}
              className="pr-12 glass border-glass-border"
              disabled={isAnalyzing}
            />
            <Button size="sm" onClick={handleSubmit} disabled={!inputValue.trim() || isAnalyzing} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 gradient-animated">
              {isAnalyzing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>

          {/* Context indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              Analyzing {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""} from your filters
            </span>
          </div>
        </div>
      </Card>

      {/* Results */}
      {renderResults()}
    </div>
  );
}

// Comparison Results Component
function ComparisonResults({ results, onJobClick, onSaveJob }: { results: ComparisonResult[]; onJobClick?: (job: Job) => void; onSaveJob?: (jobId: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-neon-purple" />
        <h3 className="font-semibold">Job Comparison Results</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((result) => (
          <Card key={result.job.id} className="p-5 glass border-glass-border hover:border-neon-purple/40 transition-all duration-300 cursor-pointer" onClick={() => onJobClick?.(result.job)}>
            {/* Job Header */}
            <div className="flex items-start gap-3 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {result.job.company_logo && <img src={result.job.company_logo} alt={result.job.company_name ?? ""} className="w-12 h-12 rounded-xl object-cover" />}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm line-clamp-2 mb-1">{result.job.title}</h4>
                <p className="text-xs text-muted-foreground">{result.job.company_name}</p>
              </div>
            </div>

            {/* Overall Score */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">AI Match Score</span>
                <span className="text-sm font-semibold text-neon-purple">{result.overallScore}%</span>
              </div>
              <Progress value={result.overallScore} className="h-2" />
            </div>

            {/* Pros */}
            <div className="mb-3">
              <div className="flex items-center gap-1 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-neon-green" />
                <span className="text-xs font-semibold text-neon-green">Pros</span>
              </div>
              <ul className="space-y-1">
                {result.pros.slice(0, 2).map((pro, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                    <span className="text-neon-green mt-0.5">•</span>
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cons */}
            <div className="mb-4">
              <div className="flex items-center gap-1 mb-2">
                <X className="w-3.5 h-3.5 text-neon-pink" />
                <span className="text-xs font-semibold text-neon-pink">Cons</span>
              </div>
              <ul className="space-y-1">
                {result.cons.slice(0, 2).map((con, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                    <span className="text-neon-pink mt-0.5">•</span>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t border-glass-border">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onSaveJob?.(String(result.job.id));
                }}
                className="flex-1 text-xs border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10"
              >
                <Bookmark className="w-3 h-3 mr-1" />
                Save
              </Button>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onJobClick?.(result.job);
                }}
                className="flex-1 text-xs gradient-animated"
              >
                View Details
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Skill Gap Results Component
function SkillGapResults({ results }: { results: SkillGapResult[] }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-neon-pink";
      case "medium":
        return "text-neon-yellow";
      case "low":
        return "text-neon-green";
      default:
        return "text-muted-foreground";
    }
  };

  const getPriorityBg = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-neon-pink/20 border-neon-pink/30";
      case "medium":
        return "bg-neon-yellow/20 border-neon-yellow/30";
      case "low":
        return "bg-neon-green/20 border-neon-green/30";
      default:
        return "bg-white/5";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Award className="w-5 h-5 text-neon-purple" />
        <h3 className="font-semibold">Your Skill Gaps Analysis</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {results.map((skill, idx) => (
          <Card key={idx} className="p-5 glass border-glass-border">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold mb-1">{skill.skill}</h4>
                <Badge className={`text-xs ${getPriorityBg(skill.priority)} border-0`}>
                  <span className={getPriorityColor(skill.priority)}>{skill.priority.charAt(0).toUpperCase() + skill.priority.slice(1)} Priority</span>
                </Badge>
              </div>
            </div>

            {/* Progress bars */}
            <div className="space-y-3 mb-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Your Level</span>
                  <span className="text-xs font-semibold">{skill.currentLevel}%</span>
                </div>
                <Progress value={skill.currentLevel} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Required Level</span>
                  <span className="text-xs font-semibold text-neon-purple">{skill.requiredLevel}%</span>
                </div>
                <Progress value={skill.requiredLevel} className="h-2 bg-neon-purple/20" />
              </div>
            </div>

            {/* Learning Resources */}
            {skill.learningResources.length > 0 && (
              <>
                <div className="flex items-center gap-1 mb-2">
                  <BookOpen className="w-3.5 h-3.5 text-neon-cyan" />
                  <span className="text-xs font-semibold">Recommended Resources</span>
                </div>
                <div className="space-y-2">
                  {skill.learningResources.map((resource, ridx) => (
                    <Button key={ridx} variant="outline" size="sm" className="w-full justify-start text-xs border-glass-border hover:border-neon-cyan/40 hover:bg-neon-cyan/10">
                      <ExternalLink className="w-3 h-3 mr-2" />
                      {resource}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// Interview Prep Results Component
function InterviewPrepResults({ results }: { results: InterviewPrepResult[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-neon-purple" />
        <h3 className="font-semibold">Interview Preparation Guide</h3>
      </div>

      <div className="space-y-4">
        {results.map((category, idx) => (
          <Card key={idx} className="p-5 glass border-glass-border">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-neon-cyan" />
              <h4 className="font-semibold">{category.category}</h4>
              <Badge className="ml-auto text-xs bg-neon-purple/20 text-neon-purple border-0">{category.questions.length} Questions</Badge>
            </div>

            <div className="space-y-3">
              {category.questions.map((question, qidx) => (
                <div key={qidx} className="p-3 rounded-lg bg-white/5 border border-glass-border hover:border-neon-cyan/30 transition-all duration-300">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neon-cyan/20 flex items-center justify-center">
                      <span className="text-xs font-semibold text-neon-cyan">{qidx + 1}</span>
                    </div>
                    <p className="text-sm flex-1">{question}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Practice CTA */}
            <div className="mt-4 pt-4 border-t border-glass-border">
              <Button size="sm" className="w-full gradient-animated">
                <Sparkles className="w-4 h-4 mr-2" />
                Start Mock Interview
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Similar Jobs Results Component
function SimilarJobsResults({
  jobs,
  onJobClick,
  onSaveJob,
  onQuickApply,
}: {
  jobs: Job[];
  onJobClick?: (job: Job) => void;
  onSaveJob?: (jobId: string) => void;
  onQuickApply?: (jobId: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="w-5 h-5 text-neon-purple" />
        <h3 className="font-semibold">Similar Job Recommendations</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.map((job) => (
          <Card key={job.id} className="p-5 glass border-glass-border hover:border-neon-purple/40 transition-all duration-300 cursor-pointer" onClick={() => onJobClick?.(job)}>
            {/* Job Header */}
            <div className="flex items-start gap-3 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {job.company_logo && <img src={job.company_logo} alt={job.company_name ?? ""} className="w-12 h-12 rounded-xl object-cover" />}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm line-clamp-2 mb-1">{job.title}</h4>
                <p className="text-xs text-muted-foreground">{job.company_name}</p>
                <p className="text-xs text-muted-foreground mt-1">{job.location}</p>
              </div>
              {job.fitScore && <Badge className="bg-neon-purple/20 text-neon-purple border-0">{job.fitScore}%</Badge>}
            </div>

            {/* Skills */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {job.skills.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs px-2 py-0.5 bg-white/5 border border-white/10">
                  {skill}
                </Badge>
              ))}
              {job.skills.length > 3 && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-white/5 border border-white/10">
                  +{job.skills.length - 3}
                </Badge>
              )}
            </div>

            {/* Salary and Work Type */}
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
              {job.salary && <span>{job.salary}</span>}
              <span>{job.work_type}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onSaveJob?.(String(job.id));
                }}
                className="flex-1 text-xs border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10"
              >
                <Bookmark className="w-3 h-3 mr-1" />
                Save
              </Button>
              {job.isQuickApplyAvailable && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickApply?.(String(job.id));
                  }}
                  className="flex-1 text-xs gradient-animated"
                >
                  Quick Apply
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
