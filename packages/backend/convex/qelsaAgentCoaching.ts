/**
 * Qelsa Agent's writing and analysis helpers.
 *
 * These actions are read-only: they load the signed-in candidate's real
 * profile and a job, then return a draft or report. Nothing is persisted here;
 * the tool result itself is the record shown in the conversation, and any
 * mutation still goes through an approval-gated tool.
 */

import { generateText } from "ai";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { internalAction, type ActionCtx } from "./_generated/server";
import { createAgentChatModel, requireOpenRouter } from "./lib/ai";
import { parseJsonObject } from "./lib/parsedProfile";
import { clipPlainText } from "./lib/skillMatch";

const MAX_JOBS = 4;

type CandidateContext = {
  profile: Record<string, unknown>;
  skills: Array<{ name: string; proficiency?: string | null; is_top_skill?: boolean }>;
  experiences: Array<Record<string, unknown>>;
  educations: Array<Record<string, unknown>>;
  projects: string[];
  certifications: string[];
  resumes: Array<{ id?: string; title: string; text?: string }>;
};

async function loadCandidate(ctx: ActionCtx, authId: string): Promise<CandidateContext> {
  return (await ctx.runQuery(internal.jobMatch.loadUserContext, { authId })) as CandidateContext;
}

async function loadJob(ctx: ActionCtx, authId: string, jobId: string): Promise<any> {
  return await ctx.runQuery(internal.qelsaAgentTools.getJobDetailsInternal, {
    authId,
    jobId: jobId as Id<"jobs">,
  });
}

function candidatePayload(candidate: CandidateContext) {
  return {
    profile: candidate.profile,
    skills: candidate.skills.slice(0, 40),
    experiences: candidate.experiences.slice(0, 8),
    educations: candidate.educations.slice(0, 6),
    projects: candidate.projects.slice(0, 12),
    certifications: candidate.certifications.slice(0, 8),
    resumes: candidate.resumes.map((resume) => ({
      title: resume.title,
      text: clipPlainText(resume.text, 3000),
    })),
  };
}

function jobPayload(job: any) {
  return {
    title: job.title,
    company: job.company,
    location: job.location,
    workplace_type: job.workplace_type,
    work_type: job.work_type,
    experience_years: job.experience_years,
    salary: job.salary,
    description: clipPlainText(job.description, 3500),
    skills: job.skills,
    responsibilities: job.responsibilities,
    apply_inside_qelsa: job.apply_inside_qelsa,
    already_applied: job.already_applied,
  };
}

async function writeMarkdown(prompt: string, effort: "low" | "medium" = "low") {
  requireOpenRouter();
  const response = await generateText({
    model: createAgentChatModel(effort),
    prompt,
    temperature: 0.35,
    maxRetries: 2,
    timeout: { totalMs: 90_000 },
  });
  const text = response.text.trim();
  if (!text) throw new Error("The draft came back empty. Try again.");
  return text;
}

export const tailorResumeInternal = internalAction({
  args: {
    authId: v.string(),
    jobId: v.id("jobs"),
    instructions: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args): Promise<any> => {
    const [candidate, job] = await Promise.all([
      loadCandidate(ctx, args.authId),
      loadJob(ctx, args.authId, args.jobId),
    ]);
    const markdown = await writeMarkdown(
      `You are a senior resume editor. Tailor this candidate's existing resume to the target job. This is a draft for the candidate to review — never invent employers, dates, degrees, metrics, or skills they did not provide.

TARGET JOB
${JSON.stringify(jobPayload(job))}

CANDIDATE
${JSON.stringify(candidatePayload(candidate))}

${args.instructions ? `CANDIDATE INSTRUCTIONS\n${clipPlainText(args.instructions, 800)}\n` : ""}

Return GitHub-flavored Markdown with exactly these sections:
# Tailored resume plan — <job title> at <company>
## Target summary
A 2–3 sentence professional summary using only real evidence.
## Experience rewrites
For each relevant role, show 2–4 bullets. Use "Before:" and "After:" lines. If the original has no bullet, write "Before: <original description>" and make the After version truthful. Never add a number or outcome that is not in the source material.
## Skills and keywords
Two subsections: "Already evidenced" and "Missing — do not claim".
## Gaps and next steps
3–6 concrete actions, ordered by impact.
## ATS checklist
Short checklist covering title alignment, keyword coverage, formatting, and evidence.

Keep the whole answer under 900 words. Do not output JSON.`,
      "medium",
    );
    return {
      markdown,
      job_title: String(job.title ?? "this role"),
      company: job.company ?? null,
      job_id: args.jobId,
    };
  },
});

