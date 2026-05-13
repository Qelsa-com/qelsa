import { useCreateEducationMutation, useDeleteEducationMutation, useGetEducationsQuery, useUpdateEducationMutation, useUpdateEducationsPositionMutation } from "@/features/api/educationsApi";
import { useGetDegreeNamesQuery, useGetFieldsOfStudyQuery } from "@/features/api/seedApi";
import { DegreeName } from "@/types/degreeName";
import { Education } from "@/types/education";
import { FieldOfStudy } from "@/types/fieldOfStudy";
import { ArrowLeft, Award, Calendar, Check, Edit3, FileText, FolderOpen, GraduationCap, GripVertical, MapPin, Plus, Search, Sparkles, Trash2, Trophy, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";

export function EducationEditorPage() {
  const router = useRouter();
  const [education, setEducation] = useState<Education[]>([]);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const { data: edu, error, isLoading } = useGetEducationsQuery();
  const { data: degreeNames = [] } = useGetDegreeNamesQuery();
  const { data: fieldsOfStudy = [] } = useGetFieldsOfStudyQuery();
  const [createEducation, { isLoading: isCreating, error: createError }] = useCreateEducationMutation();
  const [updateEducation, { isLoading: isUpdating, error: updateError }] = useUpdateEducationMutation();
  const [deleteEducation, { isLoading: isDeleting, error: deleteError }] = useDeleteEducationMutation();
  const [updateEducationsPosition, { isLoading: isUpdatingPosition, error: updatePositionError }] = useUpdateEducationsPositionMutation();

  const [degreeSearch, setDegreeSearch] = useState("");
  const [showDegreeDropdown, setShowDegreeDropdown] = useState(false);
  const [fieldSearch, setFieldSearch] = useState("");
  const [showFieldDropdown, setShowFieldDropdown] = useState(false);

  const [educations, setEducations] = useState<Education[]>(edu || []);

  useEffect(() => {
    if (edu) {
      setEducations(edu);
    }
  }, [edu]);

  const filteredDegrees = useMemo(
    () => degreeNames.filter((d) => (d.name ?? "").toLowerCase().includes(degreeSearch.toLowerCase()) || (d.abbreviation ?? "").toLowerCase().includes(degreeSearch.toLowerCase())),
    [degreeNames, degreeSearch]
  );

  const filteredFields = useMemo(
    () => fieldsOfStudy.filter((f) => (f.name ?? "").toLowerCase().includes(fieldSearch.toLowerCase())),
    [fieldsOfStudy, fieldSearch]
  );

  const emptyForm: Partial<Education> = {
    degree: undefined,
    institution: "",
    location: "",
    start_year: null,
    end_year: null,
    field_of_study: undefined,
    grade: "",
    achievements: [],
    projects: [],
  };

  const [formData, setFormData] = useState<Partial<Education>>(emptyForm);

  const handleAddNew = () => {
    setEditingId("new");
    setDegreeSearch("");
    setFieldSearch("");
    setShowDegreeDropdown(false);
    setShowFieldDropdown(false);
    setFormData(emptyForm);
  };

  const handleEdit = (edu: Education) => {
    setEditingId(edu.id.toString());
    setDegreeSearch("");
    setFieldSearch("");
    setShowDegreeDropdown(false);
    setShowFieldDropdown(false);
    setFormData(edu);
  };

  const handleDelete = (id: number) => {
    deleteEducation(id);
    toast.success("Education entry deleted");
  };

  const handleSaveEducation = () => {
    if (!formData.degree || !formData.institution || !formData.start_year || !formData.end_year || !formData.field_of_study || !formData.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    let newEducation: Education = {
      degree: formData.degree!,
      institution: formData.institution!,
      location: formData.location!,
      start_year: formData.start_year!,
      end_year: formData.end_year!,
      field_of_study: formData.field_of_study!,
      grade: formData.grade!,
      achievements: formData.achievements!.filter((a) => a.title.trim() !== ""),
      projects: formData.projects!.filter((p) => p.title.trim() !== ""),
    };

    if (editingId !== "new") newEducation.id = Number(editingId);

    if (editingId === "new") {
      createEducation(newEducation)
        .unwrap()
        .then(() => {
          toast.success("Education entry saved");
          window.location.href = "/profile/educations";
        })
        .catch((error) => {
          toast.error(error?.data?.message || "Failed to save education entry");
        });
    } else {
      updateEducation({
        id: Number(editingId),
        data: newEducation,
      })
        .unwrap()
        .then(() => {
          toast.success("Education entry updated");
          setEditingId(null);
        })
        .catch((error) => {
          toast.error(error?.data?.message || "Failed to update education entry");
        });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleAddAchievement = () => {
    setFormData({
      ...formData,
      achievements: [...(formData.achievements || []), { title: "" }],
    });
  };

  const handleRemoveAchievement = (index: number) => {
    setFormData({
      ...formData,
      achievements: formData.achievements!.filter((_, i) => i !== index),
    });
  };

  const handleAchievementChange = (index: number, value: string) => {
    const newAchievements = [...formData.achievements!];
    newAchievements[index] = { ...newAchievements[index], title: value };
    setFormData({ ...formData, achievements: newAchievements });
  };

  const handleAddProject = () => {
    setFormData({
      ...formData,
      projects: [...(formData.projects || []), { title: "" }],
    });
  };

  const handleRemoveProject = (index: number) => {
    setFormData({
      ...formData,
      projects: formData.projects!.filter((_, i) => i !== index),
    });
  };

  const handleProjectChange = (index: number, value: string) => {
    const newProjects = [...formData.projects!];
    newProjects[index] = { ...newProjects[index], title: value };
    setFormData({ ...formData, projects: newProjects });
  };

  const handleGetAchievementSuggestions = () => {};

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newEducations = [...educations];
    const draggedItem = newEducations[draggedIndex];
    newEducations.splice(draggedIndex, 1);
    newEducations.splice(index, 0, draggedItem);

    setEducations(newEducations);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    const updatedEducations = educations.map((exp, idx) => ({
      ...exp,
      position: (idx + 1).toString(),
    }));
    setEducations(updatedEducations);
  };

  const handleSaveAll = () => {
    try {
      updateEducationsPosition(educations);
      toast.success("Education position updated!");
    } catch (error) {
      toast.error("Failed to update education position.");
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-purple/3 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-neon-pink/3 rounded-full blur-3xl"></div>
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-neon-purple to-neon-pink flex items-center justify-center">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">
                  <span className="bg-gradient-to-r from-neon-purple to-neon-pink bg-clip-text text-transparent">Education</span>
                </h1>
                <p className="text-muted-foreground mt-1">Manage your academic achievements with AI-powered suggestions</p>
              </div>
            </div>
          </div>
        </div>

        {/* List View */}
        {!editingId && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                {education.length} education {education.length === 1 ? "entry" : "entries"} • Drag to reorder
              </p>
              <Button onClick={handleAddNew} className="bg-gradient-to-r from-neon-purple to-neon-pink text-white hover:scale-105 transition-all">
                <Plus className="h-4 w-4 mr-2" />
                Add Degree
              </Button>
            </div>

            <div className="space-y-4">
              {educations?.map((edu, index) => (
                <Card
                  key={edu.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className="glass hover:glass-strong p-6 rounded-xl border border-glass-border cursor-move transition-all hover:border-neon-purple"
                >
                  <div className="flex items-start gap-4">
                    <GripVertical className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="font-bold text-white text-lg">
                            {edu.degree?.abbreviation} in {edu.field_of_study?.name}
                          </h3>
                          <p className="text-neon-purple">{edu.institution}</p>
                          <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {edu.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {edu.start_year} - {edu.end_year}
                            </span>
                            <span className="flex items-center gap-1">
                              <Award className="h-3 w-3" />
                              {edu.grade}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          <Button onClick={() => handleEdit(edu)} variant="ghost" size="sm" className="glass hover:glass-strong text-neon-purple">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button onClick={() => handleDelete(edu.id)} variant="ghost" size="sm" className="glass hover:glass-strong text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {edu.achievements.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            Achievements:
                          </p>
                          <ul className="space-y-1">
                            {edu.achievements.slice(0, 2).map((achievement, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-neon-purple mt-1">•</span>
                                <span>{achievement.title}</span>
                              </li>
                            ))}
                            {edu.achievements.length > 2 && <li className="text-sm text-neon-pink">+{edu.achievements.length - 2} more...</li>}
                          </ul>
                        </div>
                      )}

                      {edu.projects.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <FolderOpen className="h-3 w-3" />
                            Projects:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {edu.projects.slice(0, 3).map((project, idx) => (
                              <Badge key={idx} variant="outline" className="border-neon-purple/30 text-neon-purple text-xs">
                                {project.title}
                              </Badge>
                            ))}
                            {edu.projects.length > 3 && (
                              <Badge variant="outline" className="border-neon-pink/30 text-neon-pink text-xs">
                                +{edu.projects.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {educations?.length > 0 && (
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" className="glass hover:glass-strong">
                  Cancel
                </Button>
                <Button onClick={handleSaveAll} className="bg-gradient-to-r from-neon-purple to-neon-pink text-white hover:scale-105 transition-all">
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
                <h2 className="text-2xl font-bold text-white">{editingId === "new" ? "Add New Degree" : "Edit Degree"}</h2>
                <Button onClick={handleGetAchievementSuggestions} variant="outline" size="sm" className="glass hover:glass-strong border-neon-pink text-neon-pink">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get Achievement Ideas
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Degree Search-Select */}
                <div className="space-y-2 relative">
                  <Label htmlFor="degree" className="text-white">
                    Degree Type <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="degree"
                      value={formData.degree ? `${formData.degree.abbreviation} — ${formData.degree.name}` : degreeSearch}
                      onChange={(e) => {
                        if (formData.degree) setFormData({ ...formData, degree: undefined });
                        setDegreeSearch(e.target.value);
                        setShowDegreeDropdown(true);
                      }}
                      onFocus={() => setShowDegreeDropdown(true)}
                      onBlur={() => setTimeout(() => setShowDegreeDropdown(false), 150)}
                      placeholder="Search degree..."
                      className="glass border-glass-border focus:border-neon-purple pl-9 pr-8"
                    />
                    {formData.degree && (
                      <button
                        type="button"
                        onMouseDown={() => { setFormData({ ...formData, degree: undefined }); setDegreeSearch(""); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {showDegreeDropdown && !formData.degree && filteredDegrees.length > 0 && (
                    <div className="absolute z-50 w-full bg-gray-900 border border-glass-border rounded-lg overflow-hidden shadow-xl max-h-52 overflow-y-auto">
                      {filteredDegrees.map((d: DegreeName) => (
                        <button
                          key={d.id}
                          type="button"
                          className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-neon-purple/10 flex items-center gap-3"
                          onMouseDown={() => {
                            setFormData({ ...formData, degree: d });
                            setDegreeSearch("");
                            setShowDegreeDropdown(false);
                          }}
                        >
                          <span className="text-neon-purple font-medium w-16 flex-shrink-0">{d.abbreviation}</span>
                          <span className="text-muted-foreground">{d.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Institution */}
                <div className="space-y-2">
                  <Label htmlFor="institution" className="text-white">
                    Institution <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="institution"
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    placeholder="e.g., IIT Delhi"
                    className="glass border-glass-border focus:border-neon-purple"
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
                    placeholder="e.g., New Delhi, India"
                    className="glass border-glass-border focus:border-neon-purple"
                  />
                </div>

                {/* Field of Study Search-Select */}
                <div className="space-y-2 relative">
                  <Label htmlFor="field_of_study" className="text-white">
                    Major / Specialization <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="field_of_study"
                      value={formData.field_of_study ? formData.field_of_study.name : fieldSearch}
                      onChange={(e) => {
                        if (formData.field_of_study) setFormData({ ...formData, field_of_study: undefined });
                        setFieldSearch(e.target.value);
                        setShowFieldDropdown(true);
                      }}
                      onFocus={() => setShowFieldDropdown(true)}
                      onBlur={() => setTimeout(() => setShowFieldDropdown(false), 150)}
                      placeholder="Search field of study..."
                      className="glass border-glass-border focus:border-neon-purple pl-9 pr-8"
                    />
                    {formData.field_of_study && (
                      <button
                        type="button"
                        onMouseDown={() => { setFormData({ ...formData, field_of_study: undefined }); setFieldSearch(""); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {showFieldDropdown && !formData.field_of_study && filteredFields.length > 0 && (
                    <div className="absolute z-50 w-full bg-gray-900 border border-glass-border rounded-lg overflow-hidden shadow-xl max-h-52 overflow-y-auto">
                      {filteredFields.map((f: FieldOfStudy) => (
                        <button
                          key={f.id}
                          type="button"
                          className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-neon-purple/10"
                          onMouseDown={() => {
                            setFormData({ ...formData, field_of_study: f });
                            setFieldSearch("");
                            setShowFieldDropdown(false);
                          }}
                        >
                          {f.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Start Year */}
                <div className="space-y-2">
                  <Label htmlFor="start_year" className="text-white">
                    Start Year <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="start_year"
                    type="number"
                    value={formData.start_year}
                    onChange={(e) => setFormData({ ...formData, start_year: parseInt(e.target.value) || null })}
                    placeholder="e.g., 2019"
                    className="glass border-glass-border focus:border-neon-purple"
                  />
                </div>

                {/* End Year */}
                <div className="space-y-2">
                  <Label htmlFor="end_year" className="text-white">
                    End Year <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="end_year"
                    type="number"
                    value={formData.end_year}
                    onChange={(e) => setFormData({ ...formData, end_year: parseInt(e.target.value) || null })}
                    placeholder="e.g., 2023"
                    className="glass border-glass-border focus:border-neon-purple"
                  />
                </div>

                {/* Grade/CGPA */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="grade" className="text-white">
                    Grade / CGPA
                  </Label>
                  <Input
                    id="grade"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    placeholder="e.g., 8.5 CGPA or First Class"
                    className="glass border-glass-border focus:border-neon-purple"
                  />
                </div>
              </div>

              {/* Achievements */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-white flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-neon-pink" />
                    Achievements
                  </Label>
                  <Button onClick={handleAddAchievement} variant="outline" size="sm" className="glass hover:glass-strong border-neon-purple/30 text-neon-purple">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Achievement
                  </Button>
                </div>

                <div className="space-y-3">
                  {formData.achievements?.map((achievement, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex gap-2">
                        <Textarea
                          value={achievement.title}
                          onChange={(e) => handleAchievementChange(index, e.target.value)}
                          placeholder="e.g., Won first place in national hackathon..."
                          rows={2}
                          className="glass border-glass-border focus:border-neon-purple"
                        />
                        <Button onClick={() => handleRemoveAchievement(index)} variant="ghost" size="icon" className="glass hover:glass-strong text-destructive flex-shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projects */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-white flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-neon-purple" />
                    Projects
                  </Label>
                  <Button onClick={handleAddProject} variant="outline" size="sm" className="glass hover:glass-strong border-neon-pink/30 text-neon-pink">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Project
                  </Button>
                </div>

                <div className="space-y-3">
                  {formData.projects?.map((project, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={project.title}
                        onChange={(e) => handleProjectChange(index, e.target.value)}
                        placeholder="e.g., E-commerce Platform with React & Node.js"
                        className="glass border-glass-border focus:border-neon-purple"
                      />
                      <Button onClick={() => handleRemoveProject(index)} variant="ghost" size="icon" className="glass hover:glass-strong text-destructive flex-shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certification Upload */}
              <div className="space-y-3">
                <Label className="text-white">Upload Certification (Optional)</Label>
                <Card className="glass border-glass-border border-dashed p-6">
                  <div className="flex flex-col items-center justify-center gap-3 text-center">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-white">Upload degree certificate or transcript</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF or image files only</p>
                    </div>
                    <Button variant="outline" size="sm" className="glass hover:glass-strong border-glass-border">
                      <FileText className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-glass-border">
                <Button variant="outline" onClick={handleCancel} className="glass hover:glass-strong">
                  Cancel
                </Button>
                <Button onClick={handleSaveEducation} className="bg-gradient-to-r from-neon-purple to-neon-pink text-white hover:scale-105 transition-all">
                  <Check className="h-4 w-4 mr-2" />
                  Save Education
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
