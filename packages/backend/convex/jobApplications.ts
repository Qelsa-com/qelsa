import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { R2 } from "@convex-dev/r2";
import { components } from "./_generated/api";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { iso, withId } from "./lib/helpers";
import { bumpJobCount } from "./lib/jobCounts";
import { yearsFromExperiences } from "./lib/applicantSearch";
import { isWithdrawn, WITHDRAWN_STATUS } from "./lib/applications";
import { buildCompetencyFramework } from "./lib/skillMatch";
import { signedFileUrl } from "./lib/r2";

const r2 = new R2(components.r2);

export const listForJob = authedQuery({
  args: { jobId: v.id("jobs"), status: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job || job.owner_id !== ctx.user._id) throw new Error("Unauthorized");
    if (args.status && isWithdrawn(args.status)) return [];

    let filtered: Doc<"job_applications">[];
    if (args.status) {
      const status = args.status as Doc<"job_applications">["status"];
      filtered = await ctx.db
        .query("job_applications")
        .withIndex("by_job_and_status", (q) => q.eq("job_id", args.jobId).eq("status", status))
        .order("desc")
        .take(80);
    } else {
      const apps = await ctx.db
        .query("job_applications")
        .withIndex("by_job", (q) => q.eq("job_id", args.jobId))
        .order("desc")
        .take(200);
      filtered = apps.filter((app) => !isWithdrawn(app.status)).slice(0, 80);
    }

    const skillCache = new Map<Id<"skills">, Promise<Doc<"skills"> | null>>();
    const getSkill = (id: Id<"skills">): Promise<Doc<"skills"> | null> => {
      let p = skillCache.get(id);
      if (!p) {
        p = ctx.db.get(id);
        skillCache.set(id, p);
      }
      return p;
    };

    const cityCache = new Map<Id<"cities">, Promise<Doc<"cities"> | null>>();
    const getCity = (id: Id<"cities">): Promise<Doc<"cities"> | null> => {
      let p = cityCache.get(id);
      if (!p) {
        p = ctx.db.get(id);
        cityCache.set(id, p);
      }
      return p;
    };

    const skillRows = await ctx.db.query("job_skills").withIndex("by_job", (q) => q.eq("job_id", args.jobId)).take(40);
    const jobSkills = (
      await Promise.all(
        skillRows.map(async (row) => {
          const skill = await getSkill(row.skill_id);
          if (!skill) return null;
          return {
            skill_id: row.skill_id,
            type: row.type,
            proficiency: row.proficiency,
            weight: row.weight,
            skill: { name: skill.name },
          };
        }),
      )
    ).filter((s): s is NonNullable<typeof s> => s !== null);

    const out = (
      await Promise.all(
        filtered.map(async (app) => {
          const user = await ctx.db.get(app.user_id);
          if (!user) return null;
          const [city, userSkills, experienceRows, educationRows] = await Promise.all([
            user.city_id ? getCity(user.city_id) : null,
            ctx.db.query("user_skills").withIndex("by_user", (q) => q.eq("user_id", user._id)).take(24),
            ctx.db.query("experiences").withIndex("by_user", (q) => q.eq("user_id", user._id)).take(8),
            ctx.db.query("educations").withIndex("by_user", (q) => q.eq("user_id", user._id)).take(4),
          ]);
          const skills: { id: Id<"skills">; name: string; proficiency?: string }[] = [];
          for (const row of userSkills) {
            const skill = await getSkill(row.skill_id);
            if (skill) skills.push({ id: row.skill_id, name: skill.name, proficiency: row.proficiency });
          }
          const competency = buildCompetencyFramework(
            jobSkills,
            userSkills.map((row) => ({ skill_id: row.skill_id, proficiency: row.proficiency })),
            {
              candidateYearsExperience: yearsFromExperiences(experienceRows, app.applied_at),
              requiredExperienceYears: job.experience,
              candidateEducationCount: educationRows.length,
            },
          );
          return {
            id: app._id,
            applicant_name: user.name ?? user.email,
            headline: user.headline,
            location: city?.name,
            profile_image: user.profile_image,
            years_experience: yearsFromExperiences(experienceRows, app.applied_at),
            skills,
            readiness: competency.readiness,
            applied_at: iso(app.applied_at),
            status: app.status,
          };
        }),
      )
    ).filter((item): item is NonNullable<typeof item> => item !== null);
    return out;
  },
});

