export type Skill = {
  id: number;
  name: string;
  category_id?: number;
  category?: SkillCategory | null;
};

export type SkillCategory = {
  id: number;
  name: string;
};

export type UserSkill = {
  id?: number;
  skill: Skill;
  category: SkillCategory | null;
  proficiency: number;
  experience_level?: string;
  is_top_skill: boolean;
};
