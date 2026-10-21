import { handler } from "@/lib/auth-server";

const EMPLOYER_FLOW_HEADER = "x-qelsa-auth-flow";

/**
 * Same Better Auth backend as the candidate flow, but every request is stamped
 * with the employer flow header. The Convex auth hook uses that header to
 * reject personal/disposable email domains before an OTP is sent or a session
 * is created.
 *
 * Keep this proxy a proxy: redirects, cookies, and query strings must be passed
 * through unchanged.
 */
async function toAuthRequest(request: Request) {
  const requestUrl = new URL(request.url);
  const suffix = requestUrl.pathname.replace(/^\/api\/employer-auth/, "");
  const target = new URL(`/api/auth${suffix}${requestUrl.search}`, requestUrl.origin);
  const headers = new Headers(request.headers);
  headers.set(EMPLOYER_FLOW_HEADER, "employer");

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

  return new Request(target, init);
}

export async function GET(request: Request) {
  return handler.GET(await toAuthRequest(request));
}

export async function POST(request: Request) {
  return handler.POST(await toAuthRequest(request));
}
