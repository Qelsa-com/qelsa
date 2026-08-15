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

import { ProficiencyLevel } from "../constants/skills";

export type UserSkill = {
  id?: number;
  skill: Skill;
  category: SkillCategory | null;
  // Proficiency is now an enum string and may be blank/unset.
  proficiency: ProficiencyLevel | "" | null;
  experience_level?: string;
  is_top_skill: boolean;
};
