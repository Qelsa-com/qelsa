import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { emailOTP } from "better-auth/plugins";
import { components, internal } from "./_generated/api";
import type { DataModel, Id } from "./_generated/dataModel";
import { query, mutation, internalMutation, type ActionCtx, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type AppUserFields = { authId: string; email: string; name?: string; image?: string };

/**
 * Creates the app `users` row for a Better Auth user, or links an existing row
 * by email. Idempotent, so it is safe to call on every sign in.
 */
async function upsertAppUser(ctx: MutationCtx, fields: AppUserFields): Promise<Id<"users">> {
  const byAuthId = await ctx.db
    .query("users")
    .withIndex("by_authId", (q) => q.eq("authId", fields.authId))
    .unique();
  if (byAuthId) return byAuthId._id;

  const byEmail = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", fields.email))
    .unique();
  if (byEmail) {
    await ctx.db.patch(byEmail._id, {
      authId: fields.authId,
      name: fields.name ?? byEmail.name,
      profile_image: fields.image ?? byEmail.profile_image,
    });
    return byEmail._id;
  }

  return await ctx.db.insert("users", {
    authId: fields.authId,
    email: fields.email,
    name: fields.name,
    profile_image: fields.image,
    role: "user",
    isActive: true,
    show_phone_number: false,
    expected_salary_currency: "INR",
  });
}

export const authComponent = createClient<DataModel>(components.betterAuth, {
  authFunctions: internal.auth,
  triggers: {
    user: {
      onCreate: async (ctx, doc) => {
        await upsertAppUser(ctx, {
          authId: doc._id,
          email: doc.email,
          name: doc.name ?? undefined,
          image: doc.image ?? undefined,
        });
      },
      onUpdate: async (ctx, newDoc) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_authId", (q) => q.eq("authId", newDoc._id))
          .unique();
        if (!user) return;
        await ctx.db.patch(user._id, {
          email: newDoc.email,
          name: newDoc.name ?? user.name,
          profile_image: newDoc.image ?? user.profile_image,
        });
      },
      onDelete: async (ctx, doc) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_authId", (q) => q.eq("authId", doc._id))
          .unique();
        if (user) await ctx.db.delete(user._id);
      },
    },
  },
});

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

export const createAuth = (ctx: Parameters<typeof authComponent.adapter>[0]) =>
  betterAuth({
    baseURL: siteUrl,
    trustedOrigins: [siteUrl, "http://localhost:3000", "http://localhost:3001"],
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID ?? process.env.NEXT_PUBLIC_GOOGLE_AUTH_CLIENT_ID ?? "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        enabled: Boolean(process.env.GOOGLE_CLIENT_SECRET),
      },
    },
    databaseHooks: {
      session: {
        create: {
          // The user trigger only runs the first time a Better Auth user is
          // created, so a missing app user (e.g. wiped table, user created
          // before the trigger existed) would never recover. Re-provisioning on
          // session creation makes every sign in self healing.
          after: async (session) => {
            // `createAuth` is also called with a stub ctx (schema generation)
            // and with query ctxs, neither of which can run mutations.
            const writeCtx = ctx as Partial<ActionCtx> | undefined;
            if (!writeCtx?.runMutation) return;
            await writeCtx.runMutation(internal.auth.ensureAppUserForAuthId, {
              authId: session.userId,
            });
          },
        },
      },
    },
    plugins: [
      convex({ authConfig }),
      emailOTP({
        otpLength: 6,
        expiresIn: 600,
        sendVerificationOTP: async ({ email, otp }) => {
          console.log(`[emailOTP] ${email}: ${otp}`);
        },
      }),
    ],
  });

export const getCurrentUser = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", authUser._id))
      .unique();
    return user;
  },
});

export const ensureAppUser = internalMutation({
  args: {
    authId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => upsertAppUser(ctx, args),
});

export const ensureAppUserForAuthId = internalMutation({
  args: { authId: v.string() },
  returns: v.union(v.id("users"), v.null()),
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAnyUserById(ctx, args.authId);
    if (!authUser) return null;
    return await upsertAppUser(ctx, {
      authId: authUser._id,
      email: authUser.email,
      name: authUser.name ?? undefined,
      image: authUser.image ?? undefined,
    });
  },
});

/**
 * Provisions the app user for the caller's Better Auth identity. Called by the
 * client when a session exists but `users.me` has no app user yet, so an
 * already signed in user recovers without having to sign out.
 */
export const ensureCurrentAppUser = mutation({
  args: {},
  returns: v.union(v.id("users"), v.null()),
  handler: async (ctx) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) return null;
    return await upsertAppUser(ctx, {
      authId: authUser._id,
      email: authUser.email,
      name: authUser.name ?? undefined,
      image: authUser.image ?? undefined,
    });
  },
});
