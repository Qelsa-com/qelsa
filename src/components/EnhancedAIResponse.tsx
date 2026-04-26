import { ArrowRight, Award, Briefcase, CheckCircle2, ChevronDown, ChevronUp, Clock, DollarSign, ExternalLink, Sparkles, Target, TrendingUp } from "lucide-react";
import { useState } from "react";
import { CareerPathForecast, InterviewPrepPlan, SkillGapAnalysis } from "./job/JobContextAI";
import type { Job } from "@/types/job";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";

interface QelsaScore {
  overall: number;
  breakdown: {
    skillMatch?: number;
    salaryFit: number;
    growthPotential: number;
    workLifeBalance: number;
    companyStability: number;
  };
}

interface JobComparison {
  jobs: Job[];
  winner: {
    salary: string;
    growth: string;
    workLife: string;
    stability: string;
  };
  recommendation: string;
}

interface EnhancedAIResponseProps {
  type: "skill-gap" | "comparison" | "career-forecast" | "interview-prep" | "qelsa-score";
  data: any;
  onAction?: (action: string, payload?: any) => void;
}

export function EnhancedAIResponse({ type, data, onAction }: EnhancedAIResponseProps) {
  switch (type) {
    case "skill-gap":
      return <SkillGapAnalysis {...data} />;
    case "comparison":
      return <JobComparisonResponse data={data} onAction={onAction} />;
    case "career-forecast":
      return <CareerPathForecast {...data} />;
    case "interview-prep":
      return <InterviewPrepPlan {...data} />;
    case "qelsa-score":
      return <QelsaScoreCard data={data} onAction={onAction} />;
    default:
      return null;
  }
}

