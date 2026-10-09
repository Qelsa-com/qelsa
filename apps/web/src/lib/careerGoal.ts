import type { CareerGoalExperienceLevel, CareerGoalFocus, CareerGoalTimeline, ExtractedCareerGoal } from "@/types/careerGoal";

export const GOAL_TIMELINE_OPTIONS: { value: CareerGoalTimeline; label: string }[] = [
  { value: "3_months", label: "3 months" },
  { value: "6_months", label: "6 months" },
  { value: "1_year", label: "1 year" },
  { value: "2_plus_years", label: "2+ years" },
];

export const GOAL_EXPERIENCE_OPTIONS: { value: CareerGoalExperienceLevel; label: string }[] = [
  { value: "entry", label: "Entry Level" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead/Principal" },
];

export const GOAL_FOCUS_OPTIONS: { value: CareerGoalFocus; label: string }[] = [
  { value: "switch_roles", label: "Switch roles" },
  { value: "get_promoted", label: "Get promoted" },
  { value: "switch_industries", label: "Switch industries" },
  { value: "upskill", label: "Upskill in current role" },
];

export const STANDARD_INDUSTRIES = [
  "Technology",
  "Fintech",
  "Insurtech",
  "SaaS",
  "Artificial Intelligence",
  "Healthcare",
  "E-Commerce",
  "Education",
  "Cybersecurity",
  "Cloud Computing",
  "Gaming",
  "Biotechnology",
  "CleanTech",
  "Media & Entertainment",
  "Financial Services",
  "Consulting",
  "Aerospace & Defense",
  "Retail",
  "Consumer Goods",
  "Hospitality",
  "Real Estate",
  "Telecommunications",
  "Transportation & Logistics",
];

export function hasCareerGoal(goal: { target_role?: string; target_roles?: string[] } | null | undefined): boolean {
  return Boolean(goal?.target_role?.trim() || goal?.target_roles?.length);
}

export function goalTimelineLabel(value?: CareerGoalTimeline): string {
  return GOAL_TIMELINE_OPTIONS.find((option) => option.value === value)?.label ?? "";
}

const MAX_COMPANIES = 12;
const MAX_INDUSTRIES = 8;
const MAX_ROLES = 8;
const MAX_SKILLS = 16;
const MAX_TAG = 80;
const MAX_ROLE = 120;

function uniqueTrimmed(values: string[], maxItems: number): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of values) {
    const value = raw.trim().slice(0, MAX_TAG);
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
    if (out.length >= maxItems) break;
  }
  return out;
}

const KNOWN_INDUSTRIES: [RegExp, string][] = [
  [/\b(?:health(?:care)?|hospital|medical|clinical|nursing)\b/i, "Healthcare"],
  [/\bbiotech(?:nology)?\b/i, "Biotechnology"],
  [/\b(?:pharma|pharmaceutical)\b/i, "Pharmaceuticals"],
  [/\bfintech\b/i, "Fintech"],
  [/\b(?:finance|banking|investment|hedge\s*fund|wealth\s*management|private\s*equity)\b/i, "Financial Services"],
  [/\binsurtech|insurance\b/i, "Insurance"],
  [/\b(?:e-?commerce|retail)\b/i, "Retail & E-Commerce"],
  [/\b(?:fashion|apparel|luxury)\b/i, "Fashion & Luxury Goods"],
  [/\b(?:media|entertainment|film|music|publishing)\b/i, "Media & Entertainment"],
  [/\b(?:gaming|video\s*games)\b/i, "Gaming"],
  [/\b(?:marketing|advertising|pr|public\s*relations)\b/i, "Marketing & Advertising"],
  [/\b(?:legal|law\s*firm|attorney|counsel)\b/i, "Legal Services"],
  [/\b(?:education|edtech|university|school|academic)\b/i, "Education"],
  [/\b(?:real\s*estate|property|housing|construction|architecture)\b/i, "Real Estate & Construction"],
  [/\b(?:supply\s*chain|logistics|transportation|freight|shipping)\b/i, "Supply Chain & Logistics"],
  [/\b(?:hospitality|hotel|travel|restaurant|culinary)\b/i, "Hospitality & Tourism"],
  [/\b(?:aerospace|aviation|defense)\b/i, "Aerospace & Defense"],
  [/\b(?:energy|oil|gas|renewables?|solar|cleantech)\b/i, "Energy & CleanTech"],
  [/\b(?:automotive|electric\s*vehicles?|ev)\b/i, "Automotive"],
  [/\b(?:manufacturing|industrial)\b/i, "Manufacturing"],
  [/\bconsulting\b/i, "Management Consulting"],
  [/\bsaas\b/i, "SaaS"],
  [/\b(?:ai|genai|artificial intelligence|machine learning)\b/i, "Artificial Intelligence"],
  [/\bcybersecurity\b/i, "Cybersecurity"],
  [/\bcloud\b/i, "Cloud Computing"],
  [/\btech(?:nology)?|software\b/i, "Technology"],
];

