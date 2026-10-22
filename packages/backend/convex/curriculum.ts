import { generateText } from "ai";
import { v } from "convex/values";
import { action, internalAction, internalQuery } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { adminMutation, adminQuery } from "./lib/customFunctions";
import { AI_AGENT_MODEL, createAgentChatModel, openRouter } from "./lib/ai";
import { listExternalCourses } from "./lib/courseCatalog";
import { parseJsonObject } from "./lib/parsedProfile";

const PROMPT_VERSION = "interview-prep-v1";
const PLANNER_PROMPT_VERSION = "curriculum-planner-v1";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function stringList(value: unknown, limit = 12) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean))].slice(0, limit);
}

function numberValue(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function contentHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function normalizeQuestion(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

type PlannedTrack = {
  slug: string;
  title: string;
  roleFamily: string;
  level: string;
  summary: string;
  skills: string[];
  interviewTypes: string[];
  demandScore: number;
  reason: string;
};

type GeneratedQuestion = {
  category: string;
  question: string;
  answer: string;
  keyPoints: string[];
  followUps: string[];
  difficulty: string;
  skills: string[];
};

type GeneratedTrack = {
  title: string;
  summary: string;
  description: string;
  skills: string[];
  interviewTypes: string[];
  estimatedMinutes: number;
  questions: GeneratedQuestion[];
};

function plannerPrompt(snapshot: unknown, maxTracks: number) {
  return `You are Qelsa's autonomous curriculum planner.

Qelsa helps candidates prepare for job interviews. You have a bounded demand snapshot of open jobs and the existing interview-prep tracks. Choose the next ${maxTracks} highest-value role-level tracks to create.

Rules:
- Build role-level interview prep, never company-specific interview questions.
- Never claim a question is leaked, real, or guaranteed.
- Prefer popular role families with the strongest demand. Do not repeat an existing track or a near-duplicate title.
- Content will be reviewed by a quality agent before publishing; still choose only topics that are useful and safe.
- Use levels: Entry, Mid, Senior, or All.
- Return ONLY valid JSON in this shape:
{"decisions":[{"slug":"kebab-case","title":"...","role_family":"...","level":"Mid","summary":"one sentence","skills":["..."],"interview_types":["Behavioral","Technical"],"demand_score":80,"reason":"short reason"}]}

Demand snapshot:
${JSON.stringify(snapshot).slice(0, 30_000)}`;
}

function builderPrompt(decision: PlannedTrack) {
  return `You are Qelsa's interview-prep author. Write an original, practical interview prep track for this role.

Role: ${decision.title}
Role family: ${decision.roleFamily}
Level: ${decision.level}
Focus skills: ${decision.skills.join(", ") || "role-relevant skills"}
Interview types: ${decision.interviewTypes.join(", ") || "Behavioral, Technical"}

Create 10 questions that are commonly useful for this role, prioritizing questions that are frequently asked in real interviews. Questions must be role-level and generic — never claim they came from a specific company or a leaked interview. Cover a mix of behavioral, role-specific, and technical/functional questions.

For every question include:
- a complete model answer written as a practical answer framework (roughly 120–250 words)
- 3–5 key points the answer should hit
- 1–3 useful follow-up questions
- difficulty: Beginner, Intermediate, or Advanced
- related skills

Return ONLY valid JSON:
{"title":"...","summary":"max 120 characters","description":"max 240 characters","skills":["..."],"interview_types":["..."],"estimated_minutes":30,"questions":[{"category":"Behavioral","question":"...","answer":"...","key_points":["..."],"follow_ups":["..."],"difficulty":"Mid","skills":["..."]}]}`;
}

function qaPrompt(track: GeneratedTrack) {
  return `You are Qelsa's interview-prep quality agent. Review this generated course for accuracy, originality, usefulness, and safety.

Score it from 0 to 10. Flag any:
- unsupported or potentially false factual claims
- company-specific claims presented as interview fact
- leaked or copyrighted interview questions
- legal, medical, financial, or compensation advice
- placeholder text, contradictions, duplicate questions, or generic filler

Return ONLY valid JSON:
{"score":8.5,"flags":["short reason if any"],"notes":"one short sentence"}

Track:
${JSON.stringify(track).slice(0, 45_000)}`;
}

async function callJson(prompt: string) {
  if (!openRouter) throw new Error("OPENROUTER_API_KEY is not configured on this deployment.");
  const response = await generateText({
    model: createAgentChatModel("low"),
    prompt,
    temperature: 0.3,
    maxRetries: 2,
    timeout: { totalMs: 120_000 },
  });
  return asRecord(parseJsonObject(response.text));
}

function parsePlannerDecisions(raw: Record<string, unknown>, maxTracks: number): PlannedTrack[] {
  const decisions = Array.isArray(raw.decisions) ? raw.decisions : [];
  return decisions
    .map((item): PlannedTrack | null => {
      const row = asRecord(item);
      const title = stringValue(row.title);
      const roleFamily = stringValue(row.role_family, title);
      const slug = slugify(stringValue(row.slug, `${roleFamily}-${stringValue(row.level, "all")}`));
      if (!title || !slug) return null;
      return {
        slug,
        title,
        roleFamily,
        level: stringValue(row.level, "All"),
        summary: stringValue(row.summary, `Interview preparation for ${title}.`),
        skills: stringList(row.skills),
        interviewTypes: stringList(row.interview_types, 6),
        demandScore: Math.max(0, Math.min(100, numberValue(row.demand_score, 50))),
        reason: stringValue(row.reason),
      };
    })
    .filter((item): item is PlannedTrack => item !== null)
    .slice(0, Math.max(1, Math.min(maxTracks, 5)));
}

function parseGeneratedTrack(raw: Record<string, unknown>, decision: PlannedTrack): GeneratedTrack {
  const rawQuestions = Array.isArray(raw.questions) ? raw.questions : [];
  const questions = rawQuestions
    .map((item): GeneratedQuestion | null => {
      const row = asRecord(item);
      const question = stringValue(row.question);
      const answer = stringValue(row.answer);
      if (!question || answer.length < 80) return null;
      return {
        category: stringValue(row.category, "Role-specific"),
        question,
        answer,
        keyPoints: stringList(row.key_points, 8),
        followUps: stringList(row.follow_ups, 6),
        difficulty: stringValue(row.difficulty, decision.level),
        skills: stringList(row.skills, 8),
      };
    })
    .filter((item): item is GeneratedQuestion => item !== null);

  if (questions.length < 8) throw new Error("Generated track had fewer than 8 valid questions.");

  return {
    title: stringValue(raw.title, decision.title),
    summary: stringValue(raw.summary, decision.summary),
    description: stringValue(raw.description, decision.summary),
    skills: stringList(raw.skills, 16).length ? stringList(raw.skills, 16) : decision.skills,
    interviewTypes: stringList(raw.interview_types, 8).length ? stringList(raw.interview_types, 8) : decision.interviewTypes,
    estimatedMinutes: Math.max(10, Math.min(120, numberValue(raw.estimated_minutes, questions.length * 3))),
    questions: questions.slice(0, 20),
  };
}

function deterministicQa(track: GeneratedTrack) {
  const flags: string[] = [];
  let score = 10;
  const normalized = new Set<string>();

  if (track.questions.length < 8) {
    flags.push("Fewer than 8 questions");
    score -= 3;
  }
  for (const question of track.questions) {
    const key = normalizeQuestion(question.question);
    if (normalized.has(key)) {
      flags.push("Duplicate question");
      score -= 1;
      break;
    }
    normalized.add(key);
    if (question.answer.length < 100) {
      flags.push("Answer is too short");
      score -= 1;
      break;
    }
    if (/lorem|todo|placeholder|as an ai|insert |\[company\]/i.test(question.answer)) {
      flags.push("Placeholder or AI-voice text");
      score -= 2;
      break;
    }
  }
  if (!track.skills.length) {
    flags.push("No skills listed");
    score -= 1;
  }
  return { score: Math.max(0, score), flags: [...new Set(flags)] };
}

async function buildTracks(
  ctx: ActionCtx,
  runId: any,
  planned: PlannedTrack[],
): Promise<{ decisions: any[]; created: number; published: number }> {
  const decisions: any[] = [];
  let created = 0;
  let published = 0;

  for (const decision of planned) {
    try {
      const raw = await callJson(builderPrompt(decision));
      const track = parseGeneratedTrack(raw, decision);
      const deterministic = deterministicQa(track);
      let aiScore = deterministic.score;
      let flags = deterministic.flags;
      try {
        const qa = await callJson(qaPrompt(track));
        aiScore = Math.max(0, Math.min(10, numberValue(qa.score, deterministic.score)));
        flags = [...new Set([...flags, ...stringList(qa.flags, 10)])];
      } catch (error) {
        console.warn("[curriculum] QA agent failed; using deterministic score", error);
      }

      const qualityScore = Math.min(deterministic.score, aiScore);
      const result: any = await ctx.runMutation(internal.interviewPrep.insertGeneratedTrack, {
        runId,
        slug: decision.slug,
        title: track.title,
        roleFamily: decision.roleFamily,
        level: decision.level,
        summary: track.summary,
        description: track.description,
        skills: track.skills,
        interviewTypes: track.interviewTypes,
        estimatedMinutes: track.estimatedMinutes,
        qualityScore,
        qualityFlags: flags,
        demandScore: decision.demandScore,
        model: AI_AGENT_MODEL,
        promptVersion: `${PLANNER_PROMPT_VERSION}+${PROMPT_VERSION}`,
        contentHash: contentHash(JSON.stringify({ decision, track })),
        publish: qualityScore >= 8 && flags.length === 0,
        questions: track.questions.map((question) => ({
          category: question.category,
          question: question.question,
          answer: question.answer,
          keyPoints: question.keyPoints,
          followUps: question.followUps,
          difficulty: question.difficulty,
          skills: question.skills,
        })),
      });

      decisions.push({
        ...decision,
        track_id: result.trackId ?? null,
        status: result.skipped ? "skipped" : result.status,
        quality_score: qualityScore,
        flags,
      });
      if (!result.skipped) {
        created += 1;
        if (result.status === "published") published += 1;
      }
    } catch (error) {
      decisions.push({ ...decision, status: "failed", error: error instanceof Error ? error.message : String(error) });
    }
  }

  return { decisions, created, published };
}

async function requireAdmin(ctx: ActionCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Admin sign-in required.");
  const admin: any = await ctx.runQuery(internal.billingCustomers.getUserByAuthId, { authId: identity.subject });
  if (!admin || admin.role !== "admin" || !admin.isActive) throw new Error("Admin access required.");
  return admin;
}

async function runAgentPipeline(
  ctx: ActionCtx,
  args: { maxTracks: number; trigger: string; actorUserId?: any },
) {
  if (!openRouter) throw new Error("OPENROUTER_API_KEY is not configured on this deployment.");

  const snapshot: any = await ctx.runQuery(internal.interviewPrep.getDemandSnapshot, {});
  const runId: any = await ctx.runMutation(internal.interviewPrep.startRun, {
    trigger: args.trigger,
    model: AI_AGENT_MODEL,
    demandSnapshot: snapshot,
    actorUserId: args.actorUserId,
  });

  const planned = await (async () => {
    try {
      return parsePlannerDecisions(await callJson(plannerPrompt(snapshot, args.maxTracks)), args.maxTracks);
    } catch (error) {
      await ctx.runMutation(internal.interviewPrep.finishRun, {
        runId,
        status: "failed",
        decisions: [],
        tracksCreated: 0,
        tracksPublished: 0,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  })();
  if (!planned.length) {
    await ctx.runMutation(internal.interviewPrep.finishRun, {
      runId,
      status: "failed",
      decisions: [],
      tracksCreated: 0,
      tracksPublished: 0,
      error: "Planner returned no new track decisions.",
    });
    throw new Error("Curriculum planner returned no tracks to build.");
  }

  const { decisions, created, published } = await buildTracks(ctx, runId, planned);

  await ctx.runMutation(internal.interviewPrep.finishRun, {
    runId,
    status: created === 0 && decisions.every((decision) => decision.status === "failed") ? "failed" : "completed",
    decisions,
    tracksCreated: created,
    tracksPublished: published,
    error: created === 0 && decisions.every((decision) => decision.status === "failed") ? "All planned tracks failed to build." : undefined,
  });

  return { runId, created, published, decisions };
}

export const runInternal = internalAction({
  args: {
    maxTracks: v.optional(v.number()),
    trigger: v.optional(v.string()),
    actorUserId: v.optional(v.id("users")),
  },
  returns: v.any(),
  handler: async (ctx, args) =>
    runAgentPipeline(ctx, {
      maxTracks: Math.max(1, Math.min(args.maxTracks ?? 2, 5)),
      trigger: args.trigger ?? "manual",
      actorUserId: args.actorUserId,
    }),
});

export const runAgent = action({
  args: { maxTracks: v.optional(v.number()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const recent: any = await ctx.runQuery(internal.curriculum.latestRun, {});
    if (recent && Date.now() - recent.started_at < 5 * 60_000) {
      throw new Error("The curriculum agent ran recently. Wait a few minutes before starting another run.");
    }
    return await runAgentPipeline(ctx, {
      maxTracks: Math.max(1, Math.min(args.maxTracks ?? 2, 5)),
      trigger: "admin",
      actorUserId: admin._id,
    });
  },
});

export const generateForRole = action({
  args: {
    role: v.string(),
    level: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    interviewTypes: v.optional(v.array(v.string())),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (!openRouter) throw new Error("OPENROUTER_API_KEY is not configured on this deployment.");

    const role = args.role.trim().slice(0, 120);
    if (role.length < 2) throw new Error("Enter a role to build a track for.");
    const level = (args.level?.trim() || "All").slice(0, 40);
    const slug = slugify(`${role}-${level === "All" ? "interview" : level}`);
    const existing: any = await ctx.runQuery(internal.interviewPrep.findTrackBySlug, { slug });
    if (existing) throw new Error("A track for this role already exists.");

    const decision: PlannedTrack = {
      slug,
      title: `${role} Interview Track`,
      roleFamily: role,
      level,
      summary: `Interview practice for ${role}.`,
      skills: (args.skills ?? []).map((skill) => skill.trim()).filter(Boolean).slice(0, 10),
      interviewTypes: (args.interviewTypes ?? []).map((type) => type.trim()).filter(Boolean).slice(0, 6),
      demandScore: 50,
      reason: "Created manually by an admin.",
    };

    const runId: any = await ctx.runMutation(internal.interviewPrep.startRun, {
      trigger: "admin_manual",
      model: AI_AGENT_MODEL,
      demandSnapshot: { source: "admin_manual", role, level },
      actorUserId: admin._id,
    });

    const { decisions, created, published } = await buildTracks(ctx, runId, [decision]);
    await ctx.runMutation(internal.interviewPrep.finishRun, {
      runId,
      status: created > 0 ? "completed" : "failed",
      decisions,
      tracksCreated: created,
      tracksPublished: published,
      error: created > 0 ? undefined : "The track could not be generated.",
    });

    return { runId, created, published, decisions };
  },
});

/** Weekly autonomous build. Disabled unless the deployment explicitly opts in. */
export const scheduledRun = internalAction({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    if (process.env.CURRICULUM_AGENT_ENABLED !== "true" || !openRouter) return null;
    const recent: any = await ctx.runQuery(internal.curriculum.latestRun, {});
    if (recent?.status === "running") return null;
    const maxTracks = Math.max(1, Math.min(Number(process.env.CURRICULUM_AGENT_MAX_TRACKS ?? 2), 5));
    return await runAgentPipeline(ctx, { maxTracks, trigger: "weekly_cron" });
  },
});

export const latestRun = internalQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const run = await ctx.db.query("curriculum_runs").withIndex("by_started_at").order("desc").first();
    if (!run) return null;
    return { started_at: run.started_at, status: run.status, trigger: run.trigger };
  },
});

export const listRoleOptions = adminQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const titles = await ctx.db.query("job_titles").withIndex("by_name").take(300);
    const tracks = await ctx.db.query("interview_prep_tracks").take(100);
    const roles = [
      ...new Set([...titles.map((title) => title.name.trim()).filter(Boolean), ...tracks.map((track) => track.role_family.trim()).filter(Boolean)]),
    ];
    return { roles: roles.slice(0, 300) };
  },
});

