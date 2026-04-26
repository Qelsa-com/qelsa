import { ScreeningQuestion } from "@/types/question";
import { AlertCircle, CheckCircle, CheckCircle2, ChevronDown, ChevronUp, Eye, GripVertical, Plus, Sparkles, Trash2, TrendingUp, XCircle, Zap } from "lucide-react";
import { useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";

interface ScreeningQuestionsBuilderProps {
  questions: ScreeningQuestion[];
  onChange: (questions: ScreeningQuestion[]) => void;
  jobTitle?: string;
  jobDescription?: string;
  isPremium?: boolean;
}

interface QuestionTemplate {
  id: string;
  name: string;
  category: "essentials" | "skills" | "logistics";
  questions: Omit<ScreeningQuestion, "id">[];
  description: string;
}

const QUESTION_TEMPLATES: QuestionTemplate[] = [
  {
    id: "essentials-1",
    name: "Essential Requirements",
    category: "essentials",
    description: "Core eligibility questions",
    questions: [
      {
        type: "yes_no",
        title: "Are you legally authorized to work in this country?",
        required: true,
        is_knockout: true,
        weight: 0,
        knockout_condition: "equals",
        knockout_value: "no",
      },
      {
        type: "yes_no",
        title: "Do you meet the minimum experience requirement for this role?",
        required: true,
        is_knockout: true,
        weight: 0,
        knockout_condition: "equals",
        knockout_value: "no",
      },
    ],
  },
  {
    id: "skills-1",
    name: "Skills Assessment",
    category: "skills",
    description: "Technical and soft skills evaluation",
    questions: [
      {
        type: "scale",
        title: "Rate your proficiency in [primary skill]",
        required: true,
        is_knockout: false,
        weight: 30,
        min_value: 1,
        max_value: 5,
      },
      {
        type: "multiple_choice",
        title: "Which tools/technologies are you proficient in?",
        required: true,
        is_knockout: false,
        weight: 25,
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
      },
    ],
  },
  {
    id: "logistics-1",
    name: "Logistics & Availability",
    category: "logistics",
    description: "Work arrangement preferences",
    questions: [
      {
        type: "multiple_choice",
        title: "What is your preferred work arrangement?",
        required: true,
        is_knockout: false,
        weight: 15,
        options: ["Remote", "Hybrid", "On-site", "Flexible"],
      },
      {
        type: "short_text",
        title: "What is your expected salary range?",
        required: false,
        is_knockout: false,
        weight: 10,
        max_length: 100,
      },
    ],
  },
];

export function ScreeningQuestionsBuilder({ questions, onChange, jobTitle, jobDescription, isPremium = false }: ScreeningQuestionsBuilderProps) {
  const [showTemplates, setShowTemplates] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [showUpgradeNudge, setShowUpgradeNudge] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [aiSuggestions, setAiSuggestions] = useState<ScreeningQuestion[]>([]);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiUsageCount, setAiUsageCount] = useState(2); // Simulated usage counter

  const totalWeight = questions.reduce((sum, q) => sum + (q.is_knockout ? 0 : q.weight), 0);
  const knockoutCount = questions.filter((q) => q.is_knockout).length;

  // Add question from template
  const addTemplateQuestions = (template: QuestionTemplate) => {
    const newQuestions = template.questions.map((q) => ({
      ...q,
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }));
    onChange([...questions, ...newQuestions]);
  };

  // Add blank question
  const addBlankQuestion = () => {
    const newQuestion: ScreeningQuestion = {
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "multiple_choice",
      title: "",
      required: true,
      is_knockout: false,
      weight: 10,
      options: ["Option 1", "Option 2"],
      min_value: 1,
      max_value: 5
    };
    onChange([...questions, newQuestion]);
    setExpandedQuestions(new Set([...expandedQuestions, newQuestion.id]));
  };

  // Update question
  const updateQuestion = (id: string, updates: Partial<ScreeningQuestion>) => {
    const updated_questions = questions.map((q) => (q.id === id ? { ...q, ...updates } : q))
    console.log("🚀 ~ updateQuestion ~ updated_questions:", updated_questions)
    onChange(updated_questions);
  };

  // Delete question
  const deleteQuestion = (id: string) => {
    onChange(questions.filter((q) => q.id !== id));
    const newExpanded = new Set(expandedQuestions);
    newExpanded.delete(id);
    setExpandedQuestions(newExpanded);
  };

  // Toggle question expansion
  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedQuestions(newExpanded);
  };

  // Add option to multiple choice
  const addOption = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (question && question.options) {
      updateQuestion(questionId, {
        options: [...question.options, `Option ${question.options.length + 1}`],
      });
    }
  };

  // Remove option from multiple choice
  const removeOption = (questionId: string, index: number) => {
    const question = questions.find((q) => q.id === questionId);
    if (question && question.options && question.options.length > 2) {
      updateQuestion(questionId, {
        options: question.options.filter((_, i) => i !== index),
      });
    }
  };

  // Update option text
  const updateOption = (questionId: string, index: number, value: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (question && question.options) {
      const newOptions = [...question.options];
      newOptions[index] = value;
      updateQuestion(questionId, { options: newOptions });
    }
  };

  // AI Generate Questions - AVAILABLE TO ALL USERS
  const handleGenerateAI = async () => {
    setIsGenerating(true);
    setAiUsageCount((prev) => prev + 1);

    // Simulate AI generation
    setTimeout(() => {
      const generated: ScreeningQuestion[] = [
        {
          id: `ai-${Date.now()}-1`,
          type: "yes_no",
          title: `Do you have at least 3 years of experience in ${jobTitle?.split(" ")[0] || "this field"}?`,
          required: true,
          is_knockout: true,
          weight: 0,
          // knockout_condition: "equals",
          // knockout_value: "no",
        },
        {
          id: `ai-${Date.now()}-2`,
          type: "scale",
          title: "Rate your proficiency with the primary technology stack mentioned in the job description",
          required: true,
          is_knockout: false,
          weight: 30,
          min_value: 1,
          max_value: 5,
        },
        {
          id: `ai-${Date.now()}-3`,
          type: "multiple_choice",
          title: "Which best describes your work arrangement preference?",
          required: true,
          is_knockout: false,
          weight: 20,
          options: ["Remote only", "Hybrid (2-3 days office)", "On-site preferred", "Fully flexible"],
        },
      ];
      setAiSuggestions(generated);
      setShowAISuggestions(true);
      setIsGenerating(false);

      // Show upgrade nudge after successful generation (soft limit)
      if (!isPremium && aiUsageCount >= 5) {
        setTimeout(() => setShowUpgradeNudge(true), 2000);
      }
    }, 1500);
  };

  // AI Rewrite Question - AVAILABLE TO ALL USERS
  const handleRewriteAI = (questionId: string) => {
    setAiUsageCount((prev) => prev + 1);

    const question = questions.find((q) => q.id === questionId);
    if (question) {
      // Simulate AI rewrite with improved phrasing
      const improvements = [
        { from: /you /gi, to: "you " },
        { from: /your /gi, to: "your " },
      ];

      let improved = question.title;
      if (!question.title.includes("Please provide")) {
        improved += " Please provide specific examples.";
      }

      updateQuestion(questionId, { title: improved });

      // Show upgrade nudge after multiple uses
      if (!isPremium && aiUsageCount >= 5) {
        setTimeout(() => setShowUpgradeNudge(true), 1000);
      }
    }
  };

  // Apply AI suggestion - AVAILABLE TO ALL USERS
  const applyAISuggestion = (suggestion: ScreeningQuestion) => {
    onChange([...questions, suggestion]);
    setAiSuggestions(aiSuggestions.filter((s) => s.id !== suggestion.id));
  };

  // Apply all AI suggestions
  const applyAllAISuggestions = () => {
    onChange([...questions, ...aiSuggestions]);
    setAiSuggestions([]);
    setShowAISuggestions(false);
  };

  // Validation warnings
  const getValidationWarnings = () => {
    const warnings: string[] = [];
    if (questions.length > 8) {
      warnings.push("Consider reducing questions to 6-8 for better completion rates");
    }
    if (knockoutCount > 3) {
      warnings.push("Too many knockout questions may reduce applicant pool");
    }
    if (totalWeight > 0 && Math.abs(totalWeight - 100) > 5) {
      warnings.push("Question weights should sum to approximately 100%");
    }
    return warnings;
  };

  const warnings = getValidationWarnings();

  return (
    <div className="space-y-6">
      {/* Header with AI Usage Badge */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg">Screening Questions</h3>
            {!isPremium && aiUsageCount > 0 && (
              <Badge variant="outline" className="border-neon-purple/30 text-neon-purple text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                {aiUsageCount} AI uses this month
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">Add questions to pre-screen candidates automatically</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </Button>
          <Button variant="outline" size="sm" onClick={handleGenerateAI} disabled={isGenerating} className="gap-2 glass border-neon-purple/30 hover:border-neon-purple hover:glow-purple">
            <Sparkles className="w-4 h-4 text-neon-purple" />
            {isGenerating ? "Generating..." : "AI Generate"}
          </Button>
        </div>
      </div>

      {/* Validation Warnings */}
      {warnings.length > 0 && (
        <div className="glass border-neon-yellow/30 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-neon-yellow">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Recommendations</span>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1 ml-6">
            {warnings.map((warning, index) => (
              <li key={index} className="list-disc">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Question Templates */}
      {showTemplates && questions.length === 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm">Quick Start Templates</h4>
            <Button variant="ghost" size="sm" onClick={() => setShowTemplates(false)}>
              Hide
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {QUESTION_TEMPLATES.map((template) => (
              <button key={template.id} onClick={() => addTemplateQuestions(template)} className="glass rounded-lg p-4 text-left hover:border-neon-cyan/50 hover:glow-cyan transition-all group">
                <div className="flex items-start justify-between mb-2">
                  <Badge
                    variant="outline"
                    className={
                      template.category === "essentials"
                        ? "border-neon-cyan/30 text-neon-cyan"
                        : template.category === "skills"
                        ? "border-neon-purple/30 text-neon-purple"
                        : "border-neon-pink/30 text-neon-pink"
                    }
                  >
                    {template.category}
                  </Badge>
                  <Plus className="w-4 h-4 text-muted-foreground group-hover:text-neon-cyan transition-colors" />
                </div>
                <h5 className="text-sm mb-1">{template.name}</h5>
                <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{template.questions.length} questions</span>
                  <span>•</span>
                  <span>{template.questions.filter((q) => q.is_knockout).length} knockout</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Suggestions - Fully Accessible */}
      {showAISuggestions && aiSuggestions.length > 0 && (
        <div className="glass border-neon-purple/30 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-neon-purple" />
              <h4 className="text-sm">AI-Generated Suggestions</h4>
              <Badge variant="outline" className="border-neon-green/30 text-neon-green text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Ready to use
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={applyAllAISuggestions} className="text-neon-purple hover:text-neon-purple">
                Add All
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowAISuggestions(false)}>
                Dismiss
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            {aiSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="glass-strong rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm">{suggestion.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {suggestion.type}
                      </Badge>
                      {suggestion.is_knockout ? (
                        <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">
                          Knockout
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs border-neon-cyan/30 text-neon-cyan">
                          Weight: {suggestion.weight}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => applyAISuggestion(suggestion)} className="gradient-animated">
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-3">
        {questions.map((question, index) => (
          <div key={question.id} className="glass rounded-lg overflow-hidden transition-all">
            {/* Question Header */}
            <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/5" onClick={() => toggleExpanded(question.id)}>
              <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-muted-foreground">Q{index + 1}</span>
                  {question.is_knockout ? (
                    <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">
                      Knockout
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs border-neon-cyan/30 text-neon-cyan">
                      {question.weight}%
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {question.type}
                  </Badge>
                </div>
                <p className="text-sm truncate">{question.title || "Untitled question"}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteQuestion(question.id);
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                {expandedQuestions.has(question.id) ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </div>

            {/* Question Editor */}
            {expandedQuestions.has(question.id) && (
              <div className="border-t border-glass-border p-4 space-y-4">
                {/* Question Text */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Question</Label>
                    <Button variant="ghost" size="sm" onClick={() => handleRewriteAI(question.id)} className="gap-2 text-xs h-7 text-neon-purple hover:text-neon-purple">
                      <Sparkles className="w-3 h-3" />
                      Improve with AI
                    </Button>
                  </div>
                  <Textarea value={question.title} onChange={(e) => updateQuestion(question.id, { title: e.target.value })} placeholder="Enter your question..." rows={2} className="resize-none" />
                </div>

                {/* Question Type */}
                <div className="space-y-2">
                  <Label>Question Type</Label>
                  <Select value={question.type} onValueChange={(value: any) => updateQuestion(question.id, { type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                      <SelectItem value="yes_no">Yes/No</SelectItem>
                      <SelectItem value="scale">Rating Scale</SelectItem>
                      <SelectItem value="short_text">Short Text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Options for Multiple Choice */}
                {question.type === "multiple_choice" && (
                  <div className="space-y-2">
                    <Label>Answer Options</Label>
                    <div className="space-y-2">
                      {question.options?.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <Input value={typeof option === "string" ? option : option.title as string} onChange={(e) => updateOption(question.id, optIndex, e.target.value)} placeholder={`Option ${optIndex + 1}`} />
                          {question.options && question.options.length > 2 && (
                            <Button variant="ghost" size="sm" onClick={() => removeOption(question.id, optIndex)}>
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => addOption(question.id)} className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Option
                      </Button>
                    </div>
                  </div>
                )}

                {/* Scale Range */}
                {question.type === "scale" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Minimum Value</Label>
                      <Input type="number" value={question.min_value || 1} onChange={(e) => updateQuestion(question.id, { min_value: parseInt(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Maximum Value</Label>
                      <Input type="number" value={question.max_value || 5} onChange={(e) => updateQuestion(question.id, { max_value: parseInt(e.target.value) })} />
                    </div>
                  </div>
                )}

                {/* Knockout Settings */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Knockout Question</Label>
                      <p className="text-xs text-muted-foreground">Auto-reject if condition not met</p>
                    </div>
                    <Switch
                      checked={question.is_knockout}
                      onCheckedChange={(checked) =>
                        updateQuestion(question.id, {
                          is_knockout: checked,
                          weight: checked ? 0 : 10,
                        })
                      }
                    />
                  </div>

                  {question.is_knockout && (
                    <div className="glass-strong rounded-lg p-3 space-y-3">
                      <div className="space-y-2">
                        <Label>Knockout Condition</Label>
                        <Select value={question.knockout_condition} onValueChange={(value: any) => updateQuestion(question.id, { knockout_condition: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="less-than">Less than</SelectItem>
                            <SelectItem value="greater-than">Greater than</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Knockout Value</Label>
                        <Input value={question.knockout_value || ""} onChange={(e) => updateQuestion(question.id, { knockout_value: e.target.value })} placeholder="e.g., 'no' or '3'" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Weight Slider (if not knockout) */}
                {!question.is_knockout && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Question Weight</Label>
                      <span className="text-sm text-neon-cyan">{question.weight}%</span>
                    </div>
                    <Slider value={[question.weight]} onValueChange={([value]) => updateQuestion(question.id, { weight: value })} min={0} max={100} step={5} className="py-4" />
                    <p className="text-xs text-muted-foreground">Higher weight = more important for overall score</p>
                  </div>
                )}

                {/* Required Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Required Question</Label>
                    <p className="text-xs text-muted-foreground">Candidates must answer to submit</p>
                  </div>
                  <Switch checked={question.required} onCheckedChange={(checked) => updateQuestion(question.id, { required: checked })} />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add Question Button */}
        <Button variant="outline" onClick={addBlankQuestion} className="w-full glass hover:border-neon-cyan/50 hover:glow-cyan">
          <Plus className="w-4 h-4 mr-2" />
          Add Custom Question
        </Button>
      </div>

      {/* Scoring Summary */}
      {questions.length > 0 && (
        <div className="glass border-neon-cyan/30 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-neon-cyan">
            <Zap className="w-4 h-4" />
            <h4 className="text-sm">Scoring Preview</h4>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total Questions</p>
              <p className="text-xl">{questions.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Knockout</p>
              <p className="text-xl text-destructive">{knockoutCount}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Scored Weight</p>
              <p className={`text-xl ${Math.abs(totalWeight - 100) > 5 ? "text-neon-yellow" : "text-neon-green"}`}>{totalWeight}%</p>
            </div>
          </div>
          <div className="pt-2 border-t border-glass-border space-y-2">
            <p className="text-xs text-muted-foreground">Scoring Flow:</p>
            <ol className="text-xs text-muted-foreground space-y-1 ml-4 list-decimal">
              <li>Check knockout questions first - auto-reject if conditions not met</li>
              <li>Calculate weighted score from remaining questions</li>
              <li>Rank candidates by total score for review</li>
            </ol>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl glass border-glass-border">
          <DialogHeader>
            <DialogTitle>Candidate Preview</DialogTitle>
            <DialogDescription>How candidates will see your screening questions</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={question.id} className="glass-strong rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-muted-foreground">Question {index + 1}</span>
                        {question.required && (
                          <Badge variant="outline" className="text-xs border-neon-cyan/30 text-neon-cyan">
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{question.title || "Untitled question"}</p>
                    </div>
                  </div>

                  {/* Preview answer format */}
                  {question.type === "multiple_choice" && (
                    <div className="space-y-2">
                      {question.options?.map((option, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border border-glass-border" />
                          <span className="text-sm text-muted-foreground">{typeof option === "string" ? option : option.title}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {question.type === "yes_no" && (
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border border-glass-border" />
                        <span className="text-sm text-muted-foreground">Yes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border border-glass-border" />
                        <span className="text-sm text-muted-foreground">No</span>
                      </div>
                    </div>
                  )}

                  {question.type === "scale" && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{question.min_value || 1}</span>
                        <span>{question.max_value || 5}</span>
                      </div>
                      <div className="h-2 glass rounded-full" />
                    </div>
                  )}

                  {question.type === "short_text" && <div className="glass rounded p-3 text-sm text-muted-foreground">Text input area...</div>}
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button onClick={() => setShowPreview(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Soft Upgrade Nudge - Only shows AFTER task completion */}
      <Dialog open={showUpgradeNudge} onOpenChange={setShowUpgradeNudge}>
        <DialogContent className="max-w-md glass border-glass-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-neon-purple" />
              You&apos;re on a roll!
            </DialogTitle>
            <DialogDescription>You&apos;ve used AI {aiUsageCount} times this month. Great work!</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Card className="glass-strong p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-neon-purple/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-neon-purple" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm mb-1">Upgrade to Premium</h4>
                  <p className="text-xs text-muted-foreground mb-3">Get unlimited AI generations, advanced scoring analytics, and priority support</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className="w-3 h-3 text-neon-green" />
                      <span className="text-muted-foreground">Unlimited AI question generation</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className="w-3 h-3 text-neon-green" />
                      <span className="text-muted-foreground">Advanced candidate analytics</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className="w-3 h-3 text-neon-green" />
                      <span className="text-muted-foreground">Custom scoring algorithms</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            <p className="text-xs text-muted-foreground text-center">Free plan: 10 AI uses per month • Premium: Unlimited</p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowUpgradeNudge(false)} className="flex-1">
              Maybe Later
            </Button>
            <Button onClick={() => setShowUpgradeNudge(false)} className="flex-1 gradient-animated">
              <TrendingUp className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
