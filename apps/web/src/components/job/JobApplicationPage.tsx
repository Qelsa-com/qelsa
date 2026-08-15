import { ScreeningQuestion } from "@/types/question";
import { ArrowLeft, CheckCircle2, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Progress } from "../ui/progress";
import { Separator } from "../ui/separator";
import { Textarea } from "../ui/textarea";

interface JobApplicationPageProps {
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    questions: ScreeningQuestion[];
  };
  onBack: () => void;
  onSubmit?: (applicationData: any) => void;
}

export function JobApplicationPage({ job, onBack, onSubmit }: JobApplicationPageProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const currentQuestion = job.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / job.questions.length) * 100;

  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < job.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);

      const applicationData = {
        jobId: job.id,
        answers,
        submittedAt: new Date().toISOString(),
      };

      onSubmit?.(applicationData);
    }, 2000);
  };

  const isCurrentQuestionAnswered = () => {
    const answer = answers[currentQuestion?.id];
    if (!answer) return false;

    if (typeof answer === "string") return answer.trim().length > 0;
    if (Array.isArray(answer)) return answer.length > 0;
    return true;
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <Card className="p-8 glass border-glass-border text-center">
            <div className="w-20 h-20 rounded-full bg-neon-green/20 border-2 border-neon-green flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-neon-green" />
            </div>

            <h2 className="text-3xl font-bold mb-3">Application Submitted! 🎉</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Your application for <span className="text-neon-cyan font-medium">{job.title}</span> at {job.company} has been successfully submitted.
            </p>

            <div className="p-6 rounded-lg bg-gradient-to-br from-neon-purple/10 to-neon-cyan/10 border border-glass-border mb-6">
              <div className="flex items-center gap-3 justify-center mb-3">
                <Sparkles className="w-5 h-5 text-neon-purple" />
                <h3 className="font-semibold">AI is Analyzing Your Responses</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Our AI is evaluating your answers and will provide the hiring team with a detailed skill match analysis. You&apos;ll hear back within 3-5 business days.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={onBack} className="gradient-animated">
                Browse More Jobs
              </Button>
              <Button variant="outline" className="border-neon-cyan/30 text-neon-cyan">
                View My Applications
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background">
      {/* Header */}
      <div className="glass-strong border-b border-glass-border">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <Button variant="ghost" onClick={onBack} className="mb-4 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Job
          </Button>

          <div className="mb-4">
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <p className="text-muted-foreground">
              {job.company} • {job.location}
            </p>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Question {currentQuestionIndex + 1} of {job.questions.length}
              </span>
              <span className="text-neon-cyan font-medium">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <Card className="p-8 glass border-glass-border">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">
                {currentQuestion?.type === "multiple_choice" && "Multiple Choice"}
                {currentQuestion?.type === "short-answer" && "Short Answer"}
                {currentQuestion?.type === "coding" && "Coding Challenge"}
                {currentQuestion?.type === "behavioral" && "Behavioral"}
              </Badge>
              {currentQuestion?.required && <Badge className="bg-neon-pink/20 text-neon-pink border-0">Required</Badge>}
            </div>

            <h2 className="text-xl font-semibold mb-2">{currentQuestion?.title}</h2>

            {currentQuestion?.type === "coding" && <p className="text-sm text-muted-foreground">Write your solution in the code editor below. Explain your approach and consider edge cases.</p>}
          </div>

          <Separator className="mb-6" />

          {/* Answer Input */}
          <div className="space-y-4">
            {currentQuestion?.type === "multiple_choice" && currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => {
                  const optId = typeof option === "string" ? option : option.id;
                  const optLabel = typeof option === "string" ? option : option.title;
                  return (
                  <label key={idx} className="flex items-center gap-3 p-4 rounded-lg border border-glass-border hover:border-neon-cyan/50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={(answers[currentQuestion.id] || []).includes(optId)}
                      onChange={(e) => {
                        const currentAnswers = answers[currentQuestion.id] || [];
                        const newAnswers = e.target.checked ? [...currentAnswers, optId] : currentAnswers.filter((a: string | number) => a !== optId);
                        handleAnswer(currentQuestion.id, newAnswers);
                      }}
                      className="w-4 h-4 rounded border-glass-border"
                    />
                    <span>{optLabel}</span>
                  </label>
                  );
                })}
              </div>
            )}

            {(currentQuestion?.type === "short-answer" || currentQuestion?.type === "behavioral") && (
              <Textarea
                placeholder="Type your answer here..."
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                className="glass border-glass-border min-h-32"
              />
            )}

            {currentQuestion?.type === "coding" && (
              <div className="space-y-3">
                <Textarea
                  placeholder="// Write your code here...
function solution() {
  // Your implementation
}"
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                  className="glass border-glass-border min-h-64 font-mono text-sm"
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="w-3 h-3 text-neon-purple" />
                  <span>AI will evaluate code quality, efficiency, and problem-solving approach</span>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0} className="border-glass-border">
              Previous
            </Button>

            {currentQuestionIndex < job.questions.length - 1 ? (
              <Button onClick={handleNext} disabled={currentQuestion?.required && !isCurrentQuestionAnswered()} className="flex-1 gradient-animated">
                Next Question
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={(currentQuestion?.required && !isCurrentQuestionAnswered()) || isSubmitting} className="flex-1 gradient-animated">
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>

        {/* Tips Card */}
        <Card className="p-4 glass border-glass-border mt-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-neon-yellow flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm mb-1">Pro Tip</h4>
              <p className="text-xs text-muted-foreground">
                {currentQuestion?.type === "coding" && "Write clean, well-commented code. Explain your thought process and time/space complexity."}
                {currentQuestion?.type === "behavioral" && "Use the STAR method (Situation, Task, Action, Result) to structure your answer effectively."}
                {currentQuestion?.type === "short-answer" && "Be specific and concise. Provide concrete examples when possible."}
                {currentQuestion?.type === "multiple_choice" && "Select all options that apply to your experience."}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
