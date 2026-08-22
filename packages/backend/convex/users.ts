import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { components } from "./_generated/api";
import { authedMutation, optionalAuthQuery } from "./lib/customFunctions";
import { query, type MutationCtx } from "./_generated/server";
import { asUserJson, iso, withId } from "./lib/helpers";
import { deleteAppUserData } from "./lib/deleteUserData";
import { deleteR2Keys, signedFileUrl } from "./lib/r2";
import { R2 } from "@convex-dev/r2";

const r2 = new R2(components.r2);

export const me = optionalAuthQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    // Returns null instead of throwing when the app user has not been
    // provisioned yet; the client calls auth.ensureCurrentAppUser to create it.
    if (!ctx.user) return null;
    const city = ctx.user.city_id ? await ctx.db.get(ctx.user.city_id) : null;
    const state = city ? await ctx.db.get(city.state_id) : null;
    const culture = await ctx.db
      .query("culture_preferences")
      .withIndex("by_user", (q) => q.eq("user_id", ctx.user._id))
      .unique();
    const resumes = await ctx.db
      .query("resumes")
      .withIndex("by_user", (q) => q.eq("user_id", ctx.user._id))
      .collect();
    return {
      ...asUserJson(ctx.user),
      profile_image: (await signedFileUrl(r2, ctx.user.profile_image_storage_id)) ?? ctx.user.profile_image,
      city: city ? { ...withId(city), state: state ? withId(state) : null } : null,
      culture_preference: culture ? withId(culture) : null,
      resumes: await Promise.all(
        resumes.map(async (r) => ({
          ...withId(r),
          file_url: (await signedFileUrl(r2, r.storage_id)) ?? r.file_url,
          createdAt: iso(r._creationTime),
          updatedAt: iso(r._creationTime),
        })),
      ),
    };
  },
});

export const publicProfile = query({
  args: { username: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user =
      (await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", args.username))
        .unique()) ??
      (await ctx.db
        .query("users")
        .withIndex("by_custom_profile_url", (q) => q.eq("custom_profile_url", args.username))
        .unique());
    if (!user || !user.isActive || user.profile_visibility === "private") return null;

    const [experiences, educations, certifications, skills] = await Promise.all([
      ctx.db.query("experiences").withIndex("by_user", (q) => q.eq("user_id", user._id)).collect(),
      ctx.db.query("educations").withIndex("by_user", (q) => q.eq("user_id", user._id)).collect(),
      ctx.db.query("user_certifications").withIndex("by_user", (q) => q.eq("user_id", user._id)).collect(),
      ctx.db.query("user_skills").withIndex("by_user", (q) => q.eq("user_id", user._id)).collect(),
    ]);

    const city = user.city_id ? await ctx.db.get(user.city_id) : null;

    return {
      user: {
        ...asUserJson(user),
        profile_image: (await signedFileUrl(r2, user.profile_image_storage_id)) ?? user.profile_image,
        city: city ? withId(city) : null,
      },
      experiences: experiences.map(withId),
      educations: educations.map(withId),
      certifications: certifications.map(withId),
      skills: skills.map(withId),
    };
  },
});

const USER_PATCH_KEYS = new Set([
  "name",
  "username",
  "gender",
  "dob",
  "city_id",
  "phone",
  "profile_image",
  "profile_image_storage_id",
  "about",
  "headline",
  "nationality",
  "pronoun",
  "professional_summary",
  "work_preference",
  "want_to_relocate",
  "preffer_full_time",
  "preffer_contract",
  "preffer_internship",
  "preffer_freelance",
  "preffer_part_time",
  "expected_salary_currency",
  "expected_min_salary",
  "expected_max_salary",
  "linkedin_url",
  "github_url",
  "twitter_url",
  "other_social_link",
  "custom_profile_url",
  "profile_visibility",
  "show_contact_to_recruiters",
  "allow_profile_downloads",
  "profile_view_analytics",
  "account_type",
  "job_seeking_status",
  "hiring_role",
  "active_page_id",
  "onboarding_completed",
  "profile_type",
  "find_job",
  "explore_career",
  "upskill_and_learn",
  "prepare_interview",
  "relocate_location",
  "website",
  "show_phone_number",
  "phone_country_code",
  "relocate_locations",
  "default_resume_id",
  "languages",
  "interests",
  "portfolio_links",
]);

