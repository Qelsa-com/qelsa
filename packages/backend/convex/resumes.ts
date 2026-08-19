import { v } from "convex/values";
import { internalQuery } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { getAppUser } from "./lib/auth";
import { iso, withId } from "./lib/helpers";

export const listMine = authedQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const resumes = await ctx.db
      .query("resumes")
      .withIndex("by_user", (q) => q.eq("user_id", ctx.user._id))
      .order("desc")
      .collect();
    return resumes.map((r) => ({
      ...withId(r),
      createdAt: iso(r._creationTime),
      updatedAt: iso(r._creationTime),
    }));
  },
});

export const create = authedMutation({
  args: {
    title: v.string(),
    storageId: v.id("_storage"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const file_url = await ctx.storage.getUrl(args.storageId);
    const id = await ctx.db.insert("resumes", {
      user_id: ctx.user._id,
      title: args.title,
      storage_id: args.storageId,
      file_url: file_url ?? undefined,
    });
    const resume = await ctx.db.get(id);
    return { resume: withId(resume!) };
  },
});

export const remove = authedMutation({
  args: { id: v.id("resumes") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const resume = await ctx.db.get(args.id);
    if (!resume || resume.user_id !== ctx.user._id) throw new Error("Resume not found");
    if (resume.storage_id) await ctx.storage.delete(resume.storage_id);
    await ctx.db.delete(args.id);
    return null;
  },
});

/**
 * Internal loader used by the `resumeParse.parse` action (which runs in the
 * Node runtime and can't touch ctx.db). Verifies the caller owns the resume and
 * hands back the storage id so the action can read the file bytes.
 */
export const loadForParse = internalQuery({
  args: { resumeId: v.id("resumes") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await getAppUser(ctx);
    const resume = await ctx.db.get(args.resumeId);
    if (!resume || resume.user_id !== user._id) throw new Error("Resume not found");
    return { storageId: resume.storage_id ?? null, title: resume.title };
  },
});

/* ------------------------------------------------------------------ *
 *  Confirmed-draft import: resume review screen -> real profile tables
 * ------------------------------------------------------------------ */

/** Strip case, spaces and punctuation so only the "essence" is compared. */
const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

/**
 * "16th February 2022" / "May 2015" / "Jan 2022" / "2019" / "Present" -> ms | null.
 * Ordinal suffixes ("16th", "31st") break Date.parse, so strip them first —
 * otherwise a full date silently collapses to just its year.
 */
const parseFlexibleDate = (s: unknown): number | null => {
  if (!s || typeof s !== "string") return null;
  if (/present|current|now|ongoing/i.test(s)) return null;
  const cleaned = s.replace(/(\d{1,2})(st|nd|rd|th)\b/gi, "$1").trim();
  const direct = new Date(cleaned);
  if (!isNaN(direct.getTime())) return direct.getTime();
  const y = cleaned.match(/\b(19|20)\d{2}\b/);
  return y ? new Date(Number(y[0]), 0, 1).getTime() : null;
};

const toYear = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isInteger(v)) return v;
  const m = String(v ?? "").match(/\b(19|20)\d{2}\b/);
  return m ? Number(m[0]) : null;
};

/** The ctx inside an authedMutation: a normal mutation ctx plus the app user. */
type Ctx = MutationCtx & { user: Doc<"users"> };

/**
 * Resolve free text to an existing catalog row by EXACT (indexed) then
 * NORMALIZED-equality (via the full-text search index) match. Never a
 * substring/contains match — that was the source of bad resolutions
 * ("Git" -> "Digital Marketing"). Returns the row id or null (caller creates).
 * `table` must have both a `by_name` index and a `search_name` search index.
 */
