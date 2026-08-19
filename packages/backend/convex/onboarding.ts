import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { query } from "./_generated/server";
import { authedMutation } from "./lib/customFunctions";
import { parsedProfileValidator } from "./lib/parsedProfile";

const jobSeekingStatus = v.union(
  v.literal("actively_hunting"),
  v.literal("exploring"),
  v.literal("building_skills"),
);

const hiringRole = v.union(
  v.literal("founder_cxo"),
  v.literal("hr_ta"),
  v.literal("hiring_manager"),
  v.literal("recruitment_agency"),
);

const companyResult = v.object({
  id: v.id("companies"),
  name: v.string(),
});

async function ensureUsername(ctx: MutationCtx, user: Doc<"users">) {
  if (user.username?.trim()) return user.username;
  const base =
    (user.name || user.email.split("@")[0] || "user")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 20) || "user";
  for (let n = 0; n < 50; n += 1) {
    const candidate = n === 0 ? base : `${base}${n}`;
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", candidate))
      .unique();
    if (!existing) {
      await ctx.db.patch(user._id, { username: candidate });
      return candidate;
    }
  }
  const fallback = `${base}${Date.now().toString().slice(-6)}`;
  await ctx.db.patch(user._id, { username: fallback });
  return fallback;
}

export const searchCompanies = query({
  args: { search: v.string() },
  returns: v.array(companyResult),
  handler: async (ctx, args) => {
    const needle = args.search.trim();
    if (!needle) return [];

    if (needle.length < 2) {
      const rows = await ctx.db.query("companies").take(80);
      return rows
        .filter((row) => row.name.toLowerCase().startsWith(needle.toLowerCase()))
        .slice(0, 8)
        .map((row) => ({ id: row._id, name: row.name }));
    }

    const rows = await ctx.db
      .query("companies")
      .withSearchIndex("search_name", (q) => q.search("name", needle))
      .take(8);
    return rows.map((row) => ({ id: row._id, name: row.name }));
  },
});

export const completeCandidateOnboarding = authedMutation({
  args: { job_seeking_status: jobSeekingStatus },
  returns: v.object({ ok: v.literal(true) }),
  handler: async (ctx, args) => {
    await ensureUsername(ctx, ctx.user);
    await ctx.db.patch(ctx.user._id, {
      account_type: "seeker",
      job_seeking_status: args.job_seeking_status,
      find_job: args.job_seeking_status === "actively_hunting",
      explore_career: args.job_seeking_status === "exploring",
      upskill_and_learn: args.job_seeking_status === "building_skills",
      prepare_interview: args.job_seeking_status === "actively_hunting",
      onboarding_completed: true,
    });
    return { ok: true as const };
  },
});

export const completeHrOnboarding = authedMutation({
  args: {
    company_name: v.string(),
    catalog_company_id: v.optional(v.id("companies")),
    hiring_role: hiringRole,
    industry: v.string(),
    size_id: v.id("company_sizes"),
  },
  returns: v.object({
    page_id: v.id("pages"),
    company_name: v.string(),
  }),
  handler: async (ctx, args) => {
    let companyName = args.company_name.trim();
    if (args.catalog_company_id) {
      const catalog = await ctx.db.get(args.catalog_company_id);
      if (catalog) companyName = catalog.name;
    }
    if (!companyName) throw new Error("Company name is required");
    if (!args.industry.trim()) throw new Error("Industry is required");

    const size = await ctx.db.get(args.size_id);
    if (!size) throw new Error("Company size not found");

    await ensureUsername(ctx, ctx.user);

    const owned = await ctx.db
      .query("pages")
      .withIndex("by_owner", (q) => q.eq("ownerId", ctx.user._id))
      .collect();
    const existing = owned.find((page) => page.name.toLowerCase() === companyName.toLowerCase());

    let pageId = existing?._id;
    if (pageId) {
      await ctx.db.patch(pageId, {
        industry: args.industry.trim(),
        size_id: args.size_id,
        type: existing?.type ?? "company",
      });
    } else {
      pageId = await ctx.db.insert("pages", {
        name: companyName,
        type: "company",
        industry: args.industry.trim(),
        size_id: args.size_id,
        ownerId: ctx.user._id,
      });
    }

    await ctx.db.patch(ctx.user._id, {
      account_type: "recruiter",
      hiring_role: args.hiring_role,
      active_page_id: pageId,
      onboarding_completed: true,
    });

    return { page_id: pageId, company_name: companyName };
  },
});

