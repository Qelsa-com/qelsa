import { createDodoWebhookHandler } from "@dodopayments/convex";
import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();
authComponent.registerRoutes(http, createAuth, { cors: true });

function webhookTimestamp(value: unknown) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof value === "string") return new Date(value).getTime();
  return Date.now();
}

async function handleDodoSubscriptionEvent(ctx: any, payload: any) {
  const data = payload?.data;
  if (!data?.subscription_id) return;

  const eventAt = webhookTimestamp(payload.timestamp);
  const subscriptionId = String(data.subscription_id);
  const eventKey = `${String(payload.type)}:${subscriptionId}:${eventAt}`;

  await ctx.runMutation(internal.billing.upsertSubscriptionFromWebhook, {
    eventKey,
    type: String(payload.type ?? "unknown"),
    eventAt,
    subscriptionId,
    customerId: String(data.customer?.customer_id ?? ""),
    customerEmail: String(data.customer?.email ?? ""),
    customerName: data.customer?.name ? String(data.customer.name) : undefined,
    productId: String(data.product_id ?? ""),
    status: String(data.status ?? "failed"),
    quantity: Number(data.quantity ?? 1),
    currency: String(data.currency ?? ""),
    recurringAmount: Number(data.recurring_pre_tax_amount ?? 0),
    currentPeriodStart: data.previous_billing_date ? webhookTimestamp(data.previous_billing_date) : undefined,
    currentPeriodEnd: data.next_billing_date ? webhookTimestamp(data.next_billing_date) : undefined,
    cancelAtPeriodEnd: Boolean(data.cancel_at_next_billing_date),
    cancelledAt: data.cancelled_at ? webhookTimestamp(data.cancelled_at) : undefined,
    metadata: data.metadata ?? {},
  });
}

http.route({
  path: "/dodopayments-webhook",
  method: "POST",
  handler: createDodoWebhookHandler({
    onSubscriptionActive: handleDodoSubscriptionEvent,
    onSubscriptionOnHold: handleDodoSubscriptionEvent,
    onSubscriptionRenewed: handleDodoSubscriptionEvent,
    onSubscriptionPlanChanged: handleDodoSubscriptionEvent,
    onSubscriptionCancelled: handleDodoSubscriptionEvent,
    onSubscriptionFailed: handleDodoSubscriptionEvent,
    onSubscriptionExpired: handleDodoSubscriptionEvent,
    onSubscriptionUpdated: handleDodoSubscriptionEvent,
    onSubscriptionPaused: handleDodoSubscriptionEvent,
    onSubscriptionUnpaused: handleDodoSubscriptionEvent,
  }),
});

const autofillCors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

http.route({
  path: "/api/agent/autofill",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: autofillCors })),
});

http.route({
  path: "/api/agent/autofill",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const token = new URL(request.url).searchParams.get("token")?.trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing autofill token." }), {
        status: 400,
        headers: { ...autofillCors, "Content-Type": "application/json" },
      });
    }
    let loaded: any = null;
    try {
      loaded = await ctx.runMutation(internal.agentAutofill.consumePacket, {
        tokenId: token as never,
      });
    } catch {
      loaded = null;
    }
    if (!loaded) {
      return new Response(JSON.stringify({ error: "This autofill link is invalid or has expired." }), {
        status: 410,
        headers: { ...autofillCors, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify(loaded.packet), {
      status: 200,
      headers: { ...autofillCors, "Content-Type": "application/json" },
    });
  }),
});

export default http;
