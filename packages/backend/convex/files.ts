import { R2 } from "@convex-dev/r2";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { SIGNED_URL_TTL } from "./lib/r2";

const r2 = new R2(components.r2);

async function requireIdentity(ctx: { auth: { getUserIdentity: () => Promise<unknown> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
}

export const { generateUploadUrl, syncMetadata } = r2.clientApi<DataModel>({
  checkUpload: requireIdentity,
});

export const { generateUploadUrl: generateResumeUploadUrl, syncMetadata: syncResumeMetadata } = r2.clientApi<DataModel>({
  checkUpload: async () => {},
});

export const getUrl = query({
  args: { key: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    return await r2.getUrl(args.key, { expiresIn: SIGNED_URL_TTL });
  },
});
