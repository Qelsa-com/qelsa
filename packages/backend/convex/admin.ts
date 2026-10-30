import { v } from "convex/values";
import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import { components, internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { internalAction, internalMutation, type QueryCtx } from "./_generated/server";
import { adminMutation, adminQuery } from "./lib/customFunctions";
import { effectiveSubscriptionPlan, getUserPlan, isSubscriptionEntitled } from "./lib/billingEntitlements";
import { defaultPlanConfig, getAllPlanConfigs, type PlanAudience, type PlanTier } from "./lib/planConfig";
import { deleteJobCascade } from "./lib/deleteUserData";
import { deleteUserAccount } from "./lib/deleteUserAccount";
import { bumpOpenJobCount, openCountDelta } from "./lib/jobCounts";
import {
  ADMIN_STAT_KEYS,
  applyUserStatDeltas,
  bumpAdminStat,
  getAdminStats,
  rebuildApplicationStats,
  rebuildJobStats,
  rebuildUserStats,
  resetAdminStatsRebuild,
} from "./lib/adminStats";

/**
 * Admin panel API.
 *
 * Every function here runs behind `adminQuery` / `adminMutation`, which reject
 * any caller whose app user is not `role === "admin"`. The role is read from
 * the server-side user row, never from a client argument, so a client cannot
 * escalate by passing a different id.
 */

/** Fields an admin is allowed to edit on a user. Deliberately narrow. */
const ADMIN_USER_PATCH_KEYS = new Set([
  "name",
  "username",
  "headline",
  "about",
  "professional_summary",
  "phone",
  "profile_image",
  "profile_visibility",
  "work_preference",
  "want_to_relocate",
  "expected_salary_currency",
  "expected_min_salary",
  "expected_max_salary",
  "linkedin_url",
  "github_url",
  "twitter_url",
  "other_social_link",
  "custom_profile_url",
  "website",
  "show_phone_number",
  "show_contact_to_recruiters",
  "allow_profile_downloads",
  "profile_view_analytics",
  "nationality",
  "gender",
  "pronoun",
  "dob",
  "job_seeking_status",
  "hiring_role",
  "profile_type",
  "languages",
  "interests",
  "portfolio_links",
  "relocate_locations",
]);

const userSummaryValidator = v.object({
  id: v.id("users"),
  name: v.union(v.string(), v.null()),
  email: v.string(),
  username: v.union(v.string(), v.null()),
  role: v.string(),
  account_type: v.union(v.string(), v.null()),
  premium_plan: v.union(v.literal("plus"), v.literal("pro"), v.null()),
  is_active: v.boolean(),
  profile_image: v.union(v.string(), v.null()),
  headline: v.union(v.string(), v.null()),
  city: v.union(v.string(), v.null()),
  job_seeking_status: v.union(v.string(), v.null()),
  hiring_role: v.union(v.string(), v.null()),
  onboarding_completed: v.boolean(),
  created_at: v.number(),
  last_login_at: v.union(v.number(), v.null()),
});

const userDetailValidator = v.object({
  id: v.id("users"),
  name: v.union(v.string(), v.null()),
  email: v.string(),
  username: v.union(v.string(), v.null()),
  role: v.string(),
  account_type: v.union(v.string(), v.null()),
  is_active: v.boolean(),
  profile_image: v.union(v.string(), v.null()),
  headline: v.union(v.string(), v.null()),
  about: v.union(v.string(), v.null()),
  professional_summary: v.union(v.string(), v.null()),
  phone: v.union(v.string(), v.null()),
  city: v.union(v.string(), v.null()),
  state: v.union(v.string(), v.null()),
  country: v.union(v.string(), v.null()),
  profile_visibility: v.union(v.string(), v.null()),
  show_phone_number: v.boolean(),
  show_contact_to_recruiters: v.boolean(),
  allow_profile_downloads: v.boolean(),
  profile_view_analytics: v.boolean(),
  work_preference: v.union(v.string(), v.null()),
  want_to_relocate: v.union(v.boolean(), v.null()),
  expected_salary_currency: v.union(v.string(), v.null()),
  expected_min_salary: v.union(v.number(), v.null()),
  expected_max_salary: v.union(v.number(), v.null()),
  linkedin_url: v.union(v.string(), v.null()),
  github_url: v.union(v.string(), v.null()),
  twitter_url: v.union(v.string(), v.null()),
  other_social_link: v.union(v.string(), v.null()),
  custom_profile_url: v.union(v.string(), v.null()),
  website: v.union(v.string(), v.null()),
  nationality: v.union(v.string(), v.null()),
  gender: v.union(v.string(), v.null()),
  pronoun: v.union(v.string(), v.null()),
  dob: v.union(v.number(), v.null()),
  job_seeking_status: v.union(v.string(), v.null()),
  hiring_role: v.union(v.string(), v.null()),
  profile_type: v.union(v.string(), v.null()),
  onboarding_completed: v.boolean(),
  languages: v.union(v.array(v.any()), v.null()),
  interests: v.union(v.array(v.string()), v.null()),
  portfolio_links: v.union(v.array(v.any()), v.null()),
  relocate_locations: v.union(v.array(v.string()), v.null()),
  created_at: v.number(),
  last_login_at: v.union(v.number(), v.null()),
  manual_pro: v.boolean(),
  manual_pro_since: v.union(v.number(), v.null()),
  manual_pro_note: v.union(v.string(), v.null()),
  pro_access: v.boolean(),
  pro_access_source: v.union(v.literal("subscription"), v.literal("manual"), v.literal("none")),
  pro_subscription: v.union(
    v.null(),
    v.object({
      status: v.string(),
      plan: v.string(),
      interval: v.string(),
      current_period_end: v.union(v.number(), v.null()),
      cancel_at_period_end: v.boolean(),
    }),
  ),
});

const planConfigValidator = v.object({
  audience: v.union(v.literal("candidate"), v.literal("employer")),
  plan: v.union(v.literal("free"), v.literal("plus"), v.literal("pro")),
  agent_daily_limit: v.number(),
  application_limit: v.union(v.number(), v.null()),
  description: v.string(),
  features: v.array(v.string()),
  updated_at: v.union(v.number(), v.null()),
  updated_by: v.union(v.id("users"), v.null()),
});

const cityRowValidator = v.object({
  name: v.union(v.string(), v.null()),
  state: v.union(v.string(), v.null()),
  country: v.union(v.string(), v.null()),
});

function toSummary(
  user: Doc<"users">,
  cityName?: string | null,
  premiumPlan: "plus" | "pro" | null = null,
) {
  return {
    id: user._id,
    name: user.name ?? null,
    email: user.email,
    username: user.username ?? null,
    role: user.role,
    account_type: user.account_type ?? null,
    premium_plan: premiumPlan,
    is_active: user.isActive,
    profile_image: user.profile_image ?? null,
    headline: user.headline ?? null,
    city: cityName ?? null,
    job_seeking_status: user.job_seeking_status ?? null,
    hiring_role: user.hiring_role ?? null,
    onboarding_completed: Boolean(user.onboarding_completed),
    created_at: user._creationTime,
    last_login_at: user.last_login_at ?? null,
  };
}

/**
 * Resolve the paid plan for the visible page only. Bounded by the page size,
 * so the admin table never scans every subscription to render one page.
 */
async function premiumPlansForPage(ctx: QueryCtx, users: Doc<"users">[]) {
  return await Promise.all(users.map((user) => getUserPlan(ctx, user._id)));
}

/**
 * Builds the admin job summary rows for one page of jobs.
 *
 * Hydration is batched per page so the number of reads scales with the page
 * size, not with the size of the table.
 */
async function hydrateJobSummaries(ctx: QueryCtx, jobs: Doc<"jobs">[]) {
  return Promise.all(
    jobs.map(async (job) => {
      const city = job.city_id ? await ctx.db.get(job.city_id) : null;
      const owner = job.owner_id ? await ctx.db.get(job.owner_id) : null;
      return {
        id: job._id,
        title: job.title ?? null,
        company_name: job.company_name ?? null,
        status: job.status,
        location: city?.name ?? null,
        work_type: job.work_type ?? null,
        workplace_type: job.workplace_type ?? null,
        salary: job.salary ?? null,
        salary_currency: job.salary_currency ?? null,
        is_ingested: job.owner_id == null,
        owner_id: job.owner_id ?? null,
        owner_email: owner?.email ?? null,
        ats_integration_id: job.ats_integration_id ?? null,
        view_count: job.view_count ?? 0,
        application_count: job.application_count ?? 0,
        published_date: job.published_date ?? null,
        created_at: job._creationTime,
        description: job.description?.slice(0, 400) ?? null,
      };
    }),
  );
}

/**
 * Paginated user list.
 *
 * Search runs against the three search indexes (name, email, username). Each
 * search is a bounded index scan, so this stays fast at 10x the user count.
 * The three result sets are merged by id, then the merged id set is paginated.
 * Without a search term it is a plain paginated index scan.
 */
export const listUsers = adminQuery({
  args: {
    search: v.optional(v.string()),
    role: v.optional(v.union(v.literal("user"), v.literal("admin"))),
    accountType: v.optional(v.union(v.literal("seeker"), v.literal("recruiter"))),
    isActive: v.optional(v.boolean()),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(userSummaryValidator),
  handler: async (ctx, args) => {
    const search = args.search?.trim() ?? "";

    // Build the filtered query first. The filters narrow an index range, so
    // the search below only has to consider the rows the admin asked for.
    let query: any = ctx.db.query("users");

    if (args.role && args.isActive !== undefined) {
      query = query.withIndex("by_role_and_active", (q: any) =>
        q.eq("role", args.role!).eq("isActive", args.isActive!),
      );
    } else if (args.role) {
      query = query.withIndex("by_role", (q: any) => q.eq("role", args.role!));
    } else if (args.accountType) {
      query = query.withIndex("by_account_type", (q: any) =>
        q.eq("account_type", args.accountType!),
      );
    } else if (args.isActive !== undefined) {
      query = query.withIndex("by_active", (q: any) => q.eq("isActive", args.isActive!));
    } else {
      query = query.withIndex("by_creation_time");
    }

    if (search) {
      // Search indexes match on prefix terms, so a partial word still finds
      // the row. Each search is bounded, and the union of ids is what we page.
      const SEARCH_LIMIT = 100;
      const [byName, byEmail, byUsername] = await Promise.all([
        ctx.db
          .query("users")
          .withSearchIndex("search_name", (q) => q.search("name", search))
          .take(SEARCH_LIMIT),
        ctx.db
          .query("users")
          .withSearchIndex("search_email", (q) => q.search("email", search))
          .take(SEARCH_LIMIT),
        ctx.db
          .query("users")
          .withSearchIndex("search_username", (q) => q.search("username", search))
          .take(SEARCH_LIMIT),
      ]);

      const ids = new Set<Id<"users">>();
      for (const group of [byName, byEmail, byUsername]) {
        for (const user of group) ids.add(user._id);
      }

      // A search index returns rows across the whole table, so the role and
      // activity filters are re-applied here on the merged id set.
      const merged = [...ids].map((id) => ctx.db.get(id));
      const rows = (await Promise.all(merged)).filter((row): row is NonNullable<typeof row> => {
        if (!row) return false;
        if (args.role && row.role !== args.role) return false;
        if (args.accountType && row.account_type !== args.accountType) return false;
        if (args.isActive !== undefined && row.isActive !== args.isActive) return false;
        return true;
      });

      rows.sort((a, b) => b._creationTime - a._creationTime);

      // Page the merged rows in memory. The search result set is already
      // bounded by SEARCH_LIMIT, so this stays a fixed-size operation.
      const { numItems, cursor } = args.paginationOpts;
      const start = cursor ? Number(cursor) : 0;
      const page = rows.slice(start, start + numItems);
      const nextStart = start + page.length;
      const isDone = nextStart >= rows.length;

      const [cities, premiumPlans] = await Promise.all([
        Promise.all(
          page.map((user) =>
            user.city_id ? ctx.db.get(user.city_id) : Promise.resolve(null),
          ),
        ),
        premiumPlansForPage(ctx, page),
      ]);

      return {
        page: page.map((user, index) =>
          toSummary(user, cities[index]?.name ?? null, premiumPlans[index]),
        ),
        isDone,
        continueCursor: isDone ? "" : String(nextStart),
        splitCursor: null,
        pageStatus: null,
      };
    }

    const result = await query.order("desc").paginate(args.paginationOpts);

    // Hydrate the city name and paid plan for the visible page only.
    const [cities, premiumPlans] = await Promise.all([
      Promise.all(
        result.page.map((user: Doc<"users">) =>
          user.city_id ? ctx.db.get(user.city_id) : Promise.resolve(null),
        ),
      ),
      premiumPlansForPage(ctx, result.page),
    ]);

    return {
      page: result.page.map((user: Doc<"users">, index: number) =>
        toSummary(user, cities[index]?.name ?? null, premiumPlans[index]),
      ),
      isDone: result.isDone,
      continueCursor: result.continueCursor,
      splitCursor: result.splitCursor ?? null,
      pageStatus: result.pageStatus ?? null,
    };
  },
});

/** Full detail for one user, including the fields the admin editor shows. */
export const getUser = adminQuery({
  args: { userId: v.id("users") },
  returns: v.union(userDetailValidator, v.null()),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const city = user.city_id ? await ctx.db.get(user.city_id) : null;
    const state = city?.state_id ? await ctx.db.get(city.state_id) : null;
    const manualGrant = (
      await ctx.db
        .query("manual_entitlements")
        .withIndex("by_user_and_granted_at", (q) => q.eq("user_id", user._id))
        .order("desc")
        .take(10)
    ).find((grant) => !grant.revoked_at);
    const subscriptions = await ctx.db
      .query("billing_subscriptions")
      .withIndex("by_user_and_updated_at", (q) => q.eq("user_id", user._id))
      .order("desc")
      .take(10);
    const subscription = subscriptions.find((row) => isSubscriptionEntitled(row)) ?? null;
    const proAccess = Boolean(subscription || manualGrant);
    const proAccessSource = subscription
      ? ("subscription" as const)
      : manualGrant
      ? ("manual" as const)
      : ("none" as const);

    return {
      id: user._id,
      name: user.name ?? null,
      email: user.email,
      username: user.username ?? null,
      role: user.role,
      account_type: user.account_type ?? null,
      is_active: user.isActive,
      profile_image: user.profile_image ?? null,
      headline: user.headline ?? null,
      about: user.about ?? null,
      professional_summary: user.professional_summary ?? null,
      phone: user.phone ?? null,
      city: city?.name ?? null,
      state: state?.name ?? null,
      country: null,
      profile_visibility: user.profile_visibility ?? null,
      show_phone_number: user.show_phone_number,
      show_contact_to_recruiters: Boolean(user.show_contact_to_recruiters),
      allow_profile_downloads: Boolean(user.allow_profile_downloads),
      profile_view_analytics: Boolean(user.profile_view_analytics),
      work_preference: user.work_preference ?? null,
      want_to_relocate: user.want_to_relocate ?? null,
      expected_salary_currency: user.expected_salary_currency ?? null,
      expected_min_salary: user.expected_min_salary ?? null,
      expected_max_salary: user.expected_max_salary ?? null,
      linkedin_url: user.linkedin_url ?? null,
      github_url: user.github_url ?? null,
      twitter_url: user.twitter_url ?? null,
      other_social_link: user.other_social_link ?? null,
      custom_profile_url: user.custom_profile_url ?? null,
      website: user.website ?? null,
      nationality: user.nationality ?? null,
      gender: user.gender ?? null,
      pronoun: user.pronoun ?? null,
      dob: user.dob ?? null,
      job_seeking_status: user.job_seeking_status ?? null,
      hiring_role: user.hiring_role ?? null,
      profile_type: user.profile_type ?? null,
      onboarding_completed: Boolean(user.onboarding_completed),
      languages: user.languages ?? null,
      interests: user.interests ?? null,
      portfolio_links: user.portfolio_links ?? null,
      relocate_locations: user.relocate_locations ?? null,
      created_at: user._creationTime,
      last_login_at: user.last_login_at ?? null,
      manual_pro: Boolean(manualGrant),
      manual_pro_since: manualGrant?.granted_at ?? null,
      manual_pro_note: manualGrant?.note ?? null,
      pro_access: proAccess,
      pro_access_source: proAccessSource,
      pro_subscription: subscription
        ? {
            status: subscription.status,
            plan: effectiveSubscriptionPlan(subscription),
            interval: subscription.interval,
            current_period_end: subscription.current_period_end ?? null,
            cancel_at_period_end: subscription.cancel_at_period_end,
          }
        : null,
    };
  },
});

/**
 * Admin-editable plan limits and benefits.
 *
 * Rows are upserted lazily: a missing row means "use the defaults in
 * lib/planConfig.ts", so a fresh deployment never needs a seed migration.
 */
export const getPlanConfigs = adminQuery({
  args: {},
  returns: v.object({ configs: v.array(planConfigValidator) }),
  handler: async (ctx) => ({ configs: await getAllPlanConfigs(ctx) }),
});

export const updatePlanConfig = adminMutation({
  args: {
    audience: v.union(v.literal("candidate"), v.literal("employer")),
    plan: v.union(v.literal("free"), v.literal("plus"), v.literal("pro")),
    agentDailyLimit: v.number(),
    applicationLimit: v.union(v.number(), v.null()),
    description: v.string(),
    features: v.array(v.string()),
    note: v.optional(v.string()),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    if (!Number.isInteger(args.agentDailyLimit) || args.agentDailyLimit < 0 || args.agentDailyLimit > 100000) {
      throw new Error("Agent daily limit must be a whole number between 0 and 100000.");
    }
    if (args.audience === "employer" && args.applicationLimit !== null) {
      throw new Error("Employer plans do not use application limits.");
    }
    if (
      args.applicationLimit !== null &&
      (!Number.isInteger(args.applicationLimit) ||
        args.applicationLimit < 0 ||
        args.applicationLimit > 100000)
    ) {
      throw new Error("Application limit must be blank or a whole number between 0 and 100000.");
    }

    const description = args.description.trim();
    if (!description) throw new Error("Add a short plan description.");
    if (description.length > 240) throw new Error("Keep the plan description under 240 characters.");

    const features = args.features.map((feature) => feature.trim()).filter(Boolean);
    if (features.length > 12) throw new Error("Use at most 12 benefit lines.");
    if (features.some((feature) => feature.length > 160)) {
      throw new Error("Keep each benefit line under 160 characters.");
    }

    const existing = await ctx.db
      .query("plan_configs")
      .withIndex("by_audience_and_plan", (q) =>
        q.eq("audience", args.audience as PlanAudience).eq("plan", args.plan as PlanTier),
      )
      .unique();
    const before = existing ?? defaultPlanConfig(args.audience, args.plan);
    const now = Date.now();
    const after = {
      audience: args.audience,
      plan: args.plan,
      agent_daily_limit: args.agentDailyLimit,
      application_limit: args.audience === "employer" ? null : args.applicationLimit,
      description,
      features,
      updated_at: now,
      updated_by: ctx.user._id,
    };

    if (existing) await ctx.db.patch(existing._id, after);
    else await ctx.db.insert("plan_configs", after);

    await ctx.db.insert("admin_audit_log", {
      admin_user_id: ctx.user._id,
      action: "plan_config.updated",
      before: {
        agent_daily_limit: before.agent_daily_limit,
        application_limit: before.application_limit,
        description: before.description,
        features: before.features,
      },
      after: {
        agent_daily_limit: after.agent_daily_limit,
        application_limit: after.application_limit,
        description: after.description,
        features: after.features,
      },
      note: args.note?.trim() || undefined,
      created_at: now,
    });

    return { ok: true };
  },
});

/**
 * Edits a user's profile fields.
 *
 * Only the fields in `ADMIN_USER_PATCH_KEYS` are accepted; anything else is
 * dropped, so a caller cannot smuggle `role`, `isActive`, or `authId` through
 * this mutation. Role and activation have their own guarded mutations below.
 */
export const updateUser = adminMutation({
  args: {
    userId: v.id("users"),
    updates: v.any(),
    note: v.optional(v.string()),
  },
  returns: v.object({ updated: v.array(v.string()) }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const incoming = (args.updates ?? {}) as Record<string, unknown>;
    const patch: Record<string, unknown> = {};

    for (const key of ADMIN_USER_PATCH_KEYS) {
      const value = incoming[key];
      if (value === undefined) continue;
      // Null clears an optional field; empty strings are dropped as no-ops.
      if (value === "") continue;
      patch[key] = value;
    }

    if (patch.dob !== undefined) {
      patch.dob = patch.dob ? new Date(String(patch.dob)).getTime() : undefined;
    }
    if (patch.phone !== undefined && patch.phone !== null) {
      patch.phone = String(patch.phone).trim();
    }

    const updatedKeys = Object.keys(patch);
    if (updatedKeys.length === 0) return { updated: [] };

    const before = {
      name: user.name ?? null,
      username: user.username ?? null,
      headline: user.headline ?? null,
      phone: user.phone ?? null,
      profile_visibility: user.profile_visibility ?? null,
    };
    const after = { ...before };
    for (const key of updatedKeys) {
      if (key in after) after[key as keyof typeof after] = patch[key] as never;
    }

    await ctx.db.patch(args.userId, patch);

    await ctx.db.insert("admin_audit_log", {
      admin_user_id: ctx.user._id,
      action: "user.updated",
      target_user_id: args.userId,
      before,
      after,
      note: args.note,
      created_at: Date.now(),
    });

    return { updated: updatedKeys };
  },
});

/**
 * Changes a user's role.
 *
 * Guard rails: an admin cannot change their own role (that would let the last
 * admin lock everyone out) and cannot promote to admin without already being
 * one. Both checks run server side.
 */
export const setUserRole = adminMutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("admin")),
    note: v.optional(v.string()),
  },
  returns: v.object({ role: v.string() }),
  handler: async (ctx, args) => {
    if (args.userId === ctx.user._id) {
      throw new Error("You cannot change your own role");
    }
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    if (user.role === args.role) return { role: user.role };

    const before = { role: user.role };
    await ctx.db.patch(args.userId, { role: args.role });
    await applyUserStatDeltas(ctx, user, { ...user, role: args.role });
    if (args.role === "user") {
      await ctx.scheduler.runAfter(0, internal.admin.revokeBetterAuthSessions, {
        authId: user.authId,
      });
    }

    await ctx.db.insert("admin_audit_log", {
      admin_user_id: ctx.user._id,
      action: "user.role_changed",
      target_user_id: args.userId,
      before,
      after: { role: args.role },
      note: args.note,
      created_at: Date.now(),
    });

    return { role: args.role };
  },
});

