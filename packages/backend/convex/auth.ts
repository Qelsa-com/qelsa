import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { R2 } from "@convex-dev/r2";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { betterAuth } from "better-auth/minimal";
import { emailOTP } from "better-auth/plugins";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import type { DataModel, Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, mutation, query, type ActionCtx, type MutationCtx } from "./_generated/server";
import authConfig from "./auth.config";
import { deleteAppUserData } from "./lib/deleteUserData";
import { ADMIN_STAT_KEYS, bumpAdminStat } from "./lib/adminStats";
import { sendOTPEmail } from "./lib/email";
import { checkEmployerEmail, EMPLOYER_EMAIL_MESSAGE } from "./lib/employerEmail";

const siteUrl = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const isLocalSite = /localhost|127\.0\.0\.1/.test(siteUrl);
const adminSiteUrl = process.env.ADMIN_SITE_URL ?? (isLocalSite ? "http://localhost:3001" : null);
const extraTrustedOrigins =
  process.env.TRUSTED_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? [];
const localOrigins = isLocalSite ? ["http://localhost:3000", "http://localhost:3001"] : [];
const trustedOrigins = [
  ...new Set([siteUrl, ...(adminSiteUrl ? [adminSiteUrl] : []), ...localOrigins, ...extraTrustedOrigins]),
];

const ADMIN_AUTH_PATHS = new Set([
  "/sign-in/email-otp",
  "/sign-in/email",
  "/email-otp/send-verification-otp",
  "/sign-out",
  "/get-session",
  "/ok",
]);

function requestHeaders(ctx: any): any {
  return ctx?.request?.headers ?? ctx?.headers ?? null;
}

function requestHost(ctx: any): string | null {
  const headers = requestHeaders(ctx);
  if (!headers) return null;
  const candidates = [
    headers.get?.("x-better-auth-forwarded-host"),
    headers.get?.("x-forwarded-host"),
    headers.get?.("origin"),
    headers.get?.("referer"),
  ];
  for (const value of candidates) {
    if (typeof value !== "string" || !value.trim()) continue;
    try {
      return new URL(value.includes("://") ? value : `http://${value}`).host;
    } catch {
      // Try the next header.
    }
  }
  return null;
}

function isAdminAuthRequest(ctx: any): boolean {
  try {
    if (!adminSiteUrl) return false;
    return requestHost(ctx) === new URL(adminSiteUrl).host;
  } catch {
    return false;
  }
}

/**
 * The employer screen uses its own auth proxy, which stamps every request.
 * A client can also send this header to the normal proxy; that only applies the
 * stricter employer policy, so it cannot be used to bypass it.
 */
function isEmployerAuthRequest(ctx: any): boolean {
  return requestHeaders(ctx)?.get?.("x-qelsa-auth-flow") === "employer";
}

const EMPLOYER_CANDIDATE_ACCOUNT_MESSAGE =
  "This email is already registered as a candidate account. Sign in as a candidate or use a different work email.";

async function appUserByEmail(ctx: any, email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  if (ctx?.db) {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", normalized))
      .unique();
  }
  if (ctx?.runQuery) {
    return await ctx.runQuery(internal.auth.findAppUserByEmail, { email: normalized });
  }
  return null;
}

async function appUserByAuthId(ctx: any, authId: string) {
  if (!authId) return null;
  if (ctx?.db) {
    return await ctx.db
      .query("users")
      .withIndex("by_authId", (q: any) => q.eq("authId", authId))
      .unique();
  }
  if (ctx?.runQuery) {
    return await ctx.runQuery(internal.auth.findAppUserByAuthId, { authId });
  }
  return null;
}

type AppUserFields = { authId: string; email: string; name?: string; image?: string };

async function claimPendingPageInvites(ctx: MutationCtx, userId: Id<"users">, email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const pendingInvites = await ctx.db
    .query("page_invites")
    .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
    .collect();

  for (const invite of pendingInvites) {
    if (invite.status !== "pending") continue;

    const existingMember = await ctx.db
      .query("page_members")
      .withIndex("by_page_and_user", (q) =>
        q.eq("page_id", invite.page_id).eq("user_id", userId)
      )
      .first();

    if (!existingMember) {
      await ctx.db.insert("page_members", {
        page_id: invite.page_id,
        user_id: userId,
        role: invite.role,
        added_at: Date.now(),
        added_by: invite.invited_by,
      });
    }

    await ctx.db.patch(invite._id, { status: "accepted" });
  }
}

/**
 * Creates the app `users` row for a Better Auth user, or links an existing row
 * by email. Idempotent, so it is safe to call on every sign in.
 */
async function upsertAppUser(ctx: MutationCtx, fields: AppUserFields): Promise<Id<"users">> {
  let userId: Id<"users">;
  const byAuthId = await ctx.db
    .query("users")
    .withIndex("by_authId", (q) => q.eq("authId", fields.authId))
    .unique();
  if (byAuthId) {
    userId = byAuthId._id;
  } else {
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
      userId = byEmail._id;
    } else {
      userId = await ctx.db.insert("users", {
        authId: fields.authId,
        email: fields.email,
        name: fields.name,
        profile_image: fields.image,
        role: "user",
        isActive: true,
        show_phone_number: false,
        expected_salary_currency: "INR",
      });
      // New account: bump the admin dashboard counters in the same transaction
      // so the dashboard never has to scan the users table.
      await bumpAdminStat(ctx, ADMIN_STAT_KEYS.users, 1);
    }
  }

  await claimPendingPageInvites(ctx, userId, fields.email);
  return userId;
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
        if (user) {
          const r2Keys = await deleteAppUserData(ctx, user);
          const r2 = new R2(components.r2);
          for (const key of r2Keys) {
            await r2.deleteObject(ctx, key);
          }
        }
        await ctx.runMutation(components.agent.users.deleteAllForUserIdAsync, {
          userId: doc._id,
        });
      },
    },
  },
});

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

