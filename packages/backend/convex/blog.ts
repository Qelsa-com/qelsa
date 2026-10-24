/**
 * Admin-owned editorial blog pipeline.
 *
 * Generation is started by a fast admin mutation and runs as a scheduled
 * internal action, so closing the admin tab never cancels a post. The public
 * queries are unauthenticated so the web app can render blog pages on the
 * server for crawlers.
 */

import { generateText } from "ai";
import { v } from "convex/values";
import type { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server";
import { internalAction, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { adminMutation, adminQuery } from "./lib/customFunctions";
import { AI_AGENT_MODEL, createChatModel, openRouter } from "./lib/ai";
import { parseJsonObject } from "./lib/parsedProfile";

const BLOG_MODEL = process.env.AI_BLOG_MODEL?.trim() || AI_AGENT_MODEL;
const BLOG_IMAGE_MODEL =
  process.env.BLOG_IMAGE_MODEL?.trim() || "google/gemini-3.1-flash-lite-image";
const BLOG_PROMPT_VERSION = "blog-v1";
const MAX_TITLE_HINT = 120;
const MAX_EXISTING_POSTS = 200;
const MAX_BLOG_WORDS = 2_400;
const MIN_BLOG_WORDS = 1_200;
const ACTIVE_RUN_WINDOW_MS = 10 * 60 * 1000;

const ALLOWED_INTERNAL_LINKS = new Set([
  "/jobs",
  "/jobs/all",
  "/courses",
  "/agent",
  "/blogs",
  "/candidates",
  "/employers",
]);

type BlogSection = {
  heading: string;
  paragraphs: string[];
  bullets: string[];
};

type BlogFaq = {
  question: string;
  answer: string;
};

type BlogLink = {
  label: string;
  href: string;
};

type GeneratedBlog = {
  title: string;
  slug: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  searchIntent: string;
  category: string;
  tags: string[];
  intro: string;
  keyTakeaways: string[];
  sections: BlogSection[];
  faq: BlogFaq[];
  relatedLinks: BlogLink[];
  imagePrompt: string;
  imageAlt: string;
  wordCount: number;
  readingMinutes: number;
  contentHash: string;
};

type ExistingBlog = {
  title: string;
  slug: string;
  primaryKeyword: string;
  contentHash: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** Keep generated prose clean and free of the em-dash tic. */
function cleanText(value: unknown, fallback = "") {
  const text = typeof value === "string" ? value : fallback;
  return text
    .replace(/\r/g, "")
    .replace(/\s*—\s*/g, ", ")
    .replace(/\s*–\s*/g, " to ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/,\s*,/g, ",")
    .trim();
}

function stringValue(value: unknown, fallback = "") {
  return cleanText(value, fallback);
}

function stringList(value: unknown, limit = 12) {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .map((item) => cleanText(item))
        .filter((item) => item.length > 0),
    ),
  ].slice(0, limit);
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function normalizeTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function titleTokens(value: string) {
  return new Set(
    normalizeTitle(value)
      .split(" ")
      .filter((word) => word.length > 2 && !["the", "and", "for", "with", "that", "this", "your", "how", "what", "why", "from", "into", "about", "when"].includes(word)),
  );
}

function titleSimilarity(a: string, b: string) {
  const left = titleTokens(a);
  const right = titleTokens(b);
  if (!left.size || !right.size) return 0;
  let overlap = 0;
  for (const token of left) if (right.has(token)) overlap += 1;
  return overlap / (left.size + right.size - overlap);
}

function contentHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function countWords(post: {
  title?: string;
  intro: string;
  keyTakeaways: string[];
  sections: BlogSection[];
  faq: BlogFaq[];
}) {
  const text = [
    post.title ?? "",
    post.intro,
    ...post.keyTakeaways,
    ...post.sections.flatMap((section) => [section.heading, ...section.paragraphs, ...section.bullets]),
    ...post.faq.flatMap((item) => [item.question, item.answer]),
  ].join(" ");
  return text.split(/\s+/).filter(Boolean).length;
}

function clip(value: string, max: number) {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  const slice = trimmed.slice(0, max);
  const at = slice.lastIndexOf(" ");
  return `${slice.slice(0, at > max * 0.65 ? at : max).trimEnd()}…`;
}

function findDuplicate(post: GeneratedBlog, existing: ExistingBlog[]) {
  const normalizedTitle = normalizeTitle(post.title);
  return (
    existing.find((row) => {
      if (row.contentHash === post.contentHash) return true;
      if (normalizeTitle(row.title) === normalizedTitle) return true;
      if (row.slug === post.slug) return true;
      const similarity = titleSimilarity(row.title, post.title);
      if (similarity >= 0.82) return true;
      return Boolean(
        row.primaryKeyword &&
          post.primaryKeyword &&
          row.primaryKeyword.toLowerCase() === post.primaryKeyword.toLowerCase() &&
          similarity >= 0.58,
      );
    }) ?? null
  );
}

function promptForBlog(existing: ExistingBlog[], titleHint: string, avoidReason = "") {
  const requestedTitle = titleHint
    ? `The admin requested this exact title for the article: ${JSON.stringify(titleHint)}. Use it as the title.`
    : "No title was provided. Choose the strongest distinct topic yourself.";
  return `You are Qelsa's senior editorial writer. Write one original, long-form blog post for Qelsa, a career platform that helps people find jobs, understand their fit, prepare applications, practice interviews, and learn job skills.

Primary goal: rank in Google search, and be useful enough to be cited by AI answer engines such as ChatGPT, Claude, Gemini, and Perplexity. Write for a smart person who wants a direct answer, practical steps, and honest tradeoffs.

Qelsa context:
- Candidate tools: job search, skill-based match scores, resume help, application preparation, interview prep tracks, courses, and an in-app career agent.
- Employer tools: job posting, applicant review, team pages.
- Never invent a Qelsa feature, benchmark, customer, statistic, quote, or study.
- You may link to /jobs, /jobs/all, /courses, /agent, /blogs, /candidates, and /employers. Use 2 or 3 relevant internal links only.

Editorial rules:
- ${requestedTitle}
- ${avoidReason || "Find a distinct angle with clear search intent. Do not repeat or lightly reword an existing post."}
- Write 1,400 to 1,900 words, with useful depth rather than padding.
- Sound like an experienced human editor: direct, specific, varied sentence lengths, occasional contractions, concrete examples, and honest caveats. Avoid corporate filler, hype, clichés, and overused AI phrases such as "delve", "landscape", "moreover", "in today's fast-paced world", "unlock", and "game changer".
- Never use em dashes or en dashes. Use commas, periods, parentheses, or a simple hyphen instead.
- Start with a direct answer to the reader's question in the intro. Do not warm up with a generic industry overview.
- Use clear H2-style section headings. No markdown syntax inside strings and no HTML.
- Include at least one short bullet list where it genuinely helps. Do not turn the whole article into a listicle.
- Do not invent statistics, percentages, survey findings, research, quotations, dates, or numeric rules of thumb. Do not claim what "most hiring managers" or "most recruiters" do. If a quantitative example helps, make it clearly hypothetical and label it as an example.
- Be careful with factual claims. If a claim needs a source, either phrase it as general guidance or omit it. Do not fabricate research or citations.
- Include a practical Qelsa call to action without making the article feel like an advert.
- The cover image must directly illustrate this article. Describe one or two believable people, such as a student or working professional, doing the specific activity the article is about, in a relevant setting with useful props. Make the scene feel candid and editorial, not a generic abstract diagram or stock-photo pose. Use a 16:9 frame, natural light, and a restrained dark navy, cyan, violet, and magenta accent palette. No words, letters, logos, or watermarks.
- The image_alt text must describe the scene and the people without naming a real individual.

Existing posts. Do not duplicate these titles, slugs, primary keywords, or angles:
${JSON.stringify(existing.slice(0, MAX_EXISTING_POSTS)).slice(0, 24_000)}

Return ONLY valid JSON in this shape:
{
  "title": "45-65 character article title",
  "slug": "kebab-case slug",
  "excerpt": "one or two sentence summary",
  "meta_title": "SEO title, at most 60 characters",
  "meta_description": "search description, about 150 characters",
  "primary_keyword": "the main search phrase",
  "search_intent": "informational or commercial investigation",
  "category": "Career Growth, Job Search, Interviews, Skills, or AI and Work",
  "tags": ["3 to 7 short tags"],
  "intro": "answer-first opening paragraph, 2 to 4 sentences",
  "key_takeaways": ["4 to 6 short, useful takeaways"],
  "sections": [
    {
      "heading": "section heading",
      "paragraphs": ["2 to 4 substantive paragraphs"],
      "bullets": ["0 to 5 short bullets"]
    }
  ],
  "faq": [
    {"question": "question a reader would actually search", "answer": "2 to 4 sentence answer"}
  ],
  "related_links": [
    {"label": "short link label", "href": "/jobs"}
  ],
  "image_prompt": "specific scene brief showing relevant professional or student people doing what the article is about, with setting and props, no text or logos",
  "image_alt": "short descriptive alt text about the people and scene"
}`;
}

function normalizeGenerated(raw: Record<string, unknown>, titleHint: string): GeneratedBlog {
  const rawSections = Array.isArray(raw.sections) ? raw.sections : [];
  const sections: BlogSection[] = rawSections
    .map((item) => {
      const row = asRecord(item);
      return {
        heading: stringValue(row.heading),
        paragraphs: stringList(row.paragraphs, 6).filter((paragraph) => paragraph.length >= 30),
        bullets: stringList(row.bullets, 8),
      };
    })
    .filter((section) => section.heading.length >= 4 && (section.paragraphs.length > 0 || section.bullets.length > 0))
    .slice(0, 8);

  const rawFaq = Array.isArray(raw.faq) ? raw.faq : [];
  const faq: BlogFaq[] = rawFaq
    .map((item) => {
      const row = asRecord(item);
      return {
        question: stringValue(row.question),
        answer: stringValue(row.answer),
      };
    })
    .filter((item) => item.question.length >= 8 && item.answer.length >= 40)
    .slice(0, 6);

  const relatedLinks: BlogLink[] = [];
  const rawLinks = Array.isArray(raw.related_links) ? raw.related_links : [];
  for (const item of rawLinks) {
    const row = asRecord(item);
    const label = stringValue(row.label);
    const href = stringValue(row.href).replace(/\/$/, "");
    if (label && ALLOWED_INTERNAL_LINKS.has(href) && !relatedLinks.some((link) => link.href === href)) {
      relatedLinks.push({ label, href });
    }
  }
  for (const fallback of [
    { label: "Browse jobs on Qelsa", href: "/jobs" },
    { label: "Explore interview prep", href: "/courses" },
  ]) {
    if (relatedLinks.length >= 3) break;
    if (!relatedLinks.some((link) => link.href === fallback.href)) relatedLinks.push(fallback);
  }

  const title = clip(titleHint || stringValue(raw.title), 120);
  const intro = stringValue(raw.intro);
  const excerpt = clip(
    stringValue(raw.excerpt) || intro,
    300,
  );
  const metaDescription = clip(
    stringValue(raw.meta_description) || excerpt,
    180,
  );
  const metaTitle = clip(stringValue(raw.meta_title) || title, 70);
  const slug = slugify(stringValue(raw.slug) || title);
  const keyTakeaways = stringList(raw.key_takeaways, 6);
  const tags = stringList(raw.tags, 8);
  const imagePrompt = stringValue(raw.image_prompt) || `Editorial cover for an article titled ${title}`;
  const imageAlt = clip(stringValue(raw.image_alt) || title, 160);

  if (!title || title.length < 10) throw new Error("The writer did not return a usable title. Try again.");
  if (!slug) throw new Error("The writer did not return a usable slug. Try again.");
  if (intro.length < 80) throw new Error("The writer returned an intro that is too short. Try again.");
  if (sections.length < 3) throw new Error("The writer returned fewer than three sections. Try again.");
  if (faq.length < 3) throw new Error("The writer returned fewer than three FAQs. Try again.");
  if (keyTakeaways.length < 3) throw new Error("The writer returned too few key takeaways. Try again.");
  if (tags.length < 3) throw new Error("The writer returned too few tags. Try again.");

  const postBase = {
    title,
    intro,
    keyTakeaways,
    sections,
    faq,
  };
  const wordCount = countWords(postBase);
  if (wordCount < MIN_BLOG_WORDS) {
    throw new Error(`The writer returned only ${wordCount} words. A longer article is required.`);
  }
  if (wordCount > MAX_BLOG_WORDS) {
    // Long is good, but clamp abnormal output to keep the reading experience tight.
    // The prompt targets 1,400-1,900; this only trims runaway drafts.
    // Section text is already structured, so trimming whole trailing sections is safest.
    while (sections.length > 4 && countWords({ ...postBase, sections, faq }) > MAX_BLOG_WORDS) {
      sections.pop();
    }
  }

  const finalWordCount = countWords({ ...postBase, sections, faq });
  return {
    title,
    slug,
    excerpt,
    metaTitle,
    metaDescription,
    primaryKeyword: stringValue(raw.primary_keyword, tags[0] ?? ""),
    searchIntent: stringValue(raw.search_intent, "informational"),
    category: stringValue(raw.category, "Career Growth"),
    tags,
    intro,
    keyTakeaways,
    sections,
    faq,
    relatedLinks: relatedLinks.slice(0, 4),
    imagePrompt,
    imageAlt,
    wordCount: finalWordCount,
    readingMinutes: Math.max(4, Math.round(finalWordCount / 220)),
    contentHash: contentHash([title, intro, ...sections.map((section) => `${section.heading} ${section.paragraphs.join(" ")}`), ...faq.map((item) => `${item.question} ${item.answer}`)].join(" ")),
  };
}

function scoreBlog(post: GeneratedBlog, coverReady: boolean) {
  let score = 0;
  const titleLength = post.title.length;
  if (titleLength >= 40 && titleLength <= 65) score += 20;
  else if (titleLength >= 30 && titleLength <= 75) score += 12;

  const descriptionLength = post.metaDescription.length;
  if (descriptionLength >= 120 && descriptionLength <= 160) score += 20;
  else if (descriptionLength >= 80 && descriptionLength <= 180) score += 12;

  if (post.metaTitle.length <= 60) score += 10;
  const keyword = post.primaryKeyword.toLowerCase();
  if (keyword && [post.title, post.metaDescription, post.intro].join(" ").toLowerCase().includes(keyword)) score += 15;
  if (post.sections.length >= 4 && post.sections.length <= 7) score += 10;
  if (post.faq.length >= 3) score += 10;
  if (post.wordCount >= 1_400) score += 10;
  else if (post.wordCount >= MIN_BLOG_WORDS) score += 6;
  if (post.keyTakeaways.length >= 4) score += 5;
  if (post.relatedLinks.length >= 2) score += 5;
  if (coverReady) score += 5;
  return Math.max(0, Math.min(100, score));
}

function coverImagePrompt(prompt: string) {
  return `${prompt}. Premium editorial magazine photograph for a career publication, 16:9 composition, one or two believable professionals or students directly relevant to the article, candid natural moment in a real workspace or study setting, natural window light, shallow depth of field, restrained dark navy, cyan, violet and magenta accent styling, photorealistic, no text, no letters, no logos, no watermark, no collage, no abstract diagram.`;
}

function decodeBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function imageMediaType(bytes: Uint8Array) {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  if (String.fromCharCode(...bytes.slice(0, 4)) === "RIFF") return "image/webp";
  return "image/jpeg";
}

async function generateCover(ctx: ActionCtx, prompt: string) {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured on this deployment.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 150_000);
  try {
    const response = await fetch("https://openrouter.ai/api/v1/images", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.SITE_URL ?? "https://qelsa.com",
        "X-Title": "Qelsa",
      },
      body: JSON.stringify({
        model: BLOG_IMAGE_MODEL,
        prompt: coverImagePrompt(prompt),
        aspect_ratio: "16:9",
        resolution: "1K",
        output_format: "jpeg",
        n: 1,
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 240);
      throw new Error(`Image generation failed (${response.status}). ${detail}`);
    }
    const payload: any = await response.json();
    const item = payload?.data?.[0];
    if (!item) throw new Error("Image generation returned no image.");
    let bytes: Uint8Array;
    if (typeof item.b64_json === "string") {
      bytes = decodeBase64(item.b64_json);
    } else if (typeof item.url === "string") {
      const imageResponse = await fetch(item.url, { signal: controller.signal });
      if (!imageResponse.ok) throw new Error("Could not download the generated cover.");
      bytes = new Uint8Array(await imageResponse.arrayBuffer());
    } else {
      throw new Error("Image generation returned an unsupported payload.");
    }
    const mediaType = item.media_type || imageMediaType(bytes);
    const buffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buffer).set(bytes);
    const storageId = await ctx.storage.store(new Blob([buffer], { type: mediaType }));
    return { storageId, mediaType };
  } finally {
    clearTimeout(timeout);
  }
}

async function writeBlog(existing: ExistingBlog[], titleHint: string, avoidReason = "") {
  if (!openRouter) throw new Error("OPENROUTER_API_KEY is not configured on this deployment.");
  const response = await generateText({
    model: createChatModel(BLOG_MODEL, "medium"),
    prompt: promptForBlog(existing, titleHint, avoidReason),
    temperature: 0.7,
    maxRetries: 2,
    timeout: { totalMs: 180_000 },
  });
  const parsed = parseJsonObject(response.text);
  if (!parsed) throw new Error("The writer returned an invalid draft. Try again.");
  return normalizeGenerated(asRecord(parsed), titleHint);
}

function editorPrompt(post: GeneratedBlog, titleHint: string) {
  return `You are Qelsa's senior editor. Rewrite this draft so it reads like a sharp human editor wrote it for a smart job seeker.

Hard rules:
- Keep the same title ${titleHint ? `exactly: ${JSON.stringify(titleHint)}` : `unless it is genuinely weak, but keep the topic and search intent`}. Keep the same slug.
- Keep the same JSON shape and every field.
- Target 1,400 to 1,900 words.
- Naturally vary sentence length. Use contractions where they sound natural. Remove repetitive transitions, generic filler, and any phrase that sounds like an AI assistant.
- Remove every unsupported statistic, percentage, survey finding, study claim, fabricated quotation, numeric rule of thumb, and claim about what "most hiring managers" or "most recruiters" do. Do not replace them with other invented facts.
- Do not add new factual claims. You may clarify, shorten, or reframe.
- Never use em dashes or en dashes. Use commas, periods, parentheses, or a simple hyphen.
- Preserve the direct answer in the intro and the practical usefulness of each section.
- Keep the 3 to 4 related links limited to /jobs, /jobs/all, /courses, /agent, /blogs, /candidates, and /employers.
- Keep the cover image prompt aligned with the article. It must show a relevant professional or student doing the activity discussed, never an abstract diagram.

Draft JSON:
${JSON.stringify(post).slice(0, 48_000)}

Return ONLY the complete rewritten JSON. No commentary.`;
}

async function editBlogDraft(post: GeneratedBlog, titleHint: string) {
  try {
    const response = await generateText({
      model: createChatModel(BLOG_MODEL, "low"),
      prompt: editorPrompt(post, titleHint),
      temperature: 0.35,
      maxRetries: 1,
      timeout: { totalMs: 150_000 },
    });
    const parsed = parseJsonObject(response.text);
    if (!parsed) return post;
    return normalizeGenerated(asRecord(parsed), titleHint || post.title);
  } catch {
    // A failed polish pass should not discard an otherwise valid draft.
    return post;
  }
}

async function coverUrl(ctx: QueryCtx | MutationCtx, row: Doc<"blog_posts">) {
  if (!row.cover_image_id) return null;
  try {
    return await ctx.storage.getUrl(row.cover_image_id);
  } catch {
    return null;
  }
}

function summary(row: Doc<"blog_posts">, cover: string | null) {
  return {
    id: row._id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    meta_title: row.meta_title,
    meta_description: row.meta_description,
    primary_keyword: row.primary_keyword,
    search_intent: row.search_intent,
    category: row.category,
    tags: row.tags,
    cover_image_url: cover,
    cover_image_alt: row.cover_image_alt,
    cover_status: row.cover_status,
    cover_error: row.cover_error ?? null,
    status: row.status,
    seo_score: row.seo_score,
    word_count: row.word_count,
    reading_minutes: row.reading_minutes,
    model: row.model,
    image_model: row.image_model,
    created_at: row.created_at,
    updated_at: row.updated_at,
    published_at: row.published_at ?? null,
  };
}

function fullPost(row: Doc<"blog_posts">, cover: string | null) {
  return {
    ...summary(row, cover),
    intro: row.intro,
    key_takeaways: row.key_takeaways,
    sections: row.sections,
    faq: row.faq,
    related_links: row.related_links,
    image_prompt: row.image_prompt,
    prompt_version: row.prompt_version,
  };
}

/* ------------------------------------------------------------------ */
/* Public reads                                                        */
/* ------------------------------------------------------------------ */

export const listPublished = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("blog_posts")
      .withIndex("by_status_published_at", (q) => q.eq("status", "published"))
      .order("desc")
      .take(30);
    return await Promise.all(rows.map(async (row) => summary(row, await coverUrl(ctx, row))));
  },
});