/**
 * Suspends or reactivates a user.
 *
 * A suspended user keeps their data but cannot be signed in: the admin app and
 * the web app both check `isActive` before trusting the session. An admin
 * cannot suspend themselves.
 */
/** Revokes Better Auth sessions through the component adapter. */
export const revokeBetterAuthSessions = internalAction({
  args: { authId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(components.betterAuth.adapter.deleteMany as any, {
      input: {
        model: "session",
        where: [{ field: "userId", operator: "eq", value: args.authId }],
      },
    });
    return null;
  },
});

export const setUserActive = adminMutation({
  args: {
    userId: v.id("users"),
    isActive: v.boolean(),
    note: v.optional(v.string()),
  },
  returns: v.object({ is_active: v.boolean() }),
  handler: async (ctx, args) => {
    if (args.userId === ctx.user._id) {
      throw new Error("You cannot suspend your own account");
    }
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    if (user.role === "admin" && !args.isActive) {
      throw new Error("Another admin must suspend an admin account");
    }
    if (user.isActive === args.isActive) return { is_active: user.isActive };

    const before = { is_active: user.isActive };
    await ctx.db.patch(args.userId, { isActive: args.isActive });
    await applyUserStatDeltas(ctx, user, { ...user, isActive: args.isActive });
    if (!args.isActive) {
      await ctx.scheduler.runAfter(0, internal.admin.revokeBetterAuthSessions, {
        authId: user.authId,
      });
    }

    await ctx.db.insert("admin_audit_log", {
      admin_user_id: ctx.user._id,
      action: args.isActive ? "user.reactivated" : "user.suspended",
      target_user_id: args.userId,
      before,
      after: { is_active: args.isActive },
      note: args.note,
      created_at: Date.now(),
    });

    return { is_active: args.isActive };
  },
});

