import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { MAX_USER_SKILLS } from "./skillLimits";
import { normalizeSkillName, PROFICIENCY_ORDER, skillMatchKey, skillMentionPhrases } from "./skillMatch";

type Level = (typeof PROFICIENCY_ORDER)[number];

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;
const EXPERIENCE_TAKE = 20;
const EXPERIENCE_SKILL_TAKE = 25;
const EDUCATION_TAKE = 10;
const CERT_TAKE = 20;
const CERT_SKILL_TAKE = 20;

type Interval = { start: number; end: number };

type Evidence = {
  experiences: Array<Interval & { skillIds: Set<string>; skillKeys: Set<string>; text: string }>;
  certifications: Array<{ skillIds: Set<string>; skillKeys: Set<string>; text: string }>;
  profileText: string;
  educationText: string;
  careerYears: number;
};

type SkillRef = { id: string; name: string };

function mergedYears(intervals: Interval[]) {
  const sorted = intervals.filter((i) => i.end > i.start).sort((a, b) => a.start - b.start);
  let total = 0;
  let cursor = -Infinity;
  for (const { start, end } of sorted) {
    const from = Math.max(start, cursor);
    if (end > from) total += end - from;
    cursor = Math.max(cursor, end);
  }
  return total / YEAR_MS;
}

/** Normalized text padded with spaces so phrases can be matched as whole words. */
function searchable(parts: Array<string | undefined | null>) {
  return ` ${normalizeSkillName(parts.filter(Boolean).join(" "))} `;
}

function mentions(text: string, skill: SkillRef) {
  return skillMentionPhrases(skill.name).some((phrase) => text.includes(` ${phrase} `));
}

function linked(entry: { skillIds: Set<string>; skillKeys: Set<string> }, skill: SkillRef) {
  return entry.skillIds.has(skill.id) || entry.skillKeys.has(skillMatchKey(skill.name));
}

function levelFromYears(years: number): Level {
  if (years >= 6) return "expert";
  if (years >= 3) return "advance";
  if (years >= 1) return "intermediate";
  return "beginner";
}

const rank = (level: Level) => PROFICIENCY_ORDER.indexOf(level);
const atLeast = (level: Level, floor: Level) => (rank(level) >= rank(floor) ? level : floor);
const atMost = (level: Level, cap: Level) => (rank(level) <= rank(cap) ? level : cap);
const bump = (level: Level) => PROFICIENCY_ORDER[Math.min(rank(level) + 1, PROFICIENCY_ORDER.length - 1)]!;

/**
 * Deterministic estimate of how strong a candidate is in one skill:
 * years of roles that use or mention it, then certifications (+1 level) and
 * education (at least intermediate) on top. Skills that are only listed get a
 * conservative baseline from overall career length.
 */
export function inferSkillLevel(skill: SkillRef, evidence: Evidence): Level {
  const usedIn = evidence.experiences.filter((exp) => linked(exp, skill) || mentions(exp.text, skill));
  let level: Level;
  if (usedIn.length > 0) {
    level = levelFromYears(Math.min(mergedYears(usedIn), evidence.careerYears));
  } else if (mentions(evidence.profileText, skill)) {
    level = atMost(levelFromYears(evidence.careerYears * 0.6), "advance");
  } else {
    level = evidence.careerYears >= 1 ? "intermediate" : "beginner";
  }

  if (evidence.certifications.some((cert) => linked(cert, skill) || mentions(cert.text, skill))) {
    level = atLeast(bump(level), "intermediate");
  }
  if (mentions(evidence.educationText, skill)) {
    level = atLeast(level, "intermediate");
  }
  return level;
}

