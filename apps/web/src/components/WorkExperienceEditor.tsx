import { Briefcase, Calendar, Check, Edit3, FileText, GripVertical, Link as LinkIcon, Loader2, MapPin, Plus, Sparkles, Trash2, Upload, Users, X } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

export interface WorkExperience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string | null;
  isPresent: boolean;
  description: string[];
  metrics: Metric[];
  skills: string[];
  teamSize?: number;
  proofs: Proof[];
}

interface Metric {
  id: string;
  type: string;
  value: string;
  outcome: string;
}

interface Proof {
  id: string;
  type: "pdf" | "link" | "doc";
  name: string;
  url: string;
}

interface WorkExperienceEditorProps {
  isOpen: boolean;
  onClose: () => void;
  experiences: WorkExperience[];
  onSave: (experiences: WorkExperience[]) => void;
}

const SUGGESTED_SKILLS = [
  "Product Management",
  "Data Analysis",
  "Leadership",
  "Project Management",
  "Agile",
  "Scrum",
  "SQL",
  "Python",
  "React",
  "Node.js",
  "UX Design",
  "Marketing",
  "Sales",
  "Communication",
  "Strategy",
];

const METRIC_TYPES = ["Revenue", "User Growth", "Cost Reduction", "Efficiency Gain", "Team Growth", "Product Launch", "Customer Satisfaction", "Market Share"];

const SUGGESTED_BULLETS: Record<string, string[]> = {
  "product manager": [
    "Led cross-functional team of [X] members to deliver [product/feature]",
    "Increased user engagement by [X]% through [specific initiative]",
    "Reduced customer churn by [X]% by implementing [solution]",
    "Launched [product] that generated ₹[X] in revenue within [timeframe]",
  ],
  "software engineer": [
    "Developed and deployed [X] features using [technology stack]",
    "Optimized [system/feature] resulting in [X]% performance improvement",
    "Reduced technical debt by [X]% through [specific action]",
    "Built scalable architecture supporting [X] concurrent users",
  ],
  "marketing manager": [
    "Increased brand awareness by [X]% through [campaign/strategy]",
    "Generated [X] qualified leads through [marketing channel]",
    "Improved conversion rate by [X]% via [optimization/initiative]",
    "Managed marketing budget of ₹[X] with [ROI/results]",
  ],
  default: [
    "Achieved [specific outcome] by [action taken]",
    "Led initiative that resulted in [measurable impact]",
    "Improved [metric] by [X]% through [specific method]",
    "Collaborated with [teams/stakeholders] to deliver [result]",
  ],
};

