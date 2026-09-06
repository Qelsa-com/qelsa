export type CareerGoalTimeline = "3_months" | "6_months" | "1_year" | "2_plus_years";
export type CareerGoalExperienceLevel = "entry" | "mid" | "senior" | "lead";
export type CareerGoalFocus = "switch_roles" | "get_promoted" | "switch_industries" | "upskill";

export type CareerGoal = {
  id?: string;
  description?: string;
  target_role: string;
  dream_companies: string[];
  timeline?: CareerGoalTimeline;
  experience_level?: CareerGoalExperienceLevel;
  skills: string[];
  primary_focus?: CareerGoalFocus;
  updated_at?: number;
};

export type ExtractedCareerGoal = {
  target_role: string | null;
  dream_companies: string[];
  timeline: CareerGoalTimeline | null;
  experience_level: CareerGoalExperienceLevel | null;
  skills: string[];
  primary_focus: CareerGoalFocus | null;
  source?: "rules" | "ai";
};