async function loadEvidence(ctx: MutationCtx, user: Doc<"users">, now: number): Promise<Evidence> {
  const skillKeyCache = new Map<Id<"skills">, Promise<string | null>>();
  const skillKey = (id: Id<"skills">) => {
    let key = skillKeyCache.get(id);
    if (!key) {
      key = ctx.db.get(id).then((skill) => (skill ? (skill.match_key ?? skillMatchKey(skill.name)) : null));
      skillKeyCache.set(id, key);
    }
    return key;
  };
  const linkSets = async (ids: Id<"skills">[]) => {
    const keys = await Promise.all(ids.map(skillKey));
    return { skillIds: new Set<string>(ids), skillKeys: new Set(keys.filter((key): key is string => Boolean(key))) };
  };

  const [experienceRows, educationRows, certRows] = await Promise.all([
    ctx.db.query("experiences").withIndex("by_user", (q) => q.eq("user_id", user._id)).take(EXPERIENCE_TAKE),
    ctx.db.query("educations").withIndex("by_user", (q) => q.eq("user_id", user._id)).take(EDUCATION_TAKE),
    ctx.db.query("user_certifications").withIndex("by_user", (q) => q.eq("user_id", user._id)).take(CERT_TAKE),
  ]);

  const experiences = await Promise.all(
    experienceRows.map(async (row) => {
      const [links, title] = await Promise.all([
        ctx.db
          .query("experience_skills")
          .withIndex("by_experience", (q) => q.eq("experience_id", row._id))
          .take(EXPERIENCE_SKILL_TAKE),
        row.job_title_id ? ctx.db.get(row.job_title_id) : null,
      ]);
      const end = row.is_current || !row.end_date ? now : row.end_date;
      return {
        start: row.start_date,
        end: Math.min(end, now),
        ...(await linkSets(links.map((link) => link.skill_id))),
        text: searchable([title?.name, row.description, ...(row.responsibilities ?? []).map((item) => item.title)]),
      };
    }),
  );

  const certifications = await Promise.all(
    certRows.map(async (row) => {
      const links = await ctx.db
        .query("user_certification_skills")
        .withIndex("by_certification", (q) => q.eq("user_certification_id", row._id))
        .take(CERT_SKILL_TAKE);
      return {
        ...(await linkSets(links.map((link) => link.skill_id))),
        text: searchable([row.name, row.description]),
      };
    }),
  );

  const educationParts = await Promise.all(
    educationRows.map(async (row) => {
      const [degree, field] = await Promise.all([
        row.degree_id ? ctx.db.get(row.degree_id) : null,
        row.field_of_study_id ? ctx.db.get(row.field_of_study_id) : null,
      ]);
      return [degree?.name, field?.name, row.description, ...(row.projects ?? []).map((item) => item.title)];
    }),
  );

  return {
    experiences,
    certifications,
    profileText: searchable([user.headline, user.professional_summary, user.about]),
    educationText: searchable(educationParts.flat()),
    careerYears: mergedYears(experiences),
  };
}

/**
 * Recompute every skill level from the current profile. Candidates cannot pin
 * a level, so a later edit to experience, education, certifications, or the
 * headline and summary replaces the previous estimate. Idempotent: a row is
 * patched only when the estimate changes. Returns immediately when the user
 * has no skills, before any evidence is loaded.
 */
export async function refreshInferredSkillLevels(ctx: MutationCtx, userId: Id<"users">, now = Date.now()) {
  const rows = await ctx.db
    .query("user_skills")
    .withIndex("by_user", (q) => q.eq("user_id", userId))
    .take(MAX_USER_SKILLS * 2);
  if (rows.length === 0) return 0;

  const user = await ctx.db.get(userId);
  if (!user) return 0;
  const evidence = await loadEvidence(ctx, user, now);

  let changed = 0;
  for (const row of rows) {
    const skill = await ctx.db.get(row.skill_id);
    if (!skill) continue;
    const level = inferSkillLevel({ id: row.skill_id, name: skill.name }, evidence);
    if (row.proficiency === level && row.proficiency_inferred) continue;
    await ctx.db.patch(row._id, { proficiency: level, proficiency_inferred: true });
    changed += 1;
  }
  return changed;
}
