"use client";

import type { BlogFaq, BlogSection, BlogStatus } from "@/features/api/blogApi";
import { BookOpen } from "lucide-react";
import { BlogInlineText } from "./BlogInlineText";

export type BlogPreviewData = {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  cover_image_url: string | null;
  cover_image_alt: string;
  meta_title: string;
  meta_description: string;
  primary_keyword: string;
  intro: string;
  key_takeaways: string[];
  sections: BlogSection[];
  faq: BlogFaq[];
  word_count: number;
  reading_minutes: number;
  status: BlogStatus;
};

export function BlogPreview({ post }: { post: BlogPreviewData }) {
  return (
    <article className="space-y-7">
      <div className="overflow-hidden rounded-2xl border border-glass-border bg-white/[0.03]">
        <div className="aspect-video">
          {post.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.cover_image_url}
              alt={post.cover_image_alt || post.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-neon-purple/20 via-[#111326] to-neon-cyan/10 text-white/30">
              <BookOpen className="size-7" />
              <span className="text-[10px] font-medium">No cover image</span>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              post.status === "published"
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-amber-500/15 text-amber-300"
            }`}
          >
            {post.status}
          </span>
          <span className="rounded-md border border-neon-cyan/20 bg-neon-cyan/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neon-cyan">
            {post.category || "Uncategorized"}
          </span>
          {post.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/45"
            >
              {tag}
            </span>
          ))}
        </div>
        <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-[-0.02em] text-white">
          {post.title || "Untitled post"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-white/55">{post.excerpt}</p>
        <p className="mt-3 text-[10px] text-white/35">
          {post.word_count.toLocaleString()} words · {post.reading_minutes} min read
        </p>
      </div>

      <div className="rounded-xl border border-sky-400/15 bg-sky-400/[0.04] p-4 text-xs">
        <p className="font-semibold text-sky-200">Search metadata</p>
        <p className="mt-2 break-words text-white/55">
          <span className="text-white/35">Title:</span> {post.meta_title || "Not set"}
        </p>
        <p className="mt-1 break-words text-white/55">
          <span className="text-white/35">Description:</span> {post.meta_description || "Not set"}
        </p>
        <p className="mt-1 break-words text-white/55">
          <span className="text-white/35">Keyword:</span> {post.primary_keyword || "Not set"}
        </p>
        <p className="mt-1 break-words text-white/55">
          <span className="text-white/35">Slug:</span> /blog/{post.slug || "…"}
        </p>
      </div>

      <p className="text-sm leading-7 text-white/70">
        <BlogInlineText text={post.intro || "The intro will appear here."} />
      </p>

      {post.key_takeaways.length ? (
        <div className="rounded-xl border border-glass-border bg-white/[0.025] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neon-cyan">
            Key takeaways
          </p>
          <ul className="mt-2 space-y-1.5">
            {post.key_takeaways.map((item, index) => (
              <li
                key={`${item}-${index}`}
                className="flex gap-2 text-xs leading-relaxed text-white/60"
              >
                <span className="text-neon-cyan">•</span>
                <BlogInlineText text={item} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {post.sections.map((section, index) => (
        <section key={`${section.heading}-${index}`}>
          <h2 className="text-lg font-bold text-white">
            <BlogInlineText text={section.heading || "Untitled section"} />
          </h2>
          <div className="mt-2 space-y-3">
            {section.paragraphs.map((paragraph, paragraphIndex) => (
              <p
                key={`${paragraph.slice(0, 40)}-${paragraphIndex}`}
                className="text-sm leading-7 text-white/65"
              >
                <BlogInlineText text={paragraph} />
              </p>
            ))}
          </div>
          {section.bullets.length ? (
            <ul className="mt-3 space-y-1.5">
              {section.bullets.map((bullet, bulletIndex) => (
                <li
                  key={`${bullet.slice(0, 40)}-${bulletIndex}`}
                  className="flex gap-2 text-sm leading-6 text-white/60"
                >
                  <span className="text-neon-purple">•</span>
                  <BlogInlineText text={bullet} />
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}

      {post.faq.length ? (
        <section>
          <h2 className="text-lg font-bold text-white">FAQ</h2>
          <div className="mt-3 space-y-3">
            {post.faq.map((item, index) => (
              <div
                key={`${item.question}-${index}`}
                className="rounded-xl border border-glass-border bg-white/[0.025] p-4"
              >
                <p className="text-sm font-semibold text-white">
                  <BlogInlineText text={item.question || "Untitled question"} />
                </p>
                <p className="mt-1.5 text-xs leading-6 text-white/55">
                  <BlogInlineText text={item.answer} />
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