export const setAccountTypeAndResetOnboarding = authedMutation({
  args: { account_type: v.union(v.literal("seeker"), v.literal("recruiter")) },
  returns: v.object({ account_type: v.union(v.literal("seeker"), v.literal("recruiter")) }),
  handler: async (ctx, args) => {
    await ctx.db.patch(ctx.user._id, {
      account_type: args.account_type,
      onboarding_completed: false,
    });
    return { account_type: args.account_type };
  },
});

export const applyParsedProfile = authedMutation({
  args: {
    profile: parsedProfileValidator,
    storage_id: v.optional(v.id("_storage")),
    filename: v.optional(v.string()),
  },
  returns: v.object({ ok: v.literal(true) }),
  handler: async (ctx, args) => {
    const profile = args.profile;
    if (profile.name?.trim()) {
      await ctx.db.patch(ctx.user._id, { name: profile.name.trim() });
    }
    await ensureUsername(ctx, {
      ...ctx.user,
      name: profile.name?.trim() || ctx.user.name,
    });

    const cityId = profile.location ? await findCityId(ctx, profile.location) : undefined;
    await ctx.db.patch(ctx.user._id, {
      phone: profile.phone ?? ctx.user.phone,
      linkedin_url: profile.linkedin_url ?? ctx.user.linkedin_url,
      about: profile.summary ?? ctx.user.about,
      professional_summary: profile.summary ?? ctx.user.professional_summary,
      headline: profile.headline ?? ctx.user.headline,
      relocate_location: profile.location ?? ctx.user.relocate_location,
      ...(cityId ? { city_id: cityId } : {}),
    });

    const existingExperiences = await ctx.db
      .query("experiences")
      .withIndex("by_user", (q) => q.eq("user_id", ctx.user._id))
      .take(1);
    if (existingExperiences.length === 0) {
      for (const [index, row] of profile.experiences.entries()) {
        if (!row.company.trim() || !row.title.trim()) continue;
        const start_date = parseFlexibleDate(row.start);
        if (start_date == null) continue;
        const company_id = await findOrCreateCompany(ctx, ctx.user._id, row.company);
        const job_title_id = await findOrCreateNamed(ctx, "job_titles", row.title);
        const experienceId = await ctx.db.insert("experiences", {
          user_id: ctx.user._id,
          company_id: company_id ?? undefined,
          job_title_id: job_title_id ?? undefined,
          start_date,
          end_date: row.is_current ? undefined : parseFlexibleDate(row.end),
          is_current: row.is_current,
          description: row.description,
          position: index,
        });
        const bullets = (row.responsibilities?.length ? row.responsibilities : row.description ? [row.description] : [])
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 12);
        for (const title of bullets) {
          await ctx.db.insert("responsibilities", {
            user_id: ctx.user._id,
            experience_id: experienceId,
            title: title.slice(0, 280),
          });
        }
        for (const tool of uniqueNames(row.tools ?? [])) {
          const skill_id = await findOrCreateNamed(ctx, "skills", tool);
          if (!skill_id) continue;
          await ctx.db.insert("experience_skills", { experience_id: experienceId, skill_id });
        }
      }
    }

    const existingEducations = await ctx.db
      .query("educations")
      .withIndex("by_user", (q) => q.eq("user_id", ctx.user._id))
      .take(1);
    if (existingEducations.length === 0) {
      for (const [index, row] of profile.educations.entries()) {
        if (!row.school.trim()) continue;
        const start_year = row.start_year ?? row.end_year;
        if (start_year == null) continue;
        const college_id = await findOrCreateNamed(ctx, "colleges", row.school);
        const field_of_study_id = row.field ? await findOrCreateNamed(ctx, "fields_of_study", row.field) : undefined;
        const degree_id = row.degree ? await findDegreeId(ctx, row.degree) : undefined;
        await ctx.db.insert("educations", {
          user_id: ctx.user._id,
          college_id: college_id ?? undefined,
          field_of_study_id: field_of_study_id ?? undefined,
          degree_id: degree_id ?? undefined,
          start_year,
          end_year: row.end_year ?? start_year,
          description: row.degree && !degree_id ? row.degree : undefined,
          position: index,
        });
      }
    }

    const existingSkills = await ctx.db
      .query("user_skills")
      .withIndex("by_user", (q) => q.eq("user_id", ctx.user._id))
      .take(1);
    if (existingSkills.length === 0) {
      const skillNames = uniqueNames([
        ...profile.skills,
        ...profile.experiences.flatMap((row) => row.tools ?? []),
      ]);
      for (const skillName of skillNames) {
        const skill_id = await findOrCreateNamed(ctx, "skills", skillName);
        if (!skill_id) continue;
        const already = await ctx.db
          .query("user_skills")
          .withIndex("by_user_and_skill", (q) => q.eq("user_id", ctx.user._id).eq("skill_id", skill_id))
          .unique();
        if (already) continue;
        await ctx.db.insert("user_skills", {
          user_id: ctx.user._id,
          skill_id,
          is_top_skill: false,
        });
      }
    }

    if (args.storage_id) {
      const existingResume = await ctx.db
        .query("resumes")
        .withIndex("by_user", (q) => q.eq("user_id", ctx.user._id))
        .take(1);
      if (existingResume.length === 0) {
        const file_url = await ctx.storage.getUrl(args.storage_id);
        await ctx.db.insert("resumes", {
          user_id: ctx.user._id,
          title: args.filename || "Resume",
          storage_id: args.storage_id,
          file_url: file_url ?? undefined,
        });
      }
    }

    return { ok: true as const };
  },
});