export const draftApplicationAnswersInternal = internalAction({
  args: {
    authId: v.string(),
    jobId: v.id("jobs"),
    instructions: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args): Promise<any> => {
    const [candidate, job, questionData] = await Promise.all([
      loadCandidate(ctx, args.authId),
      loadJob(ctx, args.authId, args.jobId),
      ctx.runQuery(internal.qelsaAgentTools.getApplicationQuestionsInternal, {
        authId: args.authId,
        jobId: args.jobId,
      }),
    ]);
    const questions = Array.isArray(questionData.questions) ? questionData.questions : [];
    if (!questions.length) {
      throw new Error("This job has no screening questions to answer.");
    }
    const prompt = `Draft application answers for this candidate. Use only facts in the profile and resume text. If the profile does not support a claim, answer honestly without inventing experience.

TARGET JOB
${JSON.stringify(jobPayload(job))}

SCREENING QUESTIONS
${JSON.stringify(
  questions.map((question: any) => ({
    question_id: String(question.question_id),
    question: question.title,
    type: question.type,
    required: question.required,
    options: (question.options ?? []).map((option: any) => option.title),
  })),
)}

CANDIDATE
${JSON.stringify(candidatePayload(candidate))}

${args.instructions ? `CANDIDATE INSTRUCTIONS\n${clipPlainText(args.instructions, 800)}\n` : ""}

Return JSON only, with this shape:
{"answers":{"<question_id>":"answer text"}}
The keys must be the exact question_id strings above. Every required question must have an answer. Keep each answer under 1200 characters, specific, first-person, and natural. For multiple-choice questions, answer with one of the provided option titles.`;
    const response = await writeMarkdown(prompt, "medium");
    const parsed = parseJsonObject(response) as { answers?: Record<string, unknown> } | null;
    if (!parsed?.answers) throw new Error("I couldn't structure the application answers. Try again.");
    const byId = new Map(questions.map((question: any) => [String(question.question_id), question]));
    const answers = questions
      .map((question: any) => {
        const raw = parsed.answers?.[String(question.question_id)];
        const answer = typeof raw === "string" ? raw.trim().slice(0, 1500) : "";
        return answer
          ? {
              question_id: String(question.question_id),
              question: question.title,
              answer,
              required: Boolean(question.required),
            }
          : null;
      })
      .filter((row: any): row is NonNullable<typeof row> => row !== null);
    const missing = questions
      .filter((question: any) => question.required && !answers.some((row: any) => row.question_id === String(question.question_id)))
      .map((question: any) => question.title);
    if (missing.length) {
      throw new Error(`I couldn't draft required answer${missing.length > 1 ? "s" : ""}: ${missing.join("; ")}`);
    }
    return {
      answers,
      answers_by_id: Object.fromEntries(answers.map((row: any) => [row.question_id, row.answer])),
      count: answers.length,
      job_title: String(job.title ?? "this role"),
      company: job.company ?? null,
      job_id: args.jobId,
      note: `Drafted ${answers.length} answer${answers.length === 1 ? "" : "s"}. Review them before applying.`,
    };
  },
});

export const interviewPrepInternal = internalAction({
  args: { authId: v.string(), jobId: v.id("jobs") },
  returns: v.any(),
  handler: async (ctx, args): Promise<any> => {
    const [candidate, job] = await Promise.all([
      loadCandidate(ctx, args.authId),
      loadJob(ctx, args.authId, args.jobId),
    ]);
    const markdown = await writeMarkdown(
      `You are an interview coach. Build a practical interview brief for this candidate and role. Ground every claim in the job or candidate data. Do not invent company facts; if company context is missing, say what to research.

TARGET JOB
${JSON.stringify(jobPayload(job))}

CANDIDATE
${JSON.stringify(candidatePayload(candidate))}

Return GitHub-flavored Markdown with these sections:
# Interview brief — <job title> at <company>
## What this role is really testing
3–5 themes.
## Likely questions
Group into "Role-specific", "Behavioral", and "Questions to ask them". Include 3–5 questions per group.
## Your evidence bank
For 4–6 likely behavioral questions, give a STAR outline using only the candidate's real experience. If evidence is thin, say what to add to the profile.
## 7-day prep plan
One concrete action per day.
## Watch-outs
2–4 gaps or risks and how to address them honestly.
Keep it under 1000 words. Do not output JSON.`,
      "medium",
    );
    return {
      markdown,
      job_title: String(job.title ?? "this role"),
      company: job.company ?? null,
      job_id: args.jobId,
    };
  },
});

