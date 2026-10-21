import { handler } from "@/lib/auth-server";

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

export const GET = (request: Request) =>
  allowed(request) ? handler.GET(request) : Promise.resolve(reject());

export const POST = (request: Request) =>
  allowed(request) ? handler.POST(request) : Promise.resolve(reject());