export const deleteUser = adminMutation({
  args: {
    userId: v.id("users"),
    note: v.optional(v.string()),
  },
  returns: v.object({ deleted: v.boolean() }),
  handler: async (ctx, args) => {
    if (args.userId === ctx.user._id) {
      throw new Error("You cannot delete your own account");
    }
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const activeSubscription = (
      await ctx.db
        .query("billing_subscriptions")
        .withIndex("by_user_and_updated_at", (q) => q.eq("user_id", user._id))
        .order("desc")
        .take(5)
    ).some((subscription) => isSubscriptionEntitled(subscription));
    if (activeSubscription) {
      throw new Error("Cancel the user's active subscription before deleting the account.");
    }

    const before = {
      email: user.email,
      account_type: user.account_type ?? null,
      role: user.role,
      active_page_id: user.active_page_id ?? null,
    };
    // Removes the app rows, owned pages/jobs, R2 objects, agent threads and the
    // Better Auth identity in one place.
    await deleteUserAccount(ctx, user);

    await ctx.db.insert("admin_audit_log", {
      admin_user_id: ctx.user._id,
      action: "user.deleted",
      target_user_id: args.userId,
      before,
      note: args.note,
      created_at: Date.now(),
    });
    return { deleted: true };
  },
});

export const grantManualPro = adminMutation({  args: {
    userId: v.id("users"),
    note: v.optional(v.string()),
  },
  returns: v.object({ granted: v.boolean(), already: v.boolean() }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const existing = (
      await ctx.db
        .query("manual_entitlements")
        .withIndex("by_user_and_granted_at", (q) => q.eq("user_id", args.userId))
        .order("desc")
        .take(10)
    ).find((grant) => !grant.revoked_at);
    if (existing) return { granted: false, already: true };

    await ctx.db.insert("manual_entitlements", {
      user_id: args.userId,
      plan: "pro",
      granted_by: ctx.user._id,
      granted_at: Date.now(),
      note: args.note?.slice(0, 500),
    });
    await ctx.db.insert("admin_audit_log", {
      admin_user_id: ctx.user._id,
      action: "billing.manual_pro_granted",
      target_user_id: args.userId,
      after: { plan: "pro" },
      note: args.note,
      created_at: Date.now(),
    });
    return { granted: true, already: false };
  },
});

