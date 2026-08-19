import { v } from "convex/values";
import { z } from "zod/v3";

export const parsedExperienceValidator = v.object({
  company: v.string(),
  title: v.string(),
  start: v.optional(v.string()),
  end: v.optional(v.string()),
  is_current: v.boolean(),
  description: v.optional(v.string()),
  responsibilities: v.optional(v.array(v.string())),
  tools: v.optional(v.array(v.string())),
});

export const parsedEducationValidator = v.object({
  school: v.string(),
  degree: v.optional(v.string()),
  field: v.optional(v.string()),
  start_year: v.optional(v.number()),
  end_year: v.optional(v.number()),
});

export const parsedProfileValidator = v.object({
  name: v.optional(v.string()),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  location: v.optional(v.string()),
  linkedin_url: v.optional(v.string()),
  summary: v.optional(v.string()),
  headline: v.optional(v.string()),
  experiences: v.array(parsedExperienceValidator),
  educations: v.array(parsedEducationValidator),
  skills: v.array(v.string()),
});

export const parsedExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  start: z.string().nullable(),
  end: z.string().nullable(),
  is_current: z.boolean(),
  description: z.string().nullable(),
  responsibilities: z.array(z.string()).max(12),
  tools: z.array(z.string()).max(12),
});

export const parsedEducationSchema = z.object({
  school: z.string(),
  degree: z.string().nullable(),
  field: z.string().nullable(),
  start_year: z.number().nullable(),
  end_year: z.number().nullable(),
});

export const parsedProfileSchema = z.object({
  name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  location: z.string().nullable(),
  linkedin_url: z.string().nullable(),
  summary: z.string().nullable(),
  headline: z.string().nullable(),
  experiences: z.array(parsedExperienceSchema).max(12),
  educations: z.array(parsedEducationSchema).max(8),
  skills: z.array(z.string()).max(24),
});

export type ParsedExperience = {
  company: string;
  title: string;
  start?: string;
  end?: string;
  is_current: boolean;
  description?: string;
  responsibilities?: string[];
  tools?: string[];
};

export type ParsedEducation = {
  school: string;
  degree?: string;
  field?: string;
  start_year?: number;
  end_year?: number;
};

export type ParsedProfile = {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin_url?: string;
  summary?: string;
  headline?: string;
  experiences: ParsedExperience[];
  educations: ParsedEducation[];
  skills: string[];
};

function optionalString(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function compactStrings(values: Array<string | null | undefined> | undefined) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values ?? []) {
    const trimmed = value?.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

export function toParsedProfile(raw: z.infer<typeof parsedProfileSchema>): ParsedProfile {
  return {
    name: optionalString(raw.name),
    email: optionalString(raw.email),
    phone: optionalString(raw.phone),
    location: optionalString(raw.location),
    linkedin_url: optionalString(raw.linkedin_url),
    summary: optionalString(raw.summary),
    headline: optionalString(raw.headline),
    experiences: raw.experiences.map((row) => ({
      company: row.company.trim(),
      title: row.title.trim(),
      start: optionalString(row.start),
      end: optionalString(row.end),
      is_current: row.is_current,
      description: optionalString(row.description),
      responsibilities: compactStrings(row.responsibilities),
      tools: compactStrings(row.tools),
    })),
    educations: raw.educations.map((row) => ({
      school: row.school.trim(),
      degree: optionalString(row.degree),
      field: optionalString(row.field),
      start_year: row.start_year ?? undefined,
      end_year: row.end_year ?? undefined,
    })),
    skills: raw.skills.map((skill) => skill.trim()).filter(Boolean),
  };
}

export const emptyParsedProfile = (): ParsedProfile => ({
  experiences: [],
  educations: [],
  skills: [],
});
