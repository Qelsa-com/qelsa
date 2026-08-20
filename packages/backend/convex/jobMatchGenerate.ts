import { z } from "zod/v3";
import { v } from "convex/values";
import { Agent, createThread, saveMessage } from "@convex-dev/agent";
import { components, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, type ActionCtx } from "./_generated/server";
import { AI_AGENT_MODEL, requireOpenRouter } from "./lib/ai";
import { sessionPublicValidator } from "./jobMatch";
import { parseJsonObject } from "./lib/parsedProfile";
import { buildCompetencyFramework, clipPlainText, extractJdListItems, normalizeSkillName } from "./lib/skillMatch";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asNullableText(value: unknown): string | null {
  const text = asText(value);
  return text || null;
}

function asStringList(value: unknown, max: number): string[] {
  const raw = Array.isArray(value) ? value : typeof value === "string" && value.trim() ? [value] : [];
  const out: string[] = [];
  for (const item of raw) {
    const text = typeof item === "string" ? item.trim() : "";
    if (!text) continue;
    out.push(text);
    if (out.length >= max) break;
  }
  return out;
}

function asScore(value: unknown): number {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(/%/g, "").trim()) : NaN;
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n > 0 && n <= 1 ? n * 100 : n)));
}

function asYears(value: unknown): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(/[^\d.]/g, "")) : NaN;
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(20, Math.round(n)));
}

function asEnum<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase().replace(/[_\s]+/g, "-");
  return allowed.find((item) => item === normalized) ?? null;
}

const WORK_TYPES = ["full-time", "part-time", "contract", "internship"] as const;
const WORKPLACES = ["on-site", "hybrid", "remote"] as const;
const SKILL_TYPES = ["core", "preferred", "nice_to_have"] as const;

function toExtractedJob(raw: unknown) {
  const obj = asRecord(raw);
  const skills = (Array.isArray(obj.skills) ? obj.skills : [])
    .map((row) => {
      const item = asRecord(row);
      const name = asText(item.name);
      const type = asEnum(item.type, SKILL_TYPES);
      if (!name || !type) return null;
      return { name, type };
    })
    .filter((row): row is { name: string; type: (typeof SKILL_TYPES)[number] } => row !== null)
    .slice(0, 16);
  return {
    title: asText(obj.title, "Untitled role"),
    company: asNullableText(obj.company),
    location: asNullableText(obj.location),
    work_type: asEnum(obj.work_type, WORK_TYPES),
    workplace_type: asEnum(obj.workplace_type, WORKPLACES),
    experience_years: asYears(obj.experience_years),
    description: asText(obj.description),
    skills,
    responsibilities: asStringList(obj.responsibilities, 10),
    requirements: asStringList(obj.requirements, 10),
  };
}

function toAnalysisShape(raw: unknown) {
  const obj = asRecord(raw);
  return {
    headline: asText(obj.headline, "Match analysis is ready."),
    strong: asStringList(obj.strong, 8),
    partial: asStringList(obj.partial, 8),
    missing: asStringList(obj.missing, 8),
    experience_match: asScore(obj.experience_match),
    education_match: asScore(obj.education_match),
    domain_match: asScore(obj.domain_match),
    responsibilities_match: asScore(obj.responsibilities_match),
    resume_evidence: asStringList(obj.resume_evidence, 6),
    actions: asStringList(obj.actions, 6),
    can_apply: asText(obj.can_apply, "Review the gaps below before you apply."),
  };
}

const extractedJobSchema = z.preprocess(
  toExtractedJob,
  z.object({
    title: z.string(),
    company: z.string().nullable(),
    location: z.string().nullable(),
    work_type: z.enum(WORK_TYPES).nullable(),
    workplace_type: z.enum(WORKPLACES).nullable(),
    experience_years: z.number().nullable(),
    description: z.string(),
    skills: z.array(z.object({
      name: z.string(),
      type: z.enum(SKILL_TYPES),
    })),
    responsibilities: z.array(z.string()),
    requirements: z.array(z.string()),
  }),
);

const analysisSchema = z.preprocess(
  toAnalysisShape,
  z.object({
    headline: z.string(),
    strong: z.array(z.string()),
    partial: z.array(z.string()),
    missing: z.array(z.string()),
    experience_match: z.number(),
    education_match: z.number(),
    domain_match: z.number(),
    responsibilities_match: z.number(),
    resume_evidence: z.array(z.string()),
    actions: z.array(z.string()),
    can_apply: z.string(),
  }),
);