export const revokeManualPro = adminMutation({
  args: {
    userId: v.id("users"),
    note: v.optional(v.string()),
  },
  returns: v.object({ revoked: v.boolean() }),
  handler: async (ctx, args) => {
    const active = (
      await ctx.db
        .query("manual_entitlements")
        .withIndex("by_user_and_granted_at", (q) => q.eq("user_id", args.userId))
        .order("desc")
        .take(10)
    ).find((grant) => !grant.revoked_at);
    if (!active) return { revoked: false };

    await ctx.db.patch(active._id, {
      revoked_at: Date.now(),
      revoked_by: ctx.user._id,
      note: args.note?.slice(0, 500) ?? active.note,
    });
    await ctx.db.insert("admin_audit_log", {
      admin_user_id: ctx.user._id,
      action: "billing.manual_pro_revoked",
      target_user_id: args.userId,
      before: { plan: "pro" },
      note: args.note,
      created_at: Date.now(),
    });
    return { revoked: true };
  },
});

const jobSummaryValidator = v.object({  id: v.id("jobs"),
  title: v.union(v.string(), v.null()),
  company_name: v.union(v.string(), v.null()),
  status: v.string(),
  location: v.union(v.string(), v.null()),
  work_type: v.union(v.string(), v.null()),
  workplace_type: v.union(v.string(), v.null()),
  salary: v.union(v.number(), v.null()),
  salary_currency: v.union(v.string(), v.null()),
  is_ingested: v.boolean(),
  owner_id: v.union(v.string(), v.null()),
  owner_email: v.union(v.string(), v.null()),
  ats_integration_id: v.union(v.string(), v.null()),
  view_count: v.number(),
  application_count: v.number(),
  published_date: v.union(v.number(), v.null()),
  created_at: v.number(),
  description: v.union(v.string(), v.null()),
});

