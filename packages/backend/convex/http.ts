import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();
authComponent.registerRoutes(http, createAuth, { cors: true });

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