type NamedTable = "companies" | "job_titles" | "skills" | "colleges" | "fields_of_study";

function catalogKey(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9+#]+/g, "");
}

function uniqueNames(values: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = catalogKey(trimmed);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

async function findNamed<T extends NamedTable>(
  ctx: MutationCtx,
  table: T,
  name: string,
): Promise<Id<T> | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const exact = await ctx.db
    .query(table)
    .withIndex("by_name", (q) => q.eq("name", trimmed as never))
    .first();
  if (exact) return exact._id as Id<T>;

  const key = catalogKey(trimmed);
  if (!key) return null;
  const hits = await ctx.db
    .query(table)
    .withSearchIndex("search_name", (q) => q.search("name", trimmed))
    .take(10);
  const match = hits.find((row) => catalogKey(row.name) === key);
  return match ? (match._id as Id<T>) : null;
}

async function findOrCreateNamed<T extends NamedTable>(
  ctx: MutationCtx,
  table: T,
  name: string,
): Promise<Id<T> | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const existing = await findNamed(ctx, table, trimmed);
  if (existing) return existing;
  return (await ctx.db.insert(table, { name: trimmed } as never)) as Id<T>;
}

async function findOrCreateCompany(ctx: MutationCtx, userId: Id<"users">, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const existing = await findNamed(ctx, "companies", trimmed);
  if (existing) return existing;
  const companyId = await ctx.db.insert("companies", { name: trimmed });
  const submitted = await ctx.db
    .query("user_submitted_companies")
    .withIndex("by_name", (q) => q.eq("name", trimmed))
    .first();
  if (submitted) {
    await ctx.db.patch(submitted._id, { submission_count: submitted.submission_count + 1 });
  } else {
    await ctx.db.insert("user_submitted_companies", {
      name: trimmed,
      submitted_by: userId,
      submission_count: 1,
      status: "pending",
    });
  }
  return companyId;
}

async function findDegreeId(ctx: MutationCtx, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return undefined;
  const key = catalogKey(trimmed);
  if (!key) return undefined;
  const hits = await ctx.db
    .query("degree_names")
    .withSearchIndex("search_name", (q) => q.search("name", trimmed))
    .take(10);
  const match = hits.find(
    (row) => catalogKey(row.name) === key || catalogKey(row.abbreviation ?? "") === key,
  );
  return match?._id;
}

async function findCityId(ctx: MutationCtx, location: string) {
  const cityName = location.split(",")[0]?.trim() ?? "";
  if (cityName.length < 2) return undefined;
  const key = catalogKey(cityName);
  const hits = await ctx.db
    .query("cities")
    .withSearchIndex("search_name", (q) => q.search("name", cityName))
    .take(8);
  const match = hits.find((row) => catalogKey(row.name) === key);
  return match?._id;
}

function parseFlexibleDate(value?: string) {
  if (!value?.trim()) return undefined;
  if (/^(present|current|now|ongoing)$/i.test(value.trim())) return undefined;
  const cleaned = value.replace(/(\d{1,2})(st|nd|rd|th)\b/gi, "$1").trim();
  const parsed = Date.parse(cleaned);
  if (!Number.isNaN(parsed)) return parsed;
  const year = cleaned.match(/\b(19|20)\d{2}\b/);
  if (year) return Date.UTC(Number(year[0]), 0, 1);
  return undefined;
}
