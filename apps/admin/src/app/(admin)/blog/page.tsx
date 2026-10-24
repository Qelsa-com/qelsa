"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { useAlert } from "@/components/ui/alert-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useBlogGenerationStateQuery,
  useDeleteBlogMutation,
  useGetAdminBlogQuery,
  useListAdminBlogsQuery,
  useRetryBlogCoverMutation,
  useSetBlogStatusMutation,
  useStartBlogGenerationMutation,
  type AdminBlog,
  type AdminBlogSummary,
} from "@/features/api/blogApi";
import {
  ArrowUpRight,
  BookOpen,
  Clock3,
  Eye,
  ImageOff,
  Loader2,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function formatDate(value: number | null) {
  if (!value) return "Not published";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusPill({ status }: { status: "draft" | "published" }) {
  return (
    <span
      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        status === "published"
          ? "bg-emerald-500/15 text-emerald-400"
          : "bg-amber-500/15 text-amber-300"
      }`}
    >
      {status}
    </span>
  );
}

function SeoScore({ score }: { score: number }) {
  const tone =
    score >= 85
      ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300"
      : score >= 70
        ? "border-sky-400/20 bg-sky-400/[0.06] text-sky-300"
        : "border-amber-400/20 bg-amber-400/[0.06] text-amber-300";
  return (
    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${tone}`}>
      SEO {score}
    </span>
  );
}

function BlogThumbnail({ post, className = "" }: { post: AdminBlogSummary; className?: string }) {
  if (post.cover_image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={post.cover_image_url}
        alt={post.cover_image_alt || post.title}
        className={`h-full w-full object-cover ${className}`}
        loading="lazy"
      />
    );
  }
  return (
    <div className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-neon-purple/20 via-[#111326] to-neon-cyan/10 text-white/35 ${className}`}>
      {post.cover_status === "failed" ? <ImageOff className="size-6" /> : <BookOpen className="size-6" />}
      <span className="px-3 text-center text-[10px] font-medium">
        {post.cover_status === "failed" ? "Cover failed" : "No cover"}
      </span>
    </div>
  );
}

