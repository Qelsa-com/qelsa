import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const openRouter = process.env.OPENROUTER_API_KEY
  ? createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
      appName: "Qelsa",
      appUrl: process.env.SITE_URL ?? "http://localhost:3000",
    })
  : null;

export const AI_AGENT_MODEL = process.env.AI_AGENT_MODEL ?? "openai/gpt-4o-mini";

export function requireOpenRouter() {
  if (!openRouter) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured. Set it on the Convex deployment before using AI Match.",
    );
  }
  return openRouter;
}