type SkillRef = {
  name: string;
  skill_id?: Id<"skills">;
  type?: "core" | "preferred" | "nice_to_have";
};

type JobSnapshot = {
  title: string;
  company?: string;
  location?: string;
  description: string;
  work_type?: string;
  workplace_type?: "on-site" | "hybrid" | "remote";
  experience?: number;
  source_url?: string;
  skills: SkillRef[];
  responsibilities: string[];
  requirements: string[];
};

type Analysis = {
  overall: number;
  headline: string;
  strong: string[];
  partial: string[];
  missing: string[];
  experience_match: number;
  education_match: number;
  domain_match: number;
  responsibilities_match: number;
  resume_evidence: string[];
  actions: string[];
  can_apply: string;
};

type SessionPublic = {
  id: Id<"job_match_sessions">;
  source: "qelsa" | "external";
  job_id?: Id<"jobs">;
  thread_id: string;
  title: string;
  company?: string;
  location?: string;
  description: string;
  work_type?: string;
  workplace_type?: "on-site" | "hybrid" | "remote";
  experience?: number;
  source_url?: string;
  skills: SkillRef[];
  responsibilities: string[];
  requirements: string[];
  analysis: Analysis;
};

type ResumeRef = {
  id?: Id<"resumes">;
  title: string;
  storage_id?: string;
  text?: string;
};

type UserContext = {
  userId: Id<"users">;
  fingerprint?: string;
  profile: Record<string, unknown>;
  skills: Array<{
    skill_id: Id<"skills">;
    name: string;
    proficiency: string | null;
    is_top_skill?: boolean;
  }>;
  experiences: unknown[];
  educations: unknown[];
  projects?: string[];
  certifications: string[];
  resumes: ResumeRef[];
};

function matchCoach(jobTitle: string, company?: string, context?: string) {
  const openRouter = requireOpenRouter();
  return new Agent(components.agent, {
    name: "Match Coach",
    languageModel: openRouter.chat(AI_AGENT_MODEL),
    instructions: `You are Qelsa's Match Coach for one job: ${jobTitle}${company ? ` at ${company}` : ""}.
You help the candidate understand how ready they are and what to do next.
Rules:
- Use only the provided job snapshot and the candidate's Qelsa profile, skills, experience, education, projects, certifications, and resume text.
- Never invent jobs, degrees, or skills the candidate did not list.
- Catalog skill matches already computed are facts. Do not contradict them.
- Be specific and practical. Qelsa tells people whether they are ready and how to become ready — not just a score.
- If they ask to rewrite a resume, write a tailored draft from their real experience.
- Keep answers concise unless they ask for a rewrite.
- Format every reply in GitHub-flavored Markdown: short headings, bullets, and **bold** for scores and skill names. Never dump JSON or repeat the raw job snapshot.
${context ? `\n${context}` : ""}`,
    maxSteps: 1,
  });
}

