/**
 * Recruiter-side writing helpers for Qelsa Agent. Drafts only; sending belongs
 * to the recruiter's own email or messaging tool.
 */

import { generateText } from "ai";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { createAgentChatModel, requireOpenRouter } from "./lib/ai";
import { clipPlainText } from "./lib/skillMatch";

export const draftOutreachInternal = internalAction({
  args: {
    authId: v.string(),
    applicationId: v.id("job_applications"),
    channel: v.optional(v.string()),
    instructions: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args): Promise<any> => {
    const context: any = await ctx.runQuery(internal.qelsaRecruiterTools.getApplicantContextInternal, {
      authId: args.authId,
      applicationId: args.applicationId,
    });
    const channel = args.channel === "linkedin" || args.channel === "in_app" ? args.channel : "email";
    requireOpenRouter();
    const response = await generateText({
      model: createAgentChatModel("low"),
      temperature: 0.4,
      maxRetries: 2,
      timeout: { totalMs: 60_000 },
      prompt: `Draft a short outreach message from a recruiter to an applicant. Use only the supplied job and applicant evidence. Never invent a mutual connection, a salary, an interview, or a company fact. Never say AI wrote it.

CHANNEL: ${channel}
JOB
${JSON.stringify(context.job)}

APPLICANT
${JSON.stringify({
  name: context.applicant?.name,
  headline: context.applicant?.headline,
  summary: clipPlainText(context.applicant?.summary, 900),
  location: context.applicant?.location,
  skills: (context.applicant?.skills ?? []).slice(0, 12),
  experiences: (context.applicant?.experiences ?? []).slice(0, 5),
})}

${args.instructions ? `RECRUITER INSTRUCTIONS\n${clipPlainText(args.instructions, 600)}\n` : ""}

Rules:
- Email: 90–150 words, with a specific subject line. LinkedIn: under 70 words. In-app: under 100 words.
- Mention one concrete reason from the applicant's background and one clear next step.
- Be warm and direct; no generic flattery.
${channel === "email" ? 'Return "Subject: ..." followed by a blank line and the body.' : "Return only the message body."}`,
    });
    const raw = response.text.trim();
    if (!raw) throw new Error("The outreach draft came back empty. Try again.");
    const subject = channel === "email" ? raw.match(/^Subject:\s*(.+)$/im)?.[1]?.trim() : undefined;
    const body = channel === "email" ? raw.replace(/^Subject:\s*.+\s*/im, "").trim() : raw;
    return {
      channel,
      subject: subject ?? null,
      body,
      markdown: channel === "email" ? `Subject: ${subject ?? "Next step"}\n\n${body}` : body,
      application_id: args.applicationId,
      applicant: context.applicant,
      job: context.job,
    };
  },
});
