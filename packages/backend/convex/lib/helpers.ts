import { v } from "convex/values";
import type { Doc } from "../_generated/dataModel";

export function withId<T extends { _id: string }>(doc: T) {
  return { ...doc, id: doc._id };
}

export function iso(value?: number | null) {
  if (value == null) return null;
  return new Date(value).toISOString();
}

export const idString = v.string();

export function asUserJson(user: Doc<"users"> & { city?: unknown; culture_preference?: unknown; resumes?: unknown }) {
  return {
    ...withId(user),
    dob: iso(user.dob),
    last_login_at: iso(user.last_login_at),
  };
}
