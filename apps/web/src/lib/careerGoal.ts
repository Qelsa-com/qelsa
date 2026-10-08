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
  [/\bfintech\b/i, "Fintech"],
  [/\binsurtech\b/i, "Insurtech"],
  [/\bsaas\b/i, "SaaS"],
  [/\b(?:health(?:care)?|healthtech)\b/i, "Healthcare"],
  [/\b(?:e-?commerce|retail)\b/i, "E-Commerce"],
  [/\b(?:ai|genai|artificial intelligence|machine learning)\b/i, "Artificial Intelligence"],
  [/\b(?:edtech|education)\b/i, "Education"],
  [/\bgaming\b/i, "Gaming"],
  [/\bbiotech(?:nology)?\b/i, "Biotechnology"],
  [/\b(?:cleantech|clean energy|renewables?)\b/i, "CleanTech"],
  [/\bcybersecurity\b/i, "Cybersecurity"],
  [/\bcloud\b/i, "Cloud Computing"],
  [/\b(?:banking|financial services)\b/i, "Financial Services"],
  [/\bconsulting\b/i, "Consulting"],
  [/\b(?:aerospace|defense)\b/i, "Aerospace & Defense"],
  [/\btech(?:nology)?\b/i, "Technology"],
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
      if (lower === "ai" || lower === "ux" || lower === "ui" || lower === "ml" || lower === "pm" || lower === "qa" || lower === "sre") {
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

/** Instant, no-network fill from the free-text goal. Empty fields stay empty. */
export function parseCareerGoalText(raw: string): ExtractedCareerGoal {
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
    matchedIndustries.push("Technology", "SaaS");
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
