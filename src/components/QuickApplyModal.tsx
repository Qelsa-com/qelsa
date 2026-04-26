import { useCreateJobApplicationMutation } from "@/features/api/jobApplicationsApi";
import { useCreateResumeMutation } from "@/features/api/resumeApi";
import { Job } from "@/types/job";
import { ScreeningQuestion } from "@/types/question";
import { Resume } from "@/types/resume";
import { AlertCircle, ArrowLeft, ArrowRight, Check, CheckCircle2, File, FileText, Upload, User, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Textarea } from "./ui/textarea";

interface QuickApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  companyName: string;
  screeningQuestions?: ScreeningQuestion[];
  onSubmit: () => void;
  resumes: Resume[];
}

export function QuickApplyModal({ isOpen, onClose, job, companyName, screeningQuestions = [], onSubmit, resumes }: QuickApplyModalProps) {
  const [currentStep, setCurrentStep] = useState<"questions" | "review">("questions");
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [createResume, { isLoading: isCreating, error: createError }] = useCreateResumeMutation();

  const [selectedResumeId, setSelectedResumeId] = useState<string | number | null>(resumes?.[0]?.id || null);
  const [createJobApplication, { isLoading: isCreatingApplication, error: createApplicationError }] = useCreateJobApplicationMutation();
  const selectedResume = resumes?.find((r) => r.id === selectedResumeId);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(screeningQuestions.length > 0 ? "questions" : "review");
      setAnswers({});
      setErrors({});
      setIsSubmitting(false);
      setShowResumeDialog(false);
    }
  }, [isOpen, screeningQuestions.length]);

  useEffect(() => {
    if (resumes && resumes.length > 0) {
      setSelectedResumeId(resumes[0].id);
    }
  }, [resumes]);

  const hasScreeningQuestions = screeningQuestions.length > 0;

  const handleAnswerChange = (questionId: string, value: string | number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    // Clear error for this question
    if (errors[questionId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const validateAnswers = () => {
    const newErrors: Record<string, string> = {};

    screeningQuestions.forEach((question) => {
      if (question.required && !answers[question.id]) {
        newErrors[question.id] = "This question is required";
      }

      // Validate text length for short_text questions
      if (question.type === "short_text" && answers[question.id]) {
        const answer = String(answers[question.id]);
        // if (question.maxLength && answer.length > question.maxLength) {
        //   newErrors[question.id] = `Maximum ${question.maxLength} characters allowed`;
        // }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === "questions") {
      if (validateAnswers()) {
        setCurrentStep("review");
      } else {
        toast.error("Please answer all required questions");
      }
    }
  };

  const handleBack = () => {
    if (currentStep === "review") {
      setCurrentStep("questions");
    } else {
      onClose();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const data = {
      id: job.id,
      applicationData: {
        resume_id: selectedResumeId,
        answers,
      },
    };

    await createJobApplication(data)
      .unwrap()
      .then(() => {
        onClose();
        toast.success("Application submitted successfully");
      })
      .catch((error) => {
        toast.error(error?.data?.message || "Failed to submit application");
      });

    setIsSubmitting(false);
  };

  const handleResumeSelect = (resumeId: string) => {
    setSelectedResumeId(resumeId);
    setShowResumeDialog(false);
    toast.success("Resume updated");
  };

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log("🚀 ~ handleResumeUpload ~ file:", file);
    if (!file) return;

    // Validate file type
    const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF or DOC file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setIsUploadingResume(true);

    try {
      const formData = new FormData();
      formData.append("title", file.name);
      formData.append("file", file);

      await createResume(formData as any).unwrap();

      setIsUploadingResume(false);
      setShowResumeDialog(false);
      toast.success("Resume uploaded successfully");
    } catch (error: any) {
      setIsUploadingResume(false);
      toast.error(error?.data?.message || "Failed to save resume entry");
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === "pdf") {
      return (
        <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center">
          <FileText className="w-5 h-5 text-red-400" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
        <File className="w-5 h-5 text-blue-400" />
      </div>
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const renderQuestionInput = (question: ScreeningQuestion) => {
    const hasError = !!errors[question.id];
    console.log("🚀 ~ renderQuestionInput ~ question.type:", question);

    switch (question.type) {
      case "multiple_choice":
        return (
          <RadioGroup value={String(answers[question.id] || "")} onValueChange={(value) => handleAnswerChange(question.id, value)}>
            <div className="space-y-3">
              {question.options?.map((option, index) => {
                const optId = typeof option === "string" ? index : option.id;
                const optValue = typeof option === "string" ? option : option.value;
                const optLabel = typeof option === "string" ? option : option.title;
                return (
                  <div
                    key={optId ?? index}
                    className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                      answers[question.id] === optValue ? "border-neon-cyan bg-neon-cyan/10" : "border-glass-border hover:border-neon-cyan/50"
                    }`}
                  >
                    <RadioGroupItem value={String(optValue)} id={`${question.id}-${optId ?? index}`} />
                    <Label htmlFor={`${question.id}-${optId ?? index}`} className="flex-1 cursor-pointer">
                      {optLabel}
                    </Label>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        );

      case "yes_no":
        return (
          <RadioGroup value={String(answers[question.id] || "")} onValueChange={(value) => handleAnswerChange(question.id, value)}>
            <div className="flex gap-3">
              <div
                className={`flex-1 flex items-center justify-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${
                  answers[question.id] === "yes" ? "border-neon-green bg-neon-green/10" : "border-glass-border hover:border-neon-green/50"
                }`}
                onClick={() => handleAnswerChange(question.id, "yes")}
              >
                <RadioGroupItem value="yes" id={`${question.id}-yes`} />
                <Label htmlFor={`${question.id}-yes`} className="cursor-pointer">
                  Yes
                </Label>
              </div>
              <div
                className={`flex-1 flex items-center justify-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${
                  answers[question.id] === "no" ? "border-destructive bg-destructive/10" : "border-glass-border hover:border-destructive/50"
                }`}
                onClick={() => handleAnswerChange(question.id, "no")}
              >
                <RadioGroupItem value="no" id={`${question.id}-no`} />
                <Label htmlFor={`${question.id}-no`} className="cursor-pointer">
                  No
                </Label>
              </div>
            </div>
          </RadioGroup>
        );

      case "scale":
        return (
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{question.min_value || 1}</span>
              <span>{question.max_value || 10}</span>
            </div>
            <div className="flex gap-2">
              {Array.from({ length: (question.max_value || 10) - (question.min_value || 1) + 1 }, (_, i) => i + (question.min_value || 1)).map((value) => (
                <button
                  key={value}
                  onClick={() => handleAnswerChange(question.id, value)}
                  className={`flex-1 p-3 rounded-lg border transition-all ${
                    answers[question.id] === value ? "border-neon-purple bg-neon-purple/20 text-neon-purple" : "border-glass-border hover:border-neon-purple/50"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        );

      case "short_text":
        return (
          <div className="space-y-2">
            <Textarea
              value={String(answers[question.id] || "")}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Type your answer here..."
              className={`min-h-[120px] glass border-glass-border focus:border-neon-cyan ${hasError ? "border-destructive focus:border-destructive" : ""}`}
              // maxLength={question.maxLength}
            />
            {/* {question.maxLength && (
              <div className="flex justify-end text-xs text-muted-foreground">
                {String(answers[question.id] || "").length} / {question.maxLength}
              </div>
            )} */}
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] glass rounded-2xl border border-glass-border overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-glass-border flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-neon-green" />
                <h2 className="text-xl bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">Quick Apply</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {job.title} at {job.company_name || job.page?.name}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress Indicator */}
          {hasScreeningQuestions && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Step {currentStep === "questions" ? "1" : "2"} of 2</span>
                <span>{currentStep === "questions" ? "Screening Questions" : "Review & Submit"}</span>
              </div>
              <Progress value={currentStep === "questions" ? 50 : 100} className="h-1" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6 space-y-6">
            {currentStep === "questions" && hasScreeningQuestions && (
              <div className="space-y-6">
                <div className="flex items-start gap-3 p-4 glass-strong rounded-lg border border-neon-cyan/30">
                  <AlertCircle className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm">Please answer the following screening questions to complete your application.</p>
                    <p className="text-xs text-muted-foreground">
                      Questions marked with <span className="text-destructive">*</span> are required.
                    </p>
                  </div>
                </div>

                {/* Questions */}
                <div className="space-y-4">
                  {screeningQuestions.map((question, index) => (
                    <div key={question.id} className={`p-5 glass-strong rounded-lg border transition-all ${errors[question.id] ? "border-destructive" : "border-glass-border"}`}>
                      {/* Question Header */}
                      <div className="mb-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <Label className="text-base flex-1">
                            <span className="text-muted-foreground mr-2">Q{index + 1}.</span>
                            {question.title}
                            {question.required && <span className="text-destructive ml-1">*</span>}
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {question.type === "multiple_choice" && "Multiple Choice"}
                            {question.type === "yes_no" && "Yes/No"}
                            {question.type === "scale" && "Rating Scale"}
                            {question.type === "short_text" && "Text Answer"}
                          </Badge>
                          {!question.required && (
                            <Badge variant="outline" className="text-xs border-muted-foreground/30 text-muted-foreground">
                              Optional
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Question Input */}
                      {renderQuestionInput(question)}

                      {/* Error Message */}
                      {errors[question.id] && (
                        <div className="flex items-center gap-2 mt-3 text-destructive text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors[question.id]}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === "review" && (
              <div className="space-y-6">
                {/* Application Summary */}
                <div className="space-y-4">
                  <h3 className="text-lg">Review Your Application</h3>

                  {/* Resume for this Application */}
                  <div className="space-y-3">
                    {selectedResume ? (
                      <div className="p-4 glass-strong rounded-xl border border-glass-border">
                        <div className="flex items-center gap-4">
                          {/* {getFileIcon(selectedResume.fileType)} */}

                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate mb-1">{selectedResume.title}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {/* <span className="uppercase">{selectedResume.fileType}</span> */}
                              {/* <span>•</span>
                              <span>{selectedResume.size}</span> */}
                              <span>•</span>
                              <span>Updated {formatDate(selectedResume.updatedAt)}</span>
                            </div>
                          </div>

                          <Button variant="outline" size="sm" onClick={() => setShowResumeDialog(true)} className="flex-shrink-0">
                            Change Resume
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 glass-strong rounded-xl border border-destructive/50">
                        <div className="flex items-center gap-3 text-sm text-destructive">
                          <AlertCircle className="w-5 h-5" />
                          <span>No resume selected. Please upload or select a resume.</span>
                          <Button variant="outline" size="sm" onClick={() => setShowResumeDialog(true)} className="ml-auto">
                            Select Resume
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Profile Info */}
                  <div className="p-5 glass-strong rounded-lg border border-glass-border">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base mb-1">Your Qelsa Profile</h4>
                        <p className="text-sm text-muted-foreground mb-3">Your profile information will be shared with the employer</p>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-neon-green" />
                          <span className="text-sm text-neon-green">Profile ready</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Screening Answers Review */}
                  {hasScreeningQuestions && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base">Screening Answers</h4>
                        <Button variant="ghost" size="sm" onClick={() => setCurrentStep("questions")} className="text-neon-cyan">
                          Edit
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {screeningQuestions.map((question, index) => (
                          <div key={question.id} className="p-4 glass rounded-lg border border-glass-border">
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-neon-cyan/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs text-neon-cyan">Q{index + 1}</span>
                              </div>
                              <div className="flex-1 space-y-2">
                                <p className="text-sm text-muted-foreground">{question.title}</p>
                                <p className="text-sm">{answers[question.id] || <span className="text-muted-foreground italic">Not answered</span>}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="p-4 glass rounded-lg border border-neon-purple/30">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-neon-purple flex-shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm">By submitting this application, you agree to share your Qelsa profile with {companyName}.</p>
                        <p className="text-xs text-muted-foreground">The employer will review your profile and screening answers.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-glass-border bg-black/20">
          <div className="flex items-center justify-between gap-4">
            <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {currentStep === "questions" && hasScreeningQuestions ? (
              <Button onClick={handleNext} className="gradient-animated">
                Continue to Review
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting || !selectedResumeId} className="gradient-animated min-w-[180px]">
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Resume Selection Dialog */}
      <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <DialogContent className="glass max-w-2xl border-glass-border max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">Select Resume</DialogTitle>
            <p className="text-sm text-muted-foreground">Choose which resume to submit with this application</p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {/* Upload New Resume */}
            <div className="p-4 glass-strong rounded-xl border-2 border-dashed border-glass-border hover:border-neon-cyan/50 transition-colors">
              <label htmlFor="resume-upload" className="flex flex-col items-center justify-center cursor-pointer py-4">
                <div className="w-12 h-12 rounded-full bg-neon-cyan/20 border border-neon-cyan/30 flex items-center justify-center mb-3">
                  {isUploadingResume ? <div className="w-6 h-6 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" /> : <Upload className="w-6 h-6 text-neon-cyan" />}
                </div>
                <p className="text-sm mb-1">{isUploadingResume ? "Uploading..." : "Upload New Resume"}</p>
                <p className="text-xs text-muted-foreground">PDF or DOC (max 5MB)</p>
              </label>
              <input id="resume-upload" type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} disabled={isUploadingResume} className="hidden" />
            </div>

            {/* Saved Resumes */}
            <div className="space-y-3">
              {resumes.map((resume) => (
                <button
                  key={resume.id}
                  onClick={() => handleResumeSelect(String(resume.id))}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    resume.id === selectedResumeId ? "border-neon-cyan bg-neon-cyan/10" : "glass-strong border-glass-border hover:border-neon-cyan/50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* {getFileIcon(resume.fileType)} */}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate mb-1">{resume.title}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {/* <span className="uppercase">{resume.fileType}</span> */}
                        {/* <span>•</span>
                        <span>{resume.size}</span> */}
                        <span>•</span>
                        <span>Updated {formatDate(resume.updatedAt)}</span>
                      </div>
                    </div>

                    {resume.id === selectedResumeId && (
                      <div className="w-5 h-5 rounded-full bg-neon-cyan flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-black" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-glass-border">
            <Button variant="outline" onClick={() => setShowResumeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowResumeDialog(false)} className="gradient-animated" disabled={!selectedResumeId}>
              Confirm Selection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