function PreviewPanel({ blogId, onClose }: { blogId: string; onClose: () => void }) {
  const { data, isLoading } = useGetAdminBlogQuery(blogId);
  const post = data as AdminBlog | undefined;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="h-full w-full max-w-3xl overflow-y-auto border-l border-glass-border bg-[#08080f] p-5 shadow-2xl sm:p-7"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Blog preview"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Preview</p>
            <h2 className="mt-1 text-xl font-bold leading-tight">{post?.title ?? "Loading post…"}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-glass-border text-white/60 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        {isLoading || !post ? (
          <div className="mt-6 space-y-4">
            <Skeleton className="aspect-video w-full rounded-2xl bg-white/[0.06]" />
            <Skeleton className="h-4 w-3/4 bg-white/[0.06]" />
            <Skeleton className="h-4 w-full bg-white/[0.06]" />
            <Skeleton className="h-4 w-5/6 bg-white/[0.06]" />
          </div>
        ) : (
          <article className="mt-6 space-y-6">
            <div className="aspect-video overflow-hidden rounded-2xl border border-glass-border bg-white/[0.03]">
              <BlogThumbnail post={post} />
            </div>

            <div className="rounded-xl border border-sky-400/15 bg-sky-400/[0.04] p-4 text-xs">
              <p className="font-semibold text-sky-200">Search metadata</p>
              <p className="mt-2 text-white/55">
                <span className="text-white/35">Title:</span> {post.meta_title}
              </p>
              <p className="mt-1 text-white/55">
                <span className="text-white/35">Description:</span> {post.meta_description}
              </p>
              <p className="mt-1 text-white/55">
                <span className="text-white/35">Keyword:</span> {post.primary_keyword}
              </p>
              <p className="mt-1 text-white/55">
                <span className="text-white/35">Slug:</span> /blogs/{post.slug}
              </p>
            </div>

            <p className="text-sm leading-7 text-white/70">{post.intro}</p>

            {post.key_takeaways.length ? (
              <div className="rounded-xl border border-glass-border bg-white/[0.025] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neon-cyan">Key takeaways</p>
                <ul className="mt-2 space-y-1.5">
                  {post.key_takeaways.map((item) => (
                    <li key={item} className="flex gap-2 text-xs leading-relaxed text-white/60">
                      <span className="text-neon-cyan">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {post.sections.map((section) => (
              <section key={section.heading}>
                <h3 className="text-lg font-bold">{section.heading}</h3>
                <div className="mt-2 space-y-3">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-7 text-white/65">{paragraph}</p>
                  ))}
                </div>
                {section.bullets.length ? (
                  <ul className="mt-3 space-y-1.5">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2 text-sm leading-6 text-white/60">
                        <span className="text-neon-purple">•</span>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}

            {post.faq.length ? (
              <section>
                <h3 className="text-lg font-bold">FAQ</h3>
                <div className="mt-3 space-y-3">
                  {post.faq.map((item) => (
                    <div key={item.question} className="rounded-xl border border-glass-border bg-white/[0.025] p-4">
                      <p className="text-sm font-semibold">{item.question}</p>
                      <p className="mt-1.5 text-xs leading-6 text-white/55">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </article>
        )}
      </div>
    </div>
  );
}

export default function BlogPage() {
  const alert = useAlert();
  const { data: postsData, isLoading } = useListAdminBlogsQuery();
  const { data: runData } = useBlogGenerationStateQuery();
  const [startGeneration, { isLoading: isStarting }] = useStartBlogGenerationMutation();
  const [setStatus] = useSetBlogStatusMutation();
  const [deleteBlog] = useDeleteBlogMutation();
  const [retryCover] = useRetryBlogCoverMutation();
  const [title, setTitle] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [coverBusyId, setCoverBusyId] = useState<string | null>(null);

  const posts = (postsData as AdminBlogSummary[] | undefined) ?? [];
  const generation = runData as
    | {
        status: "running" | "completed" | "failed";
        title_hint: string | null;
        started_at: number;
        error: string | null;
      }
    | undefined;
  const isRunning = generation?.status === "running";
  const busy = isStarting || isRunning;
  const drafts = useMemo(() => posts.filter((post) => post.status === "draft").length, [posts]);
  const published = posts.length - drafts;

  const handleGenerate = async () => {
    if (busy) return;
    try {
      await startGeneration({ title: title.trim() || undefined });
      setTitle("");
      toast.success("Blog generation started. You can leave this page while it writes.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start the blog agent.");
    }
  };

  const handleStatus = async (post: AdminBlogSummary, status: "draft" | "published") => {
    setBusyId(post.id);
    try {
      await setStatus({ blogId: post.id, status });
      toast.success(status === "published" ? "Post published." : "Post moved back to drafts.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the post.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (post: AdminBlogSummary) => {
    const confirmed = await alert({
      title: "Delete this post?",
      description: `“${post.title}” and its cover image will be permanently removed.`,
      confirmText: "Delete post",
      cancelText: "Keep post",
      tone: "danger",
    });
    if (!confirmed) return;
    setBusyId(post.id);
    try {
      await deleteBlog({ blogId: post.id });
      toast.success("Post deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete the post.");
    } finally {
      setBusyId(null);
    }
  };

  const handleRetryCover = async (post: AdminBlogSummary) => {
    setCoverBusyId(post.id);
    try {
      await retryCover({ blogId: post.id });
      toast.success("Cover generation started.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not retry the cover.");
    } finally {
      setCoverBusyId(null);
    }
  };

  return (
    <div className="min-h-full">
      <PageHeader
        title="Blog"
        description="One post at a time. The agent finds a gap, writes a long guide in a natural human voice for search and AI answers, and makes a cover."
      />

      <div className="space-y-6 p-5 md:p-8">
        <section className="rounded-2xl border border-glass-border bg-white/[0.025] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold">
                <Sparkles className="size-4 text-neon-cyan" />
                Generate a post
              </h2>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                Runs in the background. Leave the title blank and the agent picks a topic that is not already covered.
              </p>
            </div>
            <span className="rounded-md bg-white/[0.04] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/40">
              Nano Banana Lite cover
            </span>
          </div>

          <form
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              void handleGenerate();
            }}
          >
            <label className="min-w-0 flex-1 space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Title (optional)</span>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={120}
                placeholder="Leave blank and the agent decides"
                disabled={busy}
              />
            </label>
            <Button
              type="submit"
              disabled={busy}
              className="gradient-primary h-11 rounded-xl px-5 text-xs font-bold text-white sm:h-9"
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              {busy ? "Writing…" : "Generate blog"}
            </Button>
          </form>

          {isRunning ? (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-sky-400/15 bg-sky-400/[0.05] px-3 py-2 text-[11px] text-sky-200">
              <Loader2 className="size-3.5 animate-spin" />
              Planning, writing, scoring, and making the cover. This keeps running if you leave.
            </div>
          ) : null}

          {!isRunning && generation?.status === "failed" ? (
            <div className="mt-3 rounded-lg border border-rose-400/20 bg-rose-400/[0.06] px-3 py-2 text-[11px] leading-relaxed text-rose-200">
              Last run failed: {generation.error ?? "The agent stopped before finishing."}
            </div>
          ) : null}
        </section>

        <section className="overflow-hidden rounded-2xl border border-glass-border bg-white/[0.02]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-glass-border px-5 py-4">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold">
                <BookOpen className="size-4 text-neon-cyan" />
                Posts
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {posts.length ? `${drafts} draft${drafts === 1 ? "" : "s"} · ${published} published` : "No posts yet."}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} className="h-28 w-full rounded-xl bg-white/[0.05]" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <BookOpen className="mx-auto size-8 text-white/20" />
              <p className="mt-3 text-sm font-semibold">The blog is ready for its first post.</p>
              <p className="mt-1 text-xs text-muted-foreground">Generate one above. It will appear here as a draft.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {posts.map((post) => (
                <article key={post.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
                  <div className="aspect-video w-full shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] sm:w-40">
                    <BlogThumbnail post={post} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill status={post.status} />
                      <SeoScore score={post.seo_score} />
                      <span className="text-[10px] text-white/35">{formatDate(post.published_at ?? post.created_at)}</span>
                      {post.cover_status === "failed" ? (
                        <span className="text-[10px] font-medium text-rose-300">Cover failed</span>
                      ) : null}
                    </div>

                    <h3 className="mt-2 text-base font-bold leading-snug">{post.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{post.excerpt}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/35">
                      <span>{post.category}</span>
                      <span>{post.word_count.toLocaleString()} words</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="size-3" />
                        {post.reading_minutes} min
                      </span>
                      <span className="truncate">/blogs/{post.slug}</span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-11 rounded-lg border-glass-border bg-white/[0.03] px-3 text-[11px] sm:h-9"
                        onClick={() => setPreviewId(post.id)}
                      >
                        <Eye className="size-3.5" />
                        Preview
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-11 rounded-lg px-3 text-[11px] font-semibold sm:h-9"
                        disabled={busyId === post.id}
                        onClick={() => void handleStatus(post, post.status === "published" ? "draft" : "published")}
                      >
                        {busyId === post.id ? <Loader2 className="size-3.5 animate-spin" /> : <ArrowUpRight className="size-3.5" />}
                        {post.status === "published" ? "Unpublish" : "Publish"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`h-11 rounded-lg px-3 text-[11px] sm:h-9 ${
                          post.cover_status === "failed"
                            ? "border-amber-400/20 bg-amber-400/[0.05] text-amber-200"
                            : "border-glass-border bg-white/[0.03] text-white/55"
                        }`}
                        disabled={coverBusyId === post.id}
                        onClick={() => void handleRetryCover(post)}
                      >
                        {coverBusyId === post.id ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
                        {post.cover_status === "failed" ? "Retry cover" : "New cover"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-11 rounded-lg px-3 text-[11px] text-white/40 hover:text-rose-300 sm:h-9"
                        disabled={busyId === post.id}
                        onClick={() => void handleDelete(post)}
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {previewId ? <PreviewPanel blogId={previewId} onClose={() => setPreviewId(null)} /> : null}
    </div>
  );
}
