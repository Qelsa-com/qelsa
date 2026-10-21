/**
 * Out-of-app delivery for proactive agent briefs.
 *
 * Email uses the existing Cloudflare/Resend sender in lib/email. Web Push uses
 * the same brief payload, and both paths are idempotent: a brief is only sent
 * once per channel.
 */

import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { sendEmail } from "./lib/email";

function siteUrl() {
  return (process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function briefJobs(ctx: { db: any }, brief: Doc<"agent_briefs">) {
  const jobs = [];
  for (const id of brief.job_ids.slice(0, 6)) {
    const job = await ctx.db.get(id);
    if (!job) continue;
    jobs.push({
      title: job.title ?? "Role",
      company: job.company_name ?? "",
      url: `${siteUrl()}/jobs/${job._id}`,
    });
  }
  return jobs;
}

export const loadBriefForEmail = internalQuery({
  args: { briefId: v.id("agent_briefs") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const brief = await ctx.db.get(args.briefId);
    if (!brief) return null;
    const user = await ctx.db.get(brief.user_id);
    if (!user?.email) return null;
    const search = brief.saved_search_id ? await ctx.db.get(brief.saved_search_id) : null;
    if (search && search.email_alerts === false) return null;
    if (brief.email_sent_at) return null;
    return {
      brief,
      email: user.email,
      name: user.name ?? null,
      jobs: await briefJobs(ctx, brief),
    };
  },
});

export const emailBrief = internalAction({
  args: { briefId: v.id("agent_briefs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const loaded: any = await ctx.runQuery(internal.agentNotifications.loadBriefForEmail, {
      briefId: args.briefId,
    });
    if (!loaded) return null;
    const { brief, email, name, jobs } = loaded;
    const greeting = name ? `Hi ${name.split(/\s+/)[0]},` : "Hi there,";
    const jobLines = jobs
      .map(
        (job: any) =>
          `<li style="margin:8px 0"><a href="${job.url}" style="color:#0ea5e9;text-decoration:none;font-weight:600">${escapeHtml(job.title)}</a>${job.company ? `<span style="color:#64748b"> · ${escapeHtml(job.company)}</span>` : ""}</li>`,
      )
      .join("");
    const html = `<!doctype html><html><body style="margin:0;background:#0b0b14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e5e7eb">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="border:1px solid rgba(255,255,255,.1);border-radius:16px;background:#121220;padding:24px">
      <p style="margin:0 0 6px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#7dd3fc">Qelsa Agent</p>
      <h1 style="margin:0 0 8px;font-size:20px;line-height:1.3;color:#ffffff">${escapeHtml(brief.title)}</h1>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#94a3b8">${escapeHtml(brief.summary)}</p>
      ${jobLines ? `<ul style="margin:0 0 20px;padding-left:18px;font-size:14px;line-height:1.6">${jobLines}</ul>` : ""}
      <a href="${siteUrl()}/agent" style="display:inline-block;border-radius:10px;background:linear-gradient(90deg,#623dd6,#be2680);padding:11px 16px;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none">Review in Qelsa Agent</a>
      <p style="margin:20px 0 0;font-size:11px;line-height:1.6;color:#64748b">${escapeHtml(greeting)} You are receiving this because you saved a job search in Qelsa. You can remove the search or turn off email alerts in the Agent.</p>
    </div>
  </div>
</body></html>`;
    const result = await sendEmail({
      to: email,
      subject: `${brief.title} — Qelsa Agent`,
      html,
      text: `${brief.title}\n\n${brief.summary}\n\n${jobs.map((job: any) => `${job.title}${job.company ? ` at ${job.company}` : ""}: ${job.url}`).join("\n")}\n\nReview: ${siteUrl()}/agent`,
    });
    if (!result.success) {
      console.warn("[agentNotifications] email delivery failed", result.error);
      return null;
    }
    await ctx.runMutation(internal.agentNotifications.markBriefNotified, {
      briefId: args.briefId,
      channel: "email",
    });
    return null;
  },
});

export const markBriefNotified = internalMutation({
  args: { briefId: v.id("agent_briefs"), channel: v.union(v.literal("email"), v.literal("push")) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const brief = await ctx.db.get(args.briefId);
    if (!brief) return null;
    if (args.channel === "email" && !brief.email_sent_at) {
      await ctx.db.patch(brief._id, { email_sent_at: Date.now() });
    }
    if (args.channel === "push" && !brief.push_sent_at) {
      await ctx.db.patch(brief._id, { push_sent_at: Date.now() });
    }
    return null;
  },
});

/** Reads the brief payload for the push sender without exposing it publicly. */
export const loadBriefForPush = internalQuery({
  args: { briefId: v.id("agent_briefs") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const brief = await ctx.db.get(args.briefId);
    if (!brief) return null;
    if (brief.push_sent_at) return null;
    const search = brief.saved_search_id ? await ctx.db.get(brief.saved_search_id) : null;
    if (search && search.push_alerts === false) return null;
    return {
      brief,
      jobs: await briefJobs(ctx, brief),
    };
  },
});

/** Push subscriptions for one user. Kept in a separate table, one row per device. */
export const pushSubscriptionsForUser = internalQuery({
  args: { userId: v.id("users") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agent_push_subscriptions")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .take(20);
  },
});

export const getVapidPublicKey = authedQuery({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async () => process.env.VAPID_PUBLIC_KEY ?? null,
});

export const savePushSubscription = authedMutation({
  args: {
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const endpoint = args.endpoint.trim().slice(0, 2000);
    if (!endpoint) throw new Error("Push endpoint is missing.");
    const existing = await ctx.db
      .query("agent_push_subscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        user_id: ctx.user._id,
        p256dh: args.p256dh.slice(0, 500),
        auth: args.auth.slice(0, 200),
        last_used_at: Date.now(),
      });
    } else {
      const count = await ctx.db
        .query("agent_push_subscriptions")
        .withIndex("by_user", (q) => q.eq("user_id", ctx.user._id))
        .take(20);
      if (count.length >= 10) {
        const oldest = count.sort((a, b) => a.created_at - b.created_at).slice(0, count.length - 9);
        for (const row of oldest) await ctx.db.delete(row._id);
      }
      await ctx.db.insert("agent_push_subscriptions", {
        user_id: ctx.user._id,
        endpoint,
        p256dh: args.p256dh.slice(0, 500),
        auth: args.auth.slice(0, 200),
        created_at: Date.now(),
      });
    }
    return null;
  },
});

export const removePushSubscription = authedMutation({
  args: { endpoint: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("agent_push_subscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();
    if (row && row.user_id === ctx.user._id) await ctx.db.delete(row._id);
    return null;
  },
});

export const removePushSubscriptionByEndpoint = internalMutation({
  args: { endpoint: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("agent_push_subscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();
    if (row) await ctx.db.delete(row._id);
    return null;
  },
});

export type NotificationJob = { title: string; company: string; url: string };
