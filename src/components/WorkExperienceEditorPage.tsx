import { useLazySearchCompaniesQuery } from "@/features/api/companiesApi";
import { useCreateExperienceMutation, useDeleteExperienceMutation, useGetExperiencesQuery, useUpdateExperienceMutation, useUpdateExperiencesPositionMutation } from "@/features/api/experiencesApi";
import { useLazySearchJobTitlesQuery } from "@/features/api/jobTitlesApi";
import { useGetUserSkillsQuery } from "@/features/api/userSkillsApi";
import { Company } from "@/types/company";
import { Experience } from "@/types/experience";
import { JobTitle } from "@/types/jobTitle";
import { ImpactMetric } from "@/types/impactMetric";
import { UserSkill } from "@/types/userSkill";
import { ArrowLeft, Briefcase, Building2, Calendar, Check, Edit3, GripVertical, Loader2, MapPin, Plus, Search, Sparkles, Trash2, TrendingUp, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

const METRIC_TYPES = ["Revenue", "Cost Savings", "User Growth", "Efficiency Improvement", "Customer Satisfaction", "Team Performance", "Time Saved", "Quality Improvement"];


export function WorkExperienceEditorPage() {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const { data: exp, error, isLoading } = useGetExperiencesQuery();
  const { data: user_skills, error: skillError, isLoading: skillLoading } = useGetUserSkillsQuery();
  const [createExperience, { isLoading: isCreating, error: createError }] = useCreateExperienceMutation();
  const [updateExperience, { isLoading: isUpdating, error: updateError }] = useUpdateExperienceMutation();
  const [deleteExperience, { isLoading: isDeleting, error: deleteError }] = useDeleteExperienceMutation();
  const [updateExperiencesPosition, { isLoading: isUpdatingPosition, error: updatePositionError }] = useUpdateExperiencesPositionMutation();
  const [triggerCompanySearch, { data: companyResults = [] }] = useLazySearchCompaniesQuery();
  const [triggerJobTitleSearch, { data: jobTitleResults = [] }] = useLazySearchJobTitlesQuery();

  const [companySearch, setCompanySearch] = useState("");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [jobTitleSearch, setJobTitleSearch] = useState("");
  const [showJobTitleDropdown, setShowJobTitleDropdown] = useState(false);

  const [experiences, setExperiences] = useState<Experience[]>(exp || []);

  useEffect(() => {
    if (exp) {
      setExperiences(exp);
    }
  }, [exp]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (companySearch.length >= 2) {
        triggerCompanySearch(companySearch);
        setShowCompanyDropdown(true);
      } else {
        setShowCompanyDropdown(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [companySearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (jobTitleSearch.length >= 2) {
        triggerJobTitleSearch(jobTitleSearch);
        setShowJobTitleDropdown(true);
      } else {
        setShowJobTitleDropdown(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [jobTitleSearch]);

  const [formData, setFormData] = useState<Partial<Experience>>({
    job_title: undefined,
    company: undefined,
    location: "",
    start_date: undefined,
    end_date: undefined,
    is_current: false,
    responsibilities: [],
    impact_metrics: [],
    skills: [],
    team_size: undefined,
  });

  const handleAddNew = () => {
    setEditingId("new");
    setCompanySearch("");
    setJobTitleSearch("");
    setShowCompanyDropdown(false);
    setShowJobTitleDropdown(false);
    setFormData({
      job_title: undefined,
      company: undefined,
      location: "",
      start_date: undefined,
      end_date: undefined,
      is_current: false,
      responsibilities: [],
      impact_metrics: [],
      skills: [],
      team_size: undefined,
    });
  };

  const handleEdit = (exp: Experience) => {
    setEditingId(exp.id.toString());
    setCompanySearch("");
    setJobTitleSearch("");
    setShowCompanyDropdown(false);
    setShowJobTitleDropdown(false);
    setFormData(exp);
  };

  const handleDelete = (id: any) => {
    deleteExperience(id);
    toast.success("Experience entry deleted");
  };

  const handleSaveExperience = () => {
    if (!formData.job_title || !formData.company || !formData.start_date) {
      return;
    }

    let newExperience: Experience = {
      job_title: formData.job_title!,
      company: formData.company!,
      location: formData.location!,
      start_date: formData.start_date!,
      end_date: formData.end_date,
      is_current: formData.is_current!,
      responsibilities: (formData.responsibilities || []).filter((r) => r.title.trim() !== ""),
      impact_metrics: (formData.impact_metrics || []).filter((m) => m.impact_type.trim() !== "" || m.impact_value.trim() !== ""),
      skills: formData.skills || [],
      team_size: formData.team_size,
    };

    if (editingId !== "new") newExperience.id = Number(editingId);

    if (editingId === "new") {
      createExperience(newExperience)
        .unwrap()
        .then(() => {
          toast.success("Education entry saved");
          window.location.href = "/profile/work-experience";
        })
        .catch((error) => {
          toast.error(error?.data?.message || "Failed to save education entry");
        });
    } else {
      updateExperience({
        id: Number(editingId),
        data: newExperience,
      })
        .unwrap()
        .then(() => {
          toast.success("Experience entry updated");
          setEditingId(null);
        })
        .catch((error) => {
          toast.error(error?.data?.message || "Failed to update experience entry");
        });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleAddBullet = () => {
    setFormData({
      ...formData,
      responsibilities: [...(formData.responsibilities || []), { title: "" }],
    });
  };

  const handleRemoveBullet = (index: number) => {
    setFormData({
      ...formData,
      responsibilities: formData.responsibilities!.filter((_, i) => i !== index),
    });
  };

  const handleBulletChange = (index: number, value: string) => {
    const newResponsibilities = [...(formData.responsibilities || [])];

    newResponsibilities[index] = {
      ...newResponsibilities[index],
      title: value, // ✅ update title
    };

    setFormData({
      ...formData,
      responsibilities: newResponsibilities,
    });
  };

  const handleAIRewriteBullet = async (index: number) => {
    setAiLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const original = formData.responsibilities![index].title;

    const enhanced = `Led ${original.toLowerCase()} resulting in 40% improvement in team efficiency and stakeholder satisfaction`;

    const newResponsibilities = [...formData.responsibilities!];

    newResponsibilities[index] = {
      ...newResponsibilities[index],
      title: enhanced,
    };

    setFormData({
      ...formData,
      responsibilities: newResponsibilities,
    });

    setAiLoading(false);
  };

  const handleAddMetric = () => {
    setFormData({
      ...formData,
      impact_metrics: [...(formData.impact_metrics || []), { impact_type: "", impact_value: "", description: "" }],
    });
  };

  const handleRemoveMetric = (index: number) => {
    setFormData({
      ...formData,
      impact_metrics: (formData.impact_metrics || []).filter((_, i) => i !== index),
    });
  };

  const handleMetricChange = (index: number, field: keyof ImpactMetric, value: string) => {
    const updated = [...(formData.impact_metrics || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, impact_metrics: updated });
  };

  const handleAddSkill = (skill: UserSkill) => {
    const exists = formData.skills?.some((s) => s.id === skill.id);

    if (!exists) {
      setFormData({
        ...formData,
        skills: [...(formData.skills || []), skill], // ✅ full object
      });
    }
  };

  const handleRemoveSkill = (skillId: number) => {
    setFormData({
      ...formData,
      skills: formData.skills!.filter((s) => s.id !== skillId),
    });
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
    // Update the position field for each experience based on its index (starting from 1)
    const updatedExperiences = experiences.map((exp, idx) => ({
      ...exp,
      position: (idx + 1).toString(),
    }));
    setExperiences(updatedExperiences);
  };

  const handleSaveAll = () => {
    try {
      updateExperiencesPosition(experiences);
      toast.success("Experience position updated!");
    } catch (error) {
      toast.error("Failed to update experience position.");
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/3 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-neon-purple/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" className="glass hover:glass-strong mb-4" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-neon-cyan to-neon-purple flex items-center justify-center">
                <Briefcase className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">
                  <span className="bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">Work Experience</span>
                </h1>
                <p className="text-muted-foreground mt-1">Manage your professional journey with AI-powered tools</p>
              </div>
            </div>
          </div>
        </div>

        {/* List View */}
        {!editingId && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">
                  {experiences?.length} work {experiences?.length === 1 ? "experience" : "experiences"} • Drag to reorder
                </p>
              </div>
              <Button onClick={handleAddNew} className="bg-gradient-to-r from-neon-cyan to-neon-purple text-white hover:scale-105 transition-all">
                <Plus className="h-4 w-4 mr-2" />
                Add Experience
              </Button>
            </div>

            <div className="space-y-4">
              {experiences?.map((exp, index) => (
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
                          <h3 className="font-bold text-white text-lg">{exp.job_title?.name}</h3>
                          <p className="text-neon-cyan">{exp.company?.name}</p>
                          <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {/* {exp.duration} */}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {exp.location}
                            </span>
                            {exp.team_size && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                Team of {exp.team_size}
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

                      {exp.responsibilities &&
                        exp.responsibilities.length > 0 &&
                        (() => {
                          const validResponsibilities = exp.responsibilities.filter((r) => r.title?.trim());

                          return (
                            <ul className="space-y-1 mb-3">
                              {validResponsibilities.slice(0, 3).map((bullet, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-neon-cyan mt-1">•</span>
                                  <span>{bullet.title}</span>
                                </li>
                              ))}

                              {validResponsibilities.length > 3 && <li className="text-sm text-neon-pink">+{validResponsibilities.length - 3} more achievements...</li>}
                            </ul>
                          );
                        })()}

                      {exp.impact_metrics && exp.impact_metrics.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {exp.impact_metrics.map((metric, idx) => (
                            <Badge key={metric.id ?? idx} variant="outline" className="border-neon-green/30 text-neon-green">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              {metric.impact_value}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {exp.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {exp.skills.slice(0, 5).map((skill) => (
                            <Badge key={skill.id} variant="outline" className="border-neon-purple/30 text-neon-purple text-xs">
                              {skill.title}
                            </Badge>
                          ))}
                          {exp.skills.length > 5 && (
                            <Badge variant="outline" className="border-neon-pink/30 text-neon-pink text-xs">
                              +{exp.skills.length - 5} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {experiences?.length > 0 && (
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" className="glass hover:glass-strong">
                  Cancel
                </Button>
                <Button onClick={handleSaveAll} className="bg-gradient-to-r from-neon-cyan to-neon-purple text-white hover:scale-105 transition-all">
                  <Check className="h-4 w-4 mr-2" />
                  Save All Changes
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Edit Form */}
        {editingId && (
          <Card className="glass p-8 rounded-2xl border border-glass-border">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-glass-border">
                <h2 className="text-2xl font-bold text-white">{editingId === "new" ? "Add New Experience" : "Edit Experience"}</h2>
                <Badge className="bg-glass-bg text-neon-cyan border-glass-border">All fields with * are required</Badge>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Job Title Search-Select */}
                <div className="space-y-2 relative">
                  <Label htmlFor="job_title" className="text-white">
                    Job Title <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="job_title"
                      value={formData.job_title ? formData.job_title.name : jobTitleSearch}
                      onChange={(e) => {
                        if (formData.job_title) setFormData({ ...formData, job_title: undefined });
                        setJobTitleSearch(e.target.value);
                      }}
                      onFocus={() => {
                        if (!formData.job_title && jobTitleSearch.length >= 2) setShowJobTitleDropdown(true);
                      }}
                      onBlur={() => setTimeout(() => setShowJobTitleDropdown(false), 150)}
                      placeholder="Search job title..."
                      className="glass border-glass-border focus:border-neon-cyan pl-9 pr-8"
                    />
                    {formData.job_title && (
                      <button
                        type="button"
                        onMouseDown={() => { setFormData({ ...formData, job_title: undefined }); setJobTitleSearch(""); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {showJobTitleDropdown && jobTitleResults.length > 0 && (
                    <div className="absolute z-50 w-full bg-gray-900 border border-glass-border rounded-lg overflow-hidden shadow-xl max-h-52 overflow-y-auto">
                      {jobTitleResults.map((jt: JobTitle) => (
                        <button
                          key={jt.id}
                          type="button"
                          className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-neon-cyan/10 flex items-center gap-2"
                          onMouseDown={() => {
                            setFormData({ ...formData, job_title: jt });
                            setJobTitleSearch("");
                            setShowJobTitleDropdown(false);
                          }}
                        >
                          <Briefcase className="h-4 w-4 text-neon-cyan flex-shrink-0" />
                          {jt.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Company Search-Select */}
                <div className="space-y-2 relative">
                  <Label htmlFor="company" className="text-white">
                    Company <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="company"
                      value={formData.company ? formData.company.name : companySearch}
                      onChange={(e) => {
                        if (formData.company) setFormData({ ...formData, company: undefined });
                        setCompanySearch(e.target.value);
                      }}
                      onFocus={() => {
                        if (!formData.company && companySearch.length >= 2) setShowCompanyDropdown(true);
                      }}
                      onBlur={() => setTimeout(() => setShowCompanyDropdown(false), 150)}
                      placeholder="Search company..."
                      className="glass border-glass-border focus:border-neon-cyan pl-9 pr-8"
                    />
                    {formData.company && (
                      <button
                        type="button"
                        onMouseDown={() => { setFormData({ ...formData, company: undefined }); setCompanySearch(""); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {showCompanyDropdown && companyResults.length > 0 && (
                    <div className="absolute z-50 w-full bg-gray-900 border border-glass-border rounded-lg overflow-hidden shadow-xl max-h-52 overflow-y-auto">
                      {companyResults.map((company: Company) => (
                        <button
                          key={company.id}
                          type="button"
                          className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-neon-cyan/10 flex items-center gap-2"
                          onMouseDown={() => {
                            setFormData({ ...formData, company });
                            setCompanySearch("");
                            setShowCompanyDropdown(false);
                          }}
                        >
                          <Building2 className="h-4 w-4 text-neon-cyan flex-shrink-0" />
                          {company.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-white">
                    Location <span className="text-destructive">*</span>
                  </Label>
                  <Input id="location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="e.g., Bangalore, India" className="glass border-glass-border focus:border-neon-cyan" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team_size" className="text-white">
                    Team Size
                  </Label>
                  <Input
                    id="team_size"
                    type="number"
                    value={formData.team_size || ""}
                    onChange={(e) => setFormData({ ...formData, team_size: parseInt(e.target.value) || undefined })}
                    placeholder="e.g., 12"
                    className="glass border-glass-border focus:border-neon-cyan"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_date" className="text-white">
                    Start Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="start_date"
                    type="month"
                    value={formData.start_date ? new Date(formData.start_date).toISOString().slice(0, 7) : ""}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value ? new Date(e.target.value + "-01") : undefined })}
                    className="glass border-glass-border focus:border-neon-cyan"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date" className="text-white">
                    End Date
                  </Label>
                  <div className="space-y-2">
                    <Input
                      id="end_date"
                      type="month"
                      value={formData.end_date ? new Date(formData.end_date).toISOString().slice(0, 7) : ""}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value ? new Date(e.target.value + "-01") : undefined })}
                      disabled={formData.is_current}
                      className="glass border-glass-border focus:border-neon-cyan"
                    />
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input type="checkbox" checked={formData.is_current} onChange={(e) => setFormData({ ...formData, is_current: e.target.checked, end_date: undefined })} className="rounded border-glass-border" />I currently work here
                    </label>
                  </div>
                </div>
              </div>

              {/* Responsibilities & Achievements */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Responsibilities & Achievements</Label>
                  <Button onClick={handleAddBullet} variant="outline" size="sm" className="glass hover:glass-strong border-neon-cyan/30 text-neon-cyan">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Bullet
                  </Button>
                </div>

                <div className="space-y-3">
                  {(formData.responsibilities || []).map((bullet, index) => (
                    <div key={index} className="flex gap-2">
                      <Textarea
                        value={bullet.title}
                        onChange={(e) => handleBulletChange(index, e.target.value)}
                        placeholder="e.g., Led cross-functional team of 12 to deliver..."
                        rows={2}
                        className="glass border-glass-border focus:border-neon-cyan"
                      />
                      <div className="flex flex-col gap-2">
                        <Button onClick={() => handleRemoveBullet(index)} variant="ghost" size="icon" className="glass hover:glass-strong text-destructive flex-shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => handleAIRewriteBullet(index)} variant="ghost" size="icon" className="glass hover:glass-strong text-neon-pink flex-shrink-0" disabled={aiLoading}>
                          {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metrics */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-neon-green" />
                    Impact Metrics
                  </Label>
                  <Button onClick={handleAddMetric} variant="outline" size="sm" className="glass hover:glass-strong border-neon-green/30 text-neon-green">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Metric
                  </Button>
                </div>

                <div className="space-y-3">
                  {(formData.impact_metrics || []).map((metric, index) => (
                    <Card key={index} className="glass p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <select
                          value={metric.impact_type}
                          onChange={(e) => handleMetricChange(index, "impact_type", e.target.value)}
                          className="glass border border-glass-border rounded-lg px-3 py-2 focus:border-neon-green focus:outline-none bg-transparent text-white"
                        >
                          <option value="" className="bg-gray-900">
                            Select metric type
                          </option>
                          {METRIC_TYPES.map((type) => (
                            <option key={type} value={type} className="bg-gray-900">
                              {type}
                            </option>
                          ))}
                        </select>

                        <Input
                          value={metric.impact_value}
                          onChange={(e) => handleMetricChange(index, "impact_value", e.target.value)}
                          placeholder="e.g., $2M, 40%"
                          className="glass border-glass-border focus:border-neon-green"
                        />

                        <div className="flex gap-2">
                          <Input
                            value={metric.description || ""}
                            onChange={(e) => handleMetricChange(index, "description", e.target.value)}
                            placeholder="e.g., increased revenue by..."
                            className="glass border-glass-border focus:border-neon-green"
                          />
                          <Button onClick={() => handleRemoveMetric(index)} variant="ghost" size="icon" className="glass hover:glass-strong text-destructive flex-shrink-0">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-3">
                <Label className="text-white">Skills Used</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.skills?.map((skill) => (
                    <Badge key={skill.id} variant="outline" className="border-neon-purple/30 text-neon-purple cursor-pointer hover:bg-neon-purple/10" onClick={() => handleRemoveSkill(skill.id!)}>
                      {skill.skill?.name}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Click to add:</p>
                  <div className="flex flex-wrap gap-2">
                    {user_skills
                      ?.filter((skill) => !formData.skills?.some((s) => s.id === skill.id))
                      .map((skill) => (
                        <Badge key={skill.id} variant="outline" className="border-glass-border text-muted-foreground cursor-pointer hover:border-neon-purple hover:text-neon-purple" onClick={() => handleAddSkill(skill)}>
                          <Plus className="h-3 w-3 mr-1" />
                          {skill.skill?.name}
                        </Badge>
                      ))}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-glass-border">
                <Button variant="outline" onClick={handleCancel} className="glass hover:glass-strong">
                  Cancel
                </Button>
                <Button onClick={handleSaveExperience} className="bg-gradient-to-r from-neon-cyan to-neon-purple text-white hover:scale-105 transition-all">
                  <Check className="h-4 w-4 mr-2" />
                  Save Experience
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
