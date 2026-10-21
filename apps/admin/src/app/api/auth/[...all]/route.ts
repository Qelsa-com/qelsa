import { handler } from "@/lib/auth-server";

const ADMIN_FLOW_HEADER = "x-qelsa-admin-auth";

/**
 * The admin auth proxy is deliberately not a general Better Auth surface.
 * Only the routes used by the admin login/session flow are forwarded; this
 * keeps sign-up, password reset, account deletion, social callbacks, and other
 * web-app auth flows off the admin origin.
 */
const ALLOWED_PATHS = new Set([
  "/get-session",
  "/sign-in/email",
  "/sign-in/email-otp",
  "/email-otp/send-verification-otp",
  "/sign-out",
  "/ok",
]);

function allowed(request: Request) {
  const path = new URL(request.url).pathname.replace(/^\/api\/auth/, "");
  if (path.startsWith("/convex/")) return true;
  return ALLOWED_PATHS.has(path);
}

function reject() {
  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Stamp every request that actually came through the admin origin. The Convex
 * auth hook treats this as an admin-flow request even if ADMIN_SITE_URL is
 * missing or points at a different host after a domain move.
 */
async function toAdminRequest(request: Request) {
  const headers = new Headers(request.headers);
  headers.set(ADMIN_FLOW_HEADER, "1");

  const method = request.method.toUpperCase();
  const init: RequestInit = {
    method,
    headers,
    redirect: "manual",
  };

  if (method !== "GET" && method !== "HEAD") {
    const body = await request.arrayBuffer();
    if (body.byteLength > 0) init.body = body;
  }

  return new Request(request.url, init);
}

export async function GET(request: Request) {
  if (!allowed(request)) return reject();
  return handler.GET(await toAdminRequest(request));
}

export async function POST(request: Request) {
  if (!allowed(request)) return reject();
  return handler.POST(await toAdminRequest(request));
}