async function resolveExistingByName(
  ctx: Ctx,
  table: "companies" | "skills" | "job_titles" | "fields_of_study" | "colleges",
  name: string,
): Promise<Id<typeof table> | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const exact = await ctx.db
    .query(table)
    .withIndex("by_name", (q: any) => q.eq("name", trimmed))
    .first();
  if (exact) return exact._id as Id<typeof table>;
  const norm = normalize(trimmed);
  const candidates = await ctx.db
    .query(table)
    .withSearchIndex("search_name", (q: any) => q.search("name", trimmed))
    .take(10);
  for (const c of candidates) {
    if (normalize((c as { name: string }).name) === norm) return c._id as Id<typeof table>;
  }
  return null;
}

async function resolveCompany(ctx: Ctx, name: string): Promise<Id<"companies"> | undefined> {
  const trimmed = name.trim();
  if (!trimmed) return undefined;
  const found = await resolveExistingByName(ctx, "companies", trimmed);
  if (found) return found as Id<"companies">;
  const created = await ctx.db.insert("companies", { name: trimmed });
  // Record it for admin review (deduped by name, counted).
  const sub = await ctx.db
    .query("user_submitted_companies")
    .withIndex("by_name", (q) => q.eq("name", trimmed))
    .first();
  if (sub) {
    await ctx.db.patch(sub._id, { submission_count: sub.submission_count + 1 });
  } else {
    await ctx.db.insert("user_submitted_companies", {
      name: trimmed,
      submitted_by: String(ctx.user._id),
      submission_count: 1,
      status: "pending",
    });
  }
  return created;
}

async function resolveSkill(ctx: Ctx, name: string): Promise<Id<"skills"> | undefined> {
  const trimmed = name.trim();
  if (!trimmed) return undefined;
  const found = await resolveExistingByName(ctx, "skills", trimmed);
  if (found) return found as Id<"skills">;
  return await ctx.db.insert("skills", { name: trimmed });
}

async function resolveJobTitle(ctx: Ctx, name: string): Promise<Id<"job_titles"> | undefined> {
  const trimmed = name.trim();
  if (!trimmed) return undefined;
  const found = await resolveExistingByName(ctx, "job_titles", trimmed);
  if (found) return found as Id<"job_titles">;
  return await ctx.db.insert("job_titles", { name: trimmed });
}

async function resolveField(ctx: Ctx, name: string): Promise<Id<"fields_of_study"> | undefined> {
  const trimmed = name.trim();
  if (!trimmed) return undefined;
  const found = await resolveExistingByName(ctx, "fields_of_study", trimmed);
  if (found) return found as Id<"fields_of_study">;
  return await ctx.db.insert("fields_of_study", { name: trimmed });
}

async function resolveCollege(ctx: Ctx, name: string): Promise<Id<"colleges"> | undefined> {
  const trimmed = name.trim();
  if (!trimmed) return undefined;
  const found = await resolveExistingByName(ctx, "colleges", trimmed);
  if (found) return found as Id<"colleges">;
  return await ctx.db.insert("colleges", { name: trimmed });
}

/** degree_names has no by_name index (only by_level + search_name) and requires
 *  a level_id, so it gets its own resolver with a default level fallback. */
async function resolveDegree(ctx: Ctx, name: string): Promise<Id<"degree_names"> | undefined> {
  const trimmed = name.trim();
  if (!trimmed) return undefined;
  const norm = normalize(trimmed);
  const candidates = await ctx.db
    .query("degree_names")
    .withSearchIndex("search_name", (q) => q.search("name", trimmed))
    .take(10);
  for (const c of candidates) {
    if (normalize(c.name) === norm) return c._id;
  }
  const level =
    (await ctx.db.query("degree_levels").withIndex("by_name", (q) => q.eq("name", "Other")).first()) ??
    (await ctx.db.query("degree_levels").first());
  if (!level) return undefined; // can't satisfy the required level_id
  return await ctx.db.insert("degree_names", { name: trimmed, level_id: level._id });
}

/**
 * Persist a user-confirmed resume draft to the real profile tables. A Convex
 * mutation is a single transaction, so the whole import commits atomically or
 * not at all. Email is never touched (it's the account identity). Rows that
 * can't satisfy a required field after resolution (an experience with no
 * parseable start date, an education with no year) are skipped rather than
 * aborting the import. Returns per-section counts.
 */