export const getPublishedBySlug = query({
  args: { slug: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const slug = args.slug.trim().toLowerCase();
    if (!slug) return null;
    const row = await ctx.db
      .query("blog_posts")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!row || row.status !== "published") return null;
    return fullPost(row, await coverUrl(ctx, row));
  },
});

export const listSitemap = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("blog_posts")
      .withIndex("by_status_published_at", (q) => q.eq("status", "published"))
      .order("desc")
      .take(500);
    return rows.map((row) => ({ slug: row.slug, updated_at: row.updated_at }));
  },
});

/* ------------------------------------------------------------------ */
/* Admin reads                                                         */
/* ------------------------------------------------------------------ */

export const listAdmin = adminQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("blog_posts")
      .withIndex("by_created_at")
      .order("desc")
      .take(60);
    return await Promise.all(rows.map(async (row) => summary(row, await coverUrl(ctx, row))));
  },
});

export const getAdmin = adminQuery({
  args: { blogId: v.id("blog_posts") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.blogId);
    if (!row) return null;
    return fullPost(row, await coverUrl(ctx, row));
  },
});

export const generationState = adminQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const row = await ctx.db
      .query("blog_generation_runs")
      .withIndex("by_started_at")
      .order("desc")
      .first();
    if (!row) return null;
    return {
      id: row._id,
      status: row.status,
      title_hint: row.title_hint ?? null,
      model: row.model,
      image_model: row.image_model,
      started_at: row.started_at,
      completed_at: row.completed_at ?? null,
      blog_id: row.blog_id ?? null,
      error: row.error ?? null,
    };
  },
});

