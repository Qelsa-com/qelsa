/**
 * Candidate Agent memory.
 *
 * The profile is the source of truth for structured facts (skills, experience,
 * preferences). Memory is a small, user-editable layer for durable things the
 * candidate says in conversation that do not belong in the profile — for
 * example "I want remote-first fintech roles" or "I freeze on system design
 * interviews." Keeping it separate makes it easy to inspect and delete.
 */

import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, internalQuery } from "./_generated/server";
import { authedMutation, authedQuery } from "./lib/customFunctions";

export const MAX_CANDIDATE_MEMORIES = 40;
const MAX_MEMORY_LENGTH = 240;

export const memoryCategoryValidator = v.union(
  v.literal("preference"),
  v.literal("constraint"),
  v.literal("goal"),
  v.literal("experience"),
  v.literal("coaching"),
  v.literal("other"),
);

type MemoryCategory =
  | "preference"
  | "constraint"
  | "goal"
  | "experience"
  | "coaching"
  | "other";

function cleanMemoryText(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, MAX_MEMORY_LENGTH);
}

function normalizeMemory(text: string) {
  return cleanMemoryText(text).toLowerCase();
}

function isExpired(row: Doc<"agent_memories">, now = Date.now()) {
  return row.expires_at != null && row.expires_at <= now;
}

async function activeMemories(ctx: { db: any }, userId: Id<"users">) {
  const rows = await ctx.db
    .query("agent_memories")
    .withIndex("by_user_and_updated", (q: any) => q.eq("user_id", userId))
    .order("desc")
    .take(MAX_CANDIDATE_MEMORIES + 20);
  return (rows as Doc<"agent_memories">[]).filter((row) => !isExpired(row)).slice(0, MAX_CANDIDATE_MEMORIES);
}

async function candidateForAuth(ctx: { db: any }, authId: string) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_authId", (q: any) => q.eq("authId", authId))
    .unique();
  if (!user) throw new Error("Finish setting up your Qelsa profile first.");
  if (user.account_type === "recruiter") {
    throw new Error("Agent memory is only available on candidate accounts.");
  }
  return user as Doc<"users">;
}

function memoryView(row: Doc<"agent_memories">) {
  return {
    memory_id: row._id,
    text: row.text,
    category: row.category,
    source: row.source,
    created_at: row.created_at,
    updated_at: row.updated_at,
    expires_at: row.expires_at ?? null,
  };
}

async function upsertMemory(
  ctx: { db: any },
  userId: Id<"users">,
  args: {
    text: string;
    category?: MemoryCategory;
    source: "user" | "agent";
    expiresInDays?: number;
  },
) {
  const text = cleanMemoryText(args.text);
  if (text.length < 3) throw new Error("Memory is too short.");
  const normalized = normalizeMemory(text);
  const now = Date.now();
  const expiresAt =
    args.expiresInDays && args.expiresInDays > 0
      ? now + Math.min(Math.max(Math.round(args.expiresInDays), 1), 365) * 86_400_000
      : undefined;

  const existing = await ctx.db
    .query("agent_memories")
    .withIndex("by_user_and_normalized", (q: any) => q.eq("user_id", userId).eq("normalized", normalized))
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, {
      text,
      category: args.category ?? existing.category,
      source: args.source,
      updated_at: now,
      expires_at: expiresAt,
    });
    return { ...existing, text, category: args.category ?? existing.category, updated_at: now, expires_at: expiresAt };
  }

  const current = await activeMemories(ctx, userId);
  if (current.length >= MAX_CANDIDATE_MEMORIES) {
    throw new Error(
      `Agent memory is full (${MAX_CANDIDATE_MEMORIES} items). Remove an item in Agent memory settings, then try again.`,
    );
  }

  const id = await ctx.db.insert("agent_memories", {
    user_id: userId,
    text,
    normalized,
    category: args.category ?? "other",
    source: args.source,
    created_at: now,
    updated_at: now,
    ...(expiresAt ? { expires_at: expiresAt } : {}),
  });
  return {
    _id: id,
    user_id: userId,
    text,
    normalized,
    category: args.category ?? "other",
    source: args.source,
    created_at: now,
    updated_at: now,
    expires_at: expiresAt,
  } as Doc<"agent_memories">;
}

