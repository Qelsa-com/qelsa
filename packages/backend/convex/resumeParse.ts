"use node";

import { Agent } from "@convex-dev/agent";
import { v } from "convex/values";
import mammoth from "mammoth";
import { extractText } from "unpdf";
import { R2 } from "@convex-dev/r2";
import { components } from "./_generated/api";
import { action, internalAction } from "./_generated/server";
import { AI_AGENT_MODEL, requireOpenRouter } from "./lib/ai";
import { parsedProfileSchema, parsedProfileValidator, parseJsonObject, repairProfileJson, toParsedProfile } from "./lib/parsedProfile";
import { clipPlainText } from "./lib/skillMatch";

const r2 = new R2(components.r2);

const MAX_BYTES = 10 * 1024 * 1024;
const MIN_TEXT_CHARS = 40;
const MAX_DOCX_IMAGES = 8;

const INSTRUCTIONS = `Extract a candidate profile from the resume.
- Use only information present in the resume. Never invent employers, dates, degrees, or skills.
- Copy dates as written, including ordinals (e.g. "16th February 2022", "Jan 2022", "Present").
- responsibilities: short bullet phrases listed for that role. Use [] if none.
- Put role highlights only in responsibilities. Leave description null — do not duplicate bullets into description.
- tools: technologies or tools used in that role. Use [] if none.
- experiences, educations, and skills must be arrays. Use [] when absent, never omit them.
- is_current must be true or false, never omit it.
- start_year and end_year must be numbers like 2019, or null — never strings.
- Use null for missing strings. Never omit required keys.`;

type ResumeKind = "pdf" | "docx" | "image";
type UserPart =
  | { type: "text"; text: string }
  | { type: "file"; data: Uint8Array; mediaType: string; filename: string }
  | { type: "image"; image: Uint8Array; mediaType: string };

export const extractStoredDocument = internalAction({
  args: {
    storageId: v.string(),
    filename: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (_ctx, args) => {
    const url = await r2.getUrl(args.storageId);
    const response = await fetch(url);
    if (!response.ok) return "";
    const blob = await response.blob();
    if (blob.size > MAX_BYTES) return "";
    const buffer = new Uint8Array(await blob.arrayBuffer());
    const name = (args.filename || "").toLowerCase();
    const type = blob.type.toLowerCase();
    if (name.endsWith(".txt") || name.endsWith(".md") || type.startsWith("text/")) {
      return clipPlainText(await blob.text(), 14000);
    }
    try {
      return await extractResumeText(buffer, classifyResume(name || "resume.pdf", type));
    } catch {
      return clipPlainText(await blob.text(), 14000);
    }
  },
});

export const parseResume = action({
  args: {
    storageId: v.string(),
    filename: v.string(),
    contentType: v.optional(v.string()),
  },
  returns: parsedProfileValidator,
  handler: async (ctx, args) => {
    const url = await r2.getUrl(args.storageId);
    const response = await fetch(url);
    if (!response.ok) throw new Error("Resume file not found. Please upload again.");
    const blob = await response.blob();
    if (blob.size > MAX_BYTES) throw new Error("File is larger than 10 MB.");

    const buffer = new Uint8Array(await blob.arrayBuffer());
    const name = args.filename.toLowerCase();
    const type = (args.contentType || blob.type || "").toLowerCase();
    const kind = classifyResume(name, type);
    const source = await extractResumeText(buffer, kind);

    const openRouter = requireOpenRouter();
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject ?? "resume-parse";

    if (source.length >= MIN_TEXT_CHARS) {
      return await readProfile(ctx, openRouter, userId, false, {
        prompt: `Extract the candidate profile into the schema.\n\n${source}`,
      });
    }

    const parts = await multimodalParts(buffer, kind, name, type, source);
    if (parts.length <= 1) {
      throw new Error(
        kind === "docx"
          ? "We couldn't read that Word file. Export it as a PDF or image and try again."
          : "We couldn't read that resume. Try a PDF, DOCX, PNG, or JPG.",
      );
    }

    return await readProfile(ctx, openRouter, userId, kind === "pdf", {
      messages: [{ role: "user", content: parts }],
    });
  },
});

async function readProfile(
  ctx: Parameters<Agent["generateObject"]>[0],
  openRouter: ReturnType<typeof requireOpenRouter>,
  userId: string,
  pdfOcr: boolean,
  input: { prompt: string } | { messages: Array<{ role: "user"; content: UserPart[] }> },
) {
  const agent = new Agent(components.agent, {
    name: "Resume Reader",
    languageModel: openRouter.chat(
      AI_AGENT_MODEL,
      pdfOcr
        ? { plugins: [{ id: "file-parser", pdf: { engine: "mistral-ocr" } }] }
        : undefined,
    ),
    instructions: INSTRUCTIONS,
    maxSteps: 1,
  });

  const result = await withRetry(async () => {
    try {
      return await agent.generateObject(
        ctx,
        { userId },
        {
          schema: parsedProfileSchema,
          experimental_repairText: async ({ text }) => repairProfileJson(text) ?? text,
          ...input,
        },
      );
    } catch (error) {
      const repaired = repairParsedProfile(error);
      if (repaired) return { object: repaired };
      throw error;
    }
  });
  return toParsedProfile(result.object);
}

function unwrapErrorValue(error: unknown): unknown {
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

function repairParsedProfile(error: unknown) {
  const parsed = unwrapErrorValue(error);
  if (!parsed) return null;
  const profile = toParsedProfile(parsed);
  if (!profile.name && profile.experiences.length === 0 && profile.educations.length === 0 && profile.skills.length === 0) {
    return null;
  }
  return profile;
}

function classifyResume(filename: string, contentType: string): ResumeKind {
  if (filename.endsWith(".pdf") || contentType.includes("pdf")) return "pdf";
  if (filename.endsWith(".docx") || contentType.includes("wordprocessingml") || contentType.includes("officedocument")) {
    return "docx";
  }
  if (imageMediaType(filename, contentType)) return "image";
  throw new Error("Use a PDF, DOCX, PNG, or JPG.");
}

function imageMediaType(filename: string, contentType: string) {
  if (contentType.startsWith("image/")) {
    if (contentType.includes("png")) return "image/png";
    if (contentType.includes("webp")) return "image/webp";
    if (contentType.includes("gif")) return "image/gif";
    if (contentType.includes("jpeg") || contentType.includes("jpg")) return "image/jpeg";
  }
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".webp")) return "image/webp";
  if (filename.endsWith(".gif")) return "image/gif";
  if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
  return null;
}

