import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { listExternalCourses } from "./lib/courseCatalog";
import { skillMatchKey } from "./lib/skillMatch";

const MAX_PUBLISHED = 200;

function summary(track: Doc<"interview_prep_tracks">) {
  return {
    id: track._id,
    slug: track.slug,
    title: track.title,
    role_family: track.role_family,
    level: track.level,
    summary: track.summary,
    skills: track.skills,
    interview_types: track.interview_types,
    question_count: track.question_count,
    estimated_minutes: track.estimated_minutes,
    quality_score: track.quality_score,
    demand_score: track.demand_score,
    published_at: track.published_at ?? null,
  };
}

/** Public catalog: only published tracks, newest/highest-value first. */
export const listPublished = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const tracks = await ctx.db
      .query("interview_prep_tracks")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .take(MAX_PUBLISHED);

    return tracks
      .sort((a, b) => b.demand_score - a.demand_score || b.quality_score - a.quality_score || b.updated_at - a.updated_at)
      .slice(0, 60)
      .map(summary);
  },
});

/** Public detail. Questions are returned in author order for learn/flashcard modes. */
export const getBySlug = query({  args: { slug: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const track = await ctx.db
      .query("interview_prep_tracks")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!track || track.status !== "published") return null;

    const questions = await ctx.db
      .query("interview_prep_questions")
      .withIndex("by_track_and_order", (q) => q.eq("track_id", track._id))
      .take(80);

    return {
      ...summary(track),
      description: track.description,
      model: track.model,
      content_hash: track.content_hash,
      questions: questions.map((question) => ({
        id: question._id,
        order: question.order,
        category: question.category,
        question: question.question,
        answer: question.answer,
        key_points: question.key_points,
        follow_ups: question.follow_ups,
        difficulty: question.difficulty,
        skills: question.skills,
      })),
    };
  },
});

export const findTrackBySlug = internalQuery({
  args: { slug: v.string() },
  returns: v.any(),
  handler: async (ctx, args) =>
    await ctx.db
      .query("interview_prep_tracks")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first(),
});

/** Curated external resources. Affiliate URLs are labeled so the UI can disclose them. */
export const listExternal = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const managed = await ctx.db
      .query("affiliate_courses")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .take(200);
    const managedCourses = managed.map((row) => ({
      course_id: row._id,
      title: row.title,
      provider: row.provider,
      url: row.url,
      level: row.level,
      duration: row.duration,
      free: row.free,
      description: row.description,
      skills: row.skills,
      affiliate: true,
    }));
    return [...managedCourses, ...listExternalCourses()].sort((a, b) => a.title.localeCompare(b.title));
  },
});

export const listPublishedAffiliateCourses = internalQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) =>
    await ctx.db
      .query("affiliate_courses")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .take(200),
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function roleWords(value: string) {  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9+#.]+/)
      .map((word) => word.trim())
      .filter((word) => word.length > 2),
  );
}

/**
 * Bounded planner input. We sample the newest open roles rather than scanning
 * the jobs table; the curriculum agent runs on a schedule and only needs a
 * demand signal, not an exact report.
 */
export const getDemandSnapshot = internalQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .order("desc")
      .take(1500);

    const byTitle = new Map<string, { title: string; count: number }>();
    for (const job of jobs) {
      const title = job.title?.trim();
      if (!title) continue;
      const key = title.toLowerCase().replace(/\s+/g, " ");
      const current = byTitle.get(key);
      if (current) current.count += 1;
      else byTitle.set(key, { title, count: 1 });
    }

    const topTitles = [...byTitle.values()]
      .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title))
      .slice(0, 40);

    const existing = await ctx.db.query("interview_prep_tracks").take(200);
    return {
      sampled_jobs: jobs.length,
      top_titles: topTitles,
      existing_tracks: existing.map((track) => ({
        slug: track.slug,
        title: track.title,
        role_family: track.role_family,
        level: track.level,
        skills: track.skills,
        status: track.status,
      })),
    };
  },
});

/** Deterministic recommendation used by Qelsa Agent and job-fit cards. */
export const recommend = internalQuery({
  args: {
    role: v.optional(v.string()),
    jobId: v.optional(v.id("jobs")),
    skills: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    let role = args.role?.trim() ?? "";
    if (args.jobId) {
      const job = await ctx.db.get(args.jobId);
      if (job?.title) role = job.title;
    }

    const tracks = await ctx.db
      .query("interview_prep_tracks")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .take(MAX_PUBLISHED);
    const words = roleWords(role);
    const wantedSkills = new Set((args.skills ?? []).map(skillMatchKey).filter(Boolean));

    const ranked = tracks
      .map((track) => {
        const text = `${track.title} ${track.role_family} ${track.skills.join(" ")}`.toLowerCase();
        const roleMatches = [...words].filter((word) => text.includes(word)).length;
        const skillMatches = track.skills
          .map((skill) => ({ label: skill, key: skillMatchKey(skill) }))
          .filter((skill) => wantedSkills.has(skill.key));
        const score = roleMatches * 5 + skillMatches.length * 3 + track.quality_score / 5 + track.demand_score / 20;
        return { track, roleMatches, skillMatches, score };
      })
      .filter((item) => item.roleMatches > 0 || item.skillMatches.length > 0)
      .sort((a, b) => b.score - a.score || b.track.updated_at - a.track.updated_at)
      .slice(0, Math.max(1, Math.min(args.limit ?? 3, 5)));

    return ranked.map(({ track, skillMatches }) => ({
      ...summary(track),
      matched_skills: [...new Set(skillMatches.map((skill) => skill.label))],
      url_path: `/courses/interview/${track.slug}`,
    }));
  },
});

