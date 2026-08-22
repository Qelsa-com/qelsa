import { customMutation, customQuery } from "convex-helpers/server/customFunctions";
import { mutation, query } from "../_generated/server";
import { getAppUser, getAppUserOrNull } from "./auth";

export const authedQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const user = await getAppUser(ctx);
    return { ctx: { ...ctx, user }, args };
  },
});

export const authedMutation = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    const user = await getAppUser(ctx);
    return { ctx: { ...ctx, user }, args };
  },
});

export const optionalAuthQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const user = await getAppUserOrNull(ctx);
    return { ctx: { ...ctx, user }, args };
  },
});

export const adminQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const user = await getAppUser(ctx);
    if (user.role !== "admin") throw new Error("Admin access required");
    return { ctx: { ...ctx, user }, args };
  },
});

export const adminMutation = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    const user = await getAppUser(ctx);
    if (user.role !== "admin") throw new Error("Admin access required");
    return { ctx: { ...ctx, user }, args };
  },
});
