import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import type { GoalExperienceLevel } from "./careerGoal";

/** Ready Now is 80 or above. Almost There is 60–79. */
export const READY_MIN = 80;
export const ALMOST_MIN = 60;
export const ALMOST_MAX = 79;

const TITLE_SCAN_LIMIT = 160;
const TITLE_MATCH_CAP = 48;
const EXPERIENCE_TAKE = 16;

const SENIORITY = new Set([
  "senior",
  "junior",
  "sr",
  "jr",
  "staff",
  "lead",
  "principal",
  "intern",
  "internship",
  "associate",
  "entry",
  "level",
  "mid",
  "i",
  "ii",
  "iii",
  "iv",
  "v",
  "head",
  "chief",
]);

const SYNONYMS: Record<string, string> = {
  developer: "engineer",
  programmer: "engineer",
  swe: "engineer",
  sde: "engineer",
  frontend: "front",
  backend: "back",
  fullstack: "full",
  pm: "product",
};

export type UserRoleProfile = {
  titleIds: Set<Id<"job_titles">>;
  phrases: string[];
};

export function titleTokens(raw: string): string[] {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9+#]+/g, " ")
    .split(/\s+/)
    .map((token) => SYNONYMS[token] ?? token)
    .filter((token) => token.length >= 2 && !SENIORITY.has(token));
}

/** 0–1 overlap for “similar jobs”. Two shared role tokens (e.g. product + manager) count as a match. */
export function titleSimilarity(left: string, right: string): number {
  const a = titleTokens(left);
  const b = titleTokens(right);
  if (a.length === 0 || b.length === 0) return 0;
  if (a.join(" ") === b.join(" ")) return 1;
  const aSet = new Set(a);
  const bSet = new Set(b);
  const shared = a.filter((token) => bSet.has(token));
  if (shared.length === 0) return 0;
  const jaccard = shared.length / new Set([...a, ...b]).size;
  if (a.every((token) => bSet.has(token)) || b.every((token) => aSet.has(token))) return Math.max(0.8, jaccard);
  if (shared.length >= 2) return Math.max(0.55, jaccard);
  return jaccard;
}

export function titlesAlign(jobTitle: string, userTitle: string): boolean {
  const jobTokens = titleTokens(jobTitle);
  const userTokens = titleTokens(userTitle);
  if (jobTokens.length === 0 || userTokens.length === 0) return false;
  if (jobTokens.join(" ") === userTokens.join(" ")) return true;

  const jobSet = new Set(jobTokens);
  const userSet = new Set(userTokens);
  const shared = jobTokens.filter((token) => userSet.has(token));
  if (shared.length === 0) return false;
  if (userTokens.every((token) => jobSet.has(token)) || jobTokens.every((token) => userSet.has(token))) {
    return true;
  }
  const union = new Set([...jobTokens, ...userTokens]).size;
  return shared.length >= 2 && shared.length / union >= 0.4;
}

export function jobMatchesUserRole(jobTitleId: Id<"job_titles"> | undefined, jobTitle: string | null | undefined, profile: UserRoleProfile): boolean {
  if (jobTitleId && profile.titleIds.has(jobTitleId)) return true;
  const title = (jobTitle ?? "").trim();
  if (!title) return false;
  return profile.phrases.some((phrase) => titlesAlign(title, phrase));
}

export function roundedReadiness(readiness: number | null | undefined): number | null {
  if (typeof readiness !== "number" || Number.isNaN(readiness)) return null;
  return Math.round(readiness);
}

export function isReadyNow(score: number | null): boolean {
  return score != null && score >= READY_MIN;
}

export function isAlmostThere(score: number | null): boolean {
  return score != null && score >= ALMOST_MIN && score <= ALMOST_MAX;
}

export function scoreInRange(score: number | null, min?: number, max?: number): boolean {
  if (score == null) return false;
  if (typeof min === "number" && score < min) return false;
  if (typeof max === "number" && score > max) return false;
  return true;
}

