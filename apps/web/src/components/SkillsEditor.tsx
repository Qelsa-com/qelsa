import { AlertCircle, Award, Briefcase, Check, Code, Crown, Lightbulb, Plus, Search, Sparkles, Target, Trash2, Upload, Users, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";

export type SkillCategory = "Professional" | "Technical" | "Soft Skills";
export type ExperienceLevel = "Beginner" | "Intermediate" | "Advanced" | "Expert";

export interface SkillBadge {
  id: string;
  name: string;
  source: string; // 'Mock Interview', 'Project', 'Assessment', 'Course'
  icon: string;
  color: string;
}

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  proficiency: number; // 0-100
  experienceLevel: ExperienceLevel;
  badges: SkillBadge[];
  hasEvidence: boolean;
  yearsOfExperience?: number;
}

interface SkillsEditorProps {
  isOpen: boolean;
  onClose: () => void;
  skills: Skill[];
  onSave: (skills: Skill[]) => void;
}

const SKILL_CATEGORIES: SkillCategory[] = ["Professional", "Technical", "Soft Skills"];

const PROFESSIONAL_SKILLS = [
  "Product Management",
  "Project Management",
  "Business Strategy",
  "Business Development",
  "Marketing Strategy",
  "Sales Management",
  "Operations Management",
  "Financial Analysis",
  "Consulting",
  "Stakeholder Management",
];

const TECHNICAL_SKILLS = [
  "Python",
  "JavaScript",
  "SQL",
  "React",
  "Node.js",
  "Java",
  "C++",
  "Data Analysis",
  "Machine Learning",
  "AWS",
  "Azure",
  "Docker",
  "Kubernetes",
  "Git",
  "Jira",
  "Figma",
  "Adobe XD",
  "Tableau",
  "Power BI",
  "Excel",
];

const SOFT_SKILLS = [
  "Leadership",
  "Communication",
  "Team Collaboration",
  "Problem Solving",
  "Critical Thinking",
  "Time Management",
  "Adaptability",
  "Creativity",
  "Emotional Intelligence",
  "Negotiation",
  "Public Speaking",
  "Conflict Resolution",
];

const RECOMMENDED_SKILLS_FOR_PM = [
  { name: "Agile Methodologies", category: "Professional" as SkillCategory, demand: "High" },
  { name: "Data-Driven Decision Making", category: "Professional" as SkillCategory, demand: "High" },
  { name: "User Research", category: "Professional" as SkillCategory, demand: "Medium" },
  { name: "A/B Testing", category: "Technical" as SkillCategory, demand: "Medium" },
  { name: "Roadmap Planning", category: "Professional" as SkillCategory, demand: "High" },
];

function getExperienceLevelFromProficiency(proficiency: number): ExperienceLevel {
  if (proficiency >= 90) return "Expert";
  if (proficiency >= 70) return "Advanced";
  if (proficiency >= 40) return "Intermediate";
  return "Beginner";
}

function getProficiencyColor(proficiency: number): string {
  if (proficiency >= 90) return "text-neon-yellow";
  if (proficiency >= 70) return "text-neon-green";
  if (proficiency >= 40) return "text-neon-cyan";
  return "text-neon-pink";
}