export const createAuth = (ctx: Parameters<typeof authComponent.adapter>[0]) =>
  betterAuth({
    baseURL: siteUrl,
    trustedOrigins,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 60,
      customRules: {
        "/sign-in/email-otp": { window: 60, max: 10 },
        "/email-otp/send-verification-otp": { window: 60, max: 5 },
        "/sign-in/email": { window: 60, max: 10 },
        "/sign-up/email": { window: 60, max: 5 },
      },
    },
    user: {
      deleteUser: {
        enabled: true,
      },
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID ?? process.env.NEXT_PUBLIC_GOOGLE_AUTH_CLIENT_ID ?? "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        enabled: Boolean(process.env.GOOGLE_CLIENT_SECRET),
      },
    },
    hooks: {
      before: createAuthMiddleware(async (authCtx) => {
        const path = String(authCtx.path ?? "").replace(/^\/api\/auth/, "");
        const body = (authCtx.body ?? {}) as { email?: unknown };
        const email = typeof body.email === "string" ? body.email : "";
        const appUser = email ? await appUserByEmail(ctx, email) : null;
        const adminRequest = isAdminAuthRequest(authCtx);

        // The admin app shares this Better Auth instance, but it must not be a
        // second public sign-up surface. Restrict its origin to the handful of
        // session/sign-in routes the admin app actually uses.
        if (adminRequest) {
          if (path.startsWith("/convex/")) return;
          if (!ADMIN_AUTH_PATHS.has(path)) {
            throw new APIError("NOT_FOUND", { message: "Not found" });
          }
          if (
            (path === "/sign-in/email-otp" || path === "/sign-in/email") &&
            (!appUser || appUser.role !== "admin" || !appUser.isActive)
          ) {
            throw new APIError("UNAUTHORIZED", { message: "Invalid email or password" });
          }
          return;
        }

        // The employer screen has its own proxy header. Reject consumer and
        // disposable domains at the auth endpoint, not just in the React form.
        if (isEmployerAuthRequest(authCtx)) {
          const isEmailEntryPath =
            path === "/email-otp/send-verification-otp" ||
            path === "/sign-in/email-otp" ||
            path === "/sign-in/email" ||
            path === "/sign-up/email";
          if (isEmailEntryPath && email) {
            const check = checkEmployerEmail(email);
            if (!check.allowed) {
              throw new APIError("BAD_REQUEST", {
                message: check.message ?? EMPLOYER_EMAIL_MESSAGE,
              });
            }
            if (
              appUser?.account_type === "seeker" &&
              (path === "/sign-in/email-otp" || path === "/sign-in/email" || path === "/sign-up/email")
            ) {
              throw new APIError("BAD_REQUEST", {
                message: EMPLOYER_CANDIDATE_ACCOUNT_MESSAGE,
              });
            }
          }
        }

        // Suspended app users must not be able to establish a new session.
        // Their existing sessions are also rejected by getAppUser().
        if (appUser && !appUser.isActive) {
          if (path === "/email-otp/send-verification-otp") return;
          if (path === "/sign-in/email-otp" || path === "/sign-in/email") {
            throw new APIError("UNAUTHORIZED", { message: "Invalid email or password" });
          }
        }

        // Legacy recruiter rows may predate the company-email policy. Do not
        // send them a new code or let them create a session on any flow.
        if (appUser?.account_type === "recruiter" && !checkEmployerEmail(appUser.email).allowed) {
          if (path === "/email-otp/send-verification-otp") return;
          if (path === "/sign-in/email-otp" || path === "/sign-in/email") {
            throw new APIError("UNAUTHORIZED", { message: EMPLOYER_EMAIL_MESSAGE });
          }
        }
      }),
    },
    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            // Legacy recruiter rows may predate the company-email policy.
            // Block new sessions for them on every flow, not just the employer
            // screen, so candidate Google/OTP sign-in cannot bypass it.
            const appUser = await appUserByAuthId(ctx, session.userId);
            if (appUser?.account_type === "recruiter" && !checkEmployerEmail(appUser.email).allowed) {
              throw new APIError("UNAUTHORIZED", { message: EMPLOYER_EMAIL_MESSAGE });
            }
          },
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
        sendVerificationOTP: async ({ email, otp }, endpointCtx) => {
          // Return the same success response to non-admin email addresses, but
          // never send them an admin-origin code. This avoids turning the admin
          // login into a user-enumeration or email-spam surface.
          const appUser = await appUserByEmail(ctx, email);
          if (appUser && !appUser.isActive) return;
          if (appUser?.account_type === "recruiter" && !checkEmployerEmail(appUser.email).allowed) return;
          if (isAdminAuthRequest(endpointCtx) && (!appUser || appUser.role !== "admin")) return;
          if (isEmployerAuthRequest(endpointCtx) && !checkEmployerEmail(email).allowed) return;
          await sendOTPEmail({ to: email, otp });
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

export const findAppUserByEmail = internalQuery({
  args: { email: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.trim().toLowerCase()))
      .unique();
  },
});

export const findAppUserByAuthId = internalQuery({
  args: { authId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", args.authId))
      .unique();
  },
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
