import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withId } from "./lib/helpers";
import { bumpOpenJobCount, ensureJobStats } from "./lib/jobCounts";
import * as catalog from "./seedCatalogData";
import cityData from "./seed/cities.json";

function cityList(): Array<{ name: string; state: string }> {
  const value = cityData as unknown;
  if (Array.isArray(value)) return value as Array<{ name: string; state: string }>;
  if (value && typeof value === "object") {
    const nested = "default" in value ? (value as { default: unknown }).default : value;
    if (Array.isArray(nested)) return nested as Array<{ name: string; state: string }>;
    const rows = Object.values(nested as Record<string, unknown>).filter(
      (row): row is { name: string; state: string } =>
        Boolean(row) && typeof row === "object" && "name" in row && "state" in row,
    );
    return rows;
  }
  return [];
}

export const seedAll = mutation({
  args: {},
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx) => {
    const existing = await ctx.db.query("degree_levels").first();
    if (!existing) {
      const levelIds = new Map<string, string>();
      for (const level of catalog.degreeLevels) {
        const id = await ctx.db.insert("degree_levels", level);
        levelIds.set(level.name, id);
      }
      for (const degree of catalog.degreeNames) {
        const level_id = levelIds.get(degree.level);
        if (level_id) {
          await ctx.db.insert("degree_names", {
            level_id: level_id as never,
            name: degree.name,
            abbreviation: degree.abbreviation,
          });
        }
      }
      for (const field of catalog.fieldsOfStudy) {
        await ctx.db.insert("fields_of_study", field);
      }
      for (const size of catalog.companySizes) {
        await ctx.db.insert("company_sizes", size);
      }
      const categoryIds: string[] = [];
      for (const category of catalog.skillCategories) {
        categoryIds.push(await ctx.db.insert("skill_categories", category));
      }
      let i = 0;
      for (const name of catalog.skills) {
        await ctx.db.insert("skills", {
          name,
          category_id: categoryIds[i % categoryIds.length] as never,
          is_quick_add: true,
          sort_order: i++,
        });
      }
      i = 0;
      for (const name of catalog.jobTitles) {
        await ctx.db.insert("job_titles", { name, is_popular: true, sort_order: i++ });
      }
      for (const name of catalog.companies) {
        await ctx.db.insert("companies", { name, is_popular: true });
      }
      for (const name of catalog.colleges) {
        await ctx.db.insert("colleges", { name });
      }
    }

    const existingCity = await ctx.db.query("cities").first();
    if (!existingCity) {
      const stateIds = new Map<string, string>();
      for (const city of cityList()) {
        if (!stateIds.has(city.state)) {
          stateIds.set(city.state, await ctx.db.insert("states", { name: city.state }));
        }
        await ctx.db.insert("cities", {
          name: city.name,
          state_id: stateIds.get(city.state)! as never,
        });
      }
    }

    return { ok: true };
  },
});

type SeedJobSkill = { name: string; type: "core" | "preferred" | "nice_to_have"; proficiency: "beginner" | "intermediate" | "advance" | "expert" };

type SeedJob = {
  slug: string;
  title: string;
  company_name: string;
  city: string;
  workplace_type: "on-site" | "hybrid" | "remote";
  work_type: string;
  experience: number;
  experience_level: string;
  salary_min: number;
  salary_max: number;
  has_remote: boolean;
  description: string;
  skills: SeedJobSkill[];
};