export function SkillsEditor({ isOpen, onClose, skills: initialSkills, onSave }: SkillsEditorProps) {
  const [skills, setSkills] = useState<Skill[]>(initialSkills);
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory>("Professional");
  const [searchQuery, setSearchQuery] = useState("");
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");

  // Get suggestions based on category
  const getSkillSuggestions = (category: SkillCategory): string[] => {
    switch (category) {
      case "Professional":
        return PROFESSIONAL_SKILLS;
      case "Technical":
        return TECHNICAL_SKILLS;
      case "Soft Skills":
        return SOFT_SKILLS;
      default:
        return [];
    }
  };

  const handleAddSkill = (skillName: string, category: SkillCategory) => {
    // Check if skill already exists
    const exists = skills.some((skill) => skill.name.toLowerCase() === skillName.toLowerCase());

    if (exists) {
      toast.error("This skill already exists in your profile");
      return;
    }

    const newSkill: Skill = {
      id: Date.now().toString(),
      name: skillName,
      category,
      proficiency: 50,
      experienceLevel: "Intermediate",
      badges: [],
      hasEvidence: false,
    };

    setSkills([...skills, newSkill]);
    setNewSkillName("");
    setShowAddSkill(false);
    toast.success(`${skillName} added successfully!`);
  };

  const handleDeleteSkill = (skillId: string) => {
    setSkills(skills.filter((skill) => skill.id !== skillId));
    toast.success("Skill removed");
  };

  const handleProficiencyChange = (skillId: string, proficiency: number) => {
    setSkills(
      skills.map((skill) =>
        skill.id === skillId
          ? {
              ...skill,
              proficiency,
              experienceLevel: getExperienceLevelFromProficiency(proficiency),
            }
          : skill
      )
    );
  };

  const handleRunValidation = () => {
    const issues: string[] = [];

    skills.forEach((skill) => {
      // Check for high proficiency without evidence
      if (skill.proficiency >= 70 && !skill.hasEvidence) {
        issues.push(`${skill.name} - High proficiency (${skill.proficiency}%) but no supporting evidence. Consider adding projects or certifications.`);
      }

      // Check for technical skills without recent usage
      if (skill.category === "Technical" && skill.proficiency >= 60) {
        // Simulate checking if skill is used in projects
        const random = Math.random();
        if (random > 0.7) {
          issues.push(`${skill.name} - No recent projects found using this skill. Add supporting evidence or update proficiency.`);
        }
      }
    });

    setValidationIssues(issues);
    setShowValidation(true);

    if (issues.length === 0) {
      toast.success("All skills validated! Your profile looks great.");
    } else {
      toast.info(`Found ${issues.length} suggestions to improve your skills profile`);
    }
  };

  const handleAutoAddFromResume = () => {
    // Simulate resume parsing
    const resumeSkills = [
      { name: "Agile Methodologies", category: "Professional" as SkillCategory, proficiency: 85 },
      { name: "A/B Testing", category: "Technical" as SkillCategory, proficiency: 75 },
      { name: "User Research", category: "Professional" as SkillCategory, proficiency: 80 },
    ];

    let addedCount = 0;
    resumeSkills.forEach((resumeSkill) => {
      const exists = skills.some((skill) => skill.name.toLowerCase() === resumeSkill.name.toLowerCase());

      if (!exists) {
        const newSkill: Skill = {
          id: `resume-${Date.now()}-${addedCount}`,
          name: resumeSkill.name,
          category: resumeSkill.category,
          proficiency: resumeSkill.proficiency,
          experienceLevel: getExperienceLevelFromProficiency(resumeSkill.proficiency),
          badges: [
            {
              id: `badge-${Date.now()}`,
              name: "Resume Verified",
              source: "Resume",
              icon: "FileText",
              color: "text-neon-cyan",
            },
          ],
          hasEvidence: true,
        };
        setSkills((prev) => [...prev, newSkill]);
        addedCount++;
      }
    });

    toast.success(`Added ${addedCount} skills from your resume!`);
  };

  const handleAddRecommendedSkill = (skillName: string, category: SkillCategory) => {
    handleAddSkill(skillName, category);
    toast.info("This skill is in high demand for Product Manager roles");
  };

  const handleSaveAll = () => {
    onSave(skills);
    onClose();
    toast.success("Skills updated successfully!");
  };

  const filteredSkills = skills.filter((skill) => {
    const matchesCategory = skill.category === selectedCategory;
    const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getSkillStats = () => {
    const total = skills.length;
    const withBadges = skills.filter((s) => s.badges.length > 0).length;
    const expert = skills.filter((s) => s.experienceLevel === "Expert").length;
    const avgProficiency = Math.round(skills.reduce((sum, s) => sum + s.proficiency, 0) / total || 0);

    return { total, withBadges, expert, avgProficiency };
  };

  const stats = getSkillStats();

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto glass border border-glass-border">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-neon-pink to-neon-yellow flex items-center justify-center">
                <Award className="h-5 w-5 text-black" />
              </div>
              <div>
                <DialogTitle className="text-2xl">
                  <span className="bg-gradient-to-r from-neon-pink to-neon-yellow bg-clip-text text-transparent">Skills & Expertise</span>
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.total} skills • {stats.expert} expert level • {stats.avgProficiency}% avg proficiency
                </p>
              </div>
            </div>
            <Button onClick={onClose} variant="ghost" size="icon" className="glass hover:glass-strong">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <DialogDescription className="sr-only">Manage your professional skills with AI-powered recommendations and validation</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Smart Actions Bar */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleAutoAddFromResume} variant="outline" size="sm" className="glass hover:glass-strong border-neon-cyan/30 text-neon-cyan">
              <Upload className="h-4 w-4 mr-2" />
              Auto-Add from Resume
            </Button>
            <Button onClick={() => setShowRecommendations(!showRecommendations)} variant="outline" size="sm" className="glass hover:glass-strong border-neon-purple/30 text-neon-purple">
              <Sparkles className="h-4 w-4 mr-2" />
              AI Recommendations
            </Button>
            <Button onClick={handleRunValidation} variant="outline" size="sm" className="glass hover:glass-strong border-neon-pink/30 text-neon-pink">
              <AlertCircle className="h-4 w-4 mr-2" />
              Validate Skills
            </Button>
            <Button onClick={() => setShowAddSkill(true)} className="gradient-primary text-white hover:scale-105 transition-all" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Skill
            </Button>
          </div>

          {/* AI Recommendations Panel */}
          {showRecommendations && (
            <Card className="glass border-neon-purple/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-neon-purple" />
                  <span className="font-medium text-white">Recommended Skills for Product Manager</span>
                </div>
                <Button onClick={() => setShowRecommendations(false)} variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Based on your target role and industry trends, we recommend adding these high-demand skills:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {RECOMMENDED_SKILLS_FOR_PM.map((rec, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 glass hover:glass-strong rounded-lg transition-all">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{rec.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`text-xs ${rec.demand === "High" ? "border-neon-green/30 text-neon-green" : "border-neon-cyan/30 text-neon-cyan"}`}>
                          {rec.demand} Demand
                        </Badge>
                        <span className="text-xs text-muted-foreground">{rec.category}</span>
                      </div>
                    </div>
                    <Button onClick={() => handleAddRecommendedSkill(rec.name, rec.category)} variant="ghost" size="sm" className="glass hover:glass-strong text-neon-purple">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Validation Issues Panel */}
          {showValidation && validationIssues.length > 0 && (
            <Card className="glass border-neon-pink/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-neon-pink" />
                  <span className="font-medium text-white">AI Validation - {validationIssues.length} Suggestions</span>
                </div>
                <Button onClick={() => setShowValidation(false)} variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {validationIssues.map((issue, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-3 glass rounded-lg text-sm">
                    <Lightbulb className="h-4 w-4 text-neon-yellow mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">{issue}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Add Skill Modal */}
          {showAddSkill && (
            <Card className="glass border-neon-cyan/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-neon-cyan" />
                  <span className="font-medium text-white">Add New Skill</span>
                </div>
                <Button
                  onClick={() => {
                    setShowAddSkill(false);
                    setNewSkillName("");
                  }}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="newSkillName" className="text-white mb-2 block">
                      Skill Name
                    </Label>
                    <Input
                      id="newSkillName"
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      placeholder="e.g., Product Strategy"
                      className="glass border-glass-border focus:border-neon-cyan"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Category</Label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value as SkillCategory)}
                      className="w-full glass border border-glass-border rounded-lg px-3 py-2 focus:border-neon-cyan focus:outline-none bg-transparent text-white"
                    >
                      {SKILL_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} className="bg-gray-900">
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    if (newSkillName.trim()) {
                      handleAddSkill(newSkillName, selectedCategory);
                    } else {
                      toast.error("Please enter a skill name");
                    }
                  }}
                  className="gradient-primary text-white"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Skill
                </Button>

                {/* Quick suggestions */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Quick add:</p>
                  <div className="flex flex-wrap gap-2">
                    {getSkillSuggestions(selectedCategory)
                      .slice(0, 6)
                      .map((suggestion) => (
                        <Badge
                          key={suggestion}
                          variant="outline"
                          className="border-neon-cyan/30 text-neon-cyan cursor-pointer hover:bg-neon-cyan/10"
                          onClick={() => handleAddSkill(suggestion, selectedCategory)}
                        >
                          {suggestion}
                        </Badge>
                      ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Search and Category Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search skills..." className="glass border-glass-border focus:border-neon-cyan pl-10" />
            </div>
            <div className="flex gap-2">
              {SKILL_CATEGORIES.map((category) => (
                <Button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  className={selectedCategory === category ? "gradient-primary text-white" : "glass hover:glass-strong border-glass-border"}
                >
                  {category === "Professional" && <Briefcase className="h-4 w-4 mr-2" />}
                  {category === "Technical" && <Code className="h-4 w-4 mr-2" />}
                  {category === "Soft Skills" && <Users className="h-4 w-4 mr-2" />}
                  {category}
                  <Badge variant="outline" className="ml-2 border-glass-border text-xs">
                    {skills.filter((s) => s.category === category).length}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Skills List */}
          <div className="space-y-4">
            {filteredSkills.length === 0 ? (
              <Card className="glass p-8 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No {selectedCategory.toLowerCase()} skills found. Add your first skill to get started!</p>
              </Card>
            ) : (
              filteredSkills.map((skill) => (
                <Card key={skill.id} className="glass hover:glass-strong p-6 rounded-xl border border-glass-border transition-all">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-white text-lg">{skill.name}</h3>
                          <Badge variant="outline" className={`${getProficiencyColor(skill.proficiency)} border-current`}>
                            {skill.experienceLevel}
                          </Badge>
                          {!skill.hasEvidence && skill.proficiency >= 70 && (
                            <Badge variant="outline" className="border-neon-pink/30 text-neon-pink text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Needs Evidence
                            </Badge>
                          )}
                        </div>
                        {skill.badges.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {skill.badges.map((badge) => (
                              <Badge key={badge.id} variant="outline" className={`${badge.color} border-current text-xs`}>
                                <Crown className="h-3 w-3 mr-1" />
                                {badge.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button onClick={() => handleDeleteSkill(skill.id)} variant="ghost" size="icon" className="glass hover:glass-strong text-destructive flex-shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-muted-foreground">Proficiency: {skill.proficiency}%</Label>
                        <span className={`text-sm font-medium ${getProficiencyColor(skill.proficiency)}`}>{skill.experienceLevel}</span>
                      </div>
                      <Slider value={[skill.proficiency]} onValueChange={(value) => handleProficiencyChange(skill.id, value[0])} max={100} step={5} className="w-full" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Beginner</span>
                        <span>Intermediate</span>
                        <span>Advanced</span>
                        <span>Expert</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-glass-border">
            <div className="text-sm text-muted-foreground">{skills.length} total skills across all categories</div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="glass hover:glass-strong">
                Cancel
              </Button>
              <Button onClick={handleSaveAll} className="gradient-primary text-white hover:scale-105 transition-all">
                <Check className="h-4 w-4 mr-2" />
                Save All Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
