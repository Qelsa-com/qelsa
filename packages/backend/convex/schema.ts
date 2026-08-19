import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const proficiency = v.union(
  v.literal("beginner"),
  v.literal("intermediate"),
  v.literal("advance"),
  v.literal("expert"),
);

const jobStatus = v.union(
  v.literal("draft"),
  v.literal("open"),
  v.literal("closed"),
  v.literal("paused"),
);

const workplaceType = v.union(
  v.literal("on-site"),
  v.literal("hybrid"),
  v.literal("remote"),
);

const applicationStatus = v.union(
  v.literal("applied"),
  v.literal("viewed"),
  v.literal("shortlisted"),
  v.literal("sorted"),
  v.literal("rejected"),
  v.literal("hold"),
  v.literal("cancelled"),
);

const skillType = v.union(
  v.literal("core"),
  v.literal("preferred"),
  v.literal("nice_to_have"),
);

const titledItem = v.object({ title: v.string() });

const impactMetricItem = v.object({
  impact_type: v.string(),
  impact_value: v.string(),
  description: v.optional(v.string()),
});

export default defineSchema({
  users: defineTable({
    authId: v.string(),
    name: v.optional(v.string()),
    email: v.string(),
    username: v.optional(v.string()),
    gender: v.optional(v.string()),
    dob: v.optional(v.number()),
    city_id: v.optional(v.id("cities")),
    phone: v.optional(v.string()),
    profile_image: v.optional(v.string()),
    profile_image_storage_id: v.optional(v.string()),
    about: v.optional(v.string()),
    headline: v.optional(v.string()),
    nationality: v.optional(v.string()),
    last_login_at: v.optional(v.number()),
    pronoun: v.optional(v.string()),
    professional_summary: v.optional(v.string()),
    work_preference: v.optional(v.string()),
    want_to_relocate: v.optional(v.boolean()),
    preffer_full_time: v.optional(v.boolean()),
    preffer_contract: v.optional(v.boolean()),
    preffer_internship: v.optional(v.boolean()),
    preffer_freelance: v.optional(v.boolean()),
    expected_salary_currency: v.optional(v.string()),
    expected_min_salary: v.optional(v.number()),
    expected_max_salary: v.optional(v.number()),
    linkedin_url: v.optional(v.string()),
    github_url: v.optional(v.string()),
    twitter_url: v.optional(v.string()),
    other_social_link: v.optional(v.string()),
    custom_profile_url: v.optional(v.string()),
    profile_visibility: v.optional(v.string()),
    show_contact_to_recruiters: v.optional(v.boolean()),
    allow_profile_downloads: v.optional(v.boolean()),
    profile_view_analytics: v.optional(v.boolean()),
    role: v.union(v.literal("user"), v.literal("admin")),
    account_type: v.optional(v.union(v.literal("seeker"), v.literal("recruiter"))),
    job_seeking_status: v.optional(
      v.union(v.literal("actively_hunting"), v.literal("exploring"), v.literal("building_skills")),
    ),
    hiring_role: v.optional(
      v.union(
        v.literal("founder_cxo"),
        v.literal("hr_ta"),
        v.literal("hiring_manager"),
        v.literal("recruitment_agency"),
      ),
    ),
    active_page_id: v.optional(v.id("pages")),
    onboarding_completed: v.optional(v.boolean()),
    isActive: v.boolean(),
    profile_type: v.optional(
      v.union(v.literal("student"), v.literal("professional"), v.literal("career-switcher")),
    ),
    find_job: v.optional(v.boolean()),
    explore_career: v.optional(v.boolean()),
    upskill_and_learn: v.optional(v.boolean()),
    prepare_interview: v.optional(v.boolean()),
    relocate_location: v.optional(v.string()),
    website: v.optional(v.string()),
    show_phone_number: v.boolean(),
  })
    .index("by_authId", ["authId"])
    .index("by_email", ["email"])
    .index("by_username", ["username"])
    .index("by_phone", ["phone"])
    .index("by_custom_profile_url", ["custom_profile_url"]),

  culture_preferences: defineTable({
    user_id: v.id("users"),
    preset: v.optional(v.string()),
    attributes: v.array(v.object({ key: v.string(), importance: v.number() })),
    global_importance: v.number(),
    statement: v.optional(v.string()),
    visibility: v.object({ public: v.boolean(), recruiters: v.boolean() }),
  }).index("by_user", ["user_id"]),

  pages: defineTable({
    name: v.string(),
    type: v.optional(v.union(v.literal("company"), v.literal("community"), v.literal("personal"))),
    industry: v.optional(v.string()),
    website: v.optional(v.string()),
    tagline: v.optional(v.string()),
    description: v.optional(v.string()),
    detailed_description: v.optional(v.string()),
    logo: v.optional(v.string()),
    hero_image: v.optional(v.string()),
    size_id: v.optional(v.id("company_sizes")),
    headquarters: v.optional(v.string()),
    founded_year: v.optional(v.number()),
    contact_email: v.optional(v.string()),
    contact_phone: v.optional(v.string()),
    linkedin_url: v.optional(v.string()),
    twitter_url: v.optional(v.string()),
    facebook_url: v.optional(v.string()),
    instagram_url: v.optional(v.string()),
    youtube_url: v.optional(v.string()),
    ownerId: v.id("users"),
  })
    .index("by_owner", ["ownerId"])
    .index("by_industry", ["industry"])
    .searchIndex("search_name", { searchField: "name" }),

  jobs: defineTable({
    external_id: v.optional(v.string()),
    description: v.optional(v.string()),
    application_url: v.optional(v.string()),
    experience_level: v.optional(v.string()),
    experience: v.optional(v.number()),
    has_remote: v.optional(v.boolean()),
    language: v.optional(v.string()),
    city_id: v.optional(v.id("cities")),
    published_date: v.optional(v.number()),
    salary_currency: v.optional(v.string()),
    salary_max: v.optional(v.number()),
    salary_min: v.optional(v.number()),
    salary: v.optional(v.number()),
    title: v.optional(v.string()),
    company_name: v.optional(v.string()),
    company_logo: v.optional(v.string()),
    company_twitter_handle: v.optional(v.string()),
    company_website_url: v.optional(v.string()),
    company_linkedin_url: v.optional(v.string()),
    company_github_url: v.optional(v.string()),
    company_is_agency: v.optional(v.boolean()),
    resource: v.optional(v.string()),
    other_info: v.optional(v.any()),
    work_type: v.optional(v.string()),
    workplace_type: v.optional(workplaceType),
    status: jobStatus,
    job_title_id: v.optional(v.id("job_titles")),
    page_id: v.optional(v.id("pages")),
    owner_id: v.optional(v.id("users")),
    view_count: v.optional(v.number()),
    application_count: v.optional(v.number()),
    ai_summary: v.optional(
      v.object({
        role_overview: v.string(),
        key_requirements: v.array(v.string()),
        why_this_role: v.string(),
      }),
    ),
  })
    .index("by_status", ["status"])
    .index("by_owner", ["owner_id"])
    .index("by_page", ["page_id"])
    .index("by_job_title", ["job_title_id"])
    .index("by_external_id", ["external_id"])
    .index("by_status_and_published", ["status", "published_date"])
    .searchIndex("search_title", { searchField: "title" }),

  job_skills: defineTable({
    job_id: v.id("jobs"),
    skill_id: v.id("skills"),
    type: v.optional(skillType),
    proficiency: v.optional(proficiency),
    weight: v.optional(v.number()),
  })
    .index("by_job", ["job_id"])
    .index("by_skill", ["skill_id"]),

  job_applications: defineTable({
    user_id: v.id("users"),
    job_id: v.id("jobs"),
    resume_id: v.optional(v.id("resumes")),
    status: applicationStatus,
    applied_at: v.number(),
    withdrawn_at: v.optional(v.number()),
  })
    .index("by_user", ["user_id"])
    .index("by_job", ["job_id"])
    .index("by_job_and_user", ["job_id", "user_id"])
    .index("by_user_and_status", ["user_id", "status"]),

  job_application_answers: defineTable({
    job_id: v.id("jobs"),
    job_application_id: v.id("job_applications"),
    user_id: v.id("users"),
    question_id: v.id("questions"),
    question: v.string(),
    answer: v.optional(v.string()),
  })
    .index("by_application", ["job_application_id"])
    .index("by_job", ["job_id"]),

  job_application_logs: defineTable({
    job_id: v.id("jobs"),
    job_application_id: v.id("job_applications"),
    created_by_id: v.id("users"),
    action_type: v.literal("status_changed"),
    old_status: applicationStatus,
    new_status: applicationStatus,
  }).index("by_application", ["job_application_id"]),

  job_views: defineTable({
    job_id: v.id("jobs"),
    user_id: v.id("users"),
    viewed_at: v.number(),
  })
    .index("by_job", ["job_id"])
    .index("by_user", ["user_id"])
    .index("by_job_and_user", ["job_id", "user_id"]),

  saved_jobs: defineTable({
    job_id: v.id("jobs"),
    user_id: v.id("users"),
  })
    .index("by_user", ["user_id"])
    .index("by_job", ["job_id"])
    .index("by_job_and_user", ["job_id", "user_id"]),

  question_sets: defineTable({
    jobId: v.id("jobs"),
    ownerId: v.id("users"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
  }).index("by_job", ["jobId"]),

  questions: defineTable({
    question_set_id: v.id("question_sets"),
    title: v.string(),
    type: v.string(),
    category: v.optional(v.string()),
    is_knockout: v.optional(v.boolean()),
    knockout_condition: v.optional(v.string()),
    knockout_value: v.optional(v.string()),
    expected_answer: v.optional(v.string()),
    weight: v.optional(v.number()),
    min_value: v.optional(v.number()),
    max_value: v.optional(v.number()),
    order: v.optional(v.number()),
    required: v.optional(v.boolean()),
  }).index("by_set", ["question_set_id"]),

  options: defineTable({
    question_id: v.id("questions"),
    title: v.string(),
    value: v.optional(v.string()),
    is_correct: v.optional(v.boolean()),
    order: v.optional(v.number()),
  }).index("by_question", ["question_id"]),

  resumes: defineTable({
    user_id: v.id("users"),
    file_url: v.optional(v.string()),
    storage_id: v.optional(v.string()),
    title: v.string(),
    extracted_text: v.optional(v.string()),
  }).index("by_user", ["user_id"]),

  educations: defineTable({
    user_id: v.id("users"),
    degree_id: v.optional(v.id("degree_names")),
    college_id: v.optional(v.id("colleges")),
    field_of_study_id: v.optional(v.id("fields_of_study")),
    city_id: v.optional(v.id("cities")),
    position: v.optional(v.number()),
    start_year: v.number(),
    end_year: v.optional(v.number()),
    grade: v.optional(v.string()),
    description: v.optional(v.string()),
    projects: v.optional(v.array(titledItem)),
    achievements: v.optional(v.array(titledItem)),
  }).index("by_user", ["user_id"]),

  experiences: defineTable({
    user_id: v.id("users"),
    company_id: v.optional(v.id("companies")),
    job_title_id: v.optional(v.id("job_titles")),
    city_id: v.optional(v.id("cities")),
    position: v.optional(v.number()),
    start_date: v.number(),
    end_date: v.optional(v.number()),
    is_current: v.optional(v.boolean()),
    description: v.optional(v.string()),
    team_size: v.optional(v.number()),
    responsibilities: v.optional(v.array(titledItem)),
    impact_metrics: v.optional(v.array(impactMetricItem)),
  }).index("by_user", ["user_id"]),

  experience_skills: defineTable({
    experience_id: v.id("experiences"),
    skill_id: v.id("skills"),
  })
    .index("by_experience", ["experience_id"])
    .index("by_experience_and_skill", ["experience_id", "skill_id"]),

  user_skills: defineTable({
    user_id: v.id("users"),
    skill_id: v.id("skills"),
    category_id: v.optional(v.id("skill_categories")),
    proficiency: v.optional(proficiency),
    is_top_skill: v.optional(v.boolean()),
  })
    .index("by_user", ["user_id"])
    .index("by_user_and_skill", ["user_id", "skill_id"]),

  user_certifications: defineTable({
    user_id: v.id("users"),
    certification_id: v.optional(v.id("certifications")),
    issuing_body_id: v.optional(v.id("issuing_bodies")),
    name: v.optional(v.string()),
    issuingOrganization: v.optional(v.string()),
    issue_date: v.optional(v.number()),
    expiration_date: v.optional(v.number()),
    does_not_expire: v.optional(v.boolean()),
    credential_id: v.optional(v.string()),
    credential_url: v.optional(v.string()),
    description: v.optional(v.string()),
  }).index("by_user", ["user_id"]),

  user_certification_skills: defineTable({
    user_certification_id: v.id("user_certifications"),
    skill_id: v.id("skills"),
  }).index("by_certification", ["user_certification_id"]),

  degree_levels: defineTable({
    name: v.string(),
    sort_order: v.number(),
  }).index("by_name", ["name"]),

  degree_names: defineTable({
    level_id: v.id("degree_levels"),
    name: v.string(),
    abbreviation: v.optional(v.string()),
  })
    .index("by_level", ["level_id"])
    .searchIndex("search_name", { searchField: "name" }),

  fields_of_study: defineTable({
    name: v.string(),
    category: v.optional(v.string()),
  })
    .index("by_name", ["name"])
    .index("by_category", ["category"])
    .searchIndex("search_name", { searchField: "name" }),

  company_sizes: defineTable({
    label: v.string(),
    min_employees: v.optional(v.number()),
    max_employees: v.optional(v.number()),
    sort_order: v.number(),
  }).index("by_label", ["label"]),

  companies: defineTable({
    name: v.string(),
    size_id: v.optional(v.id("company_sizes")),
    hq_city: v.optional(v.string()),
    hq_country: v.optional(v.string()),
    website: v.optional(v.string()),
    is_verified: v.optional(v.boolean()),
    is_popular: v.optional(v.boolean()),
    founded_year: v.optional(v.number()),
  })
    .index("by_name", ["name"])
    .searchIndex("search_name", { searchField: "name" }),

  user_submitted_companies: defineTable({
    name: v.string(),
    industry_hint: v.optional(v.string()),
    hq_city: v.optional(v.string()),
    hq_country: v.optional(v.string()),
    website: v.optional(v.string()),
    submitted_by: v.optional(v.string()),
    submission_count: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("duplicate"),
    ),
  })
    .index("by_name", ["name"])
    .index("by_submitted_by", ["submitted_by"]),

  skill_categories: defineTable({
    name: v.string(),
    sort_order: v.number(),
  }).index("by_name", ["name"]),

  skills: defineTable({
    name: v.string(),
    category_id: v.optional(v.id("skill_categories")),
    is_quick_add: v.optional(v.boolean()),
    sort_order: v.optional(v.number()),
  })
    .index("by_name", ["name"])
    .index("by_category", ["category_id"])
    .searchIndex("search_name", { searchField: "name" }),

  job_titles: defineTable({
    name: v.string(),
    is_popular: v.optional(v.boolean()),
    sort_order: v.optional(v.number()),
  })
    .index("by_name", ["name"])
    .searchIndex("search_name", { searchField: "name" }),

  issuing_bodies: defineTable({
    name: v.string(),
    website: v.optional(v.string()),
    country: v.optional(v.string()),
  })
    .index("by_name", ["name"])
    .searchIndex("search_name", { searchField: "name" }),

  certifications: defineTable({
    name: v.string(),
    abbreviation: v.optional(v.string()),
    issuing_body_id: v.optional(v.id("issuing_bodies")),
    is_popular: v.optional(v.boolean()),
    is_globally_recognized: v.optional(v.boolean()),
    description: v.optional(v.string()),
  })
    .index("by_name", ["name"])
    .searchIndex("search_name", { searchField: "name" }),

  colleges: defineTable({
    name: v.string(),
    aishe_code: v.optional(v.string()),
    state: v.optional(v.string()),
    district: v.optional(v.string()),
    website: v.optional(v.string()),
    year_of_establishment: v.optional(v.string()),
    location: v.optional(v.string()),
    college_type: v.optional(v.string()),
  })
    .index("by_name", ["name"])
    .searchIndex("search_name", { searchField: "name" }),

  states: defineTable({
    name: v.string(),
  }).index("by_name", ["name"]),

  cities: defineTable({
    name: v.string(),
    state_id: v.id("states"),
  })
    .index("by_state", ["state_id"])
    .index("by_name_and_state", ["name", "state_id"])
    .searchIndex("search_name", { searchField: "name" }),

  job_match_sessions: defineTable({
    user_id: v.id("users"),
    source: v.union(v.literal("qelsa"), v.literal("external")),
    job_id: v.optional(v.id("jobs")),
    thread_id: v.string(),
    title: v.string(),
    company: v.optional(v.string()),
    location: v.optional(v.string()),
    description: v.string(),
    work_type: v.optional(v.string()),
    workplace_type: v.optional(workplaceType),
    experience: v.optional(v.number()),
    source_url: v.optional(v.string()),
    skills: v.array(
      v.object({
        name: v.string(),
        skill_id: v.optional(v.id("skills")),
        type: v.optional(skillType),
      }),
    ),
    responsibilities: v.array(v.string()),
    requirements: v.array(v.string()),
    context_fingerprint: v.optional(v.string()),
    analysis: v.object({
      overall: v.number(),
      headline: v.string(),
      strong: v.array(v.string()),
      partial: v.array(v.string()),
      missing: v.array(v.string()),
      experience_match: v.number(),
      education_match: v.number(),
      domain_match: v.number(),
      responsibilities_match: v.number(),
      resume_evidence: v.array(v.string()),
      actions: v.array(v.string()),
      can_apply: v.string(),
    }),
  })
    .index("by_user", ["user_id"])
    .index("by_user_and_job", ["user_id", "job_id"])
    .index("by_thread", ["thread_id"]),
});