const SEED_JOBS: SeedJob[] = [
  {
    slug: "razorpay-frontend-engineer",
    title: "Frontend Engineer",
    company_name: "Razorpay",
    city: "Bengaluru",
    workplace_type: "hybrid",
    work_type: "Full-time",
    experience: 3,
    experience_level: "mid",
    salary_min: 1800000,
    salary_max: 2800000,
    has_remote: false,
    description:
      "<p>Build checkout and dashboard experiences used by millions of businesses. You will own React surfaces end to end, partner with design, and ship with TypeScript.</p><ul><li>Ship product UI in React and Next.js</li><li>Improve performance and accessibility</li><li>Work closely with backend and design</li></ul>",
    skills: [
      { name: "React", type: "core", proficiency: "advance" },
      { name: "TypeScript", type: "core", proficiency: "intermediate" },
      { name: "Next.js", type: "preferred", proficiency: "intermediate" },
    ],
  },
  {
    slug: "swiggy-backend-engineer",
    title: "Backend Engineer",
    company_name: "Swiggy",
    city: "Bengaluru",
    workplace_type: "on-site",
    work_type: "Full-time",
    experience: 4,
    experience_level: "mid",
    salary_min: 2000000,
    salary_max: 3200000,
    has_remote: false,
    description:
      "<p>Scale order and delivery services that stay up during peak hours. You will design APIs, own data stores, and keep latency low.</p>",
    skills: [
      { name: "Node.js", type: "core", proficiency: "advance" },
      { name: "PostgreSQL", type: "core", proficiency: "intermediate" },
      { name: "AWS", type: "preferred", proficiency: "intermediate" },
    ],
  },
  {
    slug: "freshworks-full-stack-engineer",
    title: "Full Stack Engineer",
    company_name: "Freshworks",
    city: "Chennai",
    workplace_type: "hybrid",
    work_type: "Full-time",
    experience: 2,
    experience_level: "junior",
    salary_min: 1400000,
    salary_max: 2200000,
    has_remote: false,
    description:
      "<p>Join a product squad building CRM workflows. You will work across the React UI and Node services, and ship weekly.</p>",
    skills: [
      { name: "JavaScript", type: "core", proficiency: "intermediate" },
      { name: "React", type: "core", proficiency: "intermediate" },
      { name: "Node.js", type: "preferred", proficiency: "beginner" },
    ],
  },
  {
    slug: "flipkart-senior-software-engineer",
    title: "Senior Software Engineer",
    company_name: "Flipkart",
    city: "Bengaluru",
    workplace_type: "on-site",
    work_type: "Full-time",
    experience: 6,
    experience_level: "senior",
    salary_min: 3500000,
    salary_max: 5000000,
    has_remote: false,
    description:
      "<p>Lead a pod on catalog and search. Mentor engineers, set technical direction, and keep systems reliable at marketplace scale.</p>",
    skills: [
      { name: "Java", type: "core", proficiency: "expert" },
      { name: "SQL", type: "core", proficiency: "advance" },
      { name: "AWS", type: "preferred", proficiency: "intermediate" },
    ],
  },
  {
    slug: "zomato-product-manager",
    title: "Product Manager",
    company_name: "Zomato",
    city: "Delhi",
    workplace_type: "hybrid",
    work_type: "Full-time",
    experience: 5,
    experience_level: "senior",
    salary_min: 2800000,
    salary_max: 4200000,
    has_remote: false,
    description:
      "<p>Own a slice of the diner experience. Define problems, write specs, and ship with engineering and design.</p>",
    skills: [
      { name: "Product Management", type: "core", proficiency: "advance" },
      { name: "Communication", type: "core", proficiency: "advance" },
      { name: "SQL", type: "nice_to_have", proficiency: "beginner" },
    ],
  },
  {
    slug: "amazon-data-scientist",
    title: "Data Scientist",
    company_name: "Amazon",
    city: "Hyderabad",
    workplace_type: "remote",
    work_type: "Full-time",
    experience: 4,
    experience_level: "mid",
    salary_min: 2500000,
    salary_max: 4000000,
    has_remote: true,
    description:
      "<p>Build ranking and forecasting models for retail. You will own experiments, productionize models, and partner with product.</p>",
    skills: [
      { name: "Python", type: "core", proficiency: "advance" },
      { name: "Machine Learning", type: "core", proficiency: "advance" },
      { name: "SQL", type: "preferred", proficiency: "intermediate" },
    ],
  },
  {
    slug: "microsoft-devops-engineer",
    title: "DevOps Engineer",
    company_name: "Microsoft",
    city: "Hyderabad",
    workplace_type: "hybrid",
    work_type: "Full-time",
    experience: 4,
    experience_level: "mid",
    salary_min: 2400000,
    salary_max: 3800000,
    has_remote: false,
    description:
      "<p>Run CI/CD and cloud infrastructure for a developer tools org. Automate the boring work and keep production boring too.</p>",
    skills: [
      { name: "Docker", type: "core", proficiency: "advance" },
      { name: "Kubernetes", type: "core", proficiency: "intermediate" },
      { name: "AWS", type: "preferred", proficiency: "intermediate" },
    ],
  },
  {
    slug: "meta-product-designer",
    title: "Designer",
    company_name: "Meta",
    city: "Mumbai",
    workplace_type: "remote",
    work_type: "Full-time",
    experience: 3,
    experience_level: "mid",
    salary_min: 2000000,
    salary_max: 3400000,
    has_remote: true,
    description:
      "<p>Design product flows for a consumer surface. You will prototype in Figma, run critiques, and ship with engineers.</p>",
    skills: [
      { name: "Figma", type: "core", proficiency: "advance" },
      { name: "Communication", type: "preferred", proficiency: "intermediate" },
    ],
  },
  {
    slug: "google-software-engineer",
    title: "Software Engineer",
    company_name: "Google",
    city: "Bengaluru",
    workplace_type: "on-site",
    work_type: "Full-time",
    experience: 2,
    experience_level: "junior",
    salary_min: 2200000,
    salary_max: 3600000,
    has_remote: false,
    description:
      "<p>Join a core infrastructure team. Write production Go and Python, review code, and learn how large systems stay up.</p>",
    skills: [
      { name: "Go", type: "core", proficiency: "intermediate" },
      { name: "Python", type: "core", proficiency: "intermediate" },
      { name: "SQL", type: "nice_to_have", proficiency: "beginner" },
    ],
  },
  {
    slug: "infosys-engineering-manager",
    title: "Engineering Manager",
    company_name: "Infosys",
    city: "Pune",
    workplace_type: "on-site",
    work_type: "Full-time",
    experience: 8,
    experience_level: "lead",
    salary_min: 3000000,
    salary_max: 4500000,
    has_remote: false,
    description:
      "<p>Lead a delivery team of 8–12 engineers. Hire, coach, and keep programs on track with clients.</p>",
    skills: [
      { name: "Communication", type: "core", proficiency: "expert" },
      { name: "Product Management", type: "preferred", proficiency: "intermediate" },
      { name: "Java", type: "nice_to_have", proficiency: "intermediate" },
    ],
  },
];

