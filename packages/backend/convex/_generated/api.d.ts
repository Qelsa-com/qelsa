/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as certifications from "../certifications.js";
import type * as crons from "../crons.js";
import type * as educations from "../educations.js";
import type * as experiences from "../experiences.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as jobApplications from "../jobApplications.js";
import type * as jobs from "../jobs.js";
import type * as jobsGenerate from "../jobsGenerate.js";
import type * as jobsScraper from "../jobsScraper.js";
import type * as lib_ai from "../lib/ai.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_customFunctions from "../lib/customFunctions.js";
import type * as lib_helpers from "../lib/helpers.js";
import type * as lib_skillMatch from "../lib/skillMatch.js";
import type * as pages from "../pages.js";
import type * as resumes from "../resumes.js";
import type * as seed from "../seed.js";
import type * as seedCatalogData from "../seedCatalogData.js";
import type * as userSkills from "../userSkills.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  certifications: typeof certifications;
  crons: typeof crons;
  educations: typeof educations;
  experiences: typeof experiences;
  files: typeof files;
  http: typeof http;
  jobApplications: typeof jobApplications;
  jobs: typeof jobs;
  jobsGenerate: typeof jobsGenerate;
  jobsScraper: typeof jobsScraper;
  "lib/ai": typeof lib_ai;
  "lib/auth": typeof lib_auth;
  "lib/customFunctions": typeof lib_customFunctions;
  "lib/helpers": typeof lib_helpers;
  "lib/skillMatch": typeof lib_skillMatch;
  pages: typeof pages;
  resumes: typeof resumes;
  seed: typeof seed;
  seedCatalogData: typeof seedCatalogData;
  userSkills: typeof userSkills;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
  agent: import("@convex-dev/agent/_generated/component.js").ComponentApi<"agent">;
};
