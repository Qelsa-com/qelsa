import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

type SearchTextInput = {
  title?: string | null;
  companyName?: string | null;
  location?: string | null;
  departments?: string[];
  skills?: string[];
  extra?: string[];
};

/** Keep the indexed document compact and stable across write paths. */
export function composeJobSearchText(input: SearchTextInput) {
  const parts = [
    input.title,
    input.companyName,
    input.location,
    ...(input.departments ?? []),
    ...(input.skills ?? []),
    ...(input.extra ?? []),
  ]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());

  return [...new Set(parts)].join(" ").replace(/\s+/g, " ").slice(0, 5000);
}

/**
 * Rebuild a job's search text from the source rows. Used by user-authored
 * writes, skill enrichment, and the backfill migration.
 */
export async function refreshJobSearchText(ctx: MutationCtx, jobId: Id<"jobs">) {
  const job = await ctx.db.get(jobId);
  if (!job) return null;

  const [page, city, titled, skillRows] = await Promise.all([
    job.page_id ? ctx.db.get(job.page_id) : null,
    job.city_id ? ctx.db.get(job.city_id) : null,
    job.job_title_id ? ctx.db.get(job.job_title_id) : null,
    ctx.db
      .query("job_skills")
      .withIndex("by_job", (q) => q.eq("job_id", job._id))
      .collect(),
  ]);
  const skillIds = [...new Set(skillRows.map((row) => row.skill_id))];
  const skills = await Promise.all(skillIds.map((skillId) => ctx.db.get(skillId)));
  const other = (job.other_info ?? {}) as {
    location?: unknown;
    departments?: unknown;
    cities?: Array<{ name?: unknown }>;
  };
  const location =
    city?.name ??
    (typeof other.location === "string" ? other.location : undefined);

  const searchText = composeJobSearchText({
    title: job.title ?? titled?.name,
    companyName: job.company_name ?? page?.name,
    location,
    departments: Array.isArray(other.departments)
      ? other.departments.filter((value): value is string => typeof value === "string")
      : undefined,
    skills: skills.map((skill) => skill?.name).filter((name): name is string => Boolean(name)),
    extra: Array.isArray(other.cities)
      ? other.cities
          .map((cityRow) => cityRow?.name)
          .filter((name): name is string => typeof name === "string")
      : undefined,
  });

  if (searchText !== job.search_text) {
    await ctx.db.patch(job._id, { search_text: searchText });
  }
  return searchText;
}
