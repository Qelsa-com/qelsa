import { Bot, Maximize2, Minimize2, X } from "lucide-react";
import { useState } from "react";
import { ChatInterfaceEnhanced } from "../ChatInterfaceEnhanced";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";
import { JobContextAI } from "./JobContextAI";
import type { Job } from "@/types/job";

interface JobListingWithAIProps {
  visibleJobs: Job[];
  onApplyJob: (jobId: string) => void;
  onViewJob: (jobId: string) => void;
  onViewAllJobs?: () => void;
}

export function JobListingWithAI({ visibleJobs, onApplyJob, onViewJob, onViewAllJobs }: JobListingWithAIProps) {
  const [showFloatingAI, setShowFloatingAI] = useState(true);
  const [showFullscreenAI, setShowFullscreenAI] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const handleAskQuestion = (question: string, jobIds?: string[]) => {
    // Open fullscreen AI with the question
    setShowFullscreenAI(true);
    setShowFloatingAI(false);
  };

  const handleCompareJobs = (jobIds: string[]) => {
    // Open fullscreen AI with comparison
    setShowFullscreenAI(true);
    setShowFloatingAI(false);
  };

  return (
    <>
      {/* Floating AI Assistant */}
      {showFloatingAI && !showFullscreenAI && (
        <div className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ${minimized ? "w-auto" : "w-96"}`}>
          {minimized ? (
            <Button onClick={() => setMinimized(false)} className="bg-gradient-to-r from-neon-cyan to-neon-purple text-black hover:opacity-90 rounded-full w-14 h-14 p-0 glow-cyan">
              <Bot className="h-6 w-6" />
            </Button>
          ) : (
            <div className="glass-strong border-glass-border rounded-2xl shadow-2xl overflow-hidden max-h-[600px] flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10 px-4 py-3 border-b border-glass-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                    <Bot className="h-4 w-4 text-black" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">AI Job Assistant</h3>
                    <p className="text-xs text-muted-foreground">
                      Analyzing {visibleJobs.length} {visibleJobs.length === 1 ? "job" : "jobs"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setShowFullscreenAI(true)} className="h-8 w-8 text-muted-foreground hover:text-neon-cyan">
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setMinimized(true)} className="h-8 w-8 text-muted-foreground hover:text-neon-cyan">
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setShowFloatingAI(false)} className="h-8 w-8 text-muted-foreground hover:text-neon-pink">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="overflow-y-auto p-4">
                <JobContextAI jobs={visibleJobs} onAskQuestion={handleAskQuestion} onCompareJobs={handleCompareJobs} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fullscreen AI Dialog */}
      <Dialog open={showFullscreenAI} onOpenChange={setShowFullscreenAI}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0 bg-background border-glass-border">
          <DialogTitle className="sr-only">AI Job Assistant</DialogTitle>
          <DialogDescription className="sr-only">Get personalized job insights, skill analysis, and career guidance powered by AI</DialogDescription>
          <ChatInterfaceEnhanced contextJobs={visibleJobs} onMenuClick={() => {}} onProfileClick={() => {}} onViewJob={onViewJob} onApplyJob={onApplyJob} onViewAllJobs={onViewAllJobs} />
        </DialogContent>
      </Dialog>
    </>
  );
}
