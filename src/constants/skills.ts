// Shared skill enums used by both user-skills and job-skills.

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