/* ------------------------------------------------------------------ */
/* Admin mutations                                                     */
/* ------------------------------------------------------------------ */

export const startGeneration = adminMutation({
  args: { title: v.optional(v.string()) },
  returns: v.object({ runId: v.id("blog_generation_runs") }),
  handler: async (ctx, args) => {
    const titleHint = cleanText(args.title, "").slice(0, MAX_TITLE_HINT);
    const now = Date.now();
    const latest = await ctx.db
      .query("blog_generation_runs")
      .withIndex("by_started_at")
      .order("desc")
      .first();
    if (latest?.status === "running") {
      if (now - latest.started_at < ACTIVE_RUN_WINDOW_MS) {
        throw new Error("The blog agent is already writing one post. Wait for it to finish.");
      }
      await ctx.db.patch(latest._id, {
        status: "failed",
        completed_at: now,
        error: "The previous generation timed out.",
      });
    }

    const runId = await ctx.db.insert("blog_generation_runs", {
      status: "running",
      title_hint: titleHint || undefined,
      model: BLOG_MODEL,
      image_model: BLOG_IMAGE_MODEL,
      actor_user_id: ctx.user._id,
      started_at: now,
    });
    await ctx.scheduler.runAfter(0, internal.blog.runGeneration, { runId });
    return { runId };
  },
});

