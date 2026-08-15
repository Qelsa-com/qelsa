import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { emailOTP } from "better-auth/plugins";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const authComponent = createClient<DataModel>(components.betterAuth, {
  authFunctions: internal.auth,
  triggers: {
    user: {
      onCreate: async (ctx, doc) => {
        const existing = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", doc.email))
          .unique();
        if (existing) {
          await ctx.db.patch(existing._id, { authId: doc._id, name: doc.name ?? existing.name });
          return;
        }
        await ctx.db.insert("users", {
          authId: doc._id,
          email: doc.email,
          name: doc.name ?? undefined,
          profile_image: doc.image ?? undefined,
          role: "user",
          isActive: true,
          show_phone_number: false,
          expected_salary_currency: "INR",
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
  handler: async (ctx, args) => {
    const byAuth = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", args.authId))
      .unique();
    if (byAuth) return byAuth._id;
    const byEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (byEmail) {
      await ctx.db.patch(byEmail._id, { authId: args.authId, name: args.name ?? byEmail.name });
      return byEmail._id;
    }
    return await ctx.db.insert("users", {
      authId: args.authId,
      email: args.email,
      name: args.name,
      profile_image: args.image,
      role: "user",
      isActive: true,
      show_phone_number: false,
      expected_salary_currency: "INR",
    });
  },
});