function clampScore(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function overallFromParts(
  skillReadiness: number | null,
  experience: number,
  education: number,
  domain: number,
  responsibilities: number,
) {
  if (skillReadiness != null) {
    return clampScore(
      0.45 * skillReadiness +
        0.2 * experience +
        0.15 * education +
        0.1 * domain +
        0.1 * responsibilities,
    );
  }
  return clampScore(0.3 * experience + 0.2 * education + 0.25 * domain + 0.25 * responsibilities);
}

function analysisBody(analysis: Analysis) {
  const list = (items: string[], empty: string) =>
    items.length ? items.map((item) => `- ${item}`).join("\n") : empty;
  return `${analysis.headline}

### Why this score
**Strong**
${list(analysis.strong, "- No clear strengths listed yet.")}
${analysis.partial.length ? `\n**Partial**\n${list(analysis.partial, "")}` : ""}
${analysis.missing.length ? `\n**Missing**\n${list(analysis.missing, "")}` : ""}

### What to do next
${list(analysis.actions, "- Add more skills and experience on your Qelsa profile, then re-run this match.")}

${analysis.can_apply}

Ask me why this score, what's missing, whether you should apply, how to get to 90%, or to rewrite your resume for this job.`;
}

function openingMessage(jobTitle: string, company: string | undefined, analysis: Analysis) {
  const companyBit = company ? ` at ${company}` : "";
  return `You're a **${analysis.overall}% match** for ${jobTitle}${companyBit}.

${analysisBody(analysis)}`;
}

function updatedMatchMessage(
  jobTitle: string,
  company: string | undefined,
  analysis: Analysis,
  previousOverall?: number,
) {
  const companyBit = company ? ` at ${company}` : "";
  const changed = previousOverall != null && previousOverall !== analysis.overall;
  const scoreLine = changed
    ? `You're now a **${analysis.overall}% match** for ${jobTitle}${companyBit} — ${analysis.overall > previousOverall ? "up" : "down"} from **${previousOverall}%**.`
    : `You're still a **${analysis.overall}% match** for ${jobTitle}${companyBit}.`;
  return `I re-checked this role because your Qelsa profile changed.

${scoreLine}

${analysisBody(analysis)}`;
}

function candidatePayload(user: UserContext) {
  return {
    profile: user.profile,
    skills: user.skills,
    experiences: user.experiences,
    educations: user.educations,
    projects: user.projects ?? [],
    certifications: user.certifications,
    resumes: user.resumes.map((resume) => ({
      title: resume.title,
      text: clipPlainText(resume.text, 4000),
    })),
  };
}

async function enrichUserContext(ctx: ActionCtx, user: UserContext): Promise<UserContext> {
  const resumes: ResumeRef[] = [];
  for (const resume of user.resumes) {
    let text = resume.text?.trim() ?? "";
    if (!text && resume.storage_id) {
      text = await ctx.runAction(internal.resumeParse.extractStoredDocument, {
        storageId: resume.storage_id,
        filename: resume.title,
      });
      if (text && resume.id) {
        await ctx.runMutation(internal.resumes.setExtractedText, {
          resumeId: resume.id,
          text,
        });
      }
    }
    resumes.push({ ...resume, text: clipPlainText(text, 4000) });
  }
  return { ...user, resumes };
}

async function mapSkillsToCatalog(
  ctx: ActionCtx,
  raw: Array<{ name: string; type: "core" | "preferred" | "nice_to_have" }>,
): Promise<SkillRef[]> {
  const catalog: Array<{ id: Id<"skills">; name: string }> = await ctx.runQuery(
    internal.jobMatch.loadSkillCatalog,
    {},
  );
  const byName = new Map(catalog.map((skill) => [normalizeSkillName(skill.name), skill]));
  const out: SkillRef[] = [];
  const seen = new Set<string>();
  for (const skill of raw) {
    const match = byName.get(normalizeSkillName(skill.name));
    const key = match?.id ?? normalizeSkillName(skill.name);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      name: match?.name ?? skill.name,
      skill_id: match?.id,
      type: skill.type,
    });
  }
  return out;
}

function unwrapGeneratedObject(error: unknown): unknown {
  const seen = new Set<unknown>();
  let current: unknown = error;
  for (let i = 0; i < 6 && current && typeof current === "object"; i += 1) {
    if (seen.has(current)) break;
    seen.add(current);
    const record = current as Record<string, unknown>;
    if (typeof record.text === "string") {
      const parsed = parseJsonObject(record.text);
      if (parsed) return parsed;
    }
    if (record.value && typeof record.value === "object") return record.value;
    current = record.cause;
  }
  return null;
}

async function generateObjectRepaired<T>(
  generate: (args: {
    schema: z.ZodTypeAny;
    prompt: string;
    experimental_repairText: (opts: { text: string }) => Promise<string>;
  }) => Promise<{ object: unknown }>,
  schema: z.ZodTypeAny,
  coerce: (raw: unknown) => T,
  input: { prompt: string },
): Promise<T> {
  try {
    const result = await generate({
      schema,
      prompt: input.prompt,
      experimental_repairText: async ({ text }) => {
        const parsed = parseJsonObject(text);
        return parsed ? JSON.stringify(coerce(parsed)) : text;
      },
    });
    return coerce(result.object);
  } catch (error) {
    const parsed = unwrapGeneratedObject(error);
    if (parsed) return coerce(parsed);
    throw error;
  }
}

