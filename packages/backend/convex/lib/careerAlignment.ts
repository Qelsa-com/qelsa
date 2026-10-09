import { titleSimilarity } from "./jobProfileMatch";

export function calculateCareerAlignment(
  goal: {
    target_roles?: string[];
    target_role?: string;
    skills?: string[];
    industries?: string[];
    experience_level?: string;
  } | null | undefined,
  job: {
    title?: string | null;
    industry?: string | null;
    company_name?: string | null;
  },
  jobSkillNames: string[],
): number | null {
  if (!goal) return null;
  const targetRoles = goal.target_roles?.length
    ? goal.target_roles
    : goal.target_role
      ? [goal.target_role]
      : [];

  if (targetRoles.length === 0 && (!goal.skills || goal.skills.length === 0)) {
    return null;
  }

  // 1. Target Role Alignment (45% weight)
  let roleScore = 0;
  const jobTitle = (job.title ?? "").toLowerCase().trim();
  if (jobTitle && targetRoles.length > 0) {
    for (const targetRole of targetRoles) {
      const target = targetRole.toLowerCase().trim();
      if (!target) continue;
      if (jobTitle === target) {
        roleScore = Math.max(roleScore, 100);
      } else if (jobTitle.includes(target) || target.includes(jobTitle)) {
        roleScore = Math.max(roleScore, 90);
      } else {
        const sim = titleSimilarity(jobTitle, target);
        roleScore = Math.max(roleScore, Math.round(sim * 100));
      }
    }
  } else if (targetRoles.length === 0) {
    roleScore = 70;
  }

  // 2. Target Skills Alignment (35% weight)
  // Does this job require skills the user aims to build?
  let skillScore = 0;
  const goalSkills = (goal.skills ?? []).map((s) => s.toLowerCase().trim()).filter(Boolean);
  if (goalSkills.length > 0 && jobSkillNames.length > 0) {
    const jobSkillsLower = jobSkillNames.map((s) => s.toLowerCase().trim());
    let matchedCount = 0;
    for (const gs of goalSkills) {
      if (jobSkillsLower.some((js) => js === gs || js.includes(gs) || gs.includes(js))) {
        matchedCount++;
      }
    }
    skillScore = Math.min(100, Math.round((matchedCount / Math.min(goalSkills.length, 3)) * 100));
  } else if (goalSkills.length === 0) {
    skillScore = roleScore;
  } else {
    skillScore = 40;
  }

  // 3. Target Industry Alignment (20% weight)
  let industryScore = 70;
  const goalIndustries = (goal.industries ?? []).map((i) => i.toLowerCase().trim()).filter(Boolean);
  if (goalIndustries.length > 0) {
    const jobIndustry = (job.industry ?? "").toLowerCase().trim();
    if (jobIndustry) {
      const matched = goalIndustries.some((gi) => jobIndustry.includes(gi) || gi.includes(jobIndustry));
      industryScore = matched ? 100 : 45;
    } else {
      industryScore = 65;
    }
  }

  const rawAlignment = Math.round(roleScore * 0.45 + skillScore * 0.35 + industryScore * 0.20);
  return Math.max(0, Math.min(100, rawAlignment));
}

/** With a career goal, blend readiness and alignment. Otherwise the match is readiness. */
export function calculateSmartMatch(readiness: number, careerAlignment: number | null | undefined): number {
  if (careerAlignment == null || Number.isNaN(careerAlignment)) return Math.round(readiness);
  return Math.round(0.6 * readiness + 0.4 * careerAlignment);
}
