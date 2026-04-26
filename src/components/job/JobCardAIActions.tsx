import { ChevronDown, ChevronUp, MessageCircle, Sparkles, Target, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Badge } from "../ui/badge";
import type { Job } from "@/types/job";

interface JobCardAIActionsProps {
  job: Job;
  onAskAI: (question: string, jobId: string) => void;
}

export function JobCardAIActions({ job, onAskAI }: JobCardAIActionsProps) {
  const [expanded, setExpanded] = useState(false);

  const quickActions = [
    {
      label: "Analyze Fit",
      icon: Target,
      question: `What's my Qelsa Score for ${job.title} at ${job.company_name}?`,
      color: "text-neon-cyan",
    },
    {
      label: "Skill Gaps",
      icon: Sparkles,
      question: `What skills am I missing for ${job.title}?`,
      color: "text-neon-purple",
    },
    {
      label: "Interview Prep",
      icon: MessageCircle,
      question: `Prepare me for ${job.company_name} interview`,
      color: "text-neon-pink",
    },
    {
      label: "Career Path",
      icon: TrendingUp,
      question: `Show me career path for ${job.title}`,
      color: "text-neon-green",
    },
  ];

  return (
    <div className="space-y-2">
      {/* AI Badge Indicator */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
        className="flex items-center justify-between w-full p-2 rounded-lg glass border-glass-border hover:glass-strong transition-all duration-300 group"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center group-hover:from-neon-cyan/30 group-hover:to-neon-purple/30 transition-all">
            <Sparkles className="h-3 w-3 text-neon-cyan" />
          </div>
          <span className="text-xs font-medium text-muted-foreground group-hover:text-white transition-colors">AI Insights</span>
        </div>
        {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
      </button>

      {/* Expanded AI Actions */}
      {expanded && (
        <div className="grid grid-cols-2 gap-2 p-2 glass-strong rounded-lg">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  onAskAI(action.question, String(job.id));
                  setExpanded(false);
                }}
                className="flex items-center gap-2 p-2 rounded-lg glass border-glass-border hover:glass-strong hover:glow-cyan transition-all duration-300 group"
              >
                <Icon className={`h-3 w-3 ${action.color}`} />
                <span className="text-xs text-muted-foreground group-hover:text-white transition-colors">{action.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Quick Qelsa Score Preview */}
      {!expanded && job.fitScore && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onAskAI(`Show me detailed Qelsa Score for ${job.title}`, String(job.id));
          }}
          className="flex items-center justify-between p-2 rounded-lg glass border-glass-border hover:glass-strong cursor-pointer transition-all duration-300 group"
        >
          <span className="text-xs text-muted-foreground">Qelsa Score</span>
          <div className="flex items-center gap-2">
            <Badge className="bg-gradient-to-r from-neon-cyan to-neon-purple text-black text-xs">{job.fitScore}%</Badge>
            <Sparkles className="h-3 w-3 text-neon-cyan opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      )}
    </div>
  );
}
