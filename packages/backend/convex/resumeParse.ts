"use node";

import { Agent } from "@convex-dev/agent";
import { v } from "convex/values";
import mammoth from "mammoth";
import { extractText } from "unpdf";
import { components } from "./_generated/api";
import { action } from "./_generated/server";
import { AI_AGENT_MODEL, requireOpenRouter } from "./lib/ai";
import { parsedProfileSchema, parsedProfileValidator, toParsedProfile } from "./lib/parsedProfile";
import { clipPlainText } from "./lib/skillMatch";

const MAX_BYTES = 10 * 1024 * 1024;

export const parseResume = action({
  args: {
    storageId: v.id("_storage"),
    filename: v.string(),
    contentType: v.optional(v.string()),
  },
  returns: parsedProfileValidator,
  handler: async (ctx, args) => {
    const blob = await ctx.storage.get(args.storageId);
    if (!blob) throw new Error("Resume file not found. Please upload again.");
    if (blob.size > MAX_BYTES) throw new Error("File is larger than 10 MB.");

    const buffer = new Uint8Array(await blob.arrayBuffer());
    const name = args.filename.toLowerCase();
    const type = (args.contentType || blob.type || "").toLowerCase();
    const text = await extractResumeText(buffer, name, type);
    const source = clipPlainText(text, 14000);
    if (source.length < 40) {
      throw new Error("We couldn't read enough text from that file. Try a text-based PDF or DOCX.");
    }

    const openRouter = requireOpenRouter();
    const agent = new Agent(components.agent, {
      name: "Resume Reader",
      languageModel: openRouter.chat(AI_AGENT_MODEL),
      instructions:
        "Extract a candidate profile from resume text. Do not invent employers, degrees, dates, or skills that are not clearly present. Use null for unknown fields. Keep descriptions concise.",
      maxSteps: 1,
    });

    const identity = await ctx.auth.getUserIdentity();
    const result: { object: typeof parsedProfileSchema._type } = await agent.generateObject(
      ctx,
      { userId: identity?.subject ?? "resume-parse" },
      {
        schema: parsedProfileSchema,
        prompt: `Extract the candidate profile into the schema.\n\n${source}`,
      },
    );

    return toParsedProfile(result.object);
  },
});

async function extractResumeText(buffer: Uint8Array, filename: string, contentType: string) {
  if (filename.endsWith(".docx") || contentType.includes("wordprocessingml") || contentType.includes("officedocument")) {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
    return result.value;
  }
  if (filename.endsWith(".pdf") || contentType.includes("pdf")) {
    const extracted = await extractText(buffer, { mergePages: true });
    return extracted.text;
  }
  throw new Error("Use a PDF or DOCX file.");
}
