import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { iso, withId } from "./lib/helpers";

async function hydrate(ctx: { db: { get: Function; query: Function } }, row: { _id: string } & Record<string, unknown>) {
  const certification = row.certification_id ? await ctx.db.get(row.certification_id) : null;
  const issuing_body = row.issuing_body_id ? await ctx.db.get(row.issuing_body_id) : null;
  const links = await ctx.db
    .query("user_certification_skills")
    .withIndex("by_certification", (q: { eq: Function }) => q.eq("user_certification_id", row._id))
    .collect();
  const skills = [];
  for (const link of links) {
    const skill = await ctx.db.get(link.skill_id);
    if (skill) skills.push(withId(skill));
  }
  return {
    ...withId(row),
    issue_date: iso(row.issue_date as number | undefined),
    expiration_date: iso(row.expiration_date as number | undefined),
    certification: certification ? withId(certification) : null,
    issuing_body: issuing_body ? withId(issuing_body) : null,
    skills,
  };
}

async function replaceCertificationSkills(ctx: { db: { query: Function; delete: Function; insert: Function } }, certificationId: Id<"user_certifications">, skills: unknown) {
  const existing = await ctx.db
    .query("user_certification_skills")
    .withIndex("by_certification", (q: { eq: Function }) => q.eq("user_certification_id", certificationId))
    .collect();
  for (const link of existing) await ctx.db.delete(link._id);
  for (const skill of (skills as Array<string | { id?: string }> | undefined) ?? []) {
    const skillId = typeof skill === "string" ? skill : skill.id;
    if (skillId) await ctx.db.insert("user_certification_skills", { user_certification_id: certificationId, skill_id: skillId as Id<"skills"> });
  }
}

export const list = authedQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("user_certifications")
      .withIndex("by_user", (q) => q.eq("user_id", ctx.user._id))
      .collect();
    const out = [];
    for (const row of rows) out.push(await hydrate(ctx, row));
    return out;
  },
});

export const create = authedMutation({
  args: { data: v.any() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const data = args.data as Record<string, unknown>;
    const id = await ctx.db.insert("user_certifications", {
      user_id: ctx.user._id,
      certification_id: (data.certification_id as Id<"certifications"> | undefined) ?? undefined,
      issuing_body_id: (data.issuing_body_id as Id<"issuing_bodies"> | undefined) ?? undefined,
      name: (data.name as string | undefined) ?? undefined,
      issuingOrganization: (data.issuingOrganization as string | undefined) ?? undefined,
      issue_date: data.issueDate ? new Date(data.issueDate as string).getTime() : undefined,
      expiration_date: data.expirationDate ? new Date(data.expirationDate as string).getTime() : undefined,
      does_not_expire: Boolean(data.doesNotExpire),
      credential_id: data.credentialId as string | undefined,
      credential_url: data.credentialUrl as string | undefined,
      description: data.description as string | undefined,
    });
    for (const skill of (data.skills as Array<string | { id?: string }> | undefined) ?? []) {
      const skillId = typeof skill === "string" ? skill : skill.id;
      if (skillId) await ctx.db.insert("user_certification_skills", { user_certification_id: id, skill_id: skillId as Id<"skills"> });
    }
    return hydrate(ctx, (await ctx.db.get(id))!);
  },
});

export const update = authedMutation({
  args: { id: v.id("user_certifications"), data: v.any() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (!row || row.user_id !== ctx.user._id) throw new Error("Certification not found");
    const data = args.data as Record<string, unknown>;
    const doesNotExpire = data.doesNotExpire != null ? Boolean(data.doesNotExpire) : row.does_not_expire;
    await ctx.db.patch(args.id, {
      certification_id: (data.certification_id as Id<"certifications"> | undefined) ?? row.certification_id,
      issuing_body_id: (data.issuing_body_id as Id<"issuing_bodies"> | undefined) ?? row.issuing_body_id,
      name: (data.name as string | undefined) ?? row.name,
      issuingOrganization: (data.issuingOrganization as string | undefined) ?? row.issuingOrganization,
      issue_date: data.issueDate ? new Date(data.issueDate as string).getTime() : row.issue_date,
      expiration_date: doesNotExpire ? undefined : data.expirationDate ? new Date(data.expirationDate as string).getTime() : row.expiration_date,
      does_not_expire: doesNotExpire,
      credential_id: (data.credentialId as string | undefined) ?? row.credential_id,
      credential_url: (data.credentialUrl as string | undefined) ?? row.credential_url,
      description: (data.description as string | undefined) ?? row.description,
    });
    if (data.skills !== undefined) await replaceCertificationSkills(ctx, args.id, data.skills);
    return hydrate(ctx, (await ctx.db.get(args.id))!);
  },
});

export const remove = authedMutation({
  args: { id: v.id("user_certifications") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (!row || row.user_id !== ctx.user._id) throw new Error("Certification not found");
    await ctx.db.delete(args.id);
    return null;
  },
});