/**
 * Paginated job list for moderation.
 *
 * Filtered by status and by whether the job was ingested (no owner) or posted
 * by a user, which is the distinction the existing "delete ingested jobs"
 * action already draws. Search uses the job title / company search indexes.
 */
export const listJobs = adminQuery({
  args: {
    status: v.optional(v.string()),
    search: v.optional(v.string()),
    onlyIngested: v.optional(v.boolean()),
    sort: v.optional(v.union(v.literal("newest"), v.literal("oldest"))),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(jobSummaryValidator),
  handler: async (ctx, args) => {
    const search = args.search?.trim() ?? "";

    if (search) {
      // Search indexes cover title and company. Both are optional fields,
      // which Convex supports for search indexes.
      const SEARCH_LIMIT = 100;
      const [byTitle, byCompany] = await Promise.all([
        ctx.db
          .query("jobs")
          .withSearchIndex("search_title", (q) => q.search("title", search))
          .take(SEARCH_LIMIT),
        ctx.db
          .query("jobs")
          .withSearchIndex("search_company", (q) => q.search("company_name", search))
          .take(SEARCH_LIMIT),
      ]);

      const ids = new Set<Id<"jobs">>();
      for (const group of [byTitle, byCompany]) {
        for (const job of group) ids.add(job._id);
      }

      const merged = [...ids].map((id) => ctx.db.get(id));
      const rows = (await Promise.all(merged)).filter((row): row is NonNullable<typeof row> => {
        if (!row) return false;
        if (args.status && row.status !== args.status) return false;
        if (args.onlyIngested !== undefined) {
          const isIngested = row.owner_id == null;
          if (isIngested !== args.onlyIngested) return false;
        }
        return true;
      });

      rows.sort((a, b) =>
        args.sort === "oldest"
          ? a._creationTime - b._creationTime
          : b._creationTime - a._creationTime,
      );

      const { numItems, cursor } = args.paginationOpts;
      const start = cursor ? Number(cursor) : 0;
      const page = rows.slice(start, start + numItems);
      const nextStart = start + page.length;
      const isDone = nextStart >= rows.length;

      const hydrated = await hydrateJobSummaries(ctx, page);
      return {
        page: hydrated,
        isDone,
        continueCursor: isDone ? "" : String(nextStart),
        splitCursor: null,
        pageStatus: null,
      };
    }

    let query: any = ctx.db.query("jobs");
    if (args.status) {
      query = query.withIndex("by_status", (q: any) => q.eq("status", args.status as Doc<"jobs">["status"]));
    } else {
      query = query.withIndex("by_creation_time");
    }

    if (args.onlyIngested !== undefined) {
      query = query.filter((q: any) =>
        args.onlyIngested
          ? q.eq(q.field("owner_id"), undefined)
          : q.neq(q.field("owner_id"), undefined),
      );
    }

    const result = await query.order(args.sort === "oldest" ? "asc" : "desc").paginate(args.paginationOpts);
    const hydrated = await hydrateJobSummaries(ctx, result.page);

    return {
      page: hydrated,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
      splitCursor: result.splitCursor ?? null,
      pageStatus: result.pageStatus ?? null,
    };
  },
});

/**
 * Moderates a job: closes, reopens, or pauses it. Uses the shared
 * `deleteJobCascade` path only for deletion, so the open-job counter and the
 * application cascade stay correct.
 */
export const moderateJob = adminMutation({
  args: {
    jobId: v.id("jobs"),
    action: v.union(
      v.literal("close"),
      v.literal("reopen"),
      v.literal("pause"),
      v.literal("delete"),
    ),
    note: v.optional(v.string()),
  },
  returns: v.object({ status: v.union(v.string(), v.null()) }),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("Job not found");

    if (args.action === "delete") {
      await deleteJobCascade(ctx, args.jobId);
      await ctx.db.insert("admin_audit_log", {
        admin_user_id: ctx.user._id,
        action: "job.deleted",
        target_job_id: args.jobId,
        before: { title: job.title ?? null, status: job.status },
        note: args.note,
        created_at: Date.now(),
      });
      return { status: null };
    }

    const nextStatus =
      args.action === "close" ? "closed" : args.action === "reopen" ? "open" : "paused";

    if (job.status === nextStatus) return { status: job.status };

    // Keep the denormalized open-job counter in step with the status change.
    const delta = openCountDelta(job.status, nextStatus);
    if (delta !== 0) {
      await bumpOpenJobCount(ctx, delta);
      await bumpAdminStat(ctx, ADMIN_STAT_KEYS.openJobs, delta);
    }

    await ctx.db.patch(args.jobId, { status: nextStatus });

    await ctx.db.insert("admin_audit_log", {
      admin_user_id: ctx.user._id,
      action: `job.${args.action}`,
      target_job_id: args.jobId,
      before: { status: job.status, title: job.title ?? null },
      after: { status: nextStatus },
      note: args.note,
      created_at: Date.now(),
    });

    return { status: nextStatus };
  },
});

