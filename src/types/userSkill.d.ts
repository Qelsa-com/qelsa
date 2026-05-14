export type Skill = {
  id: number;
  name: string;
};

export type SkillCategory = {
  id: number;
  name: string;
};

export type UserSkill = {
  id?: number;
  skill: Skill;
  category: SkillCategory;
  proficiency: number;
  experience_level?: string;
  is_top_skill: boolean;
};