export async function loadUserRoleProfile(ctx: QueryCtx, user: Doc<"users">): Promise<UserRoleProfile> {
  const [rows, goal] = await Promise.all([
    ctx.db
      .query("experiences")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .take(EXPERIENCE_TAKE),
    ctx.db
      .query("career_goals")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .unique(),
  ]);

  const titleIds = new Set<Id<"job_titles">>();
  const uniqueTitleIds = [...new Set(rows.map((row) => row.job_title_id).filter((id): id is Id<"job_titles"> => Boolean(id)))];
  const titled = await Promise.all(uniqueTitleIds.map((id) => ctx.db.get(id)));
  const phrases: string[] = [];

  for (const id of uniqueTitleIds) titleIds.add(id);
  for (const title of titled) {
    if (title?.name) phrases.push(title.name);
  }

  if (phrases.length === 0 && user.headline?.trim()) {
    phrases.push(user.headline.trim());
  }

  // The goal is a matching input even when the user has no work experience.
  // Include every target role (the primary role first) so early-career users
  // can still get a useful role pool from their goal.
  const goalRoles = [
    ...new Set(
      [goal?.target_role, ...(goal?.target_roles ?? [])]
        .map((role) => role?.trim())
        .filter((role): role is string => Boolean(role)),
    ),
  ];
  const newGoalRoles = goalRoles.filter(
    (role) => !phrases.some((phrase) => phrase.toLowerCase() === role.toLowerCase()),
  );
  if (newGoalRoles.length > 0) phrases.unshift(...newGoalRoles);

  return { titleIds, phrases };
}

export function hasRoleProfile(profile: UserRoleProfile): boolean {
  return profile.titleIds.size > 0 || profile.phrases.length > 0;
}

const MAX_YEARS_BY_GOAL: Record<GoalExperienceLevel, number | null> = {
  entry: 2,
  mid: 5,
  senior: 8,
  lead: null,
};

const SENIORITY_PATTERNS: Record<GoalExperienceLevel, RegExp> = {
  entry: /\b(senior|sr|staff|lead|principal|head|chief|director|vp|vice president)\b/i,
  mid: /\b(staff|lead|principal|head|chief|director|vp|vice president)\b/i,
  senior: /\b(principal|head|chief|director|vp|vice president)\b/i,
  lead: /\b(chief|director|vp|vice president)\b/i,
};

const JOB_LEVEL_YEARS: Record<string, number> = {
  intern: 0,
  internship: 0,
  entry: 0,
  junior: 1,
  associate: 2,
  mid: 4,
  intermediate: 4,
  senior: 7,
  sr: 7,
  staff: 9,
  lead: 10,
  principal: 10,
  head: 12,
  director: 12,
  vp: 15,
  "vice president": 15,
};

/**
 * Goal-first matching must not hand a fresher a 5–8 year senior role just
 * because the title shares tokens with their target role. Explicit search is
 * still filtered in this mode; All Jobs remains available for a raw search.
 */
export function isSeniorityCompatible(
  job: Doc<"jobs">,
  goalLevel: GoalExperienceLevel | null | undefined,
): boolean {
  const level = goalLevel ?? "entry";
  if (SENIORITY_PATTERNS[level].test(job.title ?? "")) return false;

  const maxYears = MAX_YEARS_BY_GOAL[level];
  if (maxYears == null) return true;

  const levelKey = (job.experience_level ?? "").toLowerCase().trim();
  const yearsFromField = job.experience ?? null;
  const yearsFromLevel = levelKey ? (JOB_LEVEL_YEARS[levelKey] ?? null) : null;
  const years =
    yearsFromField == null
      ? yearsFromLevel
      : yearsFromLevel == null
        ? yearsFromField
        : Math.max(yearsFromField, yearsFromLevel);
  return years == null || years <= maxYears;
}

export const ROLE_SCAN = { TITLE_SCAN_LIMIT, TITLE_MATCH_CAP };