/**
 * Platform totals for the dashboard.
 *
 * Reads the counter rows instead of scanning tables. When a counter is missing
 * (a deployment that predates them) the count falls back to a bounded sample
 * so the dashboard still renders, and the admin can trigger a rebuild.
 */
export const platformSummary = adminQuery({
  args: {},
  returns: v.object({
    users: v.number(),
    seekers: v.number(),
    recruiters: v.number(),
    admins: v.number(),
    inactiveUsers: v.number(),
    jobs: v.number(),
    openJobs: v.number(),
    applications: v.number(),
    publicBoards: v.number(),
    recentSignups: v.array(
      v.object({
        id: v.id("users"),
        name: v.union(v.string(), v.null()),
        email: v.string(),
        role: v.string(),
        account_type: v.union(v.string(), v.null()),
        created_at: v.number(),
      }),
    ),
    recentAudit: v.array(
      v.object({
        id: v.id("admin_audit_log"),
        action: v.string(),
        admin_email: v.union(v.string(), v.null()),
        target_user_id: v.union(v.string(), v.null()),
        target_job_id: v.union(v.string(), v.null()),
        note: v.union(v.string(), v.null()),
        created_at: v.number(),
      }),
    ),
  }),
  handler: async (ctx) => {
    const counters = await getAdminStats(ctx, [
      ADMIN_STAT_KEYS.users,
      ADMIN_STAT_KEYS.seekers,
      ADMIN_STAT_KEYS.recruiters,
      ADMIN_STAT_KEYS.admins,
      ADMIN_STAT_KEYS.inactiveUsers,
      ADMIN_STAT_KEYS.jobs,
      ADMIN_STAT_KEYS.openJobs,
      ADMIN_STAT_KEYS.applications,
    ]);

    const boardRows = await ctx.db
      .query("ats_integrations")
      .withIndex("by_kind", (q) => q.eq("kind", "public_board"))
      .take(1000);

    const recentUsers = await ctx.db
      .query("users")
      .withIndex("by_creation_time")
      .order("desc")
      .take(5);

    const auditRows = await ctx.db
      .query("admin_audit_log")
      .withIndex("by_created_at")
      .order("desc")
      .take(10);

    const auditAdmins = await Promise.all(
      auditRows.map((row) => ctx.db.get(row.admin_user_id)),
    );

    return {
      users: counters[ADMIN_STAT_KEYS.users],
      seekers: counters[ADMIN_STAT_KEYS.seekers],
      recruiters: counters[ADMIN_STAT_KEYS.recruiters],
      admins: counters[ADMIN_STAT_KEYS.admins],
      inactiveUsers: counters[ADMIN_STAT_KEYS.inactiveUsers],
      jobs: counters[ADMIN_STAT_KEYS.jobs],
      openJobs: counters[ADMIN_STAT_KEYS.openJobs],
      applications: counters[ADMIN_STAT_KEYS.applications],
      publicBoards: boardRows.length,
      recentSignups: recentUsers.map((user) => ({
        id: user._id,
        name: user.name ?? null,
        email: user.email,
        role: user.role,
        account_type: user.account_type ?? null,
        created_at: user._creationTime,
      })),
      recentAudit: auditRows.map((row, index) => ({
        id: row._id,
        action: row.action,
        admin_email: auditAdmins[index]?.email ?? null,
        target_user_id: row.target_user_id ?? null,
        target_job_id: row.target_job_id ?? null,
        note: row.note ?? null,
        created_at: row.created_at,
      })),
    };
  },
});

