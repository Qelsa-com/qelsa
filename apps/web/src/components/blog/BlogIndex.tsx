import { ArrowRight, BookOpen, Clock3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { PublicBlogSummary } from "@/types/blog";

function formatDate(value: number | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function BlogCover({ post, eager = false, sizes }: { post: PublicBlogSummary; eager?: boolean; sizes: string }) {
  if (post.cover_image_url) {
    return (
      <Image
        src={post.cover_image_url}
        alt={post.cover_image_alt || post.title}
        fill
        sizes={sizes}
        priority={eager}
        className="object-cover transition-transform duration-500 group-hover:scale-[1.025]"
      />
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neon-purple/20 via-[#101120] to-neon-cyan/10">
      <BookOpen className="size-9 text-white/20" />
    </div>
  );
}

function PostMeta({ post }: { post: PublicBlogSummary }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/35">
      <span>{post.category}</span>
      <span aria-hidden>·</span>
      <span>{formatDate(post.published_at ?? post.created_at)}</span>
      <span aria-hidden>·</span>
      <span className="inline-flex items-center gap-1">
        <Clock3 className="size-3" />
        {post.reading_minutes} min read
      </span>
    </div>
  );
}

export function BlogIndex({ posts }: { posts: PublicBlogSummary[] }) {
  const [featured, ...rest] = posts;

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 lg:py-16">
        <header className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neon-cyan">Qelsa Blog</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.035em] sm:text-5xl">
            Better answers for your career.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/50 sm:text-base">
            Practical guides for finding work, interviewing well, and building skills that matter.
          </p>
        </header>

        {!posts.length ? (
          <div className="mt-12 rounded-[24px] border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
            <BookOpen className="mx-auto size-8 text-white/20" />
            <p className="mt-3 text-sm font-semibold">The first guides are on the way.</p>
            <p className="mt-1 text-xs text-white/40">In the meantime, explore open roles on Qelsa.</p>
            <Link
              href="/jobs"
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#06060f]"
            >
              Browse jobs
              <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : (
          <>
            <article className="mt-9 overflow-hidden rounded-[28px] border border-white/[0.09] bg-[#0b0b16]">
              <div className="grid lg:grid-cols-[1.15fr_1fr]">
                <Link href={`/blog/${featured.slug}`} className="group relative block aspect-[16/10] overflow-hidden bg-white/[0.03] lg:aspect-auto lg:min-h-[360px]">
                  <BlogCover post={featured} eager sizes="(max-width: 1024px) 100vw, 640px" />
                </Link>
                <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md border border-neon-cyan/20 bg-neon-cyan/[0.07] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-neon-cyan">
                      Latest
                    </span>
                    <span className="text-[10px] text-white/30">{featured.category}</span>
                  </div>
                  <h2 className="mt-4 text-2xl font-bold leading-tight tracking-[-0.02em] sm:text-3xl">
                    <Link href={`/blog/${featured.slug}`} className="hover:text-neon-cyan">
                      {featured.title}
                    </Link>
                  </h2>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/50">{featured.excerpt}</p>
                  <div className="mt-5">
                    <PostMeta post={featured} />
                  </div>
                  <Link
                    href={`/blog/${featured.slug}`}
                    className="mt-6 inline-flex w-fit items-center gap-2 text-sm font-semibold text-neon-cyan hover:text-white"
                  >
                    Read the guide
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            </article>

            {rest.length ? (
              <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <article
                    key={post.id}
                    className="group flex flex-col overflow-hidden rounded-[24px] border border-white/[0.09] bg-[#0b0b16] transition-colors hover:border-white/20"
                  >
                    <Link href={`/blog/${post.slug}`} className="relative block aspect-[16/9] overflow-hidden bg-white/[0.03]">
                      <BlogCover post={post} sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" />
                    </Link>
                    <div className="flex flex-1 flex-col p-5">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neon-purple">{post.category}</span>
                      <h2 className="mt-2 text-lg font-bold leading-snug">
                        <Link href={`/blog/${post.slug}`} className="hover:text-neon-cyan">
                          {post.title}
                        </Link>
                      </h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/45">{post.excerpt}</p>
                      <div className="mt-auto pt-5">
                        <PostMeta post={post} />
                      </div>
                    </div>
                  </article>
                ))}
              </section>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
