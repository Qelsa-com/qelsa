"use node";

import { v } from "convex/values";
import { z } from "zod/v3";
import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import mammoth from "mammoth";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

/* -------------------------------------------------------------------------- *
 *  Resume parsing action.
 *
 *  Runs in the Node runtime. Reads the uploaded file from Convex storage and
 *  asks Gemini for a structured, editable draft that the "Check your details"
 *  screen renders.
 *
 *  PDFs are sent to Gemini as a native file part (Gemini reads PDFs directly,
 *  so no server-side PDF text extraction is needed — pdf.js pulls browser
 *  globals that Convex's module analyzer rejects). DOCX has no native model
 *  support, so we extract its text with mammoth (pure JS) and send that.
 *
 *  Gemini is used because it's free and the key is already available; the AI
 *  call is isolated here so swapping to OpenRouter/Claude later is a one-file
 *  change. If GEMINI_API_KEY isn't set on the deployment we throw a clear error.
 * -------------------------------------------------------------------------- */

const draftSchema = z.object({
  full_name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  location: z.string().nullable(),
  linkedin_url: z.string().nullable(),
  summary: z.string().nullable(),
  experience: z.array(
    z.object({
      company: z.string().nullable(),
      role: z.string().nullable(),
      start_date: z.string().nullable(),
      end_date: z.string().nullable(),
      is_current: z.boolean().optional(),
      description: z.string().nullable(),
      responsibilities: z.array(z.string()),
      tools: z.array(z.string()),
    }),
  ),
  education: z.array(
    z.object({
      degree: z.string().nullable(),
      field_of_study: z.string().nullable(),
      institution: z.string().nullable(),
      start_year: z.number().nullable(),
      end_year: z.number().nullable(),
    }),
  ),
  skills: z.array(z.string()),
  certifications: z.array(z.string()),
  languages: z.array(z.string()),
});

const SYSTEM_PROMPT = `You extract structured data from a resume/CV. Return ONLY the fields in the schema.
Rules:
- Use ONLY information present in the resume. Never invent employers, dates, degrees, or skills.
- Dates: copy them as written (e.g. "Jan 2022", "16th February 2022", "2019", "Present").
- start_year / end_year for education are 4-digit numbers, or null if absent.
- responsibilities: short bullet phrases for that role. tools: technologies/tools used in that role.
- skills: a flat, de-duplicated list of the candidate's skills.
- If a field is genuinely absent, use null (or an empty array). Do not guess.`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The prompt content we hand Gemini: a native PDF file part, or extracted
 *  DOCX text. `content` matches the AI SDK user-message content shape. */
type PromptContent = Array<
  | { type: "text"; text: string }
  | { type: "file"; data: Buffer; mediaType: string }
>;

async function buildContent(buffer: Buffer, mime: string, title: string): Promise<PromptContent> {
  const name = title.toLowerCase();
  const isPdf = mime.includes("pdf") || name.endsWith(".pdf");
  const isDocx =
    mime.includes("wordprocessingml") || mime.includes("officedocument") || name.endsWith(".docx");

  if (isPdf) {
    // Gemini reads PDFs natively — hand it the bytes, no text extraction.
    return [
      { type: "text", text: "Extract the structured resume from the attached PDF." },
      { type: "file", data: buffer, mediaType: "application/pdf" },
    ];
  }
  if (isDocx) {
    const { value } = await mammoth.extractRawText({ buffer });
    const text = (value || "").trim();
    if (text.length < 20) {
      throw new Error("We couldn't read any text from this DOCX. Please try a PDF instead.");
    }
    return [{ type: "text", text: `Extract the structured resume from this text:\n\n${text.slice(0, 40000)}` }];
  }
  throw new Error("Unsupported file type. Please upload a PDF or DOCX.");
}

async function extractWithGemini(content: PromptContent) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Set it on the Convex deployment: `npx convex env set GEMINI_API_KEY <key>`.",
    );
  }
  const google = createGoogleGenerativeAI({ apiKey });
  const model = google(process.env.GEMINI_MODEL ?? "gemini-flash-lite-latest");

  const maxAttempts = 4;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { object } = await generateObject({
        model,
        schema: draftSchema,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content }],
        temperature: 0,
      });
      return { ...object, _source: "gemini" as const };
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const retriable = /503|429|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|high demand/i.test(msg);
      if (!retriable || attempt === maxAttempts) break;
      await sleep(attempt * 1500);
    }
  }
  throw lastErr;
}

export const parse = action({
  args: { resumeId: v.id("resumes") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const info: { storageId: string | null; title: string } = await ctx.runQuery(
      internal.resumes.loadForParse,
      { resumeId: args.resumeId },
    );
    if (!info.storageId) throw new Error("Resume file is missing.");

    const blob = await ctx.storage.get(info.storageId as never);
    if (!blob) throw new Error("Resume file is missing.");
    const buffer = Buffer.from(await blob.arrayBuffer());

    const content = await buildContent(buffer, blob.type || "", info.title || "");
    const draft = await extractWithGemini(content);
    return { draft };
  },
});