/** Paginated audit log, newest first. */
export const listAuditLog = adminQuery({
  args: {
    targetUserId: v.optional(v.id("users")),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(
    v.object({
      id: v.id("admin_audit_log"),
      action: v.string(),
      admin_email: v.union(v.string(), v.null()),
      target_user_id: v.union(v.string(), v.null()),
      target_job_id: v.union(v.string(), v.null()),
      before: v.union(v.any(), v.null()),
      after: v.union(v.any(), v.null()),
      note: v.union(v.string(), v.null()),
      created_at: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("admin_audit_log");
    if (args.targetUserId) {
      query = query.withIndex("by_target_user", (q: any) =>
        q.eq("target_user_id", args.targetUserId!),
      );
    } else {
      query = query.withIndex("by_created_at");
    }

    const result = await query.order("desc").paginate(args.paginationOpts);
    const admins = await Promise.all(
      result.page.map((row: Doc<"admin_audit_log">) => ctx.db.get(row.admin_user_id)),
    );

    return {
      page: result.page.map((row: Doc<"admin_audit_log">, index: number) => ({
        id: row._id,
        action: row.action,
        admin_email: admins[index]?.email ?? null,
        target_user_id: row.target_user_id ?? null,
        target_job_id: row.target_job_id ?? null,
        before: row.before ?? null,
        after: row.after ?? null,
        note: row.note ?? null,
        created_at: row.created_at,
      })),
      isDone: result.isDone,
      continueCursor: result.continueCursor,
      splitCursor: result.splitCursor ?? null,
      pageStatus: result.pageStatus ?? null,
    };
  },
});

/**
 * Rebuilds the dashboard counters from the source tables.
 *
 * Paged in the background so a large table cannot exceed the transaction
 * limits, and idempotent so running it twice converges on the same numbers.
 */
export const rebuildStats = adminMutation({
  args: {},
  returns: v.object({ started: v.boolean() }),
  handler: async (ctx) => {
    // Rebuild users, jobs, and applications independently. Each scanner owns
    // its accumulation keys, so a large table cannot overflow one mutation.
    await resetAdminStatsRebuild(ctx);
    await Promise.all([
      ctx.scheduler.runAfter(0, internal.admin.rebuildUserStatsBatch, { cursor: null }),
      ctx.scheduler.runAfter(0, internal.admin.rebuildJobStatsBatch, { cursor: null }),
      ctx.scheduler.runAfter(0, internal.admin.rebuildApplicationStatsBatch, { cursor: null }),
    ]);
    return { started: true };
  },
});

export const rebuildUserStatsBatch = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  returns: v.object({ done: v.boolean() }),
  handler: async (ctx, args) => {
    const result = await rebuildUserStats(ctx, args.cursor);
    return { done: result.done };
  },
});

export const rebuildJobStatsBatch = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  returns: v.object({ done: v.boolean() }),
  handler: async (ctx, args) => {
    const result = await rebuildJobStats(ctx, args.cursor);
    return { done: result.done };
  },
});

export const rebuildApplicationStatsBatch = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  returns: v.object({ done: v.boolean() }),
  handler: async (ctx, args) => {
    const result = await rebuildApplicationStats(ctx, args.cursor);
    return { done: result.done };
  },
});