export const setStatus = adminMutation({
  args: {
    blogId: v.id("blog_posts"),
    status: v.union(v.literal("draft"), v.literal("published")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.blogId);
    if (!row) throw new Error("Post not found.");
    const now = Date.now();
    const publishedAt = args.status === "published" ? row.published_at ?? now : undefined;
    await ctx.db.patch(row._id, {
      status: args.status,
      published_at: publishedAt,
      updated_at: now,
    });
    await ctx.db.insert("admin_audit_log", {
      admin_user_id: ctx.user._id,
      action: args.status === "published" ? "blog.published" : "blog.unpublished",
      before: { status: row.status, published_at: row.published_at ?? null },
      after: { status: args.status, published_at: publishedAt ?? null },
      note: row.title,
      created_at: now,
    });
    return null;
  },
});

export const remove = adminMutation({
  args: { blogId: v.id("blog_posts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.blogId);
    if (!row) return null;
    if (row.cover_image_id) {
      try {
        await ctx.storage.delete(row.cover_image_id);
      } catch {
        // The row can still be removed if the image is already gone.
      }
    }
    await ctx.db.delete(row._id);
    await ctx.db.insert("admin_audit_log", {
      admin_user_id: ctx.user._id,
      action: "blog.deleted",
      before: { title: row.title, slug: row.slug, status: row.status },
      note: row.title,
      created_at: Date.now(),
    });
    return null;
  },
});

export const retryCover = adminMutation({
  args: { blogId: v.id("blog_posts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.blogId);
    if (!row) throw new Error("Post not found.");
    await ctx.scheduler.runAfter(0, internal.blog.retryCoverAction, {
      blogId: args.blogId,
      actorUserId: ctx.user._id,
    });
    return null;
  },
});

/* ------------------------------------------------------------------ */
/* Background action                                                   */
/* ------------------------------------------------------------------ */

export const getRun = internalQuery({
  args: { runId: v.id("blog_generation_runs") },
  returns: v.any(),
  handler: async (ctx, args) => await ctx.db.get(args.runId),
});

export const latestRun = internalQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) =>
    await ctx.db
      .query("blog_generation_runs")
      .withIndex("by_started_at")
      .order("desc")
      .first(),
});