async function analyzeMatch(
  ctx: Parameters<Agent["generateObject"]>[0],
  userId: string,
  job: {
    title: string;
    company?: string;
    location?: string;
    description: string;
    work_type?: string;
    workplace_type?: string;
    experience?: number;
    skills: SkillRef[];
    responsibilities: string[];
    requirements: string[];
  },
  user: UserContext,
  competency: ReturnType<typeof buildCompetencyFramework> | null,
): Promise<Analysis> {
  const agent = matchCoach(job.title, job.company);
  const skillFacts = competency
    ? {
        readiness: competency.readiness,
        matched: competency.competencies.filter((c) => c.matched).map((c) => c.skill_name).filter(Boolean),
        gaps: competency.competencies.filter((c) => !c.matched).map((c) => c.skill_name).filter(Boolean),
      }
    : null;

  const generated = await generateObjectRepaired(
    (args) => agent.generateObject(ctx, { userId }, args),
    analysisSchema,
    toAnalysisShape,
    {
      prompt: `Compare this candidate to this job. Return only schema fields.

JOB
${JSON.stringify({
  title: job.title,
  company: job.company,
  location: job.location,
  work_type: job.work_type,
  workplace_type: job.workplace_type,
  experience_years: job.experience,
  description: job.description,
  skills: job.skills,
  responsibilities: job.responsibilities,
  requirements: job.requirements,
})}

CANDIDATE
${JSON.stringify(candidatePayload(user))}

CATALOG SKILL MATCH FACTS (do not contradict):
${JSON.stringify(skillFacts)}

Write headline as one sentence on readiness. can_apply should say whether applying now is reasonable and why. actions should be the next 3–6 concrete steps to become more ready. resume_evidence should cite real profile/experience lines.`,
    },
  );

  const overall = overallFromParts(
    skillFacts?.readiness ?? null,
    generated.experience_match,
    generated.education_match,
    generated.domain_match,
    generated.responsibilities_match,
  );

  const strong = generated.strong.length
    ? generated.strong
    : (skillFacts?.matched ?? []).slice(0, 6).map(String);
  const missing = generated.missing.length
    ? generated.missing
    : (skillFacts?.gaps ?? []).slice(0, 6).map(String);

  return {
    overall,
    headline: generated.headline,
    strong,
    partial: generated.partial,
    missing,
    experience_match: clampScore(generated.experience_match),
    education_match: clampScore(generated.education_match),
    domain_match: clampScore(generated.domain_match),
    responsibilities_match: clampScore(generated.responsibilities_match),
    resume_evidence: generated.resume_evidence,
    actions: generated.actions,
    can_apply: generated.can_apply,
  };
}

async function persistSession(
  ctx: ActionCtx,
  args: {
    userId: Id<"users">;
    authId: string;
    source: "qelsa" | "external";
    jobId?: Id<"jobs">;
    job: JobSnapshot;
    analysis: Analysis;
    fingerprint?: string;
    existingSessionId?: Id<"job_match_sessions">;
  },
): Promise<Id<"job_match_sessions">> {
  const threadId = await createThread(ctx, components.agent, {
    userId: args.authId,
    title: `Match: ${args.job.title}`,
    summary: `${args.analysis.overall}% match`,
  });
  await saveMessage(ctx, components.agent, {
    threadId,
    userId: args.authId,
    agentName: "Match Coach",
    message: {
      role: "assistant",
      content: openingMessage(args.job.title, args.job.company, args.analysis),
    },
  });
  const payload = {
    thread_id: threadId,
    ...sessionFields(args),
  };
  if (args.existingSessionId) {
    return await ctx.runMutation(internal.jobMatch.replaceSession, {
      sessionId: args.existingSessionId,
      ...payload,
    });
  }
  return await ctx.runMutation(internal.jobMatch.insertSession, {
    user_id: args.userId,
    source: args.source,
    job_id: args.jobId,
    ...payload,
  });
}

function sessionFields(args: {
  job: JobSnapshot;
  analysis: Analysis;
  fingerprint?: string;
}) {
  return {
    title: args.job.title,
    company: args.job.company,
    location: args.job.location,
    description: args.job.description,
    work_type: args.job.work_type,
    workplace_type: args.job.workplace_type,
    experience: args.job.experience,
    source_url: args.job.source_url,
    skills: args.job.skills,
    responsibilities: args.job.responsibilities,
    requirements: args.job.requirements,
    analysis: args.analysis,
    context_fingerprint: args.fingerprint,
  };
}

