/**
 * Small, curated upskilling catalog used by Qelsa Agent's fit reports.
 *
 * The catalog is intentionally static: course links are stable, public
 * resources, and recommendations stay deterministic and free of extra API
 * calls. A course is matched by normalized skill key plus explicit aliases for
 * common job-description phrasing (LLMs, MCP, agent SDKs, etc.).
 */

import { skillMatchKey } from "./skillMatch";

export type CourseRecommendation = {
  course_id: string;
  title: string;
  provider: string;
  url: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  free: boolean;
  description: string;
  matched_skills: string[];
  affiliate: boolean;
};

type Course = Omit<CourseRecommendation, "matched_skills" | "affiliate"> & {
  skills: string[];
  aliases?: string[];
};

const COURSES: Course[] = [
  {
    course_id: "python-py4e",
    title: "Python for Everybody",
    provider: "University of Michigan · py4e",
    url: "https://www.py4e.com/",
    level: "Beginner",
    duration: "8 weeks · self-paced",
    free: true,
    description: "Python fundamentals through data structures, web data, and databases.",
    skills: ["Python", "Programming"],
  },
  {
    course_id: "udemy-python-bootcamp",
    title: "The Complete Python Bootcamp",
    provider: "Udemy · Jose Portilla",
    url: "https://www.udemy.com/course/complete-python-bootcamp/",
    level: "Beginner",
    duration: "22 hours",
    free: false,
    description: "A project-based Python course from fundamentals through OOP and web scraping.",
    skills: ["Python", "Programming"],
  },
  {
    course_id: "udemy-web-developer-bootcamp",
    title: "The Web Developer Bootcamp",
    provider: "Udemy · Colt Steele",
    url: "https://www.udemy.com/course/the-web-developer-bootcamp/",
    level: "Beginner",
    duration: "60+ hours",
    free: false,
    description: "HTML, CSS, JavaScript, Node, and full-stack web application fundamentals.",
    skills: ["JavaScript", "Web Applications", "Full Stack Development", "Node.js"],
    aliases: ["webdevelopment", "fullstack", "fullstackdevelopment", "webapplication", "webapplications"],
  },
  {
    course_id: "udemy-react-complete-guide",
    title: "React — The Complete Guide",
    provider: "Udemy · Maximilian Schwarzmüller",
    url: "https://www.udemy.com/course/react-the-complete-guide-incl-redux/",
    level: "Intermediate",
    duration: "40+ hours",
    free: false,
    description: "Modern React, hooks, routing, state management, and production patterns.",
    skills: ["React", "Redux", "Frontend Development"],
    aliases: ["reactjs", "frontend", "webapplications"],
  },
  {
    course_id: "udemy-sql-bootcamp",
    title: "The Complete SQL Bootcamp",
    provider: "Udemy · Jose Portilla",
    url: "https://www.udemy.com/course/the-complete-sql-bootcamp/",
    level: "Beginner",
    duration: "9 hours",
    free: false,
    description: "SQL querying, joins, aggregation, and PostgreSQL analytics practice.",
    skills: ["SQL", "PostgreSQL", "Data Analysis"],
  },
  {
    course_id: "typescript-handbook",
    title: "TypeScript Handbook",
    provider: "Microsoft",
    url: "https://www.typescriptlang.org/docs/handbook/intro.html",
    level: "Intermediate",
    duration: "Self-paced",
    free: true,
    description: "Types, generics, narrowing, and production TypeScript patterns.",
    skills: ["TypeScript"],
    aliases: ["ts", "typescript"],
  },
  {
    course_id: "react-learn",
    title: "Learn React",
    provider: "react.dev",
    url: "https://react.dev/learn",
    level: "Beginner",
    duration: "Self-paced",
    free: true,
    description: "Components, state, effects, and building real React interfaces.",
    skills: ["React", "Frontend Development", "Web Applications"],
    aliases: ["reactjs", "frontend", "webapplication", "webapplications"],
  },
  {
    course_id: "javascript-info",
    title: "The Modern JavaScript Tutorial",
    provider: "javascript.info",
    url: "https://javascript.info/",
    level: "Beginner",
    duration: "Self-paced",
    free: true,
    description: "JavaScript from fundamentals to asynchronous programming and browser APIs.",
    skills: ["JavaScript"],
    aliases: ["js", "ecmascript"],
  },
  {
    course_id: "sqlbolt",
    title: "SQLBolt",
    provider: "SQLBolt",
    url: "https://sqlbolt.com/",
    level: "Beginner",
    duration: "2–3 hours",
    free: true,
    description: "Hands-on SQL: filtering, joins, aggregation, and subqueries.",
    skills: ["SQL", "Data Analysis", "Analytics"],
  },
  {
    course_id: "postgres-tutorial",
    title: "PostgreSQL Tutorial",
    provider: "PostgreSQL Tutorial",
    url: "https://www.postgresqltutorial.com/",
    level: "Beginner",
    duration: "Self-paced",
    free: true,
    description: "Practical PostgreSQL from queries and indexes to transactions.",
    skills: ["PostgreSQL", "Database Management"],
  },
  {
    course_id: "ml-specialization",
    title: "Machine Learning Specialization",
    provider: "DeepLearning.AI · Coursera",
    url: "https://www.coursera.org/specializations/machine-learning-introduction",
    level: "Intermediate",
    duration: "3 months",
    free: false,
    description: "Supervised learning, neural networks, and practical ML with Andrew Ng.",
    skills: ["Machine Learning", "Neural Networks", "TensorFlow"],
  },
  {
    course_id: "hf-llm-course",
    title: "Hugging Face LLM Course",
    provider: "Hugging Face",
    url: "https://huggingface.co/learn/llm-course",
    level: "Intermediate",
    duration: "Self-paced",
    free: true,
    description: "Transformers, fine-tuning, evaluation, and deploying language models.",
    skills: ["Large Language Models", "LLM Evaluation"],
    aliases: [
      "llm",
      "llms",
      "largelanguagemodel",
      "largelanguagemodels",
      "largelanguagemodelsllms",
      "llmevaluation",
      "evals",
      "evaluation",
    ],
  },
  {
    course_id: "hf-agents-course",
    title: "Hugging Face AI Agents Course",
    provider: "Hugging Face",
    url: "https://huggingface.co/learn/agents-course",
    level: "Intermediate",
    duration: "Self-paced",
    free: true,
    description: "Build tool-using agents, evaluate them, and deploy reliable agent workflows.",
    skills: ["AI Agents", "Agentic AI", "Claude Agent SDK", "AI Agent Development"],
    aliases: ["aiagent", "aiagents", "agents", "agenticai", "claudeagentsdk", "agentsdk"],
  },
  {
    course_id: "mcp-intro",
    title: "Model Context Protocol: Introduction",
    provider: "Model Context Protocol",
    url: "https://modelcontextprotocol.io/introduction",
    level: "Intermediate",
    duration: "1–2 hours",
    free: true,
    description: "The protocol, servers, clients, tools, and resources behind MCP.",
    skills: ["Model Context Protocol", "Model Context Protocol (MCP)"],
    aliases: ["mcp", "modelcontextprotocol", "modelcontextprotocolmcp"],
  },
  {
    course_id: "deeplearning-short-courses",
    title: "DeepLearning.AI Short Courses",
    provider: "DeepLearning.AI",
    url: "https://www.deeplearning.ai/short-courses/",
    level: "Intermediate",
    duration: "1–2 hours each",
    free: true,
    description: "Focused courses on agents, RAG, evals, and applied generative AI.",
    skills: ["LLM Evaluation", "Generative AI", "Prompt Engineering"],
    aliases: ["genai", "generativeai", "promptengineering", "rag"],
  },
  {
    course_id: "system-design-primer",
    title: "The System Design Primer",
    provider: "GitHub · Donne Martin",
    url: "https://github.com/donnemartin/system-design-primer",
    level: "Advanced",
    duration: "Self-paced",
    free: true,
    description: "Scalability, reliability, caching, queues, and system design interview practice.",
    skills: ["System Design", "Distributed Systems", "Architecture"],
  },
  {
    course_id: "data-engineer-handbook",
    title: "Data Engineer Handbook",
    provider: "GitHub · DataExpert.io",
    url: "https://github.com/DataExpert-io/data-engineer-handbook",
    level: "Intermediate",
    duration: "Self-paced",
    free: true,
    description: "A practical map of data engineering concepts, projects, and interview topics.",
    skills: ["Data Engineering", "Data Pipelines", "Data Warehousing"],
  },
  {
    course_id: "dbt-fundamentals",
    title: "dbt Fundamentals",
    provider: "dbt Labs",
    url: "https://learn.getdbt.com/courses/dbt-fundamentals",
    level: "Beginner",
    duration: "4 hours",
    free: true,
    description: "Models, tests, documentation, and the analytics engineering workflow.",
    skills: ["dbt", "Analytics Engineering"],
  },
  {
    course_id: "airflow-tutorial",
    title: "Apache Airflow Tutorial",
    provider: "Apache Airflow",
    url: "https://airflow.apache.org/docs/apache-airflow/stable/tutorial/index.html",
    level: "Intermediate",
    duration: "2–4 hours",
    free: true,
    description: "DAGs, operators, scheduling, and running a local Airflow pipeline.",
    skills: ["Apache Airflow", "Orchestration"],
  },
  {
    course_id: "docker-get-started",
    title: "Docker Get Started",
    provider: "Docker",
    url: "https://docs.docker.com/get-started/",
    level: "Beginner",
    duration: "2 hours",
    free: true,
    description: "Images, containers, volumes, and composing a small application.",
    skills: ["Docker", "Containers"],
  },
  {
    course_id: "kubernetes-basics",
    title: "Kubernetes Basics",
    provider: "Kubernetes",
    url: "https://kubernetes.io/docs/tutorials/kubernetes-basics/",
    level: "Intermediate",
    duration: "3 hours",
    free: true,
    description: "Pods, deployments, services, and scaling with a hands-on cluster.",
    skills: ["Kubernetes", "Cloud Infrastructure"],
    aliases: ["k8s"],
  },
  {
    course_id: "aws-skill-builder",
    title: "AWS Skill Builder",
    provider: "Amazon Web Services",
    url: "https://explore.skillbuilder.aws/",
    level: "Beginner",
    duration: "Self-paced",
    free: true,
    description: "Cloud fundamentals and role-based AWS learning paths.",
    skills: ["AWS", "Cloud", "Cloud Infrastructure"],
  },
  {
    course_id: "graphql-learn",
    title: "GraphQL Learn",
    provider: "GraphQL Foundation",
    url: "https://graphql.org/learn/",
    level: "Beginner",
    duration: "2–3 hours",
    free: true,
    description: "Schemas, queries, mutations, resolvers, and GraphQL server basics.",
    skills: ["GraphQL", "API Design"],
  },
  {
    course_id: "pm-coursera",
    title: "Digital Product Management",
    provider: "University of Virginia · Coursera",
    url: "https://www.coursera.org/learn/uva-darden-digital-product-management",
    level: "Beginner",
    duration: "4 weeks",
    free: false,
    description: "Product discovery, roadmaps, metrics, and working with engineering teams.",
    skills: ["Product Management", "Product Strategy"],
    aliases: ["productmanager", "productstrategy", "productmanagement"],
  },
  {
    course_id: "communication-coursera",
    title: "Improving Communication Skills",
    provider: "University of Pennsylvania · Coursera",
    url: "https://www.coursera.org/learn/wharton-communication-skills",
    level: "Beginner",
    duration: "4 weeks",
    free: false,
    description: "Clear, persuasive communication for teams, stakeholders, and interviews.",
    skills: ["Communication", "Stakeholder Management"],
  },
  {
    course_id: "google-data-analytics",
    title: "Google Data Analytics",
    provider: "Google · Coursera",
    url: "https://www.coursera.org/professional-certificates/google-data-analytics",
    level: "Beginner",
    duration: "6 months",
    free: false,
    description: "Spreadsheets, SQL, visualization, and the analytics process end to end.",
    skills: ["Data Analysis", "Analytics", "Data Visualization"],
  },
  {
    course_id: "kaggle-pandas",
    title: "Pandas",
    provider: "Kaggle",
    url: "https://www.kaggle.com/learn/pandas",
    level: "Beginner",
    duration: "4 hours",
    free: true,
    description: "DataFrames, cleaning, grouping, and practical Python data analysis.",
    skills: ["Data Analysis", "Pandas", "Python"],
  },
  {
    course_id: "figma-learn",
    title: "Figma Learn",
    provider: "Figma",
    url: "https://help.figma.com/hc/en-us/categories/360002051613",
    level: "Beginner",
    duration: "Self-paced",
    free: true,
    description: "Frames, components, auto layout, prototyping, and design handoff.",
    skills: ["Figma", "UI Design", "Prototyping"],
  },
  {
    course_id: "nng-ux-research",
    title: "Nielsen Norman Group UX Research",
    provider: "Nielsen Norman Group",
    url: "https://www.nngroup.com/articles/",
    level: "Intermediate",
    duration: "Self-paced",
    free: true,
    description: "Research methods, usability testing, synthesis, and evidence-based design.",
    skills: ["User Research", "UX Design", "Usability Testing"],
  },
  {
    course_id: "salesforce-trailhead",
    title: "Salesforce Trailhead",
    provider: "Salesforce",
    url: "https://trailhead.salesforce.com/",
    level: "Beginner",
    duration: "Self-paced",
    free: true,
    description: "CRM fundamentals, Salesforce admin basics, and customer data workflows.",
    skills: ["CRM", "Salesforce", "Customer Success"],
  },
  {
    course_id: "nextjs-learn",
    title: "Next.js Learn",
    provider: "Vercel",
    url: "https://nextjs.org/learn",
    level: "Intermediate",
    duration: "Self-paced",
    free: true,
    description: "Routing, rendering, data fetching, and building a production Next.js app.",
    skills: ["Next.js", "Web Applications", "Full Stack Development"],
    aliases: ["nextjs", "fullstack", "fullstackdevelopment", "webapplication", "webapplications"],
  },
  {
    course_id: "nodejs-learn",
    title: "Node.js Learn",
    provider: "OpenJS Foundation",
    url: "https://nodejs.org/en/learn",
    level: "Beginner",
    duration: "Self-paced",
    free: true,
    description: "Node.js fundamentals, async I/O, modules, and backend services.",
    skills: ["Node.js", "Backend Development"],
    aliases: ["nodejs", "node"],
  },
  {
    course_id: "go-tour",
    title: "A Tour of Go",
    provider: "Go",
    url: "https://go.dev/tour/",
    level: "Beginner",
    duration: "2–3 hours",
    free: true,
    description: "Go syntax, concurrency, interfaces, and building small programs.",
    skills: ["Go", "Golang"],
  },
  {
    course_id: "rust-book",
    title: "The Rust Programming Language",
    provider: "Rust Project",
    url: "https://doc.rust-lang.org/book/",
    level: "Intermediate",
    duration: "Self-paced",
    free: true,
    description: "Ownership, borrowing, error handling, concurrency, and production Rust.",
    skills: ["Rust"],
  },
  {
    course_id: "github-actions",
    title: "GitHub Actions Documentation",
    provider: "GitHub",
    url: "https://docs.github.com/en/actions",
    level: "Intermediate",
    duration: "Self-paced",
    free: true,
    description: "Workflows, runners, matrix builds, secrets, and deployment automation.",
    skills: ["CI/CD", "GitHub Actions", "DevOps"],
  },
  {
    course_id: "playwright",
    title: "Playwright Documentation",
    provider: "Microsoft",
    url: "https://playwright.dev/docs/intro",
    level: "Intermediate",
    duration: "Self-paced",
    free: true,
    description: "End-to-end browser testing, selectors, fixtures, and CI integration.",
    skills: ["Playwright", "Testing", "QA Automation"],
  },
];

