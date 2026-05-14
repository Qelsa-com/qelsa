import { useGetUserSkillsQuery } from "@/features/api/userSkillsApi";
import { UserSkill } from "@/types/userSkill";
import { ArrowLeft, Award, Info, Star, Target, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

export function SkillsViewPage() {
  const router = useRouter();
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const { data: userSkills, error, isLoading } = useGetUserSkillsQuery();

  // Sync skills state with fetched data
  useEffect(() => {
    if (userSkills) {
      setSkills(userSkills);
    }
  }, [userSkills]);

  const handleEdit = () => {
    router.push("/profile/skills/edit");
  };

  function getExperienceLevelFromProficiency(proficiency: number) {
    if (proficiency >= 90) return "Expert";
    if (proficiency >= 70) return "Advanced";
    if (proficiency >= 40) return "Intermediate";
    return "Beginner";
  }

  // Calculate skill statistics
  const totalSkills = skills.length;
  const topSkillsCount = skills.filter((s) => s.is_top_skill).length;
  const expertSkills = skills.filter((s) => s.experience_level === "Expert").length;
  const advancedSkills = skills.filter((s) => s.experience_level === "Advanced").length;

  // Group skills dynamically by their category object
  const skillsByCategoryMap = skills.reduce((map, s) => {
    if (!s.category) return map;
    const key = s.category.id;
    if (!map.has(key)) map.set(key, { name: s.category.name, skills: [] });
    map.get(key)!.skills.push(s);
    return map;
  }, new Map<number, { name: string; skills: typeof skills }>());

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/3 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-neon-purple/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button onClick={() => router.back()} variant="outline" size="icon" className="glass hover:glass-strong border-glass-border hover:border-neon-cyan">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                <span className="bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">Skills & Expertise</span>
              </h1>
              <p className="text-muted-foreground mt-1">Complete overview of your professional skill set</p>
            </div>
          </div>
          <Button onClick={handleEdit} className="bg-gradient-to-r from-neon-cyan to-neon-purple text-black hover:scale-105 transition-all duration-300">
            <Award className="h-4 w-4 mr-2" />
            Edit Skills
          </Button>
        </div>

        {/* Skills Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="glass p-6 rounded-2xl border border-glass-border">
            <div className="flex items-center justify-between mb-2">
              <Award className="h-5 w-5 text-neon-cyan" />
              <span className="text-2xl font-bold text-white">{totalSkills}</span>
            </div>
            <p className="text-sm text-muted-foreground">Total Skills</p>
          </Card>

          <Card className="glass p-6 rounded-2xl border border-glass-border">
            <div className="flex items-center justify-between mb-2">
              <Star className="h-5 w-5 text-neon-yellow fill-neon-yellow" />
              <span className="text-2xl font-bold text-white">{topSkillsCount}</span>
            </div>
            <p className="text-sm text-muted-foreground">Top Skills</p>
          </Card>

          <Card className="glass p-6 rounded-2xl border border-glass-border">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-neon-green" />
              <span className="text-2xl font-bold text-white">{expertSkills}</span>
            </div>
            <p className="text-sm text-muted-foreground">Expert Level</p>
          </Card>

          <Card className="glass p-6 rounded-2xl border border-glass-border">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-neon-purple" />
              <span className="text-2xl font-bold text-white">{advancedSkills}</span>
            </div>
            <p className="text-sm text-muted-foreground">Advanced Level</p>
          </Card>
        </div>

        {/* Proficiency Level Legend */}
        <Card className="glass p-6 rounded-2xl border border-neon-cyan/30 mb-8">
          <div className="flex items-start gap-3 mb-4">
            <Info className="h-5 w-5 text-neon-cyan mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1">Understanding Proficiency Levels</h3>
              <p className="text-sm text-muted-foreground">Skill level definitions for reference</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 glass-strong rounded-xl border border-neon-pink/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-neon-pink"></div>
                <span className="font-medium text-neon-pink">Beginner</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Has basic understanding; can follow instructions but cannot work independently.</p>
            </div>

            <div className="p-4 glass-strong rounded-xl border border-neon-cyan/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-neon-cyan"></div>
                <span className="font-medium text-neon-cyan">Intermediate</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Can apply the skill in common situations with some guidance; has worked on a few real-world tasks.</p>
            </div>

            <div className="p-4 glass-strong rounded-xl border border-neon-green/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-neon-green"></div>
                <span className="font-medium text-neon-green">Advanced</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Can work independently, solve complex problems, and deliver end-to-end tasks with consistency.</p>
            </div>

            <div className="p-4 glass-strong rounded-xl border border-neon-yellow/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-neon-yellow"></div>
                <span className="font-medium text-neon-yellow">Expert</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Deep mastery; can architect solutions, handle ambiguity, and guide others in the skill.</p>
            </div>
          </div>
        </Card>

        {/* Top Skills Section */}
        {skills.some((s) => s.is_top_skill) && (
          <Card className="glass p-8 rounded-2xl border border-glass-border mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Star className="h-6 w-6 text-neon-yellow fill-neon-yellow" />
              <h2 className="text-2xl font-bold text-white">Top Skills</h2>
              <Badge className="bg-neon-yellow/20 text-neon-yellow border-neon-yellow/30">Featured</Badge>
            </div>
            <p className="text-muted-foreground mb-6">Your highlighted skills that showcase your strongest expertise</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {skills
                .filter((skill) => skill.is_top_skill)
                .map((skill) => (
                  <div key={skill.id} className="p-6 glass-strong rounded-xl border border-neon-yellow/20 hover:border-neon-yellow/40 transition-all duration-300">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-white text-lg mb-1">{skill.skill?.name}</h3>
                      </div>
                      <Star className="h-5 w-5 text-neon-yellow fill-neon-yellow flex-shrink-0" />
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        getExperienceLevelFromProficiency(skill.proficiency) === "Expert"
                          ? "bg-neon-yellow/10 border-neon-yellow/30 text-neon-yellow"
                          : getExperienceLevelFromProficiency(skill.proficiency) === "Advanced"
                          ? "bg-neon-green/10 border-neon-green/30 text-neon-green"
                          : getExperienceLevelFromProficiency(skill.proficiency) === "Intermediate"
                          ? "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan"
                          : "bg-neon-pink/10 border-neon-pink/30 text-neon-pink"
                      }`}
                    >
                      {getExperienceLevelFromProficiency(skill.proficiency)}
                    </Badge>
                  </div>
                ))}
            </div>
          </Card>
        )}

        {/* All Skills by Category */}
        <div className="space-y-6">
          {Array.from(skillsByCategoryMap.entries()).map(([catId, { name: categoryName, skills: categorySkills }]) => {
            const nonTopSkills = categorySkills.filter((s) => !s.is_top_skill);

            if (nonTopSkills.length === 0) return null;

            return (
              <Card key={catId} className="glass p-8 rounded-2xl border border-glass-border">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">{categoryName}</h2>
                  <Badge className="bg-glass-bg text-white border-glass-border">
                    {nonTopSkills.length} {nonTopSkills.length === 1 ? "skill" : "skills"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {nonTopSkills.map((skill) => (
                    <div key={skill.id} className="p-4 glass-strong rounded-xl border border-glass-border hover:border-neon-cyan/30 transition-all duration-300">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-white">{skill.skill?.name}</h3>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          getExperienceLevelFromProficiency(skill.proficiency) === "Expert"
                            ? "bg-neon-yellow/10 border-neon-yellow/30 text-neon-yellow"
                            : getExperienceLevelFromProficiency(skill.proficiency) === "Advanced"
                            ? "bg-neon-green/10 border-neon-green/30 text-neon-green"
                            : getExperienceLevelFromProficiency(skill.proficiency) === "Intermediate"
                            ? "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan"
                            : "bg-neon-pink/10 border-neon-pink/30 text-neon-pink"
                        }`}
                      >
                        {getExperienceLevelFromProficiency(skill.proficiency)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {skills.length === 0 && (
          <Card className="glass p-12 rounded-2xl border border-glass-border text-center">
            <Award className="h-16 w-16 text-neon-cyan mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-white mb-2">No Skills Added Yet</h3>
            <p className="text-muted-foreground mb-6">Start building your professional profile by adding your skills and expertise</p>
            <Button onClick={handleEdit} className="bg-gradient-to-r from-neon-cyan to-neon-purple text-black hover:scale-105 transition-all duration-300">
              <Award className="h-4 w-4 mr-2" />
              Add Your First Skill
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