export const getDetail = authedQuery({
  args: { jobId: v.id("jobs"), applicationId: v.id("job_applications") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job || job.owner_id !== ctx.user._id) throw new Error("Unauthorized");
    const app = await ctx.db.get(args.applicationId);
    if (!app || app.job_id !== args.jobId || isWithdrawn(app.status)) return null;
    const user = await ctx.db.get(app.user_id);
    const resume = app.resume_id ? await ctx.db.get(app.resume_id) : null;

    const [
      city,
      userSkills,
      experienceRows,
      educationRows,
      jobSkillRows,
      answers,
      rawNotes,
    ] = await Promise.all([
      user?.city_id ? ctx.db.get(user.city_id) : null,
      user ? ctx.db.query("user_skills").withIndex("by_user", (q) => q.eq("user_id", user._id)).take(50) : [],
      user ? ctx.db.query("experiences").withIndex("by_user", (q) => q.eq("user_id", user._id)).take(20) : [],
      user ? ctx.db.query("educations").withIndex("by_user", (q) => q.eq("user_id", user._id)).take(10) : [],
      ctx.db.query("job_skills").withIndex("by_job", (q) => q.eq("job_id", args.jobId)).take(40),
      ctx.db.query("job_application_answers").withIndex("by_application", (q) => q.eq("job_application_id", app._id)).take(50),
      ctx.db.query("job_application_notes").withIndex("by_application", (q) => q.eq("job_application_id", app._id)).take(50),
    ]);

    const skillCache = new Map<Id<"skills">, Promise<Doc<"skills"> | null>>();
    const getSkill = (id: Id<"skills">): Promise<Doc<"skills"> | null> => {
      let p = skillCache.get(id);
      if (!p) {
        p = ctx.db.get(id);
        skillCache.set(id, p);
      }
      return p;
    };

    const enrichedUserSkills = await Promise.all(
      userSkills.map(async (row) => {
        const s = await getSkill(row.skill_id);
        return {
          id: row.skill_id,
          skill: s ? { id: s._id, name: s.name } : { id: row.skill_id, name: "" },
          proficiency: row.proficiency,
        };
      }),
    );

    const jobSkills = (
      await Promise.all(
        jobSkillRows.map(async (row) => {
          const s = await getSkill(row.skill_id);
          return {
            skill_id: row.skill_id,
            type: row.type,
            proficiency: row.proficiency,
            weight: row.weight,
            skill: { name: s?.name },
          };
        }),
      )
    );

    const competency = buildCompetencyFramework(
      jobSkills,
      userSkills.map((row) => ({ skill_id: row.skill_id, proficiency: row.proficiency })),
    );

    const enrichedExperiences = await Promise.all(
      experienceRows.map(async (exp) => {
        const [company, jobTitle] = await Promise.all([
          exp.company_id ? ctx.db.get(exp.company_id) : null,
          exp.job_title_id ? ctx.db.get(exp.job_title_id) : null,
        ]);
        return {
          ...withId(exp),
          start_date: iso(exp.start_date),
          end_date: iso(exp.end_date),
          company: company ? withId(company) : null,
          job_title: jobTitle ? withId(jobTitle) : null,
        };
      })
    );

    const enrichedEducations = await Promise.all(
      educationRows.map(async (edu) => {
        const [degree, college] = await Promise.all([
          edu.degree_id ? ctx.db.get(edu.degree_id) : null,
          edu.college_id ? ctx.db.get(edu.college_id) : null,
        ]);
        return {
          ...withId(edu),
          degree: degree ? withId(degree) : null,
          college: college ? withId(college) : null,
        };
      })
    );

    const questionDocs = await Promise.all(answers.map((a) => (a.question_id ? ctx.db.get(a.question_id) : null)));
    const enrichedAnswers = answers.map((ans, i) => {
      const questionDoc = questionDocs[i];
      let meets_requirement: boolean | null = null;
      if (questionDoc?.expected_answer && ans.answer) {
        const expected = questionDoc.expected_answer.trim().toLowerCase();
        const actual = ans.answer.trim().toLowerCase();
        meets_requirement = actual === expected || (expected === "yes" && ["yes", "true", "y"].includes(actual));
      } else if (questionDoc?.is_knockout && questionDoc.knockout_value && ans.answer) {
        const val = questionDoc.knockout_value.trim().toLowerCase();
        const actual = ans.answer.trim().toLowerCase();
        if (questionDoc.knockout_condition === "not_equals") {
          meets_requirement = actual !== val;
        } else {
          meets_requirement = actual === val;
        }
      }
      return {
        ...withId(ans),
        is_knockout: Boolean(questionDoc?.is_knockout),
        meets_requirement,
        expected_answer: questionDoc?.expected_answer,
      };
    });

    const notes = rawNotes.sort((a, b) => b.created_at - a.created_at).map(withId);

    return {
      ...withId(app),
      applied_at: iso(app.applied_at),
      user: user
        ? {
            ...withId(user),
            city: city ? withId(city) : null,
            skills: enrichedUserSkills,
            experiences: enrichedExperiences,
            educations: enrichedEducations,
          }
        : null,
      competency,
      resume: resume
        ? {
            ...withId(resume),
            file_url: (await signedFileUrl(r2, resume.storage_id)) ?? resume.file_url,
          }
        : null,
      answers: enrichedAnswers,
      job_application_answers: enrichedAnswers,
      notes,
      cover_letter: app.cover_letter ?? null,
    };
  },
});