function courseKeys(course: Course) {
  return new Set([...course.skills, ...(course.aliases ?? [])].map(skillMatchKey));
}

function matches(courseKeysSet: Set<string>, skill: string) {
  const key = skillMatchKey(skill);
  return Boolean(key) && courseKeysSet.has(key);
}

function affiliateLinks(): Record<string, string> {
  const raw = process.env.COURSE_AFFILIATE_LINKS;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string" && /^https?:\/\//i.test(value)) out[key] = value;
    }
    return out;
  } catch {
    console.warn("[courseCatalog] COURSE_AFFILIATE_LINKS is not valid JSON");
    return {};
  }
}

export function recommendCourses(skills: string[], limit = 4): CourseRecommendation[] {
  const seen = new Set<string>();
  const affiliates = affiliateLinks();
  const scored = [];
  for (const course of COURSES) {
    const keys = courseKeys(course);
    const matched = skills
      .filter((skill) => matches(keys, skill))
      .map((skill) => skill.trim())
      .filter(Boolean);
    if (!matched.length) continue;
    const uniqueMatched = [...new Set(matched)];
    if (seen.has(course.course_id)) continue;
    seen.add(course.course_id);
    const affiliateUrl = affiliates[course.course_id];
    scored.push({
      ...course,
      url: affiliateUrl ?? course.url,
      affiliate: Boolean(affiliateUrl),
      matched_skills: uniqueMatched,
      score: uniqueMatched.length * 10 + (course.free ? 2 : 0) + (course.level === "Beginner" ? 1 : 0),
    });
  }
  const selected: typeof scored = [];
  const perSkill = new Map<string, number>();
  for (const course of scored.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))) {
    // Don't let four Python courses crowd out the AI/LLM gap. Show at most two
    // options for any one matched skill, then diversify across the gaps.
    const primary = course.matched_skills[0] ?? "general";
    const used = perSkill.get(primary) ?? 0;
    if (used >= 2) continue;
    selected.push(course);
    perSkill.set(primary, used + 1);
    if (selected.length >= Math.min(Math.max(limit, 1), 8)) break;
  }
  return selected.map(({ score: _score, skills: _skills, aliases: _aliases, ...course }) => course);
}

export function courseSearchUrl(skill: string) {
  return `https://www.coursera.org/search?query=${encodeURIComponent(skill.trim())}`;
}