function QelsaScoreCard({ data, onAction }: { data: { job: Job; score: QelsaScore; insights: string[] }; onAction?: (action: string, payload?: any) => void }) {
  const { job, score, insights } = data;
  const [showBreakdown, setShowBreakdown] = useState(false);

  const getScoreColor = (value: number) => {
    if (value >= 80) return "text-neon-green";
    if (value >= 60) return "text-neon-cyan";
    if (value >= 40) return "text-neon-yellow";
    return "text-neon-pink";
  };

  const getScoreLabel = (value: number) => {
    if (value >= 80) return "Excellent Match";
    if (value >= 60) return "Good Match";
    if (value >= 40) return "Fair Match";
    return "Needs Work";
  };

  return (
    <Card className="glass border-glass-border p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white">Qelsa Score</h3>
            <Badge className="bg-gradient-to-r from-neon-cyan to-neon-purple text-black">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {job.title} at {job.company_name}
          </p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="relative w-20 h-20">
            <svg className="transform -rotate-90 w-20 h-20">
              <circle cx="40" cy="40" r="36" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="url(#gradient)"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 36}`}
                strokeDashoffset={`${2 * Math.PI * 36 * (1 - score.overall / 100)}`}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="50%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-bold ${getScoreColor(score.overall)}`}>{score.overall}</span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">{getScoreLabel(score.overall)}</span>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-3">
        <button onClick={() => setShowBreakdown(!showBreakdown)} className="flex items-center justify-between w-full text-sm font-medium text-white hover:text-neon-cyan transition-colors">
          <span>Score Breakdown</span>
          {showBreakdown ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showBreakdown && (
          <div className="space-y-3">
            {Object.entries(score.breakdown).map(([key, value]) => {
              const label = key.replace(/([A-Z])/g, " $1").trim();
              const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);

              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{formattedLabel}</span>
                    <span className={`font-medium ${getScoreColor(value)}`}>{value}%</span>
                  </div>
                  <Progress value={value} className="h-2" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Insights */}
      <div className="space-y-3 pt-4 border-t border-glass-border">
        <h4 className="text-sm font-medium text-white flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-neon-cyan" />
          AI Insights
        </h4>
        <div className="space-y-2">
          {insights.map((insight, index) => (
            <div key={index} className="flex items-start gap-2 p-3 glass-strong rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-neon-green flex-shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{insight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-glass-border">
        <Button onClick={() => onAction?.("apply", { jobId: job.id })} className="bg-neon-cyan text-black hover:bg-neon-cyan/90">
          <Briefcase className="h-4 w-4 mr-2" />
          Apply Now
        </Button>
        <Button variant="outline" onClick={() => onAction?.("prep-plan", { jobId: job.id })} className="border-glass-border hover:bg-glass-bg">
          <Target className="h-4 w-4 mr-2" />
          Get Prep Plan
        </Button>
        <Button variant="outline" onClick={() => onAction?.("similar", { jobId: job.id })} className="border-glass-border hover:bg-glass-bg">
          <ExternalLink className="h-4 w-4 mr-2" />
          Similar Jobs
        </Button>
        <Button variant="outline" onClick={() => onAction?.("course", { jobId: job.id })} className="border-glass-border hover:bg-glass-bg">
          <TrendingUp className="h-4 w-4 mr-2" />
          Skill Courses
        </Button>
      </div>
    </Card>
  );
}

function JobComparisonResponse({ data, onAction }: { data: JobComparison; onAction?: (action: string, payload?: any) => void }) {
  const { jobs, winner, recommendation } = data;

  const comparisonMetrics = [
    {
      key: "salary",
      label: "Salary",
      icon: DollarSign,
      values: jobs.map((j) => j.salary || "Not disclosed"),
    },
    {
      key: "growth",
      label: "Growth Potential",
      icon: TrendingUp,
      values: jobs.map((j, i) => ["High", "Medium", "High", "Medium"][i]),
    },
    {
      key: "workLife",
      label: "Work-Life Balance",
      icon: Clock,
      values: jobs.map((j, i) => ["Good", "Excellent", "Fair", "Good"][i]),
    },
    {
      key: "stability",
      label: "Company Stability",
      icon: Award,
      values: jobs.map((j, i) => ["Stable", "Growing", "Stable", "Established"][i]),
    },
  ];

  return (
    <Card className="glass border-glass-border p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-white">Side-by-Side Comparison</h3>
          <Badge className="bg-gradient-to-r from-neon-cyan to-neon-purple text-black">
            <Award className="h-3 w-3 mr-1" />
            AI Analysis
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">Comparing {jobs.length} opportunities</p>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <div className="min-w-full space-y-4">
          {/* Job Headers */}
          <div className="grid gap-3" style={{ gridTemplateColumns: `auto repeat(${jobs.length}, 1fr)` }}>
            <div className="font-medium text-white text-sm">Job</div>
            {jobs.map((job, index) => (
              <div key={index} className="glass-strong rounded-lg p-3 space-y-1">
                <h4 className="font-medium text-white text-sm line-clamp-1">{job.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-1">{job.company_name}</p>
                <Badge variant="secondary" className={`text-xs ${job.resource === "Qelsa" ? "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30" : "bg-glass-bg text-muted-foreground"}`}>
                  {job.resource}
                </Badge>
              </div>
            ))}
          </div>

          <Separator className="bg-glass-border" />

          {/* Comparison Rows */}
          {comparisonMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.key} className="grid gap-3" style={{ gridTemplateColumns: `auto repeat(${jobs.length}, 1fr)` }}>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon className="h-4 w-4" />
                  {metric.label}
                </div>
                {metric.values.map((value, index) => {
                  const isWinner = winner[metric.key as keyof typeof winner] === String(jobs[index].id);
                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg text-sm text-center ${isWinner ? "glass-strong border-2 border-neon-green/50 bg-neon-green/5 text-white font-medium" : "glass text-muted-foreground"}`}
                    >
                      {isWinner && <Award className="h-3 w-3 text-neon-green inline mr-1" />}
                      {value}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Recommendation */}
      <div className="pt-4 border-t border-glass-border space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-neon-cyan" />
          <h4 className="text-sm font-medium text-white">AI Recommendation</h4>
        </div>
        <div className="glass-strong rounded-lg p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{recommendation}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-glass-border">
        <Button onClick={() => onAction?.("view-full-comparison")} className="bg-gradient-to-r from-neon-cyan to-neon-purple text-black hover:opacity-90">
          <Award className="h-4 w-4 mr-2" />
          Detailed Comparison
        </Button>
        <Button variant="outline" onClick={() => onAction?.("customize-weights")} className="border-glass-border hover:bg-glass-bg">
          <Target className="h-4 w-4 mr-2" />
          Customize Weights
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {jobs.map((job, index) => (
          <Button key={index} size="sm" variant="ghost" onClick={() => onAction?.("apply", { jobId: job.id })} className="text-neon-cyan hover:text-neon-cyan hover:bg-neon-cyan/10">
            Apply to {job.company_name}
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        ))}
      </div>
    </Card>
  );
}
