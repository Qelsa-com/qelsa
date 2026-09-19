// Shared skill enums used by both user-skills and job-skills.

/** How many skill pills to render before collapsing into a "+N" overflow chip. */
export const MAX_VISIBLE_SKILLS = 8;

/** Hard cap on skills a candidate can attach to their profile. */
export const MAX_USER_SKILLS = 20;

/** How many skills a candidate can star as top skills. */
export const MAX_TOP_SKILLS = 3;

export type ProficiencyLevel = "beginner" | "intermediate" | "advance" | "expert";

export const PROFICIENCY_LEVELS: { value: ProficiencyLevel; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advance", label: "Advance" },
  { value: "expert", label: "Expert" },
];

// Display label for a proficiency value; blank/unset -> "Not set".
export const proficiencyLabel = (p?: ProficiencyLevel | string | null): string => {
  if (!p) return "Not set";
  return PROFICIENCY_LEVELS.find((l) => l.value === p)?.label ?? String(p);
};

/** Badge copy for view modals — "advance" reads as Advanced. */
export const proficiencyBadgeLabel = (p?: ProficiencyLevel | string | null): string => {
  if (p === "advance") return "Advanced";
  return proficiencyLabel(p);
};

/** "Senior Product Manager · TechFlow Solutions" — skips empty parts. */
export const skillRoleSubtitle = (role?: string | null, company?: string | null): string => {
  return [role, company].filter((part): part is string => Boolean(part && part.trim())).join(" · ");
};

export type JobSkillType = "core" | "preferred" | "nice_to_have";

export const JOB_SKILL_TYPES: { value: JobSkillType; label: string }[] = [
  { value: "core", label: "Core" },
  { value: "preferred", label: "Preferred" },
  { value: "nice_to_have", label: "Nice to have" },
];

// Display label for a job-skill type; note the wire value `nice_to_have` -> "Nice to have".
export const jobSkillTypeLabel = (t?: JobSkillType | string | null): string => {
  return JOB_SKILL_TYPES.find((x) => x.value === t)?.label ?? "Preferred";
};
