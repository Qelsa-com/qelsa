import { createOpenRouter, type OpenRouterChatSettings } from "@openrouter/ai-sdk-provider";

export const openRouter = process.env.OPENROUTER_API_KEY
  ? createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
      appName: "Qelsa",
      appUrl: process.env.SITE_URL ?? "http://localhost:3000",
    })
  : null;

export const AI_AGENT_MODEL = process.env.AI_AGENT_MODEL ?? "openai/gpt-4o-mini";

const REASONING_EFFORTS = ["xhigh", "high", "medium", "low", "minimal", "none"] as const;
type ReasoningEffort = (typeof REASONING_EFFORTS)[number];

/**
 * Explicit operator override. Unset means each call site chooses a default
 * that fits its task; "off" disables reasoning for models that support it.
 */
function configuredReasoningEffort(): ReasoningEffort | undefined {
  const raw = process.env.AI_AGENT_REASONING_EFFORT?.trim().toLowerCase();
  if (raw === "off" || raw === "disabled" || raw === "false") return undefined;
  if (raw && (REASONING_EFFORTS as readonly string[]).includes(raw)) {
    return raw as ReasoningEffort;
  }
  return undefined;
}

export const AI_AGENT_REASONING_EFFORT = configuredReasoningEffort();

function modelSupportsReasoning(model: string) {
  return /(?:gemini|claude|gpt-5|(?:^|\/)o[1-9]|grok-4|deepseek-r)/i.test(model);
}

/** Optional model override for task-specific writers (for example the blog agent). */
export function createChatModel(model: string, defaultEffort?: ReasoningEffort) {
  const settings: OpenRouterChatSettings = {
    provider: { sort: "throughput", allow_fallbacks: true },
  };
  const effort =
    AI_AGENT_REASONING_EFFORT ?? (modelSupportsReasoning(model) ? defaultEffort : undefined);
  if (effort) {
    settings.reasoning = { effort };
  }
  return requireOpenRouter().chat(model, settings);
}

/**
 * The OpenRouter provider emits a direct console.warn for unsigned Gemini /
 * Anthropic reasoning details. It intentionally skips that warning whenever
 * AI_SDK_LOG_WARNINGS is a function (see OpenRouterTeam/ai-sdk-provider#423 and
 * #418). Registering a forwarder suppresses that noisy, non-fatal message while
 * still surfacing every warning emitted by the AI SDK itself.
 */
type AISDKWarningLogger = (options: {
  warnings?: unknown[];
  provider?: string;
  model?: string;
}) => void;

const warningGlobal = globalThis as typeof globalThis & {
  AI_SDK_LOG_WARNINGS?: false | AISDKWarningLogger;
};

if (warningGlobal.AI_SDK_LOG_WARNINGS === undefined) {
  warningGlobal.AI_SDK_LOG_WARNINGS = (options: {
    warnings?: unknown[];
    provider?: string;
    model?: string;
  }) => {
    const prefix = ["[ai-sdk]", options.provider, options.model].filter(Boolean).join(" ");
    for (const warning of options.warnings ?? []) {
      console.warn(prefix, warning);
    }
  };
}

/**
 * Chat model used by the agent and its writing helpers. Prefer the fastest
 * healthy provider so interactive turns do not sit behind a slow upstream.
 *
 * `defaultEffort` is task-specific: the main agent gets "medium" because it
 * plans across tools, while one-shot writing gets "low" because it does not
 * need a long planning pass. The environment override wins for both.
 */
export function createAgentChatModel(defaultEffort?: ReasoningEffort) {
  return createChatModel(AI_AGENT_MODEL, defaultEffort);
}

export function requireOpenRouter() {
  if (!openRouter) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured. Set it on the Convex deployment before using AI Match.",
    );
  }
  return openRouter;
}
