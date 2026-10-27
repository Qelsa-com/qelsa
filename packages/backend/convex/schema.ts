import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const proficiency = v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advance"), v.literal("expert"));

const jobStatus = v.union(v.literal("draft"), v.literal("open"), v.literal("closed"), v.literal("paused"));

const workplaceType = v.union(v.literal("on-site"), v.literal("hybrid"), v.literal("remote"));

const applicationStatus = v.union(v.literal("applied"), v.literal("viewed"), v.literal("shortlisted"), v.literal("sorted"), v.literal("rejected"), v.literal("hold"), v.literal("cancelled"));

const skillType = v.union(v.literal("core"), v.literal("preferred"), v.literal("nice_to_have"));

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
    job_seeking_status: v.optional(v.union(v.literal("actively_hunting"), v.literal("exploring"), v.literal("building_skills"))),
    hiring_role: v.optional(v.union(v.literal("founder_cxo"), v.literal("hr_ta"), v.literal("hiring_manager"), v.literal("recruitment_agency"))),
    active_page_id: v.optional(v.id("pages")),
    onboarding_completed: v.optional(v.boolean()),
    isActive: v.boolean(),
    profile_type: v.optional(v.union(v.literal("student"), v.literal("professional"), v.literal("career-switcher"))),
    find_job: v.optional(v.boolean()),
    explore_career: v.optional(v.boolean()),
    upskill_and_learn: v.optional(v.boolean()),
    prepare_interview: v.optional(v.boolean()),
    relocate_location: v.optional(v.string()),
    website: v.optional(v.string()),
    show_phone_number: v.boolean(),
    // Profile editor additions
    phone_country_code: v.optional(v.string()),
    relocate_locations: v.optional(v.array(v.string())),
    preffer_part_time: v.optional(v.boolean()),
    default_resume_id: v.optional(v.id("resumes")),
    languages: v.optional(v.array(v.object({ name: v.string(), proficiency: v.string() }))),
    interests: v.optional(v.array(v.string())),
    portfolio_links: v.optional(v.array(v.object({ title: v.string(), url: v.string() }))),
  })
    .index("by_authId", ["authId"])
    .index("by_email", ["email"])
    .index("by_username", ["username"])
    .index("by_phone", ["phone"])
    .index("by_custom_profile_url", ["custom_profile_url"])
    // Admin panel: filter and count users by role / activity without scanning.
    .index("by_role", ["role"])
    .index("by_role_and_active", ["role", "isActive"])
    .index("by_account_type", ["account_type"])
    .index("by_active", ["isActive"])
    // Search indexes for the admin user search. `name` and `username` are
    // optional, which Convex supports for search indexes.
    .searchIndex("search_name", { searchField: "name" })
    .searchIndex("search_email", { searchField: "email" })
    .searchIndex("search_username", { searchField: "username" }),

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
    glassdoor_url: v.optional(v.string()),
    culture_statement: v.optional(v.string()),
    culture_tags: v.optional(v.array(v.string())),
    specialties: v.optional(v.array(v.string())),
    ownerId: v.id("users"),
  })
    .index("by_owner", ["ownerId"])
    .index("by_industry", ["industry"])
    .searchIndex("search_name", { searchField: "name" }),

  page_followers: defineTable({
    page_id: v.id("pages"),
    user_id: v.id("users"),
    followed_at: v.number(),
  })
    .index("by_page", ["page_id"])
    .index("by_user", ["user_id"])
    .index("by_page_and_user", ["page_id", "user_id"]),

  page_members: defineTable({
    page_id: v.id("pages"),
    user_id: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("editor")),
    added_at: v.number(),
    added_by: v.id("users"),
  })
    .index("by_page", ["page_id"])
    .index("by_user", ["user_id"])
    .index("by_page_and_user", ["page_id", "user_id"]),

  page_invites: defineTable({
    page_id: v.id("pages"),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("editor")),
    invited_by: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("revoked")),
    created_at: v.number(),
  })
    .index("by_page", ["page_id"])
    .index("by_email", ["email"])
    .index("by_page_and_email", ["page_id", "email"]),

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
    // Denormalized title + company + location + skills text for the single
    // full-catalog search index. Refreshed whenever those inputs change.
    search_text: v.optional(v.string()),
    company_name: v.optional(v.string()),
    company_logo: v.optional(v.string()),
    company_twitter_handle: v.optional(v.string()),
    company_website_url: v.optional(v.string()),
    company_linkedin_url: v.optional(v.string()),
    company_github_url: v.optional(v.string()),
    company_is_agency: v.optional(v.boolean()),
    resource: v.optional(v.string()),
    // Set on ATS-ingested jobs so a board sync can close postings that left the live pull.
    ats_integration_id: v.optional(v.id("ats_integrations")),
    // Timestamp of the pull that last upserted this row — used to close missing jobs without shipping the full id list.
    ats_seen_at: v.optional(v.number()),
    other_info: v.optional(v.any()),
    work_type: v.optional(v.string()),
    workplace_type: v.optional(workplaceType),
    status: jobStatus,
    job_title_id: v.optional(v.id("job_titles")),
    page_id: v.optional(v.id("pages")),
    owner_id: v.optional(v.id("users")),
    view_count: v.optional(v.number()),
    application_count: v.optional(v.number()),
    // Set once AI skill extraction has run, so jobs without extractable skills
    // are not re-processed on every scrape/backfill pass.
    skills_extracted: v.optional(v.boolean()),
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
    .index("by_ats_integration", ["ats_integration_id"])
    .index("by_resource", ["resource"])
    .searchIndex("search_title", { searchField: "title", filterFields: ["status"] })
    .searchIndex("search_company", { searchField: "company_name", filterFields: ["status"] })
    .searchIndex("search_all", { searchField: "search_text", filterFields: ["status"] }),

  /**
   * Cached company descriptions for jobs that do not have a recruiter-owned
   * company page. Keyed by canonical domain (or normalized name as a fallback),
   * generated once and reused by every job at that company.
   */
  company_profiles: defineTable({
    key: v.string(),
    name: v.string(),
    website: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("ready"), v.literal("error")),
    source: v.optional(v.union(v.literal("website"), v.literal("job"), v.literal("llm"))),
    model: v.optional(v.string()),
    sample_job_id: v.optional(v.id("jobs")),
    attempts: v.number(),
    last_error: v.optional(v.string()),
    claimed_at: v.optional(v.number()),
    next_retry_at: v.optional(v.number()),
    generated_at: v.optional(v.number()),
  })
    .index("by_key", ["key"])
    .index("by_status", ["status"]),

  job_skills: defineTable({
    job_id: v.id("jobs"),
    skill_id: v.id("skills"),
    type: v.optional(skillType),
    proficiency: v.optional(proficiency),
    weight: v.optional(v.number()),
    /** Denormalized so postings can be read newest-first without joining jobs. */
    published_date: v.optional(v.number()),
  })
    .index("by_job", ["job_id"])
    .index("by_skill", ["skill_id"])
    .index("by_skill_and_published", ["skill_id", "published_date"]),

  // Sidecar so skill enrichment never patches `jobs` (avoids OCC with ATS sync).
  job_skill_extractions: defineTable({
    job_id: v.id("jobs"),
    // Same title+JD fingerprint reuses extracted skills instead of another LLM call.
    content_hash: v.optional(v.string()),
  })
    .index("by_job", ["job_id"])
    .index("by_content_hash", ["content_hash"]),

  /**
   * Compact, denormalized scoring input for one job. Scoring a job from this row
   * needs no extra reads, which is what lets a background pass cover the whole
   * catalog instead of a keyword-selected slice.
   */
  job_match_vectors: defineTable({
    job_id: v.id("jobs"),
    status: v.optional(v.string()),
    published_date: v.optional(v.number()),
    experience: v.optional(v.number()),
    /** Resolved display fields, so scoring needs no extra reads. */
    title: v.optional(v.string()),
    company_name: v.optional(v.string()),
    industry: v.optional(v.string()),
    job_title_name: v.optional(v.string()),
    /** Sum of every skill weight on the job: the denominator of skill readiness. */
    total_weight: v.number(),
    skills: v.array(
      v.object({
        skill_id: v.id("skills"),
        name: v.optional(v.string()),
        type: v.optional(skillType),
        proficiency: v.optional(proficiency),
        weight: v.optional(v.number()),
      }),
    ),
    updated_at: v.number(),
  })
    .index("by_job", ["job_id"])
    .index("by_status_and_published", ["status", "published_date"]),

  /**
   * Cached per-user ranking across the whole catalog. `fingerprint` matches the
   * fit-report profile fingerprint, so a profile edit invalidates it.
   */
  job_match_rankings: defineTable({
    user_id: v.id("users"),
    fingerprint: v.string(),
    entries: v.array(
      v.object({
        job_id: v.id("jobs"),
        readiness: v.number(),
        smart_match: v.number(),
        career_alignment: v.optional(v.number()),
      }),
    ),
    /** How many catalog jobs the pass considered. */
    scanned: v.number(),
    /** Tier totals across the whole catalog, so counts never depend on TOP_K. */
    ready_total: v.number(),
    almost_total: v.number(),
    growth_total: v.number(),
    computed_at: v.number(),
    /** Set while a recompute is running; guards against duplicate passes. */
    computing_at: v.optional(v.number()),
    /** Earliest time the debounced recompute may run. */
    recompute_due_at: v.optional(v.number()),
  }).index("by_user", ["user_id"]),

  job_applications: defineTable({
    user_id: v.id("users"),
    job_id: v.id("jobs"),
    resume_id: v.optional(v.id("resumes")),
    cover_letter: v.optional(v.string()),
    status: applicationStatus,
    applied_at: v.number(),
    withdrawn_at: v.optional(v.number()),
  })
    .index("by_user", ["user_id"])
    .index("by_job", ["job_id"])
    .index("by_job_and_user", ["job_id", "user_id"])
    .index("by_user_and_status", ["user_id", "status"])
    .index("by_job_and_status", ["job_id", "status"]),

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

  job_application_notes: defineTable({
    job_id: v.id("jobs"),
    job_application_id: v.id("job_applications"),
    user_id: v.id("users"),
    author_name: v.string(),
    author_image: v.optional(v.string()),
    text: v.string(),
    visibility: v.optional(v.string()),
    created_at: v.number(),
  })
    .index("by_application", ["job_application_id"])
    .index("by_job", ["job_id"]),

  job_views: defineTable({
    job_id: v.id("jobs"),
    user_id: v.id("users"),
    viewed_at: v.number(),
  })
    .index("by_job", ["job_id"])
    .index("by_user", ["user_id"])
    .index("by_job_and_user", ["job_id", "user_id"]),

  job_stats: defineTable({
    job_id: v.id("jobs"),
    view_count: v.number(),
    application_count: v.number(),
  }).index("by_job", ["job_id"]),

  // Denormalized browse totals. countFiltered reads this instead of scanning every open job.
  job_browse_stats: defineTable({
    key: v.string(),
    count: v.number(),
  }).index("by_key", ["key"]),

  // Platform-wide totals for the admin dashboard. Kept as counter rows so the
  // dashboard never scans a growing table. Each key is updated in the same
  // mutation as the source write (see lib/adminStats.ts).
  admin_stats: defineTable({
    key: v.string(),
    count: v.number(),
  }).index("by_key", ["key"]),

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
    employment_type: v.optional(v.string()),
    work_type: v.optional(v.string()),
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
    // True while `proficiency` is estimated from experience, certifications,
    // education, and profile text. Estimates are rewritten when that evidence changes.
    proficiency_inferred: v.optional(v.boolean()),
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
    level_id: v.optional(v.id("degree_levels")),
    name: v.string(),
    abbreviation: v.optional(v.string()),
  })
    .index("by_level", ["level_id"])
    .index("by_name", ["name"])
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
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"), v.literal("duplicate")),
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
    /** `skillMatchKey(name)`; links spelling variants such as ReactJS and React. */
    match_key: v.optional(v.string()),
  })
    .index("by_name", ["name"])
    .index("by_match_key", ["match_key"])
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

  // One current career goal per user. Job matching reads target_role from here.
  career_goals: defineTable({
    user_id: v.id("users"),
    description: v.optional(v.string()),
    target_role: v.string(),
    target_roles: v.optional(v.array(v.string())),
    dream_companies: v.array(v.string()),
    industries: v.optional(v.array(v.string())),
    timeline: v.optional(v.union(v.literal("3_months"), v.literal("6_months"), v.literal("1_year"), v.literal("2_plus_years"))),
    experience_level: v.optional(v.union(v.literal("entry"), v.literal("mid"), v.literal("senior"), v.literal("lead"))),
    skills: v.array(v.string()),
    primary_focus: v.optional(v.union(v.literal("switch_roles"), v.literal("get_promoted"), v.literal("switch_industries"), v.literal("upskill"))),
    updated_at: v.number(),
  }).index("by_user", ["user_id"]),

  ats_integrations: defineTable({
    user_id: v.id("users"),
    provider: v.union(v.literal("zoho_recruit"), v.literal("greenhouse"), v.literal("lever"), v.literal("keka"), v.literal("ashby"), v.literal("bamboohr"), v.literal("workday"), v.literal("smartrecruiters"), v.literal("workable"), v.literal("oracle_cloud"), v.literal("eightfold"), v.literal("rippling"), v.literal("breezy"), v.literal("recruitee"), v.literal("personio"), v.literal("teamtailor"), v.literal("darwinbox"), v.literal("icims")),
    status: v.union(v.literal("connected"), v.literal("error"), v.literal("pending"), v.literal("disconnected")),
    auth_type: v.union(v.literal("oauth"), v.literal("api_key"), v.literal("gated"), v.literal("board")),
    // employer = user's own ATS (Harvest / API key). public_board = admin-ingested career site.
    kind: v.optional(v.union(v.literal("employer"), v.literal("public_board"))),
    // TODO: move secrets to an encrypted vault before production use.
    api_key: v.optional(v.string()),
    client_id: v.optional(v.string()),
    refresh_token: v.optional(v.string()),
    region: v.optional(v.string()),
    subdomain: v.optional(v.string()),
    sync_jobs: v.boolean(),
    sync_candidates: v.boolean(),
    records_synced: v.number(),
    connected_since: v.optional(v.number()),
    last_synced_at: v.optional(v.number()),
    next_sync_at: v.optional(v.number()),
    // Set while a sync action is in flight so overlapping pulls skip instead of colliding.
    sync_started_at: v.optional(v.number()),
    error_message: v.optional(v.string()),
    error_detected_at: v.optional(v.number()),
    requested_at: v.optional(v.number()),
  })
    .index("by_user", ["user_id"])
    .index("by_user_and_provider", ["user_id", "provider"])
    .index("by_kind", ["kind"])
    .index("by_kind_provider_subdomain", ["kind", "provider", "subdomain"]),

  // Editorial posts written by the admin blog agent. Content is stored as
  // structured blocks so public pages can render semantic HTML without trusting
  // model-authored markup.
  blog_posts: defineTable({
    slug: v.string(),
    title: v.string(),
    excerpt: v.string(),
    meta_title: v.string(),
    meta_description: v.string(),
    primary_keyword: v.string(),
    search_intent: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    intro: v.string(),
    key_takeaways: v.array(v.string()),
    sections: v.array(
      v.object({
        heading: v.string(),
        paragraphs: v.array(v.string()),
        bullets: v.array(v.string()),
      }),
    ),
    faq: v.array(
      v.object({
        question: v.string(),
        answer: v.string(),
      }),
    ),
    related_links: v.array(
      v.object({
        label: v.string(),
        href: v.string(),
      }),
    ),
    cover_image_id: v.optional(v.id("_storage")),
    cover_image_alt: v.string(),
    cover_status: v.union(v.literal("ready"), v.literal("failed")),
    cover_error: v.optional(v.string()),
    image_prompt: v.string(),
    status: v.union(v.literal("draft"), v.literal("published")),
    seo_score: v.number(),
    word_count: v.number(),
    reading_minutes: v.number(),
    content_hash: v.string(),
    model: v.string(),
    image_model: v.string(),
    prompt_version: v.string(),
    created_by: v.id("users"),
    created_at: v.number(),
    updated_at: v.number(),
    published_at: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_status_published_at", ["status", "published_at"])
    .index("by_created_at", ["created_at"]),

  // Observable state for the admin-only blog generator. The actual workflow is
  // an action, so this sidecar lets the panel survive a reload mid-generation.
  blog_generation_runs: defineTable({
    status: v.union(v.literal("running"), v.literal("completed"), v.literal("failed")),
    title_hint: v.optional(v.string()),
    model: v.string(),
    image_model: v.string(),
    actor_user_id: v.id("users"),
    started_at: v.number(),
    completed_at: v.optional(v.number()),
    blog_id: v.optional(v.id("blog_posts")),
    error: v.optional(v.string()),
  })
    .index("by_started_at", ["started_at"])
    .index("by_status_started_at", ["status", "started_at"]),

  // Singleton (at most one row). Admin toggle for ATS / public-board ingest.
  admin_settings: defineTable({
    ats_sync_enabled: v.boolean(),
  }),

  // Append-only trail of admin actions. One row per mutation an admin made,
  // so a privileged change is always attributable and revertable.
  admin_audit_log: defineTable({
    admin_user_id: v.id("users"),
    // Coarse action verb, e.g. "user.role_changed" / "user.suspended".
    action: v.string(),
    // The user the action targeted, when the action is user-scoped.
    target_user_id: v.optional(v.id("users")),
    target_job_id: v.optional(v.id("jobs")),
    // Small, human-readable before/after values for the change.
    before: v.optional(v.any()),
    after: v.optional(v.any()),
    // Free-form reason supplied by the admin (e.g. a moderation note).
    note: v.optional(v.string()),
    created_at: v.number(),
  })
    .index("by_created_at", ["created_at"])
    .index("by_admin", ["admin_user_id", "created_at"])
    .index("by_target_user", ["target_user_id", "created_at"]),

  // Sidecar rows for Qelsa Agent conversations. The Agent component owns the
  // thread itself; this table powers the in-app conversation list, ordering,
  // and per-user access checks without scanning the component's tables.
  qelsa_agent_threads: defineTable({
    user_id: v.id("users"),
    thread_id: v.string(),
    title: v.string(),
    created_at: v.number(),
    last_message_at: v.number(),
    // Generation lifecycle. The Agent component owns messages/streams; these
    // fields let the app distinguish a live run from one that timed out, and
    // retry the failed prompt without replaying the user's message.
    generation_seq: v.optional(v.number()),
    active_generation_id: v.optional(v.string()),
    active_generation_started_at: v.optional(v.number()),
    last_generation_id: v.optional(v.string()),
    last_generation_status: v.optional(
      v.union(
        v.literal("running"),
        v.literal("succeeded"),
        v.literal("failed"),
        v.literal("stopped"),
      ),
    ),
    last_generation_error: v.optional(v.string()),
    last_prompt_message_id: v.optional(v.string()),
    last_prompt_text: v.optional(v.string()),
    // The prompt whose tools must no longer run because the user stopped it.
    // Kept after a new prompt starts so a slow tool from the stopped turn
    // cannot write results into the thread later.
    stopped_prompt_message_id: v.optional(v.string()),
  })
    .index("by_user", ["user_id", "last_message_at"])
    .index("by_thread", ["thread_id"]),

  // Durable, user-editable facts the candidate Agent can use across chats.
  // Kept separate from the profile so the Agent can remember conversational
  // preferences and coaching context without mutating structured profile data.
  agent_memories: defineTable({
    user_id: v.id("users"),
    text: v.string(),
    normalized: v.string(),
    category: v.union(
      v.literal("preference"),
      v.literal("constraint"),
      v.literal("goal"),
      v.literal("experience"),
      v.literal("coaching"),
      v.literal("other"),
    ),
    source: v.union(v.literal("user"), v.literal("agent")),
    created_at: v.number(),
    updated_at: v.number(),
    expires_at: v.optional(v.number()),
  })
    .index("by_user_and_updated", ["user_id", "updated_at"])
    .index("by_user_and_normalized", ["user_id", "normalized"]),

  // Per-day prompt counter so one user cannot run unbounded agent cost.
  qelsa_agent_usage: defineTable({
    user_id: v.id("users"),
    day: v.string(),
    count: v.number(),
  }).index("by_user_and_day", ["user_id", "day"]),

  // Latest contextual follow-up prompts for a thread. One row per thread,
  // patched in place so the table stays bounded as conversations grow.
  qelsa_agent_followups: defineTable({
    user_id: v.id("users"),
    thread_id: v.string(),
    suggestions: v.array(v.string()),
    created_at: v.number(),
  }).index("by_thread", ["thread_id"]),

  // Saved searches power the agent's proactive layer. `seen_job_ids` is a
  // bounded diff so a job never produces the same alert twice.
  agent_saved_searches: defineTable({
    user_id: v.id("users"),
    name: v.string(),
    query: v.optional(v.string()),
    city: v.optional(v.string()),
    workplace_type: v.optional(v.string()),
    remote: v.optional(v.boolean()),
    salary_min: v.optional(v.number()),
    email_alerts: v.optional(v.boolean()),
    push_alerts: v.optional(v.boolean()),
    active: v.boolean(),
    created_at: v.number(),
    last_checked_at: v.optional(v.number()),
    seen_job_ids: v.array(v.id("jobs")),
  })
    .index("by_user", ["user_id"])
    .index("by_active", ["active"]),

  // Agent briefs are generated by scheduled search runs or on demand. They
  // store only the IDs and a short summary; the UI enriches job cards.
  agent_briefs: defineTable({
    user_id: v.id("users"),
    kind: v.union(
      v.literal("saved_search"),
      v.literal("applications"),
      v.literal("career"),
    ),
    title: v.string(),
    summary: v.string(),
    job_ids: v.array(v.id("jobs")),
    saved_search_id: v.optional(v.id("agent_saved_searches")),
    // Stable key for briefs generated on a schedule or on Agent open, so a
    // double mount or retry cannot create duplicate application/career cards.
    dedupe_key: v.optional(v.string()),
    read: v.boolean(),
    created_at: v.number(),
    read_at: v.optional(v.number()),
    email_sent_at: v.optional(v.number()),
    push_sent_at: v.optional(v.number()),
  })
    .index("by_user_and_created", ["user_id", "created_at"])
    .index("by_user_and_read", ["user_id", "read"])
    .index("by_user_and_dedupe", ["user_id", "dedupe_key"]),

  // Candidate-only notes kept out of the recruiter-facing notes table.
  agent_application_notes: defineTable({
    user_id: v.id("users"),
    application_id: v.id("job_applications"),
    text: v.string(),
    created_at: v.number(),
  }).index("by_application", ["application_id"]),

  // Short-lived packets for the external-application bookmarklet. The document
  // id is the unguessable token; packet data is only exposed through the
  // short-lived HTTP consumer, which can be retried while the packet is valid.
  agent_autofill_tokens: defineTable({
    user_id: v.id("users"),
    job_id: v.id("jobs"),
    packet: v.any(),
    created_at: v.number(),
    expires_at: v.number(),
    used_at: v.optional(v.number()),
  })
    .index("by_user", ["user_id"])
    .index("by_expires_at", ["expires_at"]),

  // Attribution for course links. We store the recommendation context, not
  // anything the affiliate network needs; no email or profile data is shared.
  course_clicks: defineTable({
    user_id: v.id("users"),
    course_id: v.string(),
    provider: v.string(),
    job_id: v.optional(v.id("jobs")),
    source: v.string(),
    matched_skills: v.array(v.string()),
    created_at: v.number(),
  })
    .index("by_user_and_created", ["user_id", "created_at"])
    .index("by_course", ["course_id"]),

  // AI-generated, role-based interview prep. Tracks and questions are separate
  // so a guide can grow without approaching a single document's size limits.
  interview_prep_tracks: defineTable({
    slug: v.string(),
    title: v.string(),
    role_family: v.string(),
    level: v.string(),
    summary: v.string(),
    description: v.string(),
    skills: v.array(v.string()),
    interview_types: v.array(v.string()),
    question_count: v.number(),
    estimated_minutes: v.number(),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    quality_score: v.number(),
    quality_flags: v.array(v.string()),
    demand_score: v.number(),
    generation_run_id: v.optional(v.id("curriculum_runs")),
    model: v.string(),
    prompt_version: v.string(),
    content_hash: v.string(),
    published_at: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .index("by_role_family", ["role_family"])
    .index("by_status_and_role_family", ["status", "role_family"]),

  interview_prep_questions: defineTable({
    track_id: v.id("interview_prep_tracks"),
    order: v.number(),
    category: v.string(),
    question: v.string(),
    answer: v.string(),
    key_points: v.array(v.string()),
    follow_ups: v.array(v.string()),
    difficulty: v.string(),
    skills: v.array(v.string()),
  }).index("by_track_and_order", ["track_id", "order"]),

  // Audit trail for autonomous curriculum runs. The run stores the demand
  // snapshot and planner decisions so a generated track can always be traced
  // back to the data and model version that produced it.
  curriculum_runs: defineTable({
    status: v.union(v.literal("running"), v.literal("completed"), v.literal("failed")),
    trigger: v.string(),
    started_at: v.number(),
    completed_at: v.optional(v.number()),
    model: v.string(),
    demand_snapshot: v.any(),
    decisions: v.array(v.any()),
    tracks_created: v.number(),
    tracks_published: v.number(),
    error: v.optional(v.string()),
    actor_user_id: v.optional(v.id("users")),
  }).index("by_started_at", ["started_at"]),

  // One row per browser/device. Endpoints are opaque Web Push URLs.
  agent_push_subscriptions: defineTable({
    user_id: v.id("users"),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    created_at: v.number(),
    last_used_at: v.optional(v.number()),
  })
    .index("by_user", ["user_id"])
    .index("by_endpoint", ["endpoint"]),

  // Dodo Payments customer mapping. One app user can own one billing customer.
  billing_customers: defineTable({
    user_id: v.id("users"),
    dodo_customer_id: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_dodo_customer_id", ["dodo_customer_id"]),

  // Current and historical subscriptions. Dodo webhooks are authoritative;
  // this table is the cheap read model used for entitlements and settings UI.
  billing_subscriptions: defineTable({
    user_id: v.id("users"),
    page_id: v.optional(v.id("pages")),
    dodo_customer_id: v.string(),
    dodo_subscription_id: v.string(),
    product_id: v.string(),
    plan: v.union(v.literal("plus"), v.literal("pro")),
    interval: v.union(v.literal("month"), v.literal("year")),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("on_hold"),
      v.literal("paused"),
      v.literal("cancelled"),
      v.literal("failed"),
      v.literal("expired"),
    ),
    quantity: v.number(),
    currency: v.string(),
    recurring_amount: v.number(),
    current_period_start: v.optional(v.number()),
    current_period_end: v.optional(v.number()),
    cancel_at_period_end: v.boolean(),
    cancelled_at: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
    last_event_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_user_and_updated_at", ["user_id", "updated_at"])
    .index("by_dodo_subscription_id", ["dodo_subscription_id"])
    .index("by_dodo_customer_id", ["dodo_customer_id"])
    .index("by_page", ["page_id"]),

  // Complimentary Pro access granted by an admin. This is independent of Dodo:
  // a user with an active row here is treated as Pro until the grant is revoked,
  // and a real subscription can coexist with it.
  manual_entitlements: defineTable({
    user_id: v.id("users"),
    plan: v.literal("pro"),
    granted_by: v.id("users"),
    granted_at: v.number(),
    revoked_at: v.optional(v.number()),
    revoked_by: v.optional(v.id("users")),
    note: v.optional(v.string()),
  })
    .index("by_user", ["user_id"])
    .index("by_user_and_granted_at", ["user_id", "granted_at"]),

  // Admin-managed external courses. Static catalog entries still live in
  // lib/courseCatalog.ts; these are courses an admin adds with a partner link
  // and optional AI-prefilled metadata.
  affiliate_courses: defineTable({
    provider: v.string(),
    title: v.string(),
    description: v.string(),
    url: v.string(),
    skills: v.array(v.string()),
    level: v.string(),
    duration: v.string(),
    free: v.boolean(),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    ai_filled: v.boolean(),
    created_by: v.id("users"),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_provider", ["provider"]),

  // Idempotency ledger for signed Dodo webhooks. A retried event must not
  // duplicate subscriptions or corrupt entitlement state.
  billing_events: defineTable({
    event_key: v.string(),
    type: v.string(),
    subscription_id: v.optional(v.string()),
    payment_id: v.optional(v.string()),
    event_at: v.number(),
    received_at: v.number(),
  }).index("by_event_key", ["event_key"]),

  // Short-lived cache of the authoritative Dodo product prices. Pricing is
  // fetched server-side so the browser never sees product IDs or invents an
  // amount from stale copy.
  billing_price_cache: defineTable({
    plan: v.optional(v.union(v.literal("plus"), v.literal("pro"))),
    interval: v.union(v.literal("month"), v.literal("year")),
    product_id: v.string(),
    amount: v.number(),
    currency: v.string(),
    // Dodo resolves localized pricing separately from the product's base
    // price. Cache the active rules so a pricing page render does not fan out
    // to Dodo on every visit.
    localized_prices: v.optional(
      v.array(
        v.object({
          country_code: v.optional(v.string()),
          currency: v.string(),
          amount: v.number(),
        }),
      ),
    ),
    localized_fetched_at: v.optional(v.number()),
    fetched_at: v.number(),
  })
    .index("by_interval", ["interval"])
    .index("by_plan_and_interval", ["plan", "interval"]),

  // Admin-editable plan limits and benefit copy. Missing rows fall back to the
  // defaults in lib/planConfig.ts, so a fresh deployment works without seeding.
  plan_configs: defineTable({
    audience: v.union(v.literal("candidate"), v.literal("employer")),
    plan: v.union(v.literal("free"), v.literal("plus"), v.literal("pro")),
    agent_daily_limit: v.number(),
    application_limit: v.union(v.number(), v.null()),
    description: v.string(),
    features: v.array(v.string()),
    updated_at: v.number(),
    updated_by: v.id("users"),
  }).index("by_audience_and_plan", ["audience", "plan"]),
});
