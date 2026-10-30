import { R2 } from "@convex-dev/r2";
import { components } from "../_generated/api";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { deleteAppUserData } from "./deleteUserData";
import { deleteR2Keys } from "./r2";

const r2 = new R2(components.r2);

const BA_USER_OWNED_MODELS = [
  "session",
  "account",
  "twoFactor",
  "oauthApplication",
  "oauthAccessToken",
  "oauthConsent",
] as const;

async function deleteBetterAuthUser(ctx: MutationCtx, authId: string) {
  for (const model of BA_USER_OWNED_MODELS) {
    let cursor: string | null = null;
    for (;;) {
      const result: { isDone: boolean; continueCursor: string } = await ctx.runMutation(
        components.betterAuth.adapter.deleteMany,
        {
          input: {
            model,
            where: [{ field: "userId", value: authId }],
          },
          paginationOpts: { numItems: 100, cursor },
        },
      );
      if (result.isDone) break;
      cursor = result.continueCursor;
    }
  }
  await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
    input: {
      model: "user",
      where: [{ field: "_id", value: authId }],
    },
  });
}

/**
 * Deletes every app row for this user (profile, applications, agent data,
 * owned pages and their jobs), their R2 objects, and their Better Auth
 * identity. Shared by self-service deletion, support deletion, and the admin
 * panel so all three stay in step.
 */
export async function deleteUserAccount(ctx: MutationCtx, user: Doc<"users">) {
  const authId = user.authId;
  await ctx.runMutation(components.agent.users.deleteAllForUserIdAsync, { userId: authId });
  const r2Keys = await deleteAppUserData(ctx, user);
  await deleteR2Keys(r2, ctx, r2Keys);
  await deleteBetterAuthUser(ctx, authId);
}