export const listForPrompt = internalQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("blog_posts")
      .withIndex("by_created_at")
      .order("desc")
      .take(MAX_EXISTING_POSTS);
    return rows.map((row) => ({
      title: row.title,
      slug: row.slug,
      primaryKeyword: row.primary_keyword,
      contentHash: row.content_hash,
    }));
  },
});

export const finishRun = internalMutation({
  args: {
    runId: v.id("blog_generation_runs"),
    status: v.union(v.literal("completed"), v.literal("failed")),
    blogId: v.optional(v.id("blog_posts")),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.runId);
    if (!row) return null;
    await ctx.db.patch(row._id, {
      status: args.status,
      completed_at: Date.now(),
      blog_id: args.blogId,
      error: args.error?.slice(0, 500),
    });
    return null;
  },
});

export const insertGeneratedBlog = internalMutation({
  args: {
    post: v.any(),
    createdBy: v.id("users"),
    coverImageId: v.optional(v.id("_storage")),
    coverStatus: v.union(v.literal("ready"), v.literal("failed")),
    coverError: v.optional(v.string()),
    imageModel: v.string(),
    seoScore: v.number(),
  },
  returns: v.id("blog_posts"),
  handler: async (ctx, args) => {
    const post = args.post as GeneratedBlog;
    const existing = await ctx.db
      .query("blog_posts")
      .withIndex("by_slug", (q) => q.eq("slug", post.slug))
      .first();
    if (existing) {
      if (args.coverImageId) await ctx.storage.delete(args.coverImageId);
      throw new Error("A post with this slug already exists. Try again with a different title.");
    }
    const now = Date.now();
    const blogId = await ctx.db.insert("blog_posts", {
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      meta_title: post.metaTitle,
      meta_description: post.metaDescription,
      primary_keyword: post.primaryKeyword,
      search_intent: post.searchIntent,
      category: post.category,
      tags: post.tags,
      intro: post.intro,
      key_takeaways: post.keyTakeaways,
      sections: post.sections,
      faq: post.faq,
      related_links: post.relatedLinks,
      cover_image_id: args.coverImageId,
      cover_image_alt: post.imageAlt,
      cover_status: args.coverStatus,
      cover_error: args.coverError?.slice(0, 300),
      image_prompt: post.imagePrompt,
      status: "draft",
      seo_score: args.seoScore,
      word_count: post.wordCount,
      reading_minutes: post.readingMinutes,
      content_hash: post.contentHash,
      model: BLOG_MODEL,
      image_model: args.imageModel,
      prompt_version: BLOG_PROMPT_VERSION,
      created_by: args.createdBy,
      created_at: now,
      updated_at: now,
    });
    await ctx.db.insert("admin_audit_log", {
      admin_user_id: args.createdBy,
      action: "blog.generated",
      before: undefined,
      after: {
        blog_id: blogId,
        title: post.title,
        slug: post.slug,
        seo_score: args.seoScore,
        cover_status: args.coverStatus,
      },
      note: post.title,
      created_at: now,
    });
    return blogId;
  },
});

