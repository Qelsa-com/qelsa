import { z } from "zod/v3";
import { v } from "convex/values";
import { Agent, createThread, saveMessage } from "@convex-dev/agent";
import { components, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, type ActionCtx } from "./_generated/server";
import { AI_AGENT_MODEL, requireOpenRouter } from "./lib/ai";
import { sessionPublicValidator } from "./jobMatch";
import { buildCompetencyFramework, clipPlainText, normalizeSkillName } from "./lib/skillMatch";

const extractedJobSchema = z.object({
  title: z.string(),
  company: z.string().nullable(),
  location: z.string().nullable(),
  work_type: z.enum(["full-time", "part-time", "contract", "internship"]).nullable(),
  workplace_type: z.enum(["on-site", "hybrid", "remote"]).nullable(),
  experience_years: z.number().min(0).max(20).nullable(),
  description: z.string(),
  skills: z.array(z.object({
    name: z.string(),
    type: z.enum(["core", "preferred", "nice_to_have"]),
  })).max(16),
  responsibilities: z.array(z.string()).max(10),
  requirements: z.array(z.string()).max(10),
});

const analysisSchema = z.object({
  headline: z.string(),
  strong: z.array(z.string()).max(8),
  partial: z.array(z.string()).max(8),
  missing: z.array(z.string()).max(8),
  experience_match: z.number().min(0).max(100),
  education_match: z.number().min(0).max(100),
  domain_match: z.number().min(0).max(100),
  responsibilities_match: z.number().min(0).max(100),
  resume_evidence: z.array(z.string()).max(6),
  actions: z.array(z.string()).max(6),
  can_apply: z.string(),
});

type SkillRef = {
  name: string;
  skill_id?: Id<"skills">;
  type?: "core" | "preferred" | "nice_to_have";
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

type UserContext = {
  userId: Id<"users">;
  profile: Record<string, unknown>;
  skills: Array<{
    skill_id: Id<"skills">;
    name: string;
    proficiency: string | null;
    is_top_skill?: boolean;
  }>;
  experiences: unknown[];
  educations: unknown[];
  certifications: string[];
  resumes: string[];
};

function matchCoach(jobTitle: string, company?: string, context?: string) {
  const openRouter = requireOpenRouter();
  return new Agent(components.agent, {
    name: "Match Coach",
    languageModel: openRouter.chat(AI_AGENT_MODEL),
    instructions: `You are Qelsa's Match Coach for one job: ${jobTitle}${company ? ` at ${company}` : ""}.
You help the candidate understand how ready they are and what to do next.
Rules:
- Use only the provided job snapshot and the candidate's Qelsa profile, skills, experience, education, projects, and resume titles.
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

function openingMessage(jobTitle: string, company: string | undefined, analysis: Analysis) {
  const companyBit = company ? ` at ${company}` : "";
  const actions = analysis.actions.map((item) => `- ${item}`).join("\n");
  const strong = analysis.strong.length ? analysis.strong.map((item) => `- ${item}`).join("\n") : "- No clear strengths listed yet.";
  const missing = analysis.missing.length ? analysis.missing.map((item) => `- ${item}`).join("\n") : "";
  return `You're a **${analysis.overall}% match** for ${jobTitle}${companyBit}.

${analysis.headline}

### Why this score
**Strong**
${strong}
${missing ? `\n**Missing**\n${missing}` : ""}

### What to do next
${actions || "- Add more skills and experience on your Qelsa profile, then re-run this match."}

${analysis.can_apply}

Ask me why this score, what's missing, whether you should apply, how to get to 90%, or to rewrite your resume for this job.`;
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

  const result: { object: z.infer<typeof analysisSchema> } = await agent.generateObject(
    ctx,
    { userId },
    {
      schema: analysisSchema,
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
${JSON.stringify({
  profile: user.profile,
  skills: user.skills,
  experiences: user.experiences,
  educations: user.educations,
  certifications: user.certifications,
  resumes: user.resumes,
})}

CATALOG SKILL MATCH FACTS (do not contradict):
${JSON.stringify(skillFacts)}

Write headline as one sentence on readiness. can_apply should say whether applying now is reasonable and why. actions should be the next 3–6 concrete steps to become more ready. resume_evidence should cite real profile/experience lines.`,
    },
  );

  const generated = result.object;
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
    job: {
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
    analysis: Analysis;
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
  return await ctx.runMutation(internal.jobMatch.insertSession, {
    user_id: args.userId,
    source: args.source,
    job_id: args.jobId,
    thread_id: threadId,
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
  });
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

    if (!args.refresh) {
      const existingId: Id<"job_match_sessions"> | null = await ctx.runQuery(
        internal.jobMatch.findExistingForJob,
        { userId: user.userId, jobId: args.jobId },
      );
      if (existingId) {
        return await ctx.runQuery(internal.jobMatch.getSessionInternal, {
          sessionId: existingId,
          authId: identity.subject,
        });
      }
    }

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
      responsibilities: [] as string[],
      requirements: [] as string[],
    };

    const analysis = await analyzeMatch(
      ctx,
      identity.subject,
      job,
      user,
      snapshot.competency as ReturnType<typeof buildCompetencyFramework> | null,
    );

    const sessionId = await persistSession(ctx, {
      userId: user.userId,
      authId: identity.subject,
      source: "qelsa",
      jobId: args.jobId,
      job,
      analysis,
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
  },
  returns: sessionPublicValidator,
  handler: async (ctx, args): Promise<SessionPublic> => {
    const openRouter = requireOpenRouter();
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    let sourceText = clipPlainText(args.jdText, 14000);
    if (args.jdUrl?.trim()) {
      const fetched = await fetchJdFromUrl(args.jdUrl.trim());
      sourceText = sourceText ? `${sourceText}\n\n${fetched}` : fetched;
    }
    if (sourceText.length < 80) {
      throw new Error("Paste a job description or a job URL first.");
    }

    const user: UserContext = await ctx.runQuery(internal.jobMatch.loadUserContext, {
      authId: identity.subject,
    });

    const extractor = new Agent(components.agent, {
      name: "Job Normalizer",
      languageModel: openRouter.chat(AI_AGENT_MODEL),
      instructions:
        "Extract a normalized job snapshot from unstructured JD text. Do not invent a company or location if they are not present. Pick skills that actually appear in the JD.",
      maxSteps: 1,
    });

    const extracted: { object: z.infer<typeof extractedJobSchema> } = await extractor.generateObject(
      ctx,
      { userId: identity.subject },
      {
        schema: extractedJobSchema,
        prompt: `Normalize this job posting into the schema. If a field is unknown, use null or [].\n\n${sourceText}`,
      },
    );

    const jobDoc = extracted.object;
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

    const [session, user]: [SessionPublic, UserContext] = await Promise.all([
      ctx.runQuery(internal.jobMatch.getSessionInternal, {
        sessionId: args.sessionId,
        authId: identity.subject,
      }),
      ctx.runQuery(internal.jobMatch.loadUserContext, {
        authId: identity.subject,
      }),
    ]);

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
${JSON.stringify({
  profile: user.profile,
  skills: user.skills,
  experiences: user.experiences,
  educations: user.educations,
  certifications: user.certifications,
  resumes: user.resumes,
})}`,
    );
    const result = await agent.generateText(
      ctx,
      { threadId: session.thread_id, userId: identity.subject },
      { prompt },
    );

    return { text: result.text };
  },
});
