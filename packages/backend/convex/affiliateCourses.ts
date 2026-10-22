import { generateText } from "ai";
import { v } from "convex/values";
import { action } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { adminMutation, adminQuery } from "./lib/customFunctions";
import { AI_AGENT_MODEL, createAgentChatModel, openRouter } from "./lib/ai";
import { parseJsonObject } from "./lib/parsedProfile";

const PLATFORMS = ["Udemy", "Coursera", "DataCamp", "Udacity", "edX", "LinkedIn Learning", "Other"];

async function requireAdmin(ctx: ActionCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Admin sign-in required.");
  const admin: any = await ctx.runQuery(internal.billingCustomers.getUserByAuthId, { authId: identity.subject });
  if (!admin || admin.role !== "admin" || !admin.isActive) throw new Error("Admin access required.");
  return admin;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function stringList(value: unknown, limit = 12) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean))].slice(0, limit);
}

function booleanValue(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchPageMetadata(url: string) {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (compatible; QelsaBot/1.0; +https://qelsa.ai)" },
    });
    if (!response.ok) return null;
    const html = (await response.text()).slice(0, 200_000);
    const meta = (pattern: RegExp) => {
      const match = html.match(pattern);
      return match?.[1] ? decodeEntities(match[1]) : "";
    };
    const title =
      meta(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
      meta(/<title[^>]*>([^<]+)<\/title>/i);
    const description =
      meta(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
      meta(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    return title || description ? { title, description } : null;
  } catch {
    return null;
  }
}

export const listManaged = adminQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const rows = await ctx.db.query("affiliate_courses").order("desc").take(200);
    return rows.map((row) => ({
      id: row._id,
      provider: row.provider,
      title: row.title,
      description: row.description,
      url: row.url,
      skills: row.skills,
      level: row.level,
      duration: row.duration,
      free: row.free,
      status: row.status,
      ai_filled: row.ai_filled,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  },
});

export const listPlatforms = adminQuery({
  args: {},
  returns: v.any(),
  handler: async () => PLATFORMS,
});

export const prefill = action({
  args: {
    provider: v.string(),
    url: v.string(),
    hint: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const url = args.url.trim();
    if (!/^https?:\/\//i.test(url)) throw new Error("Enter a full course URL starting with https://");

    const page = await fetchPageMetadata(url);
    let generated: Record<string, unknown> = {};
    if (openRouter) {
      const prompt = `You are filling metadata for a partner course Qelsa will recommend to candidates.

Platform: ${args.provider}
Course URL: ${url}
Page title: ${page?.title || "unknown"}
Page description: ${page?.description || "unknown"}
Extra context: ${args.hint?.trim() || "none"}

Write concise, accurate metadata for a course card. Do not invent details that are not supported by the URL or context. Keep title under 90 characters and description under 160 characters. Skills must be short, concrete skill names (max 6). Return ONLY valid JSON:
{"title":"...","description":"...","skills":["..."],"level":"Beginner|Intermediate|Advanced","duration":"...","free":false}`;
      try {
        const response = await generateText({
          model: createAgentChatModel("low"),
          prompt,
          temperature: 0.2,
          maxRetries: 2,
          timeout: { totalMs: 60_000 },
        });
        generated = asRecord(parseJsonObject(response.text));
      } catch (error) {
        console.warn("[affiliateCourses] prefill AI failed", error);
      }
    }

    const fallbackTitle = page?.title || decodeURIComponent(url.split("/").filter(Boolean).pop() ?? "Partner course").replace(/[-_]+/g, " ");
    return {
      provider: args.provider,
      url,
      title: stringValue(generated.title, fallbackTitle).slice(0, 160),
      description: stringValue(generated.description, page?.description ?? "").slice(0, 400),
      skills: stringList(generated.skills, 8),
      level: stringValue(generated.level, "Intermediate").slice(0, 40),
      duration: stringValue(generated.duration, "Self-paced").slice(0, 60),
      free: booleanValue(generated.free, false),
      model: AI_AGENT_MODEL,
    };
  },
});

export const create = adminMutation({
  args: {
    provider: v.string(),
    title: v.string(),
    description: v.string(),
    url: v.string(),
    skills: v.array(v.string()),
    level: v.string(),
    duration: v.string(),
    free: v.boolean(),
    aiFilled: v.optional(v.boolean()),
    publish: v.optional(v.boolean()),
  },
  returns: v.object({ id: v.id("affiliate_courses") }),
  handler: async (ctx, args) => {
    const url = args.url.trim();
    if (!/^https?:\/\//i.test(url)) throw new Error("Enter a full course URL starting with https://");
    const title = args.title.trim().slice(0, 160);
    if (!title) throw new Error("A title is required.");
    const now = Date.now();
    const id = await ctx.db.insert("affiliate_courses", {
      provider: args.provider.trim().slice(0, 60) || "Other",
      title,
      description: args.description.trim().slice(0, 400),
      url,
      skills: args.skills.map((skill) => skill.trim()).filter(Boolean).slice(0, 12),
      level: args.level.trim().slice(0, 40) || "Intermediate",
      duration: args.duration.trim().slice(0, 60) || "Self-paced",
      free: args.free,
      status: args.publish === false ? "draft" : "published",
      ai_filled: Boolean(args.aiFilled),
      created_by: ctx.user._id,
      created_at: now,
      updated_at: now,
    });
    await ctx.db.insert("admin_audit_log", {
      admin_user_id: ctx.user._id,
      action: "affiliate_course.created",
      after: { provider: args.provider, title },
      created_at: now,
    });
    return { id };
  },
});

export const setStatus = adminMutation({
  args: {
    courseId: v.id("affiliate_courses"),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found.");
    await ctx.db.patch(course._id, { status: args.status, updated_at: Date.now() });
    await ctx.db.insert("admin_audit_log", {
      admin_user_id: ctx.user._id,
      action: "affiliate_course.status_changed",
      before: { status: course.status },
      after: { status: args.status },
      created_at: Date.now(),
    });
    return null;
  },
});