function profileUpdates(raw: Record<string, unknown>) {
  const updates: Record<string, unknown> = { ...raw };
  if (updates.city && typeof updates.city === "object" && updates.city !== null && "id" in updates.city) {
    updates.city_id = (updates.city as { id: string }).id;
  }
  if (updates.dob && typeof updates.dob === "string") {
    updates.dob = new Date(updates.dob).getTime();
  }
  // Signed R2 URLs expire; persist the storage key and re-sign on read.
  if (updates.profile_image_storage_id && typeof updates.profile_image === "string" && updates.profile_image.includes("X-Amz-")) {
    delete updates.profile_image;
  }
  const next: Record<string, unknown> = {};
  for (const key of USER_PATCH_KEYS) {
    const value = updates[key];
    if (value !== undefined && value !== null) next[key] = value;
  }
  return next;
}

export const updateProfile = authedMutation({
  args: { updates: v.any() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const incoming = args.updates as Record<string, unknown>;
    const culture = incoming.culture_preference;
    const updates = profileUpdates(incoming);
    await ctx.db.patch(ctx.user._id, updates);

    if (culture !== undefined) {
      const existing = await ctx.db
        .query("culture_preferences")
        .withIndex("by_user", (q) => q.eq("user_id", ctx.user._id))
        .unique();
      if (culture === null) {
        if (existing) await ctx.db.delete(existing._id);
      } else if (typeof culture === "object" && culture !== null) {
        const fields = culture as {
          preset?: string;
          attributes?: Array<{ key: string; importance: number }>;
          global_importance?: number;
          statement?: string;
          visibility?: { public: boolean; recruiters: boolean };
        };
        if (existing) {
          await ctx.db.patch(existing._id, fields);
        } else {
          await ctx.db.insert("culture_preferences", {
            user_id: ctx.user._id,
            attributes: fields.attributes ?? [],
            global_importance: fields.global_importance ?? 50,
            visibility: fields.visibility ?? { public: false, recruiters: false },
            preset: fields.preset,
            statement: fields.statement,
          });
        }
      }
    }

    const user = (await ctx.db.get(ctx.user._id)) as Doc<"users">;
    return {
      ...asUserJson(user),
      profile_image: (await signedFileUrl(r2, user.profile_image_storage_id)) ?? user.profile_image,
    };
  },
});

export const setAccountType = authedMutation({
  args: { account_type: v.union(v.literal("seeker"), v.literal("recruiter")) },
  returns: v.any(),
  handler: async (ctx, args) => {
    await ctx.db.patch(ctx.user._id, { account_type: args.account_type });
    const user = (await ctx.db.get(ctx.user._id)) as Doc<"users">;
    return { message: "Account type updated", user: asUserJson(user) };
  },
});

export const deleteAccount = authedMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const authId = ctx.user.authId;
    await ctx.runMutation(components.agent.users.deleteAllForUserIdAsync, {
      userId: authId,
    });
    const r2Keys = await deleteAppUserData(ctx, ctx.user);
    await deleteR2Keys(r2, ctx, r2Keys);
    await deleteBetterAuthUser(ctx, authId);
    return null;
  },
});

const BA_USER_OWNED_MODELS = [
  "session",
  "account",
  "twoFactor",
  "oauthApplication",
  "oauthAccessToken",
  "oauthConsent",
] as const;

async function deleteBetterAuthUser(ctx: MutationCtx, authId: string) {
  for (const model of BA_USER_OWNED_MODELS) {
    let cursor: string | null = null;
    for (;;) {
      const result: { isDone: boolean; continueCursor: string } = await ctx.runMutation(
        components.betterAuth.adapter.deleteMany,
        {
          input: {
            model,
            where: [{ field: "userId", value: authId }],
          },
          paginationOpts: { numItems: 100, cursor },
        },
      );
      if (result.isDone) break;
      cursor = result.continueCursor;
    }
  }
  await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
    input: {
      model: "user",
      where: [{ field: "_id", value: authId }],
    },
  });
}