/** Prompt-facing read. Returns only the facts, never internal ids. */
export const listMemoriesForPrompt = internalQuery({
  args: { authId: v.string() },
  returns: v.array(
    v.object({
      text: v.string(),
      category: memoryCategoryValidator,
    }),
  ),
  handler: async (ctx, args) => {
    try {
      const user = await candidateForAuth(ctx, args.authId);
      const rows = await activeMemories(ctx, user._id);
      return rows.map((row) => ({ text: row.text, category: row.category }));
    } catch {
      // A missing/incomplete account should not block a reply.
      return [];
    }
  },
});

/** Tool-facing read, including ids so the Agent can forget a specific item. */
export const listMemoriesInternal = internalQuery({
  args: { authId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await candidateForAuth(ctx, args.authId);
    const rows = await activeMemories(ctx, user._id);
    return {
      count: rows.length,
      max: MAX_CANDIDATE_MEMORIES,
      memories: rows.map(memoryView),
    };
  },
});

export const rememberMemoryInternal = internalMutation({
  args: {
    authId: v.string(),
    text: v.string(),
    category: v.optional(memoryCategoryValidator),
    expiresInDays: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await candidateForAuth(ctx, args.authId);
    const row = await upsertMemory(ctx, user._id, {
      text: args.text,
      category: args.category as MemoryCategory | undefined,
      source: "agent",
      expiresInDays: args.expiresInDays,
    });
    return {
      remembered: true,
      memory: memoryView(row),
      note: "Saved to the candidate's editable Agent memory.",
    };
  },
});

export const forgetMemoryInternal = internalMutation({
  args: {
    authId: v.string(),
    memoryId: v.optional(v.id("agent_memories")),
    text: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await candidateForAuth(ctx, args.authId);
    if (!args.memoryId && !args.text?.trim()) {
      throw new Error("Provide a memory id or the text to forget.");
    }

    const removed: string[] = [];
    if (args.memoryId) {
      const row = await ctx.db.get(args.memoryId);
      if (!row || row.user_id !== user._id) throw new Error("Memory not found.");
      removed.push(row.text);
      await ctx.db.delete(row._id);
    } else {
      const needle = normalizeMemory(args.text ?? "");
      const rows = await activeMemories(ctx, user._id);
      const matches = rows
        .filter((row) => row.normalized === needle || row.normalized.includes(needle))
        .slice(0, 5);
      for (const row of matches) {
        removed.push(row.text);
        await ctx.db.delete(row._id);
      }
    }

    return {
      removed: removed.length,
      texts: removed,
      note: removed.length ? undefined : "No matching memory was found.",
    };
  },
});

export const listMemories = authedQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    if (ctx.user.account_type === "recruiter") return { count: 0, max: MAX_CANDIDATE_MEMORIES, memories: [] };
    const rows = await activeMemories(ctx, ctx.user._id);
    return {
      count: rows.length,
      max: MAX_CANDIDATE_MEMORIES,
      memories: rows.map(memoryView),
    };
  },
});

export const addMemory = authedMutation({
  args: {
    text: v.string(),
    category: v.optional(memoryCategoryValidator),
    expiresInDays: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    if (ctx.user.account_type === "recruiter") {
      throw new Error("Agent memory is only available on candidate accounts.");
    }
    const row = await upsertMemory(ctx, ctx.user._id, {
      text: args.text,
      category: args.category as MemoryCategory | undefined,
      source: "user",
      expiresInDays: args.expiresInDays,
    });
    return { remembered: true, memory: memoryView(row) };
  },
});

export const deleteMemory = authedMutation({
  args: { memoryId: v.id("agent_memories") },
  returns: v.object({ deleted: v.boolean() }),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.memoryId);
    if (!row || row.user_id !== ctx.user._id) return { deleted: false };
    await ctx.db.delete(row._id);
    return { deleted: true };
  },
});
