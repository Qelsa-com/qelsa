import { generateText } from "ai";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalQuery } from "./_generated/server";
import { AI_AGENT_MODEL, openRouter } from "./lib/ai";

export const loadContextForCoverLetter = internalQuery({
  args: {
    authId: v.string(),
    jobId: v.id("jobs"),
    resumeId: v.optional(v.id("resumes")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", args.authId))
      .unique();
    if (!user) return null;

    const job = await ctx.db.get(args.jobId);
    if (!job) return null;

    let companyName = job.company_name;
    if (!companyName && job.page_id) {
      const page = await ctx.db.get(job.page_id);
      companyName = page?.name;
    }
    companyName = companyName || "Company";

    // Experiences
    const expRows = await ctx.db
      .query("experiences")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .collect();

    const experiences = [];
    for (const exp of expRows.slice(0, 3)) {
      let roleTitle = "";
      let expCompany = "";
      if (exp.job_title_id) {
        const jt = await ctx.db.get(exp.job_title_id);
        roleTitle = jt?.name ?? "";
      }
      if (exp.company_id) {
        const comp = await ctx.db.get(exp.company_id);
        expCompany = comp?.name ?? "";
      }
      experiences.push({
        title: roleTitle || "Team Member",
        company: expCompany || "Organization",
        description: exp.description || "",
      });
    }

    // Top Skills
    const userSkillRows = await ctx.db
      .query("user_skills")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .take(10);

    const skills: string[] = [];
    for (const us of userSkillRows) {
      const sk = await ctx.db.get(us.skill_id);
      if (sk?.name) skills.push(sk.name);
    }

    // Education
    const eduRows = await ctx.db
      .query("educations")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .take(2);

    const educations: string[] = [];
    for (const edu of eduRows) {
      let degreeName = "";
      let collegeName = "";
      let fieldName = "";
      if (edu.degree_id) {
        const d = await ctx.db.get(edu.degree_id);
        degreeName = d?.name ?? "";
      }
      if (edu.college_id) {
        const c = await ctx.db.get(edu.college_id);
        collegeName = c?.name ?? "";
      }
      if (edu.field_of_study_id) {
        const f = await ctx.db.get(edu.field_of_study_id);
        fieldName = f?.name ?? "";
      }
      const parts = [degreeName, fieldName, collegeName].filter(Boolean);
      if (parts.length) educations.push(parts.join(" - "));
    }

    // Resume info
    let resumeName: string | undefined;
    if (args.resumeId) {
      const r = await ctx.db.get(args.resumeId);
      if (r) resumeName = r.title;
    }

    return {
      candidateName: user.name || "Candidate",
      headline: user.headline || "",
      skills,
      experiences,
      educations,
      jobTitle: job.title || "Position",
      companyName,
      jobDescription: (job.description || "").slice(0, 1500),
      resumeName,
    };
  },
});

function buildFallbackCoverLetter(context: {
  candidateName: string;
  headline: string;
  skills: string[];
  experiences: Array<{ title: string; company: string; description: string }>;
  educations: string[];
  jobTitle: string;
  companyName: string;
}) {
  const topSkills = context.skills.slice(0, 3).join(", ");
  const recentExp = context.experiences[0];

  const experienceParagraph = recentExp
    ? `In my previous role as ${recentExp.title} at ${recentExp.company}, I developed a strong track record of tackling complex challenges, collaborating effectively across disciplines, and delivering measurable outcomes.`
    : `Throughout my career, I have focused on solving challenging problems, delivering measurable results, and continuously expanding my technical and professional capabilities.`;

  const skillsParagraph = topSkills
    ? `My background in ${topSkills} aligns closely with the objectives outlined for the ${context.jobTitle} position.`
    : `My professional background and problem-solving skills align closely with the requirements for the ${context.jobTitle} role.`;

  return `Dear Hiring Team at ${context.companyName},

I am writing to express my strong enthusiasm for the ${context.jobTitle} role at ${context.companyName}. With my experience${context.headline ? ` as a ${context.headline}` : ""}, I am excited about the opportunity to contribute to your team's ongoing success.

${skillsParagraph} ${experienceParagraph} I take pride in building scalable, reliable solutions and thrive in collaborative environments where continuous learning and high standards are valued.

The work being done at ${context.companyName} resonates deeply with my professional values, and I would welcome the opportunity to discuss how my skill set and background can support your team's goals.

Thank you for your time and consideration.

Warm regards,
${context.candidateName}`;
}

export const generateCoverLetter = action({
  args: {
    jobId: v.id("jobs"),
    resumeId: v.optional(v.id("resumes")),
  },
  returns: v.object({
    coverLetter: v.string(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const context = await ctx.runQuery(internal.coverLetter.loadContextForCoverLetter, {
      authId: identity.subject,
      jobId: args.jobId,
      resumeId: args.resumeId,
    });

    if (!context) {
      throw new Error("Could not load application context to generate cover letter.");
    }

    if (openRouter) {
      try {
        const prompt = `You are an expert career advisor. Write a compelling, concise, professional cover letter (around 150-220 words) for a job application.
The candidate is applying for:
Job Title: ${context.jobTitle}
Company: ${context.companyName}

Job Context / Description:
${context.jobDescription || "Standard industry responsibilities for this role"}

Candidate Profile:
- Name: ${context.candidateName}
- Headline: ${context.headline || "Professional"}
- Key Skills: ${context.skills.join(", ") || "Relevant domain skills"}
- Key Experience: ${context.experiences.map((e) => `${e.title} at ${e.company}`).join("; ") || "Relevant past experience"}
- Education: ${context.educations.join("; ") || "Relevant background"}

Requirements:
- Start directly with "Dear Hiring Team at ${context.companyName}," (no date, no placeholder address).
- Write in first person ("I").
- Connect candidate's specific background and skills to the role.
- Keep tone professional, confident, and genuine (not generic or overly flowery).
- End with a professional sign-off and candidate's name: "${context.candidateName}".
- Output ONLY the cover letter text, no explanations, no markdown formatting or quotes.`;

        const response = await generateText({
          model: openRouter.chat(AI_AGENT_MODEL),
          prompt,
          temperature: 0.7,
        });

        const text = response.text.trim();
        if (text && text.length > 50) {
          return { coverLetter: text };
        }
      } catch (err) {
        console.error("[CoverLetter] AI generation failed, using structured fallback:", err);
      }
    }

    return {
      coverLetter: buildFallbackCoverLetter(context),
    };
  },
});