export function WorkExperienceEditor({ isOpen, onClose, experiences: initialExperiences, onSave }: WorkExperienceEditorProps) {
  const [experiences, setExperiences] = useState<WorkExperience[]>(initialExperiences);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState<Partial<WorkExperience>>({
    title: "",
    company: "",
    location: "",
    startDate: "",
    endDate: null,
    isPresent: false,
    description: [""],
    metrics: [],
    skills: [],
    proofs: [],
  });

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [improvementSuggestions, setImprovementSuggestions] = useState<string[]>([]);

  const handleAddNew = () => {
    setEditingId("new");
    setFormData({
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: null,
      isPresent: false,
      description: [""],
      metrics: [],
      skills: [],
      proofs: [],
    });
  };

  const handleEdit = (exp: WorkExperience) => {
    setEditingId(exp.id);
    setFormData(exp);
  };

  const handleDelete = (id: string) => {
    setExperiences(experiences.filter((exp) => exp.id !== id));
    toast.success("Work experience deleted");
  };

  const handleSaveExperience = () => {
    if (!formData.title || !formData.company || !formData.startDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newExperience: WorkExperience = {
      id: editingId === "new" ? Date.now().toString() : editingId!,
      title: formData.title!,
      company: formData.company!,
      location: formData.location!,
      startDate: formData.startDate!,
      endDate: formData.isPresent ? null : formData.endDate!,
      isPresent: formData.isPresent!,
      description: formData.description!.filter((d) => d.trim() !== ""),
      metrics: formData.metrics || [],
      skills: formData.skills || [],
      teamSize: formData.teamSize,
      proofs: formData.proofs || [],
    };

    if (editingId === "new") {
      setExperiences([newExperience, ...experiences]);
    } else {
      setExperiences(experiences.map((exp) => (exp.id === editingId ? newExperience : exp)));
    }

    setEditingId(null);
    toast.success("Work experience saved");
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: null,
      isPresent: false,
      description: [""],
      metrics: [],
      skills: [],
      proofs: [],
    });
  };

  const handleAddDescriptionBullet = () => {
    setFormData({
      ...formData,
      description: [...(formData.description || []), ""],
    });
  };

  const handleRemoveDescriptionBullet = (index: number) => {
    setFormData({
      ...formData,
      description: formData.description!.filter((_, i) => i !== index),
    });
  };

  const handleDescriptionChange = (index: number, value: string) => {
    const newDescription = [...formData.description!];
    newDescription[index] = value;
    setFormData({ ...formData, description: newDescription });
  };

  const handleAddMetric = () => {
    setFormData({
      ...formData,
      metrics: [...(formData.metrics || []), { id: Date.now().toString(), type: "", value: "", outcome: "" }],
    });
  };

  const handleRemoveMetric = (id: string) => {
    setFormData({
      ...formData,
      metrics: formData.metrics!.filter((m) => m.id !== id),
    });
  };

  const handleMetricChange = (id: string, field: keyof Metric, value: string) => {
    setFormData({
      ...formData,
      metrics: formData.metrics!.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    });
  };

  const handleToggleSkill = (skill: string) => {
    const skills = formData.skills || [];
    if (skills.includes(skill)) {
      setFormData({ ...formData, skills: skills.filter((s) => s !== skill) });
    } else {
      setFormData({ ...formData, skills: [...skills, skill] });
    }
  };

  const handleGetSuggestions = () => {
    const jobTitle = formData.title?.toLowerCase() || "";
    let suggestions = SUGGESTED_BULLETS.default;

    for (const [key, value] of Object.entries(SUGGESTED_BULLETS)) {
      if (jobTitle.includes(key)) {
        suggestions = value;
        break;
      }
    }

    setImprovementSuggestions(suggestions);
    setShowSuggestions(true);
  };

  const handleAIRewrite = async (bulletIndex: number) => {
    setAiLoading(true);
    // Simulate AI rewrite
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const originalBullet = formData.description![bulletIndex];
    const rewritten = `Enhanced: ${originalBullet} with measurable impact and action-oriented language`;

    const newDescription = [...formData.description!];
    newDescription[bulletIndex] = rewritten;
    setFormData({ ...formData, description: newDescription });

    setAiLoading(false);
    toast.success("AI rewrite completed!");
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newExperiences = [...experiences];
    const draggedItem = newExperiences[draggedIndex];
    newExperiences.splice(draggedIndex, 1);
    newExperiences.splice(index, 0, draggedItem);

    setExperiences(newExperiences);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSaveAll = () => {
    onSave(experiences);
    onClose();
    toast.success("All changes saved successfully!");
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto glass border border-glass-border">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-black" />
              </div>
              <DialogTitle className="text-2xl">
                <span className="bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">Work Experience</span>
              </DialogTitle>
            </div>
            <Button onClick={onClose} variant="ghost" size="icon" className="glass hover:glass-strong">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <DialogDescription className="sr-only">Manage your work experience history with AI-powered suggestions and metrics tracking</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* List View */}
          {!editingId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Manage your work experience. Drag to reorder.</p>
                <Button onClick={handleAddNew} className="gradient-primary text-white hover:scale-105 transition-all">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Experience
                </Button>
              </div>

              <div className="space-y-3">
                {experiences.map((exp, index) => (
                  <Card
                    key={exp.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className="glass hover:glass-strong p-6 rounded-xl border border-glass-border cursor-move transition-all hover:border-neon-cyan"
                  >
                    <div className="flex items-start gap-4">
                      <GripVertical className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <h3 className="font-bold text-white text-lg">{exp.title}</h3>
                            <p className="text-neon-cyan">{exp.company}</p>
                            <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {exp.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {exp.startDate} - {exp.isPresent ? "Present" : exp.endDate}
                              </span>
                              {exp.teamSize && (
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  Team of {exp.teamSize}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2 flex-shrink-0">
                            <Button onClick={() => handleEdit(exp)} variant="ghost" size="sm" className="glass hover:glass-strong text-neon-cyan">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button onClick={() => handleDelete(exp.id)} variant="ghost" size="sm" className="glass hover:glass-strong text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {exp.description.length > 0 && (
                          <ul className="space-y-1 mb-3">
                            {exp.description.slice(0, 2).map((desc, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-neon-cyan mt-1">•</span>
                                <span>{desc}</span>
                              </li>
                            ))}
                            {exp.description.length > 2 && <li className="text-sm text-neon-purple">+{exp.description.length - 2} more...</li>}
                          </ul>
                        )}

                        {exp.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {exp.skills.map((skill, idx) => (
                              <Badge key={idx} variant="outline" className="border-neon-cyan/30 text-neon-cyan text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={onClose} className="glass hover:glass-strong">
                  Cancel
                </Button>
                <Button onClick={handleSaveAll} className="gradient-primary text-white hover:scale-105 transition-all">
                  <Check className="h-4 w-4 mr-2" />
                  Save All Changes
                </Button>
              </div>
            </div>
          )}

          {/* Edit Form */}
          {editingId && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-glass-border">
                <h3 className="text-xl font-bold text-white">{editingId === "new" ? "Add New Experience" : "Edit Experience"}</h3>
                <Button onClick={handleGetSuggestions} variant="outline" size="sm" className="glass hover:glass-strong border-neon-purple text-neon-purple">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get AI Suggestions
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Job Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white">
                    Job Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Senior Product Manager"
                    className="glass border-glass-border focus:border-neon-cyan"
                  />
                </div>

                {/* Company Name */}
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-white">
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g., TechFlow Solutions"
                    className="glass border-glass-border focus:border-neon-cyan"
                  />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-white">
                    Location <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Bangalore, India"
                    className="glass border-glass-border focus:border-neon-cyan"
                  />
                </div>

                {/* Team Size */}
                <div className="space-y-2">
                  <Label htmlFor="teamSize" className="text-white">
                    Team Size (Optional)
                  </Label>
                  <Input
                    id="teamSize"
                    type="number"
                    value={formData.teamSize || ""}
                    onChange={(e) => setFormData({ ...formData, teamSize: parseInt(e.target.value) || undefined })}
                    placeholder="e.g., 12"
                    className="glass border-glass-border focus:border-neon-cyan"
                  />
                </div>

                {/* Start Date */}
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-white">
                    Start Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="month"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="glass border-glass-border focus:border-neon-cyan"
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-white">
                    End Date
                  </Label>
                  <div className="space-y-3">
                    <Input
                      id="endDate"
                      type="month"
                      value={formData.endDate || ""}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      disabled={formData.isPresent}
                      className="glass border-glass-border focus:border-neon-cyan disabled:opacity-50"
                    />
                    <div className="flex items-center gap-2">
                      <Checkbox id="isPresent" checked={formData.isPresent} onCheckedChange={(checked) => setFormData({ ...formData, isPresent: checked as boolean, endDate: null })} />
                      <Label htmlFor="isPresent" className="text-sm text-muted-foreground cursor-pointer">
                        I currently work here
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Bullets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Key Achievements & Responsibilities</Label>
                  <Button onClick={handleAddDescriptionBullet} variant="outline" size="sm" className="glass hover:glass-strong border-neon-cyan/30 text-neon-cyan">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Bullet
                  </Button>
                </div>

                <div className="space-y-3">
                  {formData.description?.map((bullet, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex gap-2">
                        <Textarea
                          value={bullet}
                          onChange={(e) => handleDescriptionChange(index, e.target.value)}
                          placeholder="e.g., Led cross-functional team to deliver..."
                          rows={2}
                          className="glass border-glass-border focus:border-neon-cyan"
                        />
                        <div className="flex flex-col gap-2">
                          <Button onClick={() => handleRemoveDescriptionBullet(index)} variant="ghost" size="icon" className="glass hover:glass-strong text-destructive flex-shrink-0">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button onClick={() => handleAIRewrite(index)} variant="ghost" size="icon" className="glass hover:glass-strong text-neon-purple flex-shrink-0" disabled={aiLoading}>
                            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Suggestions Panel */}
              {showSuggestions && (
                <Card className="glass border-neon-purple/30 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-neon-purple" />
                      <span className="font-medium text-white">AI Suggestions</span>
                    </div>
                    <Button onClick={() => setShowSuggestions(false)} variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {improvementSuggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          const desc = [...formData.description!];
                          desc[desc.length - 1] = suggestion;
                          setFormData({ ...formData, description: desc });
                          toast.success("Suggestion applied!");
                        }}
                        className="p-3 glass hover:glass-strong rounded-lg cursor-pointer transition-all hover:border-neon-purple border border-transparent"
                      >
                        <p className="text-sm text-muted-foreground">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Metrics */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Metrics & Impact</Label>
                  <Button onClick={handleAddMetric} variant="outline" size="sm" className="glass hover:glass-strong border-neon-green/30 text-neon-green">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Metric
                  </Button>
                </div>

                <div className="space-y-3">
                  {formData.metrics?.map((metric) => (
                    <Card key={metric.id} className="glass border-glass-border p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">Metric Type</Label>
                          <select
                            value={metric.type}
                            onChange={(e) => handleMetricChange(metric.id, "type", e.target.value)}
                            className="w-full glass border border-glass-border rounded-lg px-3 py-2 text-sm focus:border-neon-cyan focus:outline-none bg-transparent text-white"
                          >
                            <option value="" className="bg-gray-900">
                              Select type
                            </option>
                            {METRIC_TYPES.map((type) => (
                              <option key={type} value={type} className="bg-gray-900">
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">Value</Label>
                          <Input
                            value={metric.value}
                            onChange={(e) => handleMetricChange(metric.id, "value", e.target.value)}
                            placeholder="e.g., 40%, ₹2.5Cr, 10K users"
                            className="glass border-glass-border focus:border-neon-cyan text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">Outcome</Label>
                          <div className="flex gap-2">
                            <Input
                              value={metric.outcome}
                              onChange={(e) => handleMetricChange(metric.id, "outcome", e.target.value)}
                              placeholder="e.g., increased engagement"
                              className="glass border-glass-border focus:border-neon-cyan text-sm"
                            />
                            <Button onClick={() => handleRemoveMetric(metric.id)} variant="ghost" size="icon" className="glass hover:glass-strong text-destructive flex-shrink-0">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-3">
                <Label className="text-white">Skills Used</Label>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_SKILLS.map((skill) => (
                    <Badge
                      key={skill}
                      onClick={() => handleToggleSkill(skill)}
                      variant={formData.skills?.includes(skill) ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${
                        formData.skills?.includes(skill) ? "bg-gradient-to-r from-neon-cyan to-neon-purple text-black border-0" : "border-glass-border hover:border-neon-cyan"
                      }`}
                    >
                      {skill}
                      {formData.skills?.includes(skill) && <Check className="h-3 w-3 ml-1" />}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Proofs Section */}
              <div className="space-y-3">
                <Label className="text-white">Upload Proof (Optional)</Label>
                <Card className="glass border-glass-border border-dashed p-6">
                  <div className="flex flex-col items-center justify-center gap-3 text-center">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-white">Upload documents or add links</p>
                      <p className="text-xs text-muted-foreground mt-1">PDFs, documents, or URLs to verify your experience</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="glass hover:glass-strong border-glass-border">
                        <FileText className="h-4 w-4 mr-2" />
                        Upload File
                      </Button>
                      <Button variant="outline" size="sm" className="glass hover:glass-strong border-glass-border">
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Add Link
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-glass-border">
                <Button variant="outline" onClick={handleCancel} className="glass hover:glass-strong">
                  Cancel
                </Button>
                <Button onClick={handleSaveExperience} className="gradient-primary text-white hover:scale-105 transition-all">
                  <Check className="h-4 w-4 mr-2" />
                  Save Experience
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