async function namedDoc<Table extends "skills" | "job_titles">(
  ctx: { db: { query: Function } },
  table: Table,
  name: string,
) {
  return await ctx.db
    .query(table)
    .withIndex("by_name", (q: { eq: Function }) => q.eq("name", name))
    .unique();
}

export const seedJobs = mutation({
  args: {},
  returns: v.object({ created: v.number(), skipped: v.number() }),
  handler: async (ctx) => {
    const catalogReady = await ctx.db.query("skills").first();
    if (!catalogReady) {
      throw new Error("Catalog is empty. Run seed:seedAll first.");
    }

    let created = 0;
    let skipped = 0;
    const day = 86_400_000;

    for (const [index, job] of SEED_JOBS.entries()) {
      const external_id = `seed:${job.slug}`;
      const existing = await ctx.db
        .query("jobs")
        .withIndex("by_external_id", (q) => q.eq("external_id", external_id))
        .unique();
      if (existing) {
        skipped += 1;
        continue;
      }

      const cityMatches = await ctx.db
        .query("cities")
        .withSearchIndex("search_name", (q) => q.search("name", job.city))
        .take(10);
      const city =
        cityMatches.find((row: { name: string }) => row.name.toLowerCase() === job.city.toLowerCase()) ?? cityMatches[0];
      const jobTitle = await namedDoc(ctx, "job_titles", job.title);

      const jobId = await ctx.db.insert("jobs", {
        external_id,
        title: job.title,
        company_name: job.company_name,
        description: job.description,
        city_id: city?._id,
        job_title_id: jobTitle?._id,
        workplace_type: job.workplace_type,
        work_type: job.work_type,
        experience: job.experience,
        experience_level: job.experience_level,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        salary_currency: "INR",
        has_remote: job.has_remote,
        status: "open",
        resource: "qelsa",
        published_date: Date.now() - index * day,
        view_count: 0,
        application_count: 0,
        other_info: { cities: city ? [{ name: city.name }] : [{ name: job.city }] },
      });
      await ensureJobStats(ctx, jobId);
      await bumpOpenJobCount(ctx, 1);

      for (const skill of job.skills) {
        const row = await namedDoc(ctx, "skills", skill.name);
        if (!row) continue;
        await ctx.db.insert("job_skills", {
          job_id: jobId,
          skill_id: row._id,
          type: skill.type,
          proficiency: skill.proficiency,
        });
      }

      created += 1;
    }

    return { created, skipped };
  },
});