export const apply = authedMutation({
  args: {
    jobId: v.id("jobs"),
    resume_id: v.optional(v.id("resumes")),
    cover_letter: v.optional(v.string()),
    answers: v.optional(v.any()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("job_applications")
      .withIndex("by_job_and_user", (q) => q.eq("job_id", args.jobId).eq("user_id", ctx.user._id))
      .collect();
    if (existing.some((a) => a.status !== "rejected" && a.status !== "cancelled")) {
      throw new Error("You already applied to this job");
    }
    const id = await ctx.db.insert("job_applications", {
      user_id: ctx.user._id,
      job_id: args.jobId,
      resume_id: args.resume_id,
      cover_letter: args.cover_letter,
      status: "applied",
      applied_at: Date.now(),
    });
    await bumpJobCount(ctx, args.jobId, "application_count", 1);
    const answers = (args.answers ?? {}) as Record<string, string>;
    for (const [questionId, answer] of Object.entries(answers)) {
      const question = await ctx.db.get(questionId as Id<"questions">);
      await ctx.db.insert("job_application_answers", {
        job_id: args.jobId,
        job_application_id: id,
        user_id: ctx.user._id,
        question_id: questionId as Id<"questions">,
        question: question?.title ?? "",
        answer,
      });
    }
    return withId((await ctx.db.get(id))!);
  },
});

export const bulkUpdateStatus = authedMutation({
  args: {
    application_ids: v.array(v.id("job_applications")),
    new_status: v.union(
      v.literal("applied"),
      v.literal("viewed"),
      v.literal("shortlisted"),
      v.literal("sorted"),
      v.literal("rejected"),
      v.literal("hold"),
      v.literal("cancelled"),
    ),
  },
  returns: v.object({ updatedCount: v.number() }),
  handler: async (ctx, args) => {
    if (args.application_ids.length > 200) {
      throw new Error("Cannot update more than 200 applications at once");
    }
    const jobCache = new Map<Id<"jobs">, Doc<"jobs"> | null>();
    const getJob = async (id: Id<"jobs">) => {
      if (jobCache.has(id)) return jobCache.get(id);
      const doc = await ctx.db.get(id);
      jobCache.set(id, doc);
      return doc;
    };

    let updatedCount = 0;
    for (const id of args.application_ids) {
      const app = await ctx.db.get(id);
      if (!app) continue;
      const job = await getJob(app.job_id);
      if (!job || job.owner_id !== ctx.user._id) continue;
      if (app.status === args.new_status) continue;
      const old = app.status;
      await ctx.db.patch(id, { status: args.new_status });
      await ctx.db.insert("job_application_logs", {
        job_id: app.job_id,
        job_application_id: id,
        created_by_id: ctx.user._id,
        action_type: "status_changed",
        old_status: old,
        new_status: args.new_status,
      });
      updatedCount += 1;
    }
    return { updatedCount };
  },
});

export const withdraw = authedMutation({
  args: { applicationId: v.id("job_applications") },
  returns: v.object({
    id: v.id("job_applications"),
    status: v.literal(WITHDRAWN_STATUS),
    withdrawn_at: v.number(),
  }),
  handler: async (ctx, args) => {
    const app = await ctx.db.get(args.applicationId);
    if (!app) throw new Error("Application not found");
    if (app.user_id !== ctx.user._id) throw new Error("Unauthorized");

    if (isWithdrawn(app.status)) {
      return {
        id: app._id,
        status: WITHDRAWN_STATUS,
        withdrawn_at: app.withdrawn_at ?? Date.now(),
      };
    }

    if (app.status === "rejected") {
      throw new Error("This application can no longer be withdrawn");
    }

    const withdrawn_at = Date.now();
    await ctx.db.patch(app._id, { status: WITHDRAWN_STATUS, withdrawn_at });
    await ctx.db.insert("job_application_logs", {
      job_id: app.job_id,
      job_application_id: app._id,
      created_by_id: ctx.user._id,
      action_type: "status_changed",
      old_status: app.status,
      new_status: WITHDRAWN_STATUS,
    });
    await bumpJobCount(ctx, app.job_id, "application_count", -1);
    return { id: app._id, status: WITHDRAWN_STATUS, withdrawn_at };
  },
});

export const markViewed = authedMutation({
  args: { applicationId: v.id("job_applications") },
  returns: v.object({ success: v.boolean(), status: v.string() }),
  handler: async (ctx, args) => {
    const app = await ctx.db.get(args.applicationId);
    if (!app) return { success: false, status: "not_found" };
    const job = await ctx.db.get(app.job_id);
    if (!job || job.owner_id !== ctx.user._id) return { success: false, status: "unauthorized" };
    if (app.status === "applied") {
      await ctx.db.patch(app._id, { status: "viewed" });
      await ctx.db.insert("job_application_logs", {
        job_id: app.job_id,
        job_application_id: app._id,
        created_by_id: ctx.user._id,
        action_type: "status_changed",
        old_status: "applied",
        new_status: "viewed",
      });
      return { success: true, status: "viewed" };
    }
    return { success: true, status: app.status };
  },
});

export const addNote = authedMutation({
  args: {
    applicationId: v.id("job_applications"),
    text: v.string(),
    visibility: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const text = args.text.trim();
    if (!text) {
      throw new Error("Note text cannot be empty");
    }
    if (text.length > 5000) {
      throw new Error("Note cannot exceed 5000 characters");
    }
    const app = await ctx.db.get(args.applicationId);
    if (!app) throw new Error("Application not found");
    const job = await ctx.db.get(app.job_id);
    if (!job || job.owner_id !== ctx.user._id) {
      throw new Error("Unauthorized");
    }

    const noteId = await ctx.db.insert("job_application_notes", {
      job_id: app.job_id,
      job_application_id: app._id,
      user_id: ctx.user._id,
      author_name: ctx.user.name || ctx.user.email || "Recruiter",
      author_image: ctx.user.profile_image,
      text,
      visibility: args.visibility ?? "recruiter_only",
      created_at: Date.now(),
    });

    const note = await ctx.db.get(noteId);
    return withId(note!);
  },
});
