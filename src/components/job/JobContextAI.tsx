import { ArrowRight, Award, Brain, CheckCircle2, ChevronRight, Clock, GraduationCap, MessageCircle, Sparkles, Target, TrendingUp, Zap } from "lucide-react";
import { useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Progress } from "../ui/progress";
import type { Job } from "@/types/job";

interface JobContextAIProps {
  jobs: Job[];
  onAskQuestion: (question: string, jobIds?: string[]) => void;
  onCompareJobs?: (jobIds: string[]) => void;
}

export function JobContextAI({ jobs, onAskQuestion, onCompareJobs }: JobContextAIProps) {
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [showAllPrompts, setShowAllPrompts] = useState(false);

  // Generate dynamic prompts based on jobs
  const generateContextPrompts = () => {
    const prompts = [];

    if (jobs.length === 0) {
      return [
        { text: "Find jobs matching my skills", icon: Target, category: "search" },
        { text: "Help me improve my resume", icon: GraduationCap, category: "career" },
        { text: "Show me skill development roadmap", icon: TrendingUp, category: "skills" },
      ];
    }

    // Job-specific prompts
    if (jobs.length === 1) {
      prompts.push(
        { text: `What skills am I missing for ${jobs[0].title}?`, icon: Target, category: "skills", jobIds: [String(jobs[0].id)] },
        { text: `Prepare me for ${jobs[0].company_name} interview`, icon: MessageCircle, category: "interview", jobIds: [String(jobs[0].id)] },
        { text: `Show me career path for ${jobs[0].title}`, icon: TrendingUp, category: "career", jobIds: [String(jobs[0].id)] }
      );
    } else if (jobs.length >= 2) {
      prompts.push(
        { text: `Compare top ${Math.min(jobs.length, 4)} jobs`, icon: Award, category: "compare", jobIds: jobs.slice(0, 4).map((j) => String(j.id)) },
        { text: "Which job best matches my profile?", icon: Target, category: "match", jobIds: jobs.slice(0, 4).map((j) => String(j.id)) },
        { text: "Highlight skill gaps across these roles", icon: GraduationCap, category: "skills", jobIds: jobs.slice(0, 4).map((j) => String(j.id)) }
      );
    }

    // Always available prompts
    prompts.push(
      { text: "Create a 2-week preparation plan", icon: Clock, category: "prep" },
      { text: "Show me salary negotiation tips", icon: TrendingUp, category: "career" },
      { text: "Generate interview questions", icon: MessageCircle, category: "interview" }
    );

    return prompts;
  };

  const contextPrompts = generateContextPrompts();

  return (
    <div className="glass border-glass-border rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center flex-shrink-0 glow-cyan">
          <Brain className="h-6 w-6 text-black" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
            AI Job Assistant
            <Badge variant="secondary" className="bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30">
              <Sparkles className="h-3 w-3 mr-1" />
              Smart Mode
            </Badge>
          </h3>
          <p className="text-sm text-muted-foreground">
            {jobs.length > 0 ? `Analyzing ${jobs.length} ${jobs.length === 1 ? "job" : "jobs"} for personalized insights` : "Ask me anything about your career journey"}
          </p>
        </div>
      </div>

      {/* Quick Action Prompts */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-white">Quick Actions:</h4>
        <div className="grid grid-cols-1 gap-2">
          {contextPrompts.slice(0, showAllPrompts ? contextPrompts.length : 4).map((prompt, index) => {
            const Icon = prompt.icon;
            return (
              <button
                key={index}
                onClick={() => onAskQuestion(prompt.text, prompt.jobIds)}
                className="group flex items-center gap-3 p-3 glass-strong border-glass-border rounded-xl hover:border-neon-cyan/50 hover:glow-cyan transition-all duration-300 text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center flex-shrink-0 group-hover:from-neon-cyan/30 group-hover:to-neon-purple/30 transition-all">
                  <Icon className="h-4 w-4 text-neon-cyan" />
                </div>
                <span className="text-sm text-muted-foreground group-hover:text-white transition-colors flex-1">{prompt.text}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-neon-cyan transition-colors" />
              </button>
            );
          })}
        </div>

        {contextPrompts.length > 4 && (
          <Button variant="ghost" onClick={() => setShowAllPrompts(!showAllPrompts)} className="w-full text-neon-cyan hover:text-neon-cyan hover:bg-neon-cyan/10">
            {showAllPrompts ? "Show Less" : `View ${contextPrompts.length - 4} More Actions`}
            <ChevronRight className={`h-4 w-4 ml-2 transition-transform ${showAllPrompts ? "rotate-90" : ""}`} />
          </Button>
        )}
      </div>

      {/* Compare Jobs CTA */}
      {jobs.length >= 2 && onCompareJobs && (
        <div className="pt-4 border-t border-glass-border">
          <Button
            onClick={() => onCompareJobs(jobs.slice(0, 4).map((j) => String(j.id)))}
            className="w-full bg-gradient-to-r from-neon-cyan to-neon-purple text-black hover:opacity-90 transition-all duration-300 glow-cyan"
          >
            <Award className="h-4 w-4 mr-2" />
            Compare Top Jobs Side-by-Side
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* AI Capabilities */}
      <div className="pt-4 border-t border-glass-border space-y-3">
        <h4 className="text-sm font-medium text-white">I can help you with:</h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Skill Gap Analysis", icon: Target },
            { label: "Interview Prep", icon: MessageCircle },
            { label: "Career Forecasting", icon: TrendingUp },
            { label: "Resume Tips", icon: GraduationCap },
          ].map((capability, index) => {
            const Icon = capability.icon;
            return (
              <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-glass-bg/50">
                <div className="w-6 h-6 rounded-md bg-neon-cyan/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-3 w-3 text-neon-cyan" />
                </div>
                <span className="text-xs text-muted-foreground">{capability.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// AI Insight Response Components
interface SkillGapAnalysisProps {
  job: Job;
  matchedSkills: string[];
  missingSkills: string[];
  matchPercentage: number;
  recommendations: { skill: string; priority: "high" | "medium" | "low"; course?: string }[];
}

export function SkillGapAnalysis({ job, matchedSkills, missingSkills, matchPercentage, recommendations }: SkillGapAnalysisProps) {
  return (
    <Card className="glass border-glass-border p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-white mb-1">Skill Fit Analysis</h3>
          <p className="text-sm text-muted-foreground">
            {job.title} at {job.company_name}
          </p>
        </div>
        <Badge className="bg-gradient-to-r from-neon-cyan to-neon-purple text-black">{matchPercentage}% Match</Badge>
      </div>

      {/* Match Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Your Skill Match</span>
          <span className="text-neon-cyan font-medium">{matchPercentage}%</span>
        </div>
        <Progress value={matchPercentage} className="h-2" />
      </div>

      {/* Matched Skills */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-neon-green" />
          <h4 className="text-sm font-medium text-white">You Have ({matchedSkills.length})</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {matchedSkills.map((skill, index) => (
            <Badge key={index} variant="secondary" className="bg-neon-green/20 text-neon-green border-neon-green/30">
              {skill}
            </Badge>
          ))}
        </div>
      </div>

      {/* Missing Skills */}
      {missingSkills.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-neon-yellow" />
            <h4 className="text-sm font-medium text-white">Skills to Develop ({missingSkills.length})</h4>
          </div>
          <div className="space-y-2">
            {recommendations.map((rec, index) => (
              <div key={index} className="flex items-center justify-between p-3 glass-strong rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <Badge
                    variant="secondary"
                    className={`
                      ${rec.priority === "high" ? "bg-neon-pink/20 text-neon-pink border-neon-pink/30" : ""}
                      ${rec.priority === "medium" ? "bg-neon-yellow/20 text-neon-yellow border-neon-yellow/30" : ""}
                      ${rec.priority === "low" ? "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30" : ""}
                    `}
                  >
                    {rec.priority}
                  </Badge>
                  <span className="text-sm text-white">{rec.skill}</span>
                </div>
                {rec.course && (
                  <Button size="sm" variant="ghost" className="text-neon-cyan hover:text-neon-cyan hover:bg-neon-cyan/10">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    Learn
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-glass-border">
        <Button className="flex-1 bg-neon-cyan text-black hover:bg-neon-cyan/90">
          <GraduationCap className="h-4 w-4 mr-2" />
          Start Learning
        </Button>
        <Button variant="outline" className="flex-1 border-glass-border hover:bg-glass-bg">
          <MessageCircle className="h-4 w-4 mr-2" />
          Get Prep Plan
        </Button>
      </div>
    </Card>
  );
}

interface CareerPathForecastProps {
  currentRole: string;
  targetRole: string;
  timelineMonths: number;
  steps: { title: string; duration: string; skills: string[] }[];
  successRate: number;
}

export function CareerPathForecast({ currentRole, targetRole, timelineMonths, steps, successRate }: CareerPathForecastProps) {
  return (
    <Card className="glass border-glass-border p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-white mb-1">Career Path Forecast</h3>
          <p className="text-sm text-muted-foreground">
            {currentRole} → {targetRole}
          </p>
        </div>
        <Badge className="bg-gradient-to-r from-neon-purple to-neon-pink text-white">{successRate}% Success Rate</Badge>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Estimated Timeline</span>
          <span className="text-neon-purple font-medium">{timelineMonths} months</span>
        </div>
        <Progress value={(timelineMonths / 48) * 100} className="h-2" />
      </div>

      {/* Career Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="relative pl-8">
            {/* Timeline dot */}
            <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-xs font-semibold text-black">
              {index + 1}
            </div>

            {/* Timeline line */}
            {index < steps.length - 1 && <div className="absolute left-3 top-8 bottom-0 w-px bg-gradient-to-b from-neon-cyan/50 to-transparent"></div>}

            {/* Step content */}
            <div className="glass-strong rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-white">{step.title}</h4>
                <span className="text-xs text-muted-foreground">{step.duration}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {step.skills.map((skill, skillIndex) => (
                  <Badge key={skillIndex} variant="secondary" className="bg-neon-cyan/10 text-neon-cyan text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Button */}
      <Button className="w-full bg-gradient-to-r from-neon-purple to-neon-pink text-white hover:opacity-90">
        <TrendingUp className="h-4 w-4 mr-2" />
        Start Your Journey
      </Button>
    </Card>
  );
}

interface InterviewPrepPlanProps {
  jobTitle: string;
  company: string;
  topics: { category: string; questions: string[] }[];
  estimatedPrepTime: string;
}

export function InterviewPrepPlan({ jobTitle, company, topics, estimatedPrepTime }: InterviewPrepPlanProps) {
  const [expandedTopics, setExpandedTopics] = useState<number[]>([0]);

  const toggleTopic = (index: number) => {
    setExpandedTopics((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
  };

  return (
    <Card className="glass border-glass-border p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-white mb-1">Interview Preparation Plan</h3>
          <p className="text-sm text-muted-foreground">
            {jobTitle} at {company}
          </p>
        </div>
        <Badge className="bg-neon-purple/20 text-neon-purple border-neon-purple/30">
          <Clock className="h-3 w-3 mr-1" />
          {estimatedPrepTime}
        </Badge>
      </div>

      {/* Interview Topics */}
      <div className="space-y-3">
        {topics.map((topic, index) => (
          <div key={index} className="glass-strong rounded-lg overflow-hidden">
            <button onClick={() => toggleTopic(index)} className="w-full flex items-center justify-between p-4 hover:bg-glass-bg/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-neon-cyan" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-white">{topic.category}</h4>
                  <p className="text-xs text-muted-foreground">{topic.questions.length} questions</p>
                </div>
              </div>
              <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${expandedTopics.includes(index) ? "rotate-90" : ""}`} />
            </button>

            {expandedTopics.includes(index) && (
              <div className="px-4 pb-4 space-y-2">
                {topic.questions.map((question, qIndex) => (
                  <div key={qIndex} className="flex items-start gap-2 p-2 rounded-lg bg-glass-bg/30">
                    <span className="text-neon-cyan text-sm font-medium">{qIndex + 1}.</span>
                    <span className="text-sm text-muted-foreground">{question}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-glass-border">
        <Button className="flex-1 bg-neon-purple text-white hover:bg-neon-purple/90">
          <Zap className="h-4 w-4 mr-2" />
          Start Practice
        </Button>
        <Button variant="outline" className="flex-1 border-glass-border hover:bg-glass-bg">
          <GraduationCap className="h-4 w-4 mr-2" />
          Learn Topics
        </Button>
      </div>
    </Card>
  );
}