function searchName<T extends { name: string }>(rows: T[], search?: string) {
  if (!search) return rows;
  const q = search.toLowerCase();
  return rows.filter((r) => r.name.toLowerCase().includes(q));
}

export const degreeNames = query({
  args: { search: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("degree_names").collect();
    const out = [];
    for (const row of searchName(rows, args.search)) {
      const level = await ctx.db.get(row.level_id);
      out.push({ ...withId(row), degree_level: level ? withId(level) : null });
    }
    return out;
  },
});

export const fieldsOfStudy = query({
  args: { search: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => searchName(await ctx.db.query("fields_of_study").collect(), args.search).map(withId),
});

export const skills = query({
  args: { search: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const rows = args.search
      ? await ctx.db
          .query("skills")
          .withSearchIndex("search_name", (q) => q.search("name", args.search!))
          .take(30)
      : await ctx.db.query("skills").take(50);
    const out = [];
    for (const row of rows) {
      const category = row.category_id ? await ctx.db.get(row.category_id) : null;
      out.push({ ...withId(row), category: category ? withId(category) : null });
    }
    return out;
  },
});

export const skillCategories = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => (await ctx.db.query("skill_categories").collect()).map(withId),
});

export const colleges = query({
  args: { search: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const rows = args.search
      ? await ctx.db.query("colleges").withSearchIndex("search_name", (q) => q.search("name", args.search)).take(20)
      : await ctx.db.query("colleges").take(20);
    return rows.map(withId);
  },
});

export const certifications = query({
  args: { search: v.optional(v.string()), limit: v.optional(v.number()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const rows = args.search
      ? await ctx.db.query("certifications").withSearchIndex("search_name", (q) => q.search("name", args.search!)).take(args.limit ?? 20)
      : await ctx.db.query("certifications").take(args.limit ?? 20);
    return rows.map(withId);
  },
});

export const issuingBodies = query({
  args: { search: v.optional(v.string()), limit: v.optional(v.number()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const rows = args.search
      ? await ctx.db.query("issuing_bodies").withSearchIndex("search_name", (q) => q.search("name", args.search!)).take(args.limit ?? 20)
      : await ctx.db.query("issuing_bodies").take(args.limit ?? 20);
    return rows.map(withId);
  },
});

export const companySizes = query({
  args: { search: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("company_sizes").collect();
    if (!args.search) return rows.map(withId);
    const q = args.search.toLowerCase();
    return rows.filter((r) => r.label.toLowerCase().includes(q)).map(withId);
  },
});

export const states = query({
  args: { search: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => searchName(await ctx.db.query("states").collect(), args.search).map(withId),
});

export const cities = query({
  args: { search: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("cities")
      .withSearchIndex("search_name", (q) => q.search("name", args.search))
      .take(20);
    const out = [];
    for (const row of rows) {
      const state = await ctx.db.get(row.state_id);
      out.push({ ...withId(row), state: state ? withId(state) : null });
    }
    return out;
  },
});

export const companies = query({
  args: { search: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("companies")
      .withSearchIndex("search_name", (q) => q.search("name", args.search))
      .take(20);
    return rows.map(withId);
  },
});

export const jobTitles = query({
  args: { search: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("job_titles")
      .withSearchIndex("search_name", (q) => q.search("name", args.search))
      .take(20);
    return rows.map(withId);
  },
});