export const updateCover = internalMutation({
  args: {
    blogId: v.id("blog_posts"),
    coverImageId: v.id("_storage"),
    actorUserId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.blogId);
    if (!row) {
      await ctx.storage.delete(args.coverImageId);
      throw new Error("Post not found.");
    }
    if (row.cover_image_id) {
      try {
        await ctx.storage.delete(row.cover_image_id);
      } catch {
        // Best effort: replace the row even if the old object is gone.
      }
    }
    const now = Date.now();
    await ctx.db.patch(row._id, {
      cover_image_id: args.coverImageId,
      cover_status: "ready",
      cover_error: undefined,
      updated_at: now,
    });
    await ctx.db.insert("admin_audit_log", {
      admin_user_id: args.actorUserId,
      action: "blog.cover_generated",
      after: { blog_id: row._id, cover_image_id: args.coverImageId },
      note: row.title,
      created_at: now,
    });
    return null;
  },
});

export const runGeneration = internalAction({
  args: { runId: v.id("blog_generation_runs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run: any = await ctx.runQuery(internal.blog.getRun, { runId: args.runId });
    if (!run || run.status !== "running") return null;

    try {
      const existing: ExistingBlog[] = await ctx.runQuery(internal.blog.listForPrompt, {});
      const titleHint = cleanText(run.title_hint, "").slice(0, MAX_TITLE_HINT);
      if (titleHint) {
        const exact = existing.find((row) => normalizeTitle(row.title) === normalizeTitle(titleHint));
        if (exact) {
          throw new Error(`A post titled "${exact.title}" already exists. Choose a different angle.`);
        }
      }

      let post = await writeBlog(existing, titleHint);
      post = await editBlogDraft(post, titleHint);
      let duplicate = findDuplicate(post, existing);
      if (duplicate) {
        post = await writeBlog(
          existing,
          titleHint,
          `Your previous draft duplicated the existing post "${duplicate.title}". Choose a clearly different topic and angle.`,
        );
        post = await editBlogDraft(post, titleHint);
        duplicate = findDuplicate(post, existing);
        if (duplicate) {
          throw new Error(`The writer kept overlapping with "${duplicate.title}". Try again with a more specific title.`);
        }
      }

      let coverImageId: Id<"_storage"> | undefined;
      let coverError: string | undefined;
      try {
        const cover = await generateCover(ctx, post.imagePrompt);
        coverImageId = cover.storageId;
      } catch (error) {
        coverError = error instanceof Error ? error.message : "Cover generation failed.";
      }

      const seoScore = scoreBlog(post, Boolean(coverImageId));
      const blogId = await ctx.runMutation(internal.blog.insertGeneratedBlog, {
        post,
        createdBy: run.actor_user_id,
        coverImageId,
        coverStatus: coverImageId ? "ready" : "failed",
        coverError,
        imageModel: BLOG_IMAGE_MODEL,
        seoScore,
      });
      await ctx.runMutation(internal.blog.finishRun, {
        runId: args.runId,
        status: "completed",
        blogId,
      });
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[BlogAgent] generation failed", message);
      await ctx.runMutation(internal.blog.finishRun, {
        runId: args.runId,
        status: "failed",
        error: message,
      });
      return null;
    }
  },
});

export const retryCoverAction = internalAction({
  args: { blogId: v.id("blog_posts"), actorUserId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row: any = await ctx.runQuery(internal.blog.getCoverSource, { blogId: args.blogId });
    if (!row) return null;
    try {
      const cover = await generateCover(ctx, row.image_prompt || row.title);
      await ctx.runMutation(internal.blog.updateCover, {
        blogId: args.blogId,
        coverImageId: cover.storageId,
        actorUserId: args.actorUserId,
      });
    } catch (error) {
      console.error("[BlogAgent] cover retry failed", error);
    }
    return null;
  },
});

export const getCoverSource = internalQuery({
  args: { blogId: v.id("blog_posts") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.blogId);
    if (!row) return null;
    return { image_prompt: row.image_prompt, title: row.title };
  },
});