async function appendUpdatedAnalysis(
  ctx: ActionCtx,
  args: {
    authId: string;
    sessionId: Id<"job_match_sessions">;
    threadId: string;
    job: JobSnapshot;
    analysis: Analysis;
    fingerprint?: string;
    previousOverall?: number;
  },
) {
  await saveMessage(ctx, components.agent, {
    threadId: args.threadId,
    userId: args.authId,
    agentName: "Match Coach",
    message: {
      role: "assistant",
      content: updatedMatchMessage(args.job.title, args.job.company, args.analysis, args.previousOverall),
    },
  });
  await ctx.runMutation(internal.jobMatch.replaceSession, {
    sessionId: args.sessionId,
    ...sessionFields(args),
  });
  return args.sessionId;
}

async function fetchJdFromUrl(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Enter a valid job URL.");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Only http(s) job URLs are supported.");
  }
  const response = await fetch(parsed.toString(), {
    headers: { "User-Agent": "QelsaMatch/1.0" },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("Could not fetch that job URL.");
  const html = await response.text();
  const text = clipPlainText(html, 12000);
  if (text.length < 80) throw new Error("That page did not contain enough job text to analyze.");
  return text;
}

export const startForJob = action({
  args: {
    jobId: v.id("jobs"),
    refresh: v.optional(v.boolean()),
  },
  returns: sessionPublicValidator,
  handler: async (ctx, args): Promise<SessionPublic> => {
    requireOpenRouter();
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user: UserContext = await ctx.runQuery(internal.jobMatch.loadUserContext, {
      authId: identity.subject,
    });

    const existing: {
      id: Id<"job_match_sessions">;
      thread_id: string;
      context_fingerprint?: string;
      overall?: number;
    } | null = await ctx.runQuery(internal.jobMatch.findExistingForJob, {
      userId: user.userId,
      jobId: args.jobId,
    });
    if (!args.refresh && existing && existing.context_fingerprint === user.fingerprint) {
      return await ctx.runQuery(internal.jobMatch.getSessionInternal, {
        sessionId: existing.id,
        authId: identity.subject,
      });
    }

    const enriched = await enrichUserContext(ctx, user);
    const snapshot = await ctx.runQuery(internal.jobMatch.loadJobSnapshot, {
      jobId: args.jobId,
      userId: user.userId,
    });

    const job = {
      title: snapshot.title as string,
      company: snapshot.company as string | undefined,
      location: snapshot.location as string | undefined,
      description: snapshot.description as string,
      work_type: snapshot.work_type as string | undefined,
      workplace_type: snapshot.workplace_type as "on-site" | "hybrid" | "remote" | undefined,
      experience: snapshot.experience as number | undefined,
      skills: snapshot.skills as SkillRef[],
      responsibilities: (snapshot.responsibilities as string[] | undefined) ?? extractJdListItems(snapshot.description as string, 10),
      requirements: (snapshot.requirements as string[] | undefined) ?? [],
    };

    const analysis = await analyzeMatch(
      ctx,
      identity.subject,
      job,
      enriched,
      snapshot.competency as ReturnType<typeof buildCompetencyFramework> | null,
    );

    const sessionId = !args.refresh && existing
      ? await appendUpdatedAnalysis(ctx, {
          authId: identity.subject,
          sessionId: existing.id,
          threadId: existing.thread_id,
          job,
          analysis,
          fingerprint: user.fingerprint,
          previousOverall: existing.overall,
        })
      : await persistSession(ctx, {
          userId: user.userId,
          authId: identity.subject,
          source: "qelsa",
          jobId: args.jobId,
          job,
          analysis,
          fingerprint: user.fingerprint,
          existingSessionId: existing?.id,
        });

    return await ctx.runQuery(internal.jobMatch.getSessionInternal, {
      sessionId,
      authId: identity.subject,
    });
  },
});

export const startForExternal = action({
  args: {
    jdText: v.optional(v.string()),
    jdUrl: v.optional(v.string()),
    jdStorageId: v.optional(v.string()),
    jdFilename: v.optional(v.string()),
  },
  returns: sessionPublicValidator,
  handler: async (ctx, args): Promise<SessionPublic> => {
    const openRouter = requireOpenRouter();
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    let sourceText = clipPlainText(args.jdText, 14000);
    if (args.jdStorageId) {
      const fromFile = await ctx.runAction(internal.resumeParse.extractStoredDocument, {
        storageId: args.jdStorageId,
        filename: args.jdFilename,
      });
      sourceText = sourceText ? `${sourceText}\n\n${fromFile}` : fromFile;
    }
    if (args.jdUrl?.trim()) {
      const fetched = await fetchJdFromUrl(args.jdUrl.trim());
      sourceText = sourceText ? `${sourceText}\n\n${fetched}` : fetched;
    }
    if (sourceText.length < 80) {
      throw new Error("Paste a job description, upload a JD file, or add a job URL first.");
    }

    const user: UserContext = await enrichUserContext(
      ctx,
      await ctx.runQuery(internal.jobMatch.loadUserContext, {
        authId: identity.subject,
      }),
    );

    const extractor = new Agent(components.agent, {
      name: "Job Normalizer",
      languageModel: openRouter.chat(AI_AGENT_MODEL),
      instructions:
        "Extract a normalized job snapshot from unstructured JD text. Do not invent a company or location if they are not present. Pick skills that actually appear in the JD.",
      maxSteps: 1,
    });

    const jobDoc = await generateObjectRepaired(
      (args) => extractor.generateObject(ctx, { userId: identity.subject }, args),
      extractedJobSchema,
      toExtractedJob,
      {
        prompt: `Normalize this job posting into the schema. If a field is unknown, use null or [].\n\n${sourceText}`,
      },
    );
    const catalogSkills = (jobDoc.skills ?? [])
      .filter((skill): skill is { name: string; type: "core" | "preferred" | "nice_to_have" } =>
        Boolean(skill?.name && skill?.type),
      );
    const skills = await mapSkillsToCatalog(ctx, catalogSkills);
    const competency = skills.some((s) => s.skill_id)
      ? buildCompetencyFramework(
          skills
            .filter((s) => s.skill_id)
            .map((s) => ({
              skill_id: s.skill_id as string,
              type: s.type,
              proficiency: "intermediate",
              skill: { name: s.name },
            })),
          user.skills.map((s) => ({ skill_id: s.skill_id, proficiency: s.proficiency ?? undefined })),
        )
      : null;

    const job = {
      title: jobDoc.title,
      company: jobDoc.company ?? undefined,
      location: jobDoc.location ?? undefined,
      description: clipPlainText(jobDoc.description, 6000),
      work_type: jobDoc.work_type ?? undefined,
      workplace_type: jobDoc.workplace_type ?? undefined,
      experience: jobDoc.experience_years ?? undefined,
      source_url: args.jdUrl?.trim() || undefined,
      skills,
      responsibilities: jobDoc.responsibilities,
      requirements: jobDoc.requirements,
    };

    const analysis = await analyzeMatch(ctx, identity.subject, job, user, competency);
    const sessionId = await persistSession(ctx, {
      userId: user.userId,
      authId: identity.subject,
      source: "external",
      job,
      analysis,
      fingerprint: user.fingerprint,
    });

    return await ctx.runQuery(internal.jobMatch.getSessionInternal, {
      sessionId,
      authId: identity.subject,
    });
  },
});

export const sendMessage = action({
  args: {
    sessionId: v.id("job_match_sessions"),
    prompt: v.string(),
  },
  returns: v.object({ text: v.string() }),
  handler: async (ctx, args): Promise<{ text: string }> => {
    requireOpenRouter();
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const prompt = args.prompt.trim();
    if (!prompt) throw new Error("Type a question first.");
    if (prompt.length > 4000) throw new Error("Keep questions under 4000 characters.");

    const [session, loaded]: [SessionPublic, UserContext] = await Promise.all([
      ctx.runQuery(internal.jobMatch.getSessionInternal, {
        sessionId: args.sessionId,
        authId: identity.subject,
      }),
      ctx.runQuery(internal.jobMatch.loadUserContext, {
        authId: identity.subject,
      }),
    ]);
    const user = await enrichUserContext(ctx, loaded);

    const agent = matchCoach(
      session.title,
      session.company,
      `JOB SNAPSHOT
${JSON.stringify({
  title: session.title,
  company: session.company,
  location: session.location,
  description: clipPlainText(session.description, 4000),
  skills: session.skills,
  responsibilities: session.responsibilities,
  requirements: session.requirements,
  analysis: session.analysis,
})}

CANDIDATE
${JSON.stringify(candidatePayload(user))}`,
    );
    const result = await agent.generateText(
      ctx,
      { threadId: session.thread_id, userId: identity.subject },
      { prompt },
    );

    return { text: result.text };
  },
});
