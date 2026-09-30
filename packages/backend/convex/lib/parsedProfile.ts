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

export const parsedCertificationValidator = v.object({
  name: v.string(),
  issuing_organization: v.optional(v.string()),
  issue_date: v.optional(v.string()),
  expiration_date: v.optional(v.string()),
  does_not_expire: v.optional(v.boolean()),
  credential_id: v.optional(v.string()),
  credential_url: v.optional(v.string()),
  skills: v.optional(v.array(v.string())),
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
  certifications: v.optional(v.array(parsedCertificationValidator)),
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

export type ParsedCertification = {
  name: string;
  issuing_organization?: string;
  issue_date?: string;
  expiration_date?: string;
  does_not_expire?: boolean;
  credential_id?: string;
  credential_url?: string;
  skills?: string[];
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
  certifications?: ParsedCertification[];
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function optionalString(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function asStringList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return value.split(/[,;\n]/);
  return [];
}

function compactStrings(values: unknown) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of asStringList(values)) {
    const text =
      optionalString(value) ??
      optionalString(asRecord(value).name) ??
      optionalString(asRecord(value).skill);
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

function coerceYear(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value >= 1900 && value <= 2100) {
    return Math.round(value);
  }
  if (typeof value === "string") {
    const match = value.match(/\b(19|20)\d{2}\b/);
    return match ? Number(match[0]) : undefined;
  }
  return undefined;
}

function experienceHighlights(description: string | undefined, responsibilities: string[]) {
  if (responsibilities.length) return responsibilities;
  if (!description) return [];
  return description
    .split(/\n+/)
    .map((line) => line.replace(/^[-•*]\s+/, "").trim())
    .filter(Boolean);
}

function isCurrentRole(value: unknown, end: string | undefined) {
  if (value === true || value === "true") return true;
  if (typeof value === "string" && /present|current|now/i.test(value)) return true;
  return /present|current|now/i.test(end ?? "");
}

export function parseJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? trimmed).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

export function toParsedProfile(raw: unknown): ParsedProfile {
  const obj = asRecord(raw);
  const experiences: ParsedExperience[] = [];
  for (const row of Array.isArray(obj.experiences) ? obj.experiences : []) {
    const item = asRecord(row);
    const company = optionalString(item.company) ?? "";
    const title = optionalString(item.title) ?? "";
    if (!company && !title) continue;
    const start = optionalString(item.start);
    const end = optionalString(item.end);
    const responsibilities = experienceHighlights(optionalString(item.description), compactStrings(item.responsibilities));
    const tools = compactStrings(item.tools);
    experiences.push({
      company: company || title,
      title: title || company,
      is_current: isCurrentRole(item.is_current, end),
      ...(start ? { start } : {}),
      ...(end ? { end } : {}),
      ...(responsibilities.length ? { responsibilities } : {}),
      ...(tools.length ? { tools } : {}),
    });
    if (experiences.length >= 12) break;
  }

  const educations: ParsedEducation[] = [];
  for (const row of Array.isArray(obj.educations) ? obj.educations : []) {
    const item = asRecord(row);
    const school = optionalString(item.school);
    if (!school) continue;
    const degree = optionalString(item.degree);
    const field = optionalString(item.field);
    const start_year = coerceYear(item.start_year);
    const end_year = coerceYear(item.end_year);
    educations.push({
      school,
      ...(degree ? { degree } : {}),
      ...(field ? { field } : {}),
      ...(start_year ? { start_year } : {}),
      ...(end_year ? { end_year } : {}),
    });
    if (educations.length >= 8) break;
  }

  const certifications: ParsedCertification[] = [];
  for (const row of Array.isArray(obj.certifications) ? obj.certifications : []) {
    const item = asRecord(row);
    const name = optionalString(item.name) ?? optionalString(item.title) ?? "";
    if (!name) continue;
    const issuer = optionalString(item.issuing_organization) ?? optionalString(item.issuingOrganization) ?? optionalString(item.issuer);
    const issue_date = optionalString(item.issue_date) ?? optionalString(item.issueDate);
    const expiration_date = optionalString(item.expiration_date) ?? optionalString(item.expirationDate);
    const does_not_expire = item.does_not_expire === true || item.doesNotExpire === true;
    const credential_id = optionalString(item.credential_id) ?? optionalString(item.credentialId);
    const credential_url = optionalString(item.credential_url) ?? optionalString(item.credentialUrl);
    const certSkills = compactStrings(item.skills);
    certifications.push({
      name,
      ...(issuer ? { issuing_organization: issuer } : {}),
      ...(issue_date ? { issue_date } : {}),
      ...(expiration_date ? { expiration_date } : {}),
      ...(does_not_expire ? { does_not_expire: true } : {}),
      ...(credential_id ? { credential_id } : {}),
      ...(credential_url ? { credential_url } : {}),
      ...(certSkills.length ? { skills: certSkills } : {}),
    });
    if (certifications.length >= 10) break;
  }

  const name = optionalString(obj.name);
  const email = optionalString(obj.email);
  const phone = optionalString(obj.phone);
  const location = optionalString(obj.location);
  const linkedin_url = optionalString(obj.linkedin_url);
  const summary = optionalString(obj.summary);
  const headline = optionalString(obj.headline);

  return {
    ...(name ? { name } : {}),
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
    ...(location ? { location } : {}),
    ...(linkedin_url ? { linkedin_url } : {}),
    ...(summary ? { summary } : {}),
    ...(headline ? { headline } : {}),
    experiences,
    educations,
    skills: compactStrings(obj.skills).slice(0, 24),
    certifications,
  };
}

export const emptyParsedProfile = (): ParsedProfile => ({
  experiences: [],
  educations: [],
  skills: [],
  certifications: [],
});

function toLlmProfile(raw: unknown) {
  const profile = toParsedProfile(raw);
  return {
    name: profile.name ?? null,
    email: profile.email ?? null,
    phone: profile.phone ?? null,
    location: profile.location ?? null,
    linkedin_url: profile.linkedin_url ?? null,
    summary: profile.summary ?? null,
    headline: profile.headline ?? null,
    experiences: profile.experiences.map((item) => ({
      company: item.company,
      title: item.title,
      start: item.start ?? null,
      end: item.end ?? null,
      is_current: item.is_current,
      description: null,
      responsibilities: item.responsibilities ?? [],
      tools: item.tools ?? [],
    })),
    educations: profile.educations.map((item) => ({
      school: item.school,
      degree: item.degree ?? null,
      field: item.field ?? null,
      start_year: item.start_year ?? null,
      end_year: item.end_year ?? null,
    })),
    skills: profile.skills,
    certifications: (profile.certifications ?? []).map((item) => ({
      name: item.name,
      issuing_organization: item.issuing_organization ?? null,
      issue_date: item.issue_date ?? null,
      expiration_date: item.expiration_date ?? null,
      does_not_expire: Boolean(item.does_not_expire),
      credential_id: item.credential_id ?? null,
      credential_url: item.credential_url ?? null,
      skills: item.skills ?? [],
    })),
  };
}

export function repairProfileJson(text: string) {
  const parsed = parseJsonObject(text);
  return parsed ? JSON.stringify(toLlmProfile(parsed)) : null;
}

export const parsedExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  start: z.string().nullable(),
  end: z.string().nullable(),
  is_current: z.boolean(),
  description: z.string().nullable(),
  responsibilities: z.array(z.string()),
  tools: z.array(z.string()),
});

export const parsedEducationSchema = z.object({
  school: z.string(),
  degree: z.string().nullable(),
  field: z.string().nullable(),
  start_year: z.number().nullable(),
  end_year: z.number().nullable(),
});

export const parsedCertificationSchema = z.object({
  name: z.string(),
  issuing_organization: z.string().nullable(),
  issue_date: z.string().nullable(),
  expiration_date: z.string().nullable(),
  does_not_expire: z.boolean(),
  credential_id: z.string().nullable(),
  credential_url: z.string().nullable(),
  skills: z.array(z.string()),
});

export const parsedProfileSchema = z.preprocess(
  toLlmProfile,
  z.object({
    name: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    location: z.string().nullable(),
    linkedin_url: z.string().nullable(),
    summary: z.string().nullable(),
    headline: z.string().nullable(),
    experiences: z.array(parsedExperienceSchema),
    educations: z.array(parsedEducationSchema),
    skills: z.array(z.string()),
    certifications: z.array(parsedCertificationSchema),
  }),
);