const COMMON_SKILLS_KEYWORDS: [RegExp, string][] = [
  [/\b(?:gen\s*ai|generative\s*ai)\b/i, "Gen AI"],
  [/\bai\s*agents?\b/i, "AI Agents"],
  [/\bmachine\s*learning\b/i, "Machine Learning"],
  [/\bproduct\s*strategy\b/i, "Product Strategy"],
  [/\bproduct\s*management\b/i, "Product Management"],
  [/\buser\s*experience\b|\bux\b/i, "User Experience"],
  [/\buser\s*research\b/i, "User Research"],
  [/\bdata\s*science\b/i, "Data Science"],
  [/\bdata\s*analytics?\b/i, "Data Analytics"],
  [/\bpython\b/i, "Python"],
  [/\b(?:leadership|cross-functional)\b/i, "Cross-Functional Leadership"],
  [/\bsystem\s*design\b/i, "System Design"],
  [/\bprompt\s*engineering\b/i, "Prompt Engineering"],
];

export function capitalizeTitle(str: string): string {
  const words = str.trim().split(/\s+/);
  return words
    .map((w) => {
      const lower = w.toLowerCase();
      if (lower === "ai" || lower === "ux" || lower === "ui" || lower === "ml" || lower === "pm" || lower === "qa" || lower === "sre" || lower === "vp" || lower === "cfo" || lower === "cmo" || lower === "cto" || lower === "ceo") {
        return lower.toUpperCase();
      }
      if (lower === "sr." || lower === "sr") return "Sr.";
      if (lower === "jr." || lower === "jr") return "Jr.";
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

export function inferRelatedRoles(roleText: string): string[] {
  const lower = roleText.toLowerCase();
  const cap = capitalizeTitle(roleText);
  const roles = [cap];

  // Universal cross-industry seniority progression
  if (/\blead\b/i.test(lower)) {
    const base = cap.replace(/\blead\s*/i, "").trim();
    if (base) roles.push(`Senior ${base}`, `Staff ${base}`, `Principal ${base}`);
  } else if (/\bsenior|sr\.?\b/i.test(lower)) {
    const base = cap.replace(/\b(?:senior|sr\.?)\s*/i, "").trim();
    if (base) roles.push(`Lead ${base}`, `Principal ${base}`, base);
  } else if (/\bdirector\b/i.test(lower)) {
    const base = cap.replace(/\bdirector(?:\s+of)?\s*/i, "").trim();
    if (base) roles.push(`Senior Director of ${base}`, `VP of ${base}`, `Head of ${base}`);
  } else if (/\bhead\s+of\b/i.test(lower)) {
    const base = cap.replace(/\bhead\s+of\s*/i, "").trim();
    if (base) roles.push(`Director of ${base}`, `VP of ${base}`);
  } else if (/\bchief\b/i.test(lower)) {
    const base = cap.replace(/\bchief\s+/i, "").replace(/\s+officer\b/i, "").trim();
    if (base) roles.push(`VP of ${base}`, `Head of ${base}`, `Director of ${base}`);
  } else if (/\bmanager\b/i.test(lower)) {
    const base = cap.replace(/\bmanager(?:\s+of)?\s*/i, "").trim();
    if (base) roles.push(`Senior ${base} Manager`, `Lead ${base} Manager`, `Director of ${base}`);
  } else {
    roles.push(`Senior ${cap}`, `Lead ${cap}`);
  }

  // Domain-specific enhancements when recognized
  if (/front\s*end|frontend/i.test(lower)) {
    if (/lead/i.test(lower)) {
      roles.push("Senior Frontend Engineer", "Staff Frontend Engineer", "Frontend Architect");
    } else if (/senior|sr/i.test(lower)) {
      roles.push("Lead Frontend Developer", "Senior Frontend Engineer", "Frontend Developer");
    } else {
      roles.push("Senior Frontend Developer", "Frontend Developer");
    }
  } else if (/back\s*end|backend/i.test(lower)) {
    if (/lead/i.test(lower)) {
      roles.push("Senior Backend Engineer", "Staff Backend Engineer", "Backend Architect");
    } else if (/senior|sr/i.test(lower)) {
      roles.push("Lead Backend Developer", "Senior Backend Engineer", "Backend Developer");
    } else {
      roles.push("Senior Backend Developer", "Backend Developer");
    }
  } else if (/full\s*stack|fullstack/i.test(lower)) {
    roles.push("Senior Full Stack Engineer", "Full Stack Developer");
  } else if (/product\s*manager|\bpm\b/i.test(lower)) {
    if (/ai/i.test(lower)) {
      roles.push("AI Product Manager", "Sr. Product Manager", "Product Manager");
    } else {
      roles.push("Sr. Product Manager", "Product Manager");
    }
  } else if (/data\s*scien/i.test(lower)) {
    roles.push("Senior Data Scientist", "Data Scientist", "Machine Learning Engineer");
  } else if (/data\s*analyst/i.test(lower)) {
    roles.push("Senior Data Analyst", "Data Analyst", "Business Intelligence Analyst");
  } else if (/devops|sre|platform/i.test(lower)) {
    roles.push("DevOps Engineer", "Site Reliability Engineer", "Cloud Engineer");
  } else if (/mobile/i.test(lower)) {
    roles.push("Senior Mobile Engineer", "iOS Developer", "Android Developer");
  } else if (/design|ui|ux/i.test(lower)) {
    roles.push("Product Designer", "Senior UX Designer", "UI Designer");
  }

  return uniqueTrimmed(roles, MAX_ROLES);
}

export function inferSkillsForRole(roleText: string): string[] {
  const lower = roleText.toLowerCase();
  if (/front\s*end|frontend/i.test(lower)) {
    if (/lead|senior|staff|principal|architect|manager/i.test(lower)) {
      return ["Frontend Architecture", "React", "TypeScript", "Web Performance", "System Design", "Engineering Leadership"];
    }
    return ["React", "TypeScript", "JavaScript", "HTML/CSS", "Web Performance", "Next.js"];
  }
  if (/back\s*end|backend/i.test(lower)) {
    if (/lead|senior|staff|principal|architect/i.test(lower)) {
      return ["System Design", "Microservices", "Node.js", "PostgreSQL", "Cloud Architecture", "Distributed Systems"];
    }
    return ["Node.js", "Python", "SQL", "REST APIs", "PostgreSQL", "System Design"];
  }
  if (/full\s*stack|fullstack/i.test(lower)) {
    return ["React", "Node.js", "TypeScript", "PostgreSQL", "System Design", "REST APIs"];
  }
  if (/product\s*manager|product\s*management|\bpm\b/i.test(lower)) {
    if (/ai|machine\s*learning|gen\s*ai/i.test(lower)) {
      return ["Product Strategy", "Gen AI", "AI Agents", "Product Management", "Machine Learning", "User Experience"];
    }
    return ["Product Strategy", "User Research", "Product Management", "Roadmapping", "Data Analytics", "Cross-Functional Leadership"];
  }
  if (/data\s*scien|machine\s*learn|\bml\b|\bai\b/i.test(lower)) {
    return ["Machine Learning", "Python", "Data Science", "SQL", "Deep Learning", "Statistics"];
  }
  if (/data\s*analyst|analytics|business\s*intelligence|\bbi\b/i.test(lower)) {
    return ["Data Analytics", "SQL", "Tableau", "Python", "Business Intelligence", "Data Visualization"];
  }
  if (/devops|sre|cloud|infrastructure|platform\s*engineer/i.test(lower)) {
    return ["Kubernetes", "Docker", "CI/CD", "AWS", "Terraform", "System Architecture"];
  }
  if (/mobile|ios|android/i.test(lower)) {
    return ["React Native", "iOS / Swift", "Android / Kotlin", "Mobile Architecture", "State Management"];
  }
  if (/design|ui|ux/i.test(lower)) {
    return ["UI/UX Design", "Figma", "Design Systems", "User Research", "Prototyping"];
  }
  if (/qa|test|automation|quality\s*assurance/i.test(lower)) {
    return ["Test Automation", "Selenium / Playwright", "API Testing", "CI/CD", "Quality Assurance"];
  }
  if (/security|cyber/i.test(lower)) {
    return ["Cybersecurity", "Network Security", "Penetration Testing", "Threat Modeling", "SIEM", "Security Compliance"];
  }
  if (/marketing|growth/i.test(lower)) {
    return ["Growth Marketing", "SEO", "Content Strategy", "Digital Marketing", "Conversion Rate Optimization", "Google Analytics"];
  }
  if (/sales|account\s*exec/i.test(lower)) {
    return ["B2B Sales", "Enterprise Sales", "CRM", "Pipeline Management", "Negotiation", "Client Relationship Management"];
  }
  return [];
}

export function normalizeSkillKey(skill: string): string {
  return skill
    .toLowerCase()
    .trim()
    .replace(/\.js\b|js\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function isSkillInList(skill: string, existingSkills: string[]): boolean {
  const key = normalizeSkillKey(skill);
  if (!key) return false;
  return existingSkills.some((existing) => {
    const existingKey = normalizeSkillKey(existing);
    if (!existingKey) return false;
    if (existingKey === key) return true;
    if (key.length >= 4 && existingKey.includes(key)) return true;
    if (existingKey.length >= 4 && key.includes(existingKey)) return true;
    return false;
  });
}

export function normalizeTitleKey(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/\bsr\.?\b|\bsenior\b/g, "senior")
    .replace(/\bjr\.?\b|\bjunior\b/g, "junior")
    .replace(/\bdeveloper\b/g, "engineer")
    .replace(/[^a-z0-9]/g, "");
}

export function isCurrentTitleMatch(targetRole: string, currentTitles: string[]): boolean {
  const normTarget = normalizeTitleKey(targetRole);
  if (!normTarget) return false;
  return currentTitles.some((cur) => {
    const normCur = normalizeTitleKey(cur);
    if (!normCur) return false;
    if (normTarget === normCur) return true;
    if (normCur.includes("senior") && normTarget.includes("senior")) {
      if (
        (normCur.includes("frontend") || normCur.includes("ui")) &&
        (normTarget.includes("frontend") || normTarget.includes("ui"))
      ) {
        return true;
      }
      if (normCur.includes("backend") && normTarget.includes("backend")) return true;
      if (normCur.includes("fullstack") && normTarget.includes("fullstack")) return true;
      if (normCur.includes("product") && normTarget.includes("product")) return true;
    }
    return false;
  });
}

export function getAdvancedGapSkills(roleText: string): string[] {
  const lower = roleText.toLowerCase();
  if (/front\s*end|frontend/i.test(lower)) {
    return [
      "Frontend Architecture",
      "System Design",
      "Engineering Leadership",
      "Web Performance",
      "Micro-Frontends",
      "Tech Strategy",
      "Team Mentorship",
      "Cross-Functional Leadership",
      "CI/CD & DevOps",
      "API Design",
    ];
  }
  if (/back\s*end|backend/i.test(lower)) {
    return [
      "System Design",
      "Distributed Systems",
      "Cloud Architecture",
      "Microservices",
      "Engineering Leadership",
      "Performance Tuning",
      "Database Optimization",
      "Security & Compliance",
    ];
  }
  if (/full\s*stack|fullstack/i.test(lower)) {
    return [
      "System Architecture",
      "Engineering Leadership",
      "Scalability & Performance",
      "API Design",
      "Cloud Infrastructure",
      "DevOps",
    ];
  }
  if (/product\s*manager|\bpm\b/i.test(lower)) {
    return [
      "Product Strategy",
      "Gen AI",
      "AI Agents",
      "Cross-Functional Leadership",
      "Executive Communication",
      "P&L Management",
      "Go-To-Market Strategy",
      "Data-Driven Roadmapping",
    ];
  }
  if (/data\s*scien|machine\s*learn|\bml\b|\bai\b/i.test(lower)) {
    return [
      "MLOps",
      "Deep Learning",
      "LLM Fine-Tuning",
      "Distributed ML Training",
      "Model Evaluation",
      "AI Safety & Governance",
    ];
  }
  if (/marketing|growth/i.test(lower)) {
    return [
      "Growth Strategy",
      "Brand Positioning",
      "Customer Acquisition",
      "Marketing Analytics",
      "Budget & P&L Management",
      "Cross-Functional Leadership",
    ];
  }
  if (/sales|revenue|account\s*exec/i.test(lower)) {
    return [
      "Enterprise Sales Strategy",
      "Revenue Operations",
      "Executive Negotiation",
      "Pipeline Forecasting",
      "Sales Leadership",
    ];
  }
  if (/finance|accounting|financial|banking|investment/i.test(lower)) {
    return [
      "Financial Modeling",
      "Strategic Financial Planning",
      "Capital Allocation",
      "Risk Management",
      "Corporate Finance",
      "Executive Reporting",
    ];
  }
  if (/health|clinical|nurs|medic|pharma/i.test(lower)) {
    return [
      "Clinical Leadership",
      "Healthcare Administration",
      "Patient Safety Protocols",
      "Regulatory Compliance",
      "Healthcare Operations",
    ];
  }
  if (/design|creative|art\s*director/i.test(lower)) {
    return [
      "Creative Direction",
      "Brand Strategy",
      "Design Systems",
      "User Experience Strategy",
      "Creative Team Leadership",
    ];
  }
  if (/legal|counsel|attorney|law/i.test(lower)) {
    return [
      "Legal Strategy",
      "Corporate Governance",
      "Regulatory Compliance",
      "Risk Mitigation",
      "Contract Negotiation",
    ];
  }
  if (/operations|supply\s*chain|logistics/i.test(lower)) {
    return [
      "Supply Chain Optimization",
      "Operations Strategy",
      "Vendor Management",
      "Process Engineering",
      "Cost Optimization",
    ];
  }
  return [];
}

export function filterSkillsAgainstProfile(
  suggestedSkills: string[],
  existingSkills: string[],
  roleText?: string,
): string[] {
  if (!existingSkills || existingSkills.length === 0) {
    return uniqueTrimmed(suggestedSkills, MAX_SKILLS);
  }

  const filtered = suggestedSkills.filter((s) => !isSkillInList(s, existingSkills));

  if (filtered.length < 5 && roleText) {
    const gapPool = getAdvancedGapSkills(roleText);
    for (const gapSkill of gapPool) {
      if (!isSkillInList(gapSkill, existingSkills) && !filtered.some((s) => s.toLowerCase() === gapSkill.toLowerCase())) {
        filtered.push(gapSkill);
        if (filtered.length >= 6) break;
      }
    }
  }

  return uniqueTrimmed(filtered.length > 0 ? filtered : suggestedSkills, MAX_SKILLS);
}

export function filterRolesAgainstProfile(
  suggestedRoles: string[],
  currentTitles: string[],
  targetRole?: string,
): string[] {
  if (!currentTitles || currentTitles.length === 0) {
    return uniqueTrimmed(suggestedRoles, MAX_ROLES);
  }

  const filtered = suggestedRoles.filter((role) => !isCurrentTitleMatch(role, currentTitles));

  if (filtered.length < 3 && targetRole) {
    const lower = targetRole.toLowerCase();
    if (/front\s*end|frontend/i.test(lower)) {
      const alternates = [
        "Lead Frontend Developer",
        "Staff Frontend Engineer",
        "Frontend Architect",
        "Principal Frontend Engineer",
        "Engineering Manager - Frontend",
      ];
      for (const alt of alternates) {
        if (!isCurrentTitleMatch(alt, currentTitles) && !filtered.some((r) => r.toLowerCase() === alt.toLowerCase())) {
          filtered.push(alt);
          if (filtered.length >= 4) break;
        }
      }
    } else if (/back\s*end|backend/i.test(lower)) {
      const alternates = [
        "Lead Backend Developer",
        "Staff Backend Engineer",
        "Backend Architect",
        "Principal Backend Engineer",
      ];
      for (const alt of alternates) {
        if (!isCurrentTitleMatch(alt, currentTitles) && !filtered.some((r) => r.toLowerCase() === alt.toLowerCase())) {
          filtered.push(alt);
          if (filtered.length >= 4) break;
        }
      }
    } else if (/product\s*manager|\bpm\b/i.test(lower)) {
      const alternates = [
        "Lead Product Manager",
        "Principal Product Manager",
        "Director of Product Management",
        "Group Product Manager",
      ];
      for (const alt of alternates) {
        if (!isCurrentTitleMatch(alt, currentTitles) && !filtered.some((r) => r.toLowerCase() === alt.toLowerCase())) {
          filtered.push(alt);
          if (filtered.length >= 4) break;
        }
      }
    }
  }

  return uniqueTrimmed(filtered.length > 0 ? filtered : suggestedRoles, MAX_ROLES);
}

/** Instant, no-network fill from the free-text goal. Empty fields stay empty. */
export function parseCareerGoalText(
  raw: string,
  profileContext?: { currentTitles?: string[]; existingSkills?: string[] },
): ExtractedCareerGoal {
  const text = raw.trim();
  const empty: ExtractedCareerGoal = {
    target_role: null,
    target_roles: [],
    dream_companies: [],
    industries: [],
    timeline: null,
    experience_level: null,
    skills: [],
    primary_focus: null,
    source: "rules",
  };
  if (!text) return empty;

  const lower = text.toLowerCase();
  const extracted: ExtractedCareerGoal = { ...empty };

  if (/\b2\s*\+?\s*years?\b/.test(lower) || /\btwo\s*\+?\s*years?\b/.test(lower)) extracted.timeline = "2_plus_years";
  else if (/\b1\s*year\b/.test(lower) || /\bone\s*year\b/.test(lower)) extracted.timeline = "1_year";
  else if (/\b6\s*months?\b/.test(lower) || /\bsix\s*months?\b/.test(lower)) extracted.timeline = "6_months";
  else if (/\b3\s*months?\b/.test(lower) || /\bthree\s*months?\b/.test(lower)) extracted.timeline = "3_months";

  if (/\b(lead|principal)\b/.test(lower)) extracted.experience_level = "lead";
  else if (/\b(senior|sr\.?)\b/.test(lower)) extracted.experience_level = "senior";
  else if (/\bmid[- ]?level\b|\bmidlevel\b|\bmid\b/.test(lower)) extracted.experience_level = "mid";
  else if (/\b(entry|junior|student|graduate|intern)\b/.test(lower)) extracted.experience_level = "entry";

  if (/\bswitch(?:ing)?\s+industr/.test(lower)) extracted.primary_focus = "switch_industries";
  else if (/\bpromot/.test(lower)) extracted.primary_focus = "get_promoted";
  else if (/\bupskill|\bgrow in (?:my |the )?current role\b/.test(lower)) extracted.primary_focus = "upskill";
  else if (/\bswitch(?:ing)?\s+roles?\b|\bcareer switch|\bchange (?:roles?|careers?)\b|\blooking for (?:a )?(?:job|role|opportunit)/.test(lower)) {
    extracted.primary_focus = "switch_roles";
  }

  // 1. Industries
  const matchedIndustries: string[] = [];
  for (const [pattern, label] of KNOWN_INDUSTRIES) {
    if (pattern.test(lower) && !matchedIndustries.includes(label)) {
      matchedIndustries.push(label);
    }
  }
  if (matchedIndustries.length === 0) {
    if (/tech|software|developer|engineer|code|frontend|backend|fullstack|data|cyber|devops|cloud|ai\b|ml\b/i.test(lower)) {
      matchedIndustries.push("Technology", "SaaS");
    }
  }
  extracted.industries = uniqueTrimmed(matchedIndustries, MAX_INDUSTRIES);

  // 2. Roles
  let rolesFound: string[] = [];
  const roleMatch =
    text.match(/(?:aiming for|want to be(?:come)?|looking for(?: a(?:n)? (?:job|role) as)?|as a(?:n)?|role(?: of)?)\s+([^.,\n]+?)(?:\s+(?:at|in|within|for|with|focusing on|specializing in)\b|[.,\n]|$)/i) ??
    text.match(/job opportunities in\s+([^.,\n]+?)(?:\s+(?:at|in|within|for|with|focusing on|specializing in)\b|[.,\n]|$)/i);
  if (roleMatch?.[1]) {
    const rawRole = roleMatch[1]
      .replace(/\b(?:jobs?|opportunities|roles?|company|startups?)\b/gi, "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, MAX_ROLE);
    if (rawRole) {
      rolesFound = inferRelatedRoles(rawRole);
    }
  }

  if (rolesFound.length === 0) {
    if (/lead\s+frontend\s+developer|frontend\s+lead/i.test(lower)) {
      rolesFound = ["Lead Frontend Developer", "Senior Frontend Engineer", "Staff Frontend Engineer"];
    } else if (/frontend\s+developer|frontend\s+engineer/i.test(lower)) {
      rolesFound = ["Senior Frontend Developer", "Frontend Developer"];
    } else if (/backend\s+developer|backend\s+engineer/i.test(lower)) {
      rolesFound = ["Senior Backend Developer", "Backend Developer"];
    } else if (/full\s*stack/i.test(lower)) {
      rolesFound = ["Full Stack Developer", "Senior Full Stack Developer"];
    } else if (/product\s+manager/i.test(lower)) {
      rolesFound = ["Sr. Product Manager", "Product Manager"];
    }
  }

  extracted.target_roles = uniqueTrimmed(rolesFound, MAX_ROLES);
  extracted.target_role = extracted.target_roles[0] ?? null;

  if (profileContext?.currentTitles && profileContext.currentTitles.length > 0) {
    extracted.target_roles = filterRolesAgainstProfile(
      extracted.target_roles,
      profileContext.currentTitles,
      extracted.target_role ?? undefined,
    );
    extracted.target_role = extracted.target_roles[0] ?? null;
  }

  // 3. Skills
  const skillsFound: string[] = [];
  for (const [pattern, label] of COMMON_SKILLS_KEYWORDS) {
    if (pattern.test(lower) && !skillsFound.includes(label)) {
      skillsFound.push(label);
    }
  }
  const skillMatch = text.match(/skills?(?: I want)?(?: to (?:build|learn|develop))?(?: like|:)?\s+([^.\n]+)/i);
  if (skillMatch?.[1]) {
    skillsFound.push(...skillMatch[1].split(/\s*(?:,|and|&)\s*/));
  }

  // If no skills explicitly stated, auto-suggest based on target role
  if (skillsFound.length === 0 && extracted.target_roles.length > 0) {
    skillsFound.push(...inferSkillsForRole(extracted.target_roles[0]));
  }

  extracted.skills = uniqueTrimmed(skillsFound, MAX_SKILLS);

  if (profileContext?.existingSkills && profileContext.existingSkills.length > 0) {
    extracted.skills = filterSkillsAgainstProfile(
      extracted.skills,
      profileContext.existingSkills,
      extracted.target_role ?? undefined,
    );
  }

  // 4. Default timeline if unset
  if (!extracted.timeline) {
    if (extracted.experience_level === "lead" || extracted.experience_level === "senior") {
      extracted.timeline = "1_year";
    } else {
      extracted.timeline = "6_months";
    }
  }

  const companyMatch =
    text.match(/(?:work at|at company|at companies|target companies?:?|dream companies?:?)\s+([A-Z][\w&.\-]+(?:\s*(?:,|and|&|or)\s*[A-Z][\w&.\-]+){0,8})/i) ??
    text.match(/\bat\s+([A-Z][\w&.\-]+(?:\s*(?:,|and|&|or)\s*[A-Z][\w&.\-]+){0,8})/);
  if (companyMatch?.[1]) {
    extracted.dream_companies = uniqueTrimmed(companyMatch[1].split(/\s*(?:,|and|&)\s*/), MAX_COMPANIES);
  }

  return extracted;
}

export function descriptionFingerprint(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}
