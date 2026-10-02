import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { proficiencyRank, skillMatchKey } from "./skillMatch";

type Proficiency = Doc<"user_skills">["proficiency"];

/** Catalog spelling variants share a key; a handful per key at most. */
const ALIAS_TAKE = 8;

export async function findSkillByMatchKey(ctx: QueryCtx, name: string) {
  const key = skillMatchKey(name);
  if (!key) return null;
  return await ctx.db
    .query("skills")
    .withIndex("by_match_key", (q) => q.eq("match_key", key))
    .first();
}

export async function insertSkill(
  ctx: MutationCtx,
  fields: Omit<Doc<"skills">, "_id" | "_creationTime" | "match_key">,
) {
  return await ctx.db.insert("skills", { ...fields, match_key: skillMatchKey(fields.name) });
}

/** Exact name, then spelling variant (ReactJS -> React), then a new catalog row. */
export async function findOrCreateSkill(ctx: MutationCtx, name: string): Promise<Id<"skills"> | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const exact = await ctx.db
    .query("skills")
    .withIndex("by_name", (q) => q.eq("name", trimmed))
    .first();
  if (exact) return exact._id;
  const variant = await findSkillByMatchKey(ctx, trimmed);
  if (variant) return variant._id;
  // Rows created before `match_key` existed are only reachable by text search.
  const key = skillMatchKey(trimmed);
  const hits = await ctx.db
    .query("skills")
    .withSearchIndex("search_name", (q) => q.search("name", trimmed))
    .take(10);
  const legacy = hits.find((row) => skillMatchKey(row.name) === key);
  if (legacy) return legacy._id;
  return await insertSkill(ctx, { name: trimmed });
}

/**
 * The user's skills plus every catalog spelling variant of them, carrying the
 * same proficiency and name. Lets callers that only have `job_skills.skill_id`
 * (list scoring) match "React" jobs against a "ReactJS" profile. Bounded by
 * the user's skill count: one get and one indexed read per skill.
 */
export async function withSkillAliases(
  ctx: QueryCtx,
  rows: Array<{ skill_id: Id<"skills">; proficiency?: Proficiency }>,
): Promise<Array<{ skill_id: Id<"skills">; proficiency?: Proficiency; name?: string }>> {
  const own = new Set(rows.map((row) => row.skill_id));
  const expanded = await Promise.all(
    rows.map(async (row) => {
      const skill = await ctx.db.get(row.skill_id);
      if (!skill) return [{ ...row }];
      const key = skill.match_key ?? skillMatchKey(skill.name);
      const variants = key
        ? await ctx.db
            .query("skills")
            .withIndex("by_match_key", (q) => q.eq("match_key", key))
            .take(ALIAS_TAKE)
        : [];
      return [
        { skill_id: row.skill_id, proficiency: row.proficiency, name: skill.name },
        ...variants
          .filter((variant) => !own.has(variant._id))
          .map((variant) => ({ skill_id: variant._id, proficiency: row.proficiency, name: skill.name })),
      ];
    }),
  );

  const bySkill = new Map<Id<"skills">, { skill_id: Id<"skills">; proficiency?: Proficiency; name?: string }>();
  for (const entry of expanded.flat()) {
    const prev = bySkill.get(entry.skill_id);
    if (!prev || (!own.has(entry.skill_id) && (proficiencyRank(entry.proficiency) ?? -1) > (proficiencyRank(prev.proficiency) ?? -1))) {
      bySkill.set(entry.skill_id, entry);
    }
  }
  return [...bySkill.values()];
}