export const importProfile = authedMutation({
  args: { draft: v.any() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const draft = (args.draft ?? {}) as {
      full_name?: string | null;
      phone?: string | null;
      linkedin_url?: string | null;
      summary?: string | null;
      experience?: Array<Record<string, unknown>>;
      education?: Array<Record<string, unknown>>;
      skills?: string[];
    };
    const counts = {
      experiences: 0,
      responsibilities: 0,
      educations: 0,
      skills: 0,
      skippedExperiences: 0,
      skippedEducations: 0,
    };

    // ---- Contact fields on users (never email) ----
    const patch: Record<string, unknown> = {};
    if (draft.full_name) patch.name = draft.full_name;
    if (draft.summary) patch.professional_summary = draft.summary;
    if (draft.linkedin_url) patch.linkedin_url = draft.linkedin_url;
    if (draft.phone) patch.phone = draft.phone;
    if (Object.keys(patch).length) await ctx.db.patch(ctx.user._id, patch);

    // ---- Work experience (+ responsibilities, tools) ----
    for (const exp of draft.experience ?? []) {
      const start_date = parseFlexibleDate(exp.start_date);
      if (start_date == null) {
        counts.skippedExperiences += 1;
        continue; // start_date is required
      }
      const company_id = exp.company ? await resolveCompany(ctx, String(exp.company)) : undefined;
      const job_title_id = exp.role ? await resolveJobTitle(ctx, String(exp.role)) : undefined;
      const experienceId = await ctx.db.insert("experiences", {
        user_id: ctx.user._id,
        company_id,
        job_title_id,
        start_date,
        end_date: parseFlexibleDate(exp.end_date) ?? undefined,
        is_current: Boolean(exp.is_current),
        description: (exp.description as string) || undefined,
        position: counts.experiences,
      });
      counts.experiences += 1;

      for (const title of (exp.responsibilities as string[]) ?? []) {
        if (!title || !title.trim()) continue;
        await ctx.db.insert("responsibilities", {
          user_id: ctx.user._id,
          experience_id: experienceId,
          title: title.trim(),
        });
        counts.responsibilities += 1;
      }
      for (const tool of (exp.tools as string[]) ?? []) {
        if (!tool || !tool.trim()) continue;
        const skill_id = await resolveSkill(ctx, tool);
        if (skill_id) {
          await ctx.db.insert("experience_skills", { experience_id: experienceId, skill_id });
        }
      }
    }

    // ---- Education ----
    for (const ed of draft.education ?? []) {
      let start_year = toYear(ed.start_year);
      let end_year = toYear(ed.end_year);
      if (start_year == null && end_year == null) {
        counts.skippedEducations += 1;
        continue; // start_year is required
      }
      start_year = start_year ?? end_year!;
      end_year = end_year ?? start_year;
      const degree_id = ed.degree ? await resolveDegree(ctx, String(ed.degree)) : undefined;
      const field_of_study_id = ed.field_of_study ? await resolveField(ctx, String(ed.field_of_study)) : undefined;
      const college_id = ed.institution ? await resolveCollege(ctx, String(ed.institution)) : undefined;
      await ctx.db.insert("educations", {
        user_id: ctx.user._id,
        degree_id,
        field_of_study_id,
        college_id,
        start_year,
        end_year,
        position: counts.educations,
      });
      counts.educations += 1;
    }

    // ---- Skills (deduped on user_id + skill_id) ----
    for (const name of draft.skills ?? []) {
      const skill_id = await resolveSkill(ctx, name);
      if (!skill_id) continue;
      const existing = await ctx.db
        .query("user_skills")
        .withIndex("by_user_and_skill", (q) => q.eq("user_id", ctx.user._id).eq("skill_id", skill_id))
        .first();
      if (!existing) {
        await ctx.db.insert("user_skills", { user_id: ctx.user._id, skill_id });
        counts.skills += 1;
      }
    }

    return counts;
  },
});