/* ------------------------------------------------------------------ */
/* Curriculum-agent persistence                                        */
/* ------------------------------------------------------------------ */

export const startRun = internalMutation({
  args: {
    trigger: v.string(),
    model: v.string(),
    demandSnapshot: v.any(),
    actorUserId: v.optional(v.id("users")),
  },
  returns: v.id("curriculum_runs"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("curriculum_runs", {
      status: "running",
      trigger: args.trigger,
      started_at: Date.now(),
      model: args.model,
      demand_snapshot: args.demandSnapshot,
      decisions: [],
      tracks_created: 0,
      tracks_published: 0,
      actor_user_id: args.actorUserId,
    });
  },
});

export const finishRun = internalMutation({
  args: {
    runId: v.id("curriculum_runs"),
    status: v.union(v.literal("completed"), v.literal("failed")),
    decisions: v.array(v.any()),
    tracksCreated: v.number(),
    tracksPublished: v.number(),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.runId, {
      status: args.status,
      completed_at: Date.now(),
      decisions: args.decisions,
      tracks_created: args.tracksCreated,
      tracks_published: args.tracksPublished,
      error: args.error,
    });
    return null;
  },
});

export const insertGeneratedTrack = internalMutation({
  args: {
    runId: v.id("curriculum_runs"),
    slug: v.string(),
    title: v.string(),
    roleFamily: v.string(),
    level: v.string(),
    summary: v.string(),
    description: v.string(),
    skills: v.array(v.string()),
    interviewTypes: v.array(v.string()),
    estimatedMinutes: v.number(),
    qualityScore: v.number(),
    qualityFlags: v.array(v.string()),
    demandScore: v.number(),
    model: v.string(),
    promptVersion: v.string(),
    contentHash: v.string(),
    publish: v.boolean(),
    questions: v.array(
      v.object({
        category: v.string(),
        question: v.string(),
        answer: v.string(),
        keyPoints: v.array(v.string()),
        followUps: v.array(v.string()),
        difficulty: v.string(),
        skills: v.array(v.string()),
      }),
    ),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("interview_prep_tracks")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (existing) return { skipped: true, trackId: existing._id, status: existing.status };

    // The planner sees existing tracks, but keep a deterministic guard against
    // a duplicate title in the same role family if the model ignores that.
    const normalizedTitle = slugify(args.title);
    const roleTracks = await ctx.db
      .query("interview_prep_tracks")
      .withIndex("by_role_family", (q) => q.eq("role_family", args.roleFamily.slice(0, 100)))
      .take(20);
    const duplicateTitle = roleTracks.find((track) => slugify(track.title) === normalizedTitle);
    if (duplicateTitle) return { skipped: true, trackId: duplicateTitle._id, status: duplicateTitle.status };

    const now = Date.now();
    const published = args.publish && args.qualityFlags.length === 0 && args.qualityScore >= 8;
    const trackId = await ctx.db.insert("interview_prep_tracks", {
      slug: args.slug.slice(0, 90),
      title: args.title.slice(0, 180),
      role_family: args.roleFamily.slice(0, 100),
      level: args.level.slice(0, 40),
      summary: args.summary.slice(0, 600),
      description: args.description.slice(0, 4000),
      skills: args.skills.slice(0, 20).map((skill) => skill.slice(0, 80)),
      interview_types: args.interviewTypes.slice(0, 10).map((type) => type.slice(0, 60)),
      question_count: args.questions.length,
      estimated_minutes: Math.max(10, Math.min(180, args.estimatedMinutes)),
      status: published ? "published" : "draft",
      quality_score: args.qualityScore,
      quality_flags: args.qualityFlags.slice(0, 20).map((flag) => flag.slice(0, 200)),
      demand_score: args.demandScore,
      generation_run_id: args.runId,
      model: args.model.slice(0, 120),
      prompt_version: args.promptVersion.slice(0, 120),
      content_hash: args.contentHash,
      published_at: published ? now : undefined,
      created_at: now,
      updated_at: now,
    });

    for (const [index, question] of args.questions.entries()) {
      await ctx.db.insert("interview_prep_questions", {
        track_id: trackId,
        order: index + 1,
        category: question.category.slice(0, 80),
        question: question.question.slice(0, 1000),
        answer: question.answer.slice(0, 8000),
        key_points: question.keyPoints.slice(0, 10).map((point) => point.slice(0, 300)),
        follow_ups: question.followUps.slice(0, 8).map((followUp) => followUp.slice(0, 300)),
        difficulty: question.difficulty.slice(0, 40),
        skills: question.skills.slice(0, 12).map((skill) => skill.slice(0, 80)),
      });
    }

    return { skipped: false, trackId, status: published ? "published" : "draft" };
  },
});
