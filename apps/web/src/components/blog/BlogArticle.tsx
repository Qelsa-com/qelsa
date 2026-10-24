import { ArrowLeft, BookOpen, Check, Clock3 } from "lucide-react";
import { BlogCtas } from "./BlogCtas";
import Image from "next/image";
import Link from "next/link";
import type { PublicBlog } from "@/types/blog";

function formatDate(value: number | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function BlogArticle({ post }: { post: PublicBlog }) {
  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:py-12">
        <Link href="/blogs" className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/45 transition-colors hover:text-white">
          <ArrowLeft className="size-3.5" />
          All guides
        </Link>

        <article className="mt-5 overflow-hidden rounded-[28px] border border-white/[0.09] bg-[#0b0b16]">
          <div className="grid lg:grid-cols-[1.05fr_1fr]">
            <div className="relative aspect-[16/10] overflow-hidden bg-white/[0.03] lg:aspect-auto lg:min-h-[390px]">
              {post.cover_image_url ? (
                <Image
                  src={post.cover_image_url}
                  alt={post.cover_image_alt || post.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 620px"
                  priority
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neon-purple/25 via-[#101120] to-neon-cyan/10">
                  <BookOpen className="size-10 text-white/20" />
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-neon-cyan/20 bg-neon-cyan/[0.07] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-neon-cyan">
                  {post.category}
                </span>
                {post.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="rounded-md border border-white/[0.1] bg-white/[0.03] px-2 py-1 text-[10px] text-white/45">
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-[-0.03em] sm:text-4xl">
                {post.title}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-white/50">{post.excerpt}</p>
              <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/35">
                <span>Qelsa Editorial</span>
                <span aria-hidden>·</span>
                <span>{formatDate(post.published_at ?? post.created_at)}</span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="size-3" />
                  {post.reading_minutes} min read
                </span>
              </div>
            </div>
          </div>
        </article>

        <div className="mx-auto mt-10 max-w-3xl">
          <p className="text-[17px] leading-8 text-white/75">{post.intro}</p>

          {post.key_takeaways.length ? (
            <div className="mt-7 rounded-2xl border border-neon-cyan/20 bg-gradient-to-r from-neon-cyan/[0.06] to-transparent p-5 sm:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neon-cyan">Key takeaways</p>
              <ul className="mt-3 space-y-2.5">
                {post.key_takeaways.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-white/65">
                    <Check className="mt-1 size-4 shrink-0 text-neon-cyan" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-9 space-y-9">
            {post.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl font-bold leading-tight tracking-[-0.02em] text-white">{section.heading}</h2>
                <div className="mt-3 space-y-4">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-[15px] leading-8 text-white/65">
                      {paragraph}
                    </p>
                  ))}
                </div>
                {section.bullets.length ? (
                  <ul className="mt-4 space-y-2.5">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2.5 text-sm leading-7 text-white/60">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-neon-purple" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          {post.faq.length ? (
            <section className="mt-12 border-t border-white/[0.08] pt-8">
              <h2 className="text-2xl font-bold tracking-[-0.02em]">Questions people ask</h2>
              <div className="mt-4 space-y-3">
                {post.faq.map((item) => (
                  <details key={item.question} className="group rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4 py-3.5">
                    <summary className="cursor-pointer list-none text-sm font-semibold leading-6 text-white/80 [&::-webkit-details-marker]:hidden">
                      <span className="flex items-start justify-between gap-3">
                        {item.question}
                        <span className="mt-1 text-white/30 transition-transform group-open:rotate-45">+</span>
                      </span>
                    </summary>
                    <p className="mt-3 text-sm leading-7 text-white/55">{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          <aside className="mt-12 rounded-[24px] border border-white/[0.09] bg-gradient-to-br from-neon-purple/[0.12] via-white/[0.03] to-neon-cyan/[0.06] p-6 sm:p-8">
            <h2 className="text-xl font-bold">Take the next step.</h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/50">
              Browse roles that fit your experience, or get a practical plan from Qelsa Agent.
            </p>
            <div className="mt-5">
              <BlogCtas postTitle={post.title} />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
