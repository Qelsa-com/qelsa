import { v } from "convex/values";
import { query } from "./_generated/server";
import { checkEmployerEmail } from "./lib/employerEmail";

/**
 * Public preflight used by the employer auth screen. The authoritative checks
 * live in the auth hook and in every mutation that can grant the recruiter role.
 */
export const validateEmail = query({
  args: { email: v.string() },
  returns: v.object({
    allowed: v.boolean(),
    domain: v.string(),
    message: v.union(v.string(), v.null()),
  }),
  handler: async (_ctx, args) => checkEmployerEmail(args.email),
});
