/**
 * External application autofill packets.
 *
 * The Qelsa page creates a short-lived, one-time packet. A bookmarklet on the
 * external application page consumes it and fills the fields it recognizes.
 * The packet is exposed only through the one-time HTTP route in http.ts.
 */

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation, internalQuery } from "./_generated/server";
import { clipPlainText } from "./lib/skillMatch";

const PACKET_TTL_MS = 20 * 60 * 1000;

async function requireUser(ctx: any, authId: string) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_authId", (q: any) => q.eq("authId", authId))
    .unique();
  if (!user) throw new Error("Finish your Qelsa profile first.");
  return user;
}

export const createPacketInternal = internalMutation({
  args: {
    authId: v.string(),
    jobId: v.id("jobs"),
    coverLetter: v.optional(v.string()),
    resumeUrl: v.optional(v.string()),
    resumeTitle: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.authId);
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("That job no longer exists.");
    if (!job.application_url) throw new Error("This job applies inside Qelsa; no external packet is needed.");

    const city = user.city_id ? await ctx.db.get(user.city_id) : null;
    const [skillRows, experienceRows, educationRows] = await Promise.all([
      ctx.db.query("user_skills").withIndex("by_user", (q) => q.eq("user_id", user._id)).take(40),
      ctx.db.query("experiences").withIndex("by_user", (q) => q.eq("user_id", user._id)).take(12),
      ctx.db.query("educations").withIndex("by_user", (q) => q.eq("user_id", user._id)).take(8),
    ]);
    const skills: string[] = [];
    for (const row of skillRows) {
      const skill = await ctx.db.get(row.skill_id);
      if (skill) skills.push(skill.name);
    }
    experienceRows.sort((a, b) => b.start_date - a.start_date);
    const experiences = [];
    for (const row of experienceRows) {
      const [company, title] = await Promise.all([
        row.company_id ? ctx.db.get(row.company_id) : null,
        row.job_title_id ? ctx.db.get(row.job_title_id) : null,
      ]);
      experiences.push({
        title: title?.name ?? "Role",
        company: company?.name ?? "Company",
        start_date: row.start_date,
        end_date: row.end_date ?? null,
        is_current: row.is_current ?? false,
        description: clipPlainText(row.description, 500),
        bullets: (row.responsibilities ?? []).slice(0, 6).map((item) => item.title),
      });
    }
    educationRows.sort((a, b) => b.start_year - a.start_year);
    const educations = [];
    for (const row of educationRows) {
      const [degree, college, field] = await Promise.all([
        row.degree_id ? ctx.db.get(row.degree_id) : null,
        row.college_id ? ctx.db.get(row.college_id) : null,
        row.field_of_study_id ? ctx.db.get(row.field_of_study_id) : null,
      ]);
      educations.push({
        degree: degree?.name ?? "",
        college: college?.name ?? "",
        field: field?.name ?? "",
        start_year: row.start_year,
        end_year: row.end_year ?? null,
      });
    }
    const nameParts = (user.name ?? "").trim().split(/\s+/).filter(Boolean);
    const packet = {
      name: user.name ?? "",
      first_name: nameParts[0] ?? "",
      last_name: nameParts.length > 1 ? nameParts.slice(1).join(" ") : "",
      email: user.email,
      phone: user.phone ?? "",
      location: (city as { name?: string } | null)?.name ?? "",
      headline: user.headline ?? "",
      summary: clipPlainText(user.professional_summary ?? user.about, 1200),
      linkedin_url: user.linkedin_url ?? "",
      github_url: user.github_url ?? "",
      website: user.website ?? "",
      skills: skills.slice(0, 40),
      experiences,
      educations,
      cover_letter: args.coverLetter?.trim().slice(0, 6000) ?? "",
      resume_url: args.resumeUrl ?? "",
      resume_title: args.resumeTitle ?? "",
      job: {
        job_id: job._id,
        title: job.title ?? "",
        company: job.company_name ?? "",
        application_url: job.application_url,
      },
    };
    const token = await ctx.db.insert("agent_autofill_tokens", {
      user_id: user._id,
      job_id: job._id,
      packet,
      created_at: Date.now(),
      expires_at: Date.now() + PACKET_TTL_MS,
    });
    return {
      token,
      expires_at: Date.now() + PACKET_TTL_MS,
      job_title: job.title ?? "this role",
      company: job.company_name ?? null,
    };
  },
});

/** Called by the HTTP route. Consumes the token atomically. */
export const consumePacket = internalMutation({
  args: { tokenId: v.id("agent_autofill_tokens") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.tokenId);
    if (!row || row.used_at || row.expires_at < Date.now()) return null;
    await ctx.db.patch(row._id, { used_at: Date.now() });
    return { packet: row.packet, expires_at: row.expires_at };
  },
});

/** Keeps the short-lived token table from growing without bound. */
export const cleanupExpired = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("agent_autofill_tokens")
      .withIndex("by_expires_at", (q) => q.lt("expires_at", Date.now() - 60 * 60 * 1000))
      .take(200);
    for (const row of rows) await ctx.db.delete(row._id);
    return null;
  },
});

/** Exposed for a lightweight "is this token still valid?" check if needed. */
export const packetStatus = internalQuery({
  args: { tokenId: v.id("agent_autofill_tokens") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.tokenId);
    if (!row) return null;
    return {
      valid: !row.used_at && row.expires_at >= Date.now(),
      expires_at: row.expires_at,
      job_id: row.job_id as Id<"jobs">,
    };
  },
});
