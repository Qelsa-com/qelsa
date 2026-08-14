import { useState } from 'react';
import { ChevronDown, ChevronUp, Bot, Target, ArrowRight, Sparkles, Lightbulb, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { ResponseCard } from './ResponseCard';

interface ResponseData {
  id: string;
  title: string;
  description: string;
  relevance: string;
  actionLabel: string;
  actionType: 'view' | 'learn' | 'apply';
  category: 'student' | 'professional' | 'job' | 'skill';
  source?: {
    platform: 'Qelsa' | 'LinkedIn' | 'Indeed' | 'Naukri' | 'AngelList' | 'Glassdoor';
    verified?: boolean;
    exclusive?: boolean;
  };
  jobDetails?: {
    company: string;
    location: string;
    salary?: string;
    workType?: string;
    experience: string;
    responsibilities: string[];
    requirements: string[];
    preferred: string[];
    benefits: string[];
  };
}

interface AIResponseBlockProps {
  summary: string;
  responses: ResponseData[];
  reasoning?: string;
  suggestedPrompts?: string[];
  onCheckFit?: (jobId: string, jobTitle: string) => void;
  onViewJobDetails?: (jobId: string) => void;
  onSendPrompt?: (prompt: string) => void;
  className?: string;
}

export function AIResponseBlock({
  summary,
  responses = [],
  reasoning,
  suggestedPrompts = [],
  onCheckFit,
  onViewJobDetails,
  onSendPrompt,
  className = ''
}: AIResponseBlockProps) {
  const [isReasoningOpen, setIsReasoningOpen] = useState(false);

  const handlePromptClick = (prompt: string) => {
    if (onSendPrompt) {
      onSendPrompt(prompt);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* AI Response Header */}
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-full glass flex items-center justify-center flex-shrink-0 glow-cyan">
          <Bot className="h-4 w-4 text-neon-cyan" />
        </div>
        <div className="flex-1 space-y-4">
          {/* Summary Section */}
          <Card className="glass border-glass-border rounded-2xl p-6">
            <div className="space-y-4">
              {/* Summary Text */}
              <div className="prose prose-sm prose-invert max-w-none">
                <div 
                  className="text-foreground leading-relaxed text-base"
                  dangerouslySetInnerHTML={{
                    __html: summary
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-neon-cyan font-semibold">$1</strong>')
                      .replace(/\n/g, '<br/>')
                  }} 
                />
              </div>

              {/* View Reasoning Toggle */}
              {reasoning && (
                <Collapsible open={isReasoningOpen} onOpenChange={setIsReasoningOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2 text-muted-foreground hover:text-neon-cyan transition-colors p-0 h-auto"
                    >
                      <Target className="h-4 w-4" />
                      <span className="text-sm">View Reasoning</span>
                      {isReasoningOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="mt-4">
                    <div className="glass-strong rounded-lg p-4 border border-glass-border">
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="h-4 w-4 text-neon-purple" />
                        <span className="font-medium text-neon-purple">AI Reasoning</span>
                      </div>
                      <div className="prose prose-sm prose-invert max-w-none">
                        <div 
                          className="text-sm text-muted-foreground leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: reasoning
                              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                              .replace(/•/g, '<span class="text-neon-cyan">•</span>')
                              .replace(/\n/g, '<br/>')
                          }} 
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </Card>

          {/* AI-Generated Cards Section */}
          {responses.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-neon-cyan" />
                <h3 className="font-medium text-white">AI Recommendations</h3>
                <Badge variant="secondary" className="text-xs bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20">
                  {responses.length} {responses.length === 1 ? 'suggestion' : 'suggestions'}
                </Badge>
              </div>
              
              {/* Response Cards Grid */}
              <div className="space-y-4">
                {responses.map((response) => (
                  <ResponseCard
                    key={response.id}
                    response={response}
                    onCheckFit={onCheckFit}
                    onViewJobDetails={onViewJobDetails}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Suggested Next Prompts */}
          {suggestedPrompts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-neon-purple" />
                <span className="text-sm font-medium text-muted-foreground">Continue the conversation:</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePromptClick(prompt)}
                    className="text-xs px-3 py-2 h-auto glass border-glass-border text-muted-foreground hover:text-neon-cyan hover:border-neon-cyan/50 hover:bg-neon-cyan/5 transition-all duration-300 rounded-full"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}