import { R2 } from "@convex-dev/r2";
import type { MutationCtx } from "../_generated/server";

/** Max signed GET TTL allowed by the R2 component (7 days). */
export const SIGNED_URL_TTL = 60 * 60 * 24 * 7;

export async function signedFileUrl(r2: R2, key: string | undefined) {
  if (!key) return undefined;
  return await r2.getUrl(key, { expiresIn: SIGNED_URL_TTL });
}

export async function deleteR2Keys(r2: R2, ctx: MutationCtx, keys: Array<string | undefined>) {
  for (const key of keys) {
    if (key) await r2.deleteObject(ctx, key);
  }
}