export const listRuns = adminQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const runs = await ctx.db.query("curriculum_runs").withIndex("by_started_at").order("desc").take(20);
    return runs.map((run) => ({
      id: run._id,
      status: run.status,
      trigger: run.trigger,
      started_at: run.started_at,
      completed_at: run.completed_at ?? null,
      model: run.model,
      tracks_created: run.tracks_created,
      tracks_published: run.tracks_published,
      error: run.error ?? null,
      decisions: run.decisions,
    }));
  },
});

export const listTracks = adminQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const tracks = await ctx.db.query("interview_prep_tracks").order("desc").take(100);
    return tracks.map((track) => ({
      id: track._id,
      slug: track.slug,
      title: track.title,
      role_family: track.role_family,
      level: track.level,
      status: track.status,
      question_count: track.question_count,
      quality_score: track.quality_score,
      quality_flags: track.quality_flags,
      demand_score: track.demand_score,
      model: track.model,
      created_at: track.created_at,
      updated_at: track.updated_at,
    }));
  },
});

export const listAffiliateCatalog = adminQuery({
  args: {},
  returns: v.any(),
  handler: async () => listExternalCourses(),
});

export const setTrackStatus = adminMutation({  args: {
    trackId: v.id("interview_prep_tracks"),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    note: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const track = await ctx.db.get(args.trackId);
    if (!track) throw new Error("Track not found.");
    const before = track.status;
    await ctx.db.patch(track._id, {
      status: args.status,
      published_at: args.status === "published" ? (track.published_at ?? Date.now()) : track.published_at,
      updated_at: Date.now(),
    });
    await ctx.db.insert("admin_audit_log", {
      admin_user_id: ctx.user._id,
      action: "interview_prep.status_changed",
      before: { status: before },
      after: { status: args.status },
      note: args.note,
      created_at: Date.now(),
    });
    return null;
  },
});
