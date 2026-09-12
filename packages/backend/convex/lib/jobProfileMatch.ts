import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

/** Ready Now is strictly above this score. Almost There is 70–80 inclusive. */
export const READY_MIN_EXCLUSIVE = 80;
export const ALMOST_MIN = 70;
export const ALMOST_MAX = 80;

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
  return score != null && score > READY_MIN_EXCLUSIVE;
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

  const targetRole = goal?.target_role?.trim();
  if (targetRole && !phrases.some((phrase) => phrase.toLowerCase() === targetRole.toLowerCase())) {
    phrases.unshift(targetRole);
  }

  return { titleIds, phrases };
}

export function hasRoleProfile(profile: UserRoleProfile): boolean {
  return profile.titleIds.size > 0 || profile.phrases.length > 0;
}

export const ROLE_SCAN = { TITLE_SCAN_LIMIT, TITLE_MATCH_CAP };