async function extractResumeText(buffer: Uint8Array, kind: ResumeKind) {
  if (kind === "image") return "";
  try {
    if (kind === "docx") {
      const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
      return clipPlainText(result.value, 14000);
    }
    const extracted = await extractText(buffer, { mergePages: true });
    return clipPlainText(extracted.text, 14000);
  } catch {
    return "";
  }
}

async function multimodalParts(
  buffer: Uint8Array,
  kind: ResumeKind,
  filename: string,
  contentType: string,
  source: string,
): Promise<UserPart[]> {
  const parts: UserPart[] = [
    {
      type: "text",
      text: source
        ? `Extract the candidate profile into the schema. Readable text was sparse; use the attached resume.\n\n${source}`
        : "Extract the candidate profile into the schema from the attached resume.",
    },
  ];

  if (kind === "pdf") {
    parts.push({ type: "file", data: buffer, mediaType: "application/pdf", filename: filename || "resume.pdf" });
    return parts;
  }

  if (kind === "image") {
    const mediaType = imageMediaType(filename, contentType) ?? "image/jpeg";
    parts.push({ type: "image", image: buffer, mediaType });
    return parts;
  }

  for (const image of await extractDocxImages(buffer)) {
    parts.push({ type: "image", image: image.data, mediaType: image.mediaType });
  }
  return parts;
}

async function extractDocxImages(buffer: Uint8Array) {
  const images: Array<{ data: Uint8Array; mediaType: string }> = [];
  await mammoth.convertToHtml(
    { buffer: Buffer.from(buffer) },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        if (images.length >= MAX_DOCX_IMAGES) return { src: "" };
        const mediaType = image.contentType?.toLowerCase() ?? "";
        if (!mediaType.startsWith("image/") || mediaType.includes("wmf") || mediaType.includes("emf")) {
          return { src: "" };
        }
        const data = new Uint8Array(await image.readAsArrayBuffer());
        if (data.byteLength > 0) images.push({ data, mediaType });
        return { src: "" };
      }),
    },
  );
  return images;
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const retriable = /503|429|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|high demand|rate limit|did not match schema|No object generated/i.test(
        message,
      );
      if (!retriable || attempt === attempts) {
        if (/did not match schema|No object generated/i.test(message)) {
          throw new Error("We couldn't read that resume. Try a clearer PDF or DOCX.");
        }
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
  throw lastError;
}
