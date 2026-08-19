"use node";

import { Agent } from "@convex-dev/agent";
import { v } from "convex/values";
import { z } from "zod/v3";
import { components, internal } from "./_generated/api";
import { action, type ActionCtx } from "./_generated/server";
import { AI_AGENT_MODEL, openRouter } from "./lib/ai";
import {
  criteriaToChips,
  looksLikeNaturalLanguage,
  mergeCriteria,
  parseKeywordCriteria,
  rankApplicants,
  searchResultValidator,
  type ApplicantSearchCriteria,
  type ApplicantSearchDoc,
} from "./lib/applicantSearch";

const parsedQuerySchema = z.object({
  skills: z.array(z.string()).max(12),
  companies: z.array(z.string()).max(8),
  titles: z.array(z.string()).max(8),
  location: z.string().nullable(),
  education: z.string().nullable(),
  min_years: z.number().nullable(),
  status: z
    .enum(["applied", "viewed", "sorted", "rejected", "hold", "cancelled"])
    .nullable(),
  min_readiness: z.number().nullable(),
  workplace: z.enum(["on-site", "hybrid", "remote"]).nullable(),
  skill_gaps: z.array(z.string()).max(6),
  semantic_terms: z.array(z.string()).max(8),
  rank_by: z.enum(["relevance", "readiness", "experience"]),
  job_fit: z.enum(["best", "strong", "gaps_ok"]).nullable(),
});

export const searchNatural = action({
  args: {
    jobId: v.id("jobs"),
    query: v.string(),
    status: v.optional(v.string()),
    min_years: v.optional(v.number()),
    min_readiness: v.optional(v.number()),
  },
  returns: searchResultValidator,
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const payload = await ctx.runQuery(internal.applicantSearch.loadForOwner, {
      authId: identity.subject,
      jobId: args.jobId,
    });
    const docs = payload.docs as ApplicantSearchDoc[];
    const extras: Partial<ApplicantSearchCriteria> = {
      status: args.status,
      min_years: args.min_years,
      min_readiness: args.min_readiness,
    };
    const keyword = mergeCriteria(parseKeywordCriteria(args.query), extras);

    if (!looksLikeNaturalLanguage(args.query) || !openRouter) {
      return {
        mode: "keyword" as const,
        chips: criteriaToChips(keyword),
        hits: rankApplicants(docs, keyword),
      };
    }

    try {
      const parsed = await parseQuery(ctx, args.query, payload.job);
      const criteria = mergeCriteria(keyword, {
        skills: parsed.skills,
        companies: parsed.companies,
        titles: parsed.titles,
        location: parsed.location ?? undefined,
        education: parsed.education ?? undefined,
        min_years: parsed.min_years ?? undefined,
        status: parsed.status ?? undefined,
        min_readiness: parsed.min_readiness ?? undefined,
        workplace: parsed.workplace ?? undefined,
        skill_gaps: parsed.skill_gaps,
        semantic_terms: parsed.semantic_terms,
        rank_by: parsed.rank_by,
        job_fit: parsed.job_fit ?? undefined,
      });
      return {
        mode: "natural" as const,
        chips: criteriaToChips(criteria),
        hits: rankApplicants(docs, criteria),
      };
    } catch (error) {
      console.error("Applicant NL search fell back to keyword", error);
      return {
        mode: "keyword" as const,
        chips: criteriaToChips(keyword),
        hits: rankApplicants(docs, keyword),
      };
    }
  },
});

async function parseQuery(
  ctx: ActionCtx,
  query: string,
  job: {
    title: string;
    company?: string;
    location?: string;
    description: string;
    workplace_type?: string;
    experience?: number;
    skills: string[];
  },
) {
  const agent = new Agent(components.agent, {
    name: "Applicant Search",
    languageModel: openRouter!.chat(AI_AGENT_MODEL),
    instructions:
      "Extract recruiter search criteria from a query. Do not invent skills, companies, or locations that are not implied by the query. Use the job context only when the query refers to this role, best fit, gaps, or required skills. Prefer null over guessing.",
    maxSteps: 1,
  });

  const result: { object: z.infer<typeof parsedQuerySchema> } = await agent.generateObject(
    ctx,
    { userId: "applicant-search" },
    {
      schema: parsedQuerySchema,
      prompt: `Parse this recruiter query into the schema.

JOB
${JSON.stringify({
  title: job.title,
  company: job.company,
  location: job.location,
  workplace_type: job.workplace_type,
  experience_years: job.experience,
  required_skills: job.skills,
  description: job.description.slice(0, 1200),
})}

QUERY
${query}

Rules:
- status "sorted" means shortlisted.
- job_fit "best" for strongest / best fit for this role.
- job_fit "gaps_ok" when the recruiter accepts missing preferred skills.
- semantic_terms are concepts to match in experience text (e.g. "scalable applications").
- Leave arrays empty when the query does not mention them.`,
    },
  );

  const raw = result.object as z.infer<typeof parsedQuerySchema>;
  return {
    skills: compact(raw.skills),
    companies: compact(raw.companies),
    titles: compact(raw.titles),
    location: raw.location?.trim() || null,
    education: raw.education?.trim() || null,
    min_years: raw.min_years,
    status: raw.status,
    min_readiness: raw.min_readiness,
    workplace: raw.workplace,
    skill_gaps: compact(raw.skill_gaps),
    semantic_terms: compact(raw.semantic_terms),
    rank_by: raw.rank_by ?? "relevance",
    job_fit: raw.job_fit,
  };
}

function compact(values: Array<string | undefined> | undefined) {
  return (values ?? []).map((value) => value?.trim()).filter((value): value is string => Boolean(value));
}
