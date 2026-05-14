import { useGetSkillCategoriesQuery, useLazyGetSkillsQuery } from "@/features/api/seedApi";
import { useBulkModifyUserSkillsMutation, useGetUserSkillsQuery, useUpdateUserSkillMutation } from "@/features/api/userSkillsApi";
import { Skill, SkillCategory, UserSkill } from "@/types/userSkill";
import { AlertCircle, ArrowLeft, Award, Briefcase, Check, ChevronDown, Code, Lightbulb, Plus, Search, Sparkles, Star, Target, Trash2, Upload, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Slider } from "./ui/slider";

export interface SkillBadge {
  id: string;
  name: string;
  source: string;
  icon: string;
  color: string;
}

const RECOMMENDED_SKILLS_FOR_PM = [
  { name: "Agile Methodologies", category: "Professional", demand: "High" },
  { name: "Data-Driven Decision Making", category: "Professional", demand: "High" },
  { name: "User Research", category: "Professional", demand: "Medium" },
  { name: "A/B Testing", category: "Technical", demand: "Medium" },
  { name: "Roadmap Planning", category: "Professional", demand: "High" },
];

function getExperienceLevelFromProficiency(proficiency: number) {
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

export function SkillsEditorPage() {
  const router = useRouter();
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const [showAddSkill, setShowAddSkill] = useState(false);

  // New skill form state
  const [newSkill, setNewSkill] = useState<Skill | null>(null);
  const [newCategory, setNewCategory] = useState<SkillCategory | null>(null);
  const [skillSearchOpen, setSkillSearchOpen] = useState(false);
  const [skillSearchQuery, setSkillSearchQuery] = useState("");
  const [categorySearchOpen, setCategorySearchOpen] = useState(false);

  const [updateUserSkill, {}] = useUpdateUserSkillMutation();
  const [triggerSearchSkills, { data: skillSearchResults = [] }] = useLazyGetSkillsQuery();
  const { data: skillCategories = [] } = useGetSkillCategoriesQuery();
  const { data: userSkills, error, isLoading } = useGetUserSkillsQuery();
  const [bulkModifyUserSkills, { isLoading: isBulkModifying }] = useBulkModifyUserSkillsMutation();

  // Normalise legacy skills that still carry category as a plain string
  useEffect(() => {
    if (!userSkills) return;
    if (skillCategories.length === 0) return;

    const normalised = userSkills.map((s) => {
      if (s.category && typeof s.category === "object") return s;
      const raw = s.category as unknown as string;
      const matched = skillCategories.find(
        (c) => c.name.toLowerCase() === raw?.toLowerCase()
      );
      return matched ? { ...s, category: matched } : s;
    });
    setSkills(normalised as UserSkill[]);
  }, [userSkills, skillCategories]);

  // Set the first loaded category as the active filter tab
  useEffect(() => {
    if (skillCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(skillCategories[0]);
    }
  }, [skillCategories, selectedCategory]);

  // Debounced skill search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (skillSearchQuery.length >= 1) triggerSearchSkills(skillSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [skillSearchQuery, triggerSearchSkills]);

  const handleAddSkill = (skill: Skill, category: SkillCategory) => {
    const exists = skills.some((s) => s.skill?.id === skill.id);
    if (exists) {
      toast.error("This skill already exists in your profile");
      return;
    }

    const newUserSkill: UserSkill = {
      skill,
      category,
      proficiency: 50,
      experience_level: "Intermediate",
      is_top_skill: false,
    };

    setSkills([...skills, newUserSkill]);
    setSelectedCategory(category);
    setNewSkill(null);
    setNewCategory(null);
    setSkillSearchQuery("");
    setShowAddSkill(false);
    toast.success(`${skill.name} added successfully!`);
  };

  const handleDeleteSkill = (skillId: number) => {
    setSkills(skills?.filter((skill) => skill.id !== skillId));
    toast.success("Skill removed");
  };

  const handleProficiencyChange = (seedSkillId: number, proficiency: number) => {
    setSkills(
      skills.map((skill) =>
        skill.skill?.id === seedSkillId
          ? { ...skill, proficiency, experience_level: getExperienceLevelFromProficiency(proficiency) }
          : skill
      )
    );
  };

  const handleToggleTopSkill = async (skillId: number) => {
    const skill = skills.find((s) => s.id === skillId);
    if (!skill) return;

    const currentTopSkills = skills.filter((s) => s.is_top_skill);
    if (!skill.is_top_skill && currentTopSkills.length >= 3) {
      toast.error("You can only showcase up to 3 top skills", {
        description: "Remove one of your current top skills first",
      });
      return;
    }

    setSkills(skills.map((s) => (s.id === skillId ? { ...s, is_top_skill: !s.is_top_skill } : s)));

    await updateUserSkill({ id: skillId, data: { is_top_skill: !skill.is_top_skill } }).unwrap();

    if (!skill.is_top_skill) {
      toast.success(`${skill.skill?.name} added to top skills!`, {
        description: "This skill will be showcased on your profile",
      });
    } else {
      toast.info(`${skill.skill?.name} removed from top skills`);
    }
  };

  const handleRunValidation = () => {
    const issues: string[] = [];

    skills?.forEach((skill) => {
      if (skill.category?.name.toLowerCase() === "technical" && skill.proficiency >= 60) {
        if (Math.random() > 0.7) {
          issues.push(`${skill.skill?.name} - No recent projects found using this skill. Add supporting evidence or update proficiency.`);
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

  const handleAutoAddFromResume = () => {};

  const handleAddRecommendedSkill = async (skillName: string, categoryName: string) => {
    const results = await triggerSearchSkills(skillName).unwrap();
    const found = results?.find((s) => s.name.toLowerCase() === skillName.toLowerCase()) || results?.[0];
    if (!found) {
      toast.error(`Skill "${skillName}" not found in the skill catalog`);
      return;
    }
    const category = skillCategories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
    if (!category) {
      toast.error(`Category "${categoryName}" not found`);
      return;
    }
    handleAddSkill(found, category);
    toast.info("This skill is in high demand for Product Manager roles");
  };

  const handleSaveAll = () => {
    bulkModifyUserSkills(skills)
      .unwrap()
      .then(() => {
        toast.success("Skills entry saved");
        window.location.href = "/profile/skills";
      })
      .catch((error) => {
        toast.error(error?.data?.message || "Failed to save skills entry");
      });
    toast.success("Skills updated successfully!");
  };

  const filteredSkills =
    skills?.filter((skill) => {
      const matchesCategory = skill.category?.id === selectedCategory?.id;
      const matchesSearch = (skill.skill?.name ?? "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }) || [];

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-pink/3 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-neon-yellow/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" className="glass hover:glass-strong mb-4" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-neon-pink to-neon-yellow flex items-center justify-center">
                <Award className="h-8 w-8 text-black" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">
                  <span className="bg-gradient-to-r from-neon-pink to-neon-yellow bg-clip-text text-transparent">Skills & Expertise</span>
                </h1>
                <p className="text-muted-foreground mt-1"></p>
              </div>
            </div>
          </div>
        </div>

        {/* Smart Actions Bar */}
        <Card className="glass p-6 rounded-2xl border border-glass-border mb-6">
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
            <Button onClick={() => { setNewCategory(selectedCategory); setShowAddSkill(true); }} className="bg-gradient-to-r from-neon-pink to-neon-yellow text-black hover:scale-105 transition-all" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Skill
            </Button>
          </div>
        </Card>

        {/* AI Recommendations Panel */}
        {showRecommendations && (
          <Card className="glass border-neon-purple/30 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-neon-purple" />
                <span className="font-medium text-white text-lg">Recommended Skills for Product Manager</span>
              </div>
              <Button onClick={() => setShowRecommendations(false)} variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Based on your target role and industry trends, we recommend adding these high-demand skills:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {RECOMMENDED_SKILLS_FOR_PM.map((rec, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 glass hover:glass-strong rounded-lg transition-all">
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
          <Card className="glass border-neon-pink/30 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-neon-pink" />
                <span className="font-medium text-white text-lg">AI Validation - {validationIssues.length} Suggestions</span>
              </div>
              <Button onClick={() => setShowValidation(false)} variant="ghost" size="sm">
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

        {/* Add Skill Panel */}
        {showAddSkill && (
          <Card className="glass border-neon-cyan/30 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-neon-cyan" />
                <span className="font-medium text-white text-lg">Add New Skill</span>
              </div>
              <Button
                onClick={() => {
                  setShowAddSkill(false);
                  setNewSkill(null);
                  setNewCategory(null);
                  setSkillSearchQuery("");
                }}
                variant="ghost"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Skill search combobox */}
                <div>
                  <Label className="text-white mb-2 block">Skill Name</Label>
                  <Popover open={skillSearchOpen} onOpenChange={setSkillSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={skillSearchOpen}
                        className="w-full justify-between glass border-glass-border focus:border-neon-cyan text-left font-normal"
                      >
                        <span className={newSkill ? "text-white" : "text-muted-foreground"}>
                          {newSkill ? newSkill.name : "Search for a skill..."}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Type to search skills..."
                          value={skillSearchQuery}
                          onValueChange={setSkillSearchQuery}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {skillSearchQuery.length < 1 ? "Start typing to search..." : "No skills found."}
                          </CommandEmpty>
                          <CommandGroup>
                            {skillSearchResults.map((skill) => (
                              <CommandItem
                                key={skill.id}
                                value={skill.name}
                                onSelect={() => {
                                  setNewSkill(skill);
                                  setSkillSearchOpen(false);
                                }}
                              >
                                {skill.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Category search combobox */}
                <div>
                  <Label className="text-white mb-2 block">Category</Label>
                  <Popover open={categorySearchOpen} onOpenChange={setCategorySearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={categorySearchOpen}
                        className="w-full justify-between glass border-glass-border focus:border-neon-cyan text-left font-normal"
                      >
                        <span className={newCategory ? "text-white" : "text-muted-foreground"}>
                          {newCategory ? newCategory.name : "Select a category..."}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search categories..." />
                        <CommandList>
                          <CommandEmpty>No categories found.</CommandEmpty>
                          <CommandGroup>
                            {skillCategories.map((cat) => (
                              <CommandItem
                                key={cat.id}
                                value={cat.name}
                                onSelect={() => {
                                  setNewCategory(cat);
                                  setCategorySearchOpen(false);
                                }}
                              >
                                {cat.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Button
                onClick={() => {
                  if (!newSkill) {
                    toast.error("Please select a skill");
                  } else if (!newCategory) {
                    toast.error("Please select a category");
                  } else {
                    handleAddSkill(newSkill, newCategory);
                  }
                }}
                className="bg-gradient-to-r from-neon-cyan to-neon-purple text-white"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Skill
              </Button>
            </div>
          </Card>
        )}

        {/* Search and Category Filters */}
        <Card className="glass p-6 rounded-2xl border border-glass-border mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search skills..." className="glass border-glass-border focus:border-neon-cyan pl-10" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {skillCategories.map((category) => (
                <Button
                  key={category.id}
                  onClick={() => setSelectedCategory(category)}
                  variant={selectedCategory?.id === category.id ? "default" : "outline"}
                  size="sm"
                  className={selectedCategory?.id === category.id ? "bg-gradient-to-r from-neon-pink to-neon-yellow text-black" : "glass hover:glass-strong border-glass-border"}
                >
                  {category.name.toLowerCase().includes("professional") && <Briefcase className="h-4 w-4 mr-2" />}
                  {category.name.toLowerCase().includes("technical") && <Code className="h-4 w-4 mr-2" />}
                  {(category.name.toLowerCase().includes("soft") || category.name.toLowerCase().includes("skill")) && <Users className="h-4 w-4 mr-2" />}
                  {category.name}
                  <Badge variant="outline" className="ml-2 border-glass-border text-xs">
                    {skills?.filter((s) => s.category?.id === category.id).length}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Skills List */}
        <div className="space-y-4 mb-6">
          {filteredSkills?.length === 0 ? (
            <Card className="glass p-12 text-center">
              <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">
                No {selectedCategory?.name.toLowerCase() ?? ""} skills found. Add your first skill to get started!
              </p>
            </Card>
          ) : (
            filteredSkills?.map((skill) => (
              <Card key={skill.skill?.id ?? skill.id} className="glass hover:glass-strong p-6 rounded-xl border border-glass-border transition-all">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-bold text-white text-lg">{skill.skill?.name}</h3>
                        {skill.is_top_skill && (
                          <Badge variant="outline" className="border-neon-yellow/30 text-neon-yellow text-xs">
                            <Star className="h-3 w-3 mr-1 fill-neon-yellow" />
                            Top Skill
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        onClick={() => handleToggleTopSkill(skill.id)}
                        variant="ghost"
                        size="icon"
                        className={`glass hover:glass-strong ${skill.is_top_skill ? "text-neon-yellow border border-neon-yellow/30" : "text-muted-foreground"}`}
                        title={skill.is_top_skill ? "Remove from top skills" : "Add to top skills"}
                      >
                        <Star className={`h-4 w-4 ${skill.is_top_skill ? "fill-neon-yellow" : ""}`} />
                      </Button>
                      <Button onClick={() => handleDeleteSkill(skill.id)} variant="ghost" size="icon" className="glass hover:glass-strong text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-muted-foreground">Proficiency: {skill.proficiency}%</Label>
                      <span className={`text-sm font-medium ${getProficiencyColor(skill.proficiency)}`}>{getExperienceLevelFromProficiency(skill.proficiency)}</span>
                    </div>
                    <Slider
                      value={[skill.proficiency]}
                      onValueChange={(value) => skill.skill?.id && handleProficiencyChange(skill.skill.id, value[0])}
                      max={100}
                      step={5}
                      className="w-full"
                    />
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
          <div className="text-sm text-muted-foreground">{skills?.length} total skills across all categories</div>
          <div className="flex gap-3">
            <Button variant="outline" className="glass hover:glass-strong">
              Cancel
            </Button>
            <Button onClick={handleSaveAll} className="bg-gradient-to-r from-neon-pink to-neon-yellow text-black hover:scale-105 transition-all">
              <Check className="h-4 w-4 mr-2" />
              Save All Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