export const followUpDraftInternal = internalAction({
  args: {
    authId: v.string(),
    applicationId: v.id("job_applications"),
    instructions: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args): Promise<any> => {
    const [candidate, application] = await Promise.all([
      loadCandidate(ctx, args.authId),
      ctx.runQuery(internal.qelsaAgentTools.getApplicationDetailsInternal, {
        authId: args.authId,
        applicationId: args.applicationId,
      }),
    ]);
    if (!application.job) throw new Error("That application's job is no longer available.");
    const markdown = await writeMarkdown(
      `Write a short, professional follow-up email for a job application. The candidate applied ${application.applied_at ? `on ${new Date(application.applied_at).toDateString()}` : "recently"} and the current status is "${application.status}".

JOB
${JSON.stringify({
  title: application.job.title,
  company: application.job.company,
  location: application.job.location,
  applied_at: application.applied_at,
  status: application.status,
})}

CANDIDATE
${JSON.stringify(candidatePayload(candidate))}

${args.instructions ? `CANDIDATE INSTRUCTIONS\n${clipPlainText(args.instructions, 600)}\n` : ""}

Return only:
Subject: <subject>

<body>
Keep the body under 160 words. Be warm, specific, and low-pressure. Do not invent an interview, recruiter name, or prior conversation. Do not mention that AI wrote it.`,
      "low",
    );
    const match = markdown.match(/^Subject:\s*(.+)$/im);
    const subject = match?.[1]?.trim() ?? `Following up on ${application.job.title}`;
    const body = markdown.replace(/^Subject:\s*.+\s*/im, "").trim();
    return {
      subject,
      body,
      markdown,
      application_id: args.applicationId,
      job: application.job,
    };
  },
});

const offerValidator = v.object({
  label: v.string(),
  company: v.optional(v.string()),
  role: v.optional(v.string()),
  base_salary: v.optional(v.number()),
  bonus: v.optional(v.number()),
  equity: v.optional(v.string()),
  location: v.optional(v.string()),
  work_mode: v.optional(v.string()),
  notes: v.optional(v.string()),
});

export const compareOffersInternal = internalAction({
  args: {
    authId: v.string(),
    offers: v.array(offerValidator),
    priorities: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args): Promise<any> => {
    if (args.offers.length < 2) throw new Error("Add at least two offers to compare.");
    const candidate = await loadCandidate(ctx, args.authId);
    const markdown = await writeMarkdown(
      `Compare these job offers for the candidate and help them decide. Use only the numbers and terms supplied. Do not invent market data, equity value, taxes, or a company's budget. If an important term is missing, call it out as missing rather than guessing.

CANDIDATE
${JSON.stringify(candidatePayload(candidate))}

OFFERS
${JSON.stringify(args.offers.slice(0, 4))}

${args.priorities ? `WHAT THE CANDIDATE CARES ABOUT\n${clipPlainText(args.priorities, 600)}\n` : ""}

Return GitHub-flavored Markdown:
# Offer comparison
A table with Offer, Base, Bonus, Equity, Location / mode, and What it optimizes for.
## The real trade-offs
3–5 bullets. Include cash vs equity, stability vs upside, scope, and lifestyle only when supported by the supplied data.
## Negotiation plan
For the strongest offer, a short email/script with 3–5 concrete asks. Tie each ask to evidence from the candidate's profile or the role. Never suggest fabricating a competing offer.
## Recommendation
One paragraph with a clear next step. Keep it under 700 words.`,
      "low",
    );
    return {
      markdown,
      offers: args.offers,
    };
  },
});

export const compareJobsInternal = internalAction({
  args: {
    authId: v.string(),
    jobIds: v.array(v.id("jobs")),
  },
  returns: v.any(),
  handler: async (ctx, args): Promise<any> => {
    const ids = [...new Set(args.jobIds.map(String))].slice(0, MAX_JOBS);
    if (ids.length < 2) throw new Error("Choose at least two jobs to compare.");
    const candidate = await loadCandidate(ctx, args.authId);
    const jobs = [];
    for (const id of ids) {
      const job = await loadJob(ctx, args.authId, id);
      let readiness: any = null;
      try {
        readiness = await ctx.runQuery(internal.qelsaAgentTools.getJobReadinessInternal, {
          authId: args.authId,
          jobId: id as Id<"jobs">,
        });
      } catch {
        readiness = null;
      }
      jobs.push({ job, readiness });
    }
    const markdown = await writeMarkdown(
      `Compare these jobs for the candidate. Use only the supplied data. Readiness is skill/profile readiness; goal fit is separate and is not provided, so do not invent it. If a job has no readiness analysis, say that instead of estimating a score.

CANDIDATE
${JSON.stringify(candidatePayload(candidate))}

JOBS
${JSON.stringify(
  jobs.map(({ job, readiness: fit }) => ({
    ...jobPayload(job),
    readiness: fit?.available
      ? {
          overall: fit.overall,
          headline: fit.headline,
          strong: fit.strong?.slice(0, 8),
          missing: fit.missing?.slice(0, 8),
          can_apply: fit.can_apply,
        }
      : null,
  })),
)}

Return GitHub-flavored Markdown:
# Job comparison
A compact table with columns: Role, Company, Location, Salary, Readiness, Best for.
## How they differ
3–5 bullets comparing substance, not generic pros/cons.
## Recommendation
Name one best next step and explain the trade-off. If the data is insufficient, say what is missing.
Keep it under 650 words.`,
      "low",
    );
    return {
      markdown,
      job_ids: ids,
      jobs: jobs.map(({ job, readiness: fit }) => ({
        job_id: job.job_id,
        title: job.title,
        company: job.company ?? null,
        location: job.location ?? null,
        salary: job.salary ?? null,
        readiness: fit?.available ? fit.overall : null,
      })),
    };
  },
});
