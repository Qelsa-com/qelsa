"use node";

/**
 * Web Push delivery runs in the Node runtime because web-push needs crypto and
 * HTTPS sockets. Keep this file action-only; queries and mutations live in
 * agentNotifications.ts in the default runtime.
 */

import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import webpush from "web-push";

function siteUrl() {
  return (process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export const pushBrief = internalAction({
  args: { briefId: v.id("agent_briefs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT ?? "mailto:no-reply@qelsa.com";
    if (!publicKey || !privateKey) return null;
    const loaded: any = await ctx.runQuery(internal.agentNotifications.loadBriefForPush, {
      briefId: args.briefId,
    });
    if (!loaded) return null;
    const subscriptions: Doc<"agent_push_subscriptions">[] = await ctx.runQuery(
      internal.agentNotifications.pushSubscriptionsForUser,
      { userId: loaded.brief.user_id },
    );
    if (!subscriptions.length) return null;
    webpush.setVapidDetails(subject, publicKey, privateKey);
    const payload = JSON.stringify({
      title: loaded.brief.title,
      body: loaded.brief.summary.slice(0, 180),
      url: `${siteUrl()}/agent`,
      tag: `qelsa-brief-${args.briefId}`,
    });
    let delivered = 0;
    for (const subscription of subscriptions.slice(0, 10)) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          payload,
          { TTL: 60 * 60 * 24 },
        );
        delivered += 1;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await ctx.runMutation(internal.agentNotifications.removePushSubscriptionByEndpoint, {
            endpoint: subscription.endpoint,
          });
        } else {
          console.warn("[agentNotifications] push delivery failed", status ?? error);
        }
      }
    }
    if (delivered > 0) {
      await ctx.runMutation(internal.agentNotifications.markBriefNotified, {
        briefId: args.briefId,
        channel: "push",
      });
    }
    return null;
  },
});
