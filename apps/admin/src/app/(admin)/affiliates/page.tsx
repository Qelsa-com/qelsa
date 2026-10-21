"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAffiliatePlatformsQuery,
  useCreateAffiliateCourseMutation,
  useListAffiliateCatalogQuery,
  useListManagedAffiliateCoursesQuery,
  usePrefillAffiliateCourseAction,
  useSetAffiliateCourseStatusMutation,
  type AffiliateCourse,
  type ManagedAffiliateCourse,
} from "@/features/api/curriculumApi";
import { Check, Copy, ExternalLink, Handshake, Link2, Search, Sparkles, Terminal } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

const ENV_NAME = "COURSE_AFFILIATE_LINKS";

function CopyButton({ label, value, onCopied }: { label: string; value: string; onCopied: (label: string) => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          onCopied(label);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-medium text-white/60 transition-colors hover:border-white/25 hover:text-white"
    >
      {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
      {copied ? "Copied" : label}
    </button>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-glass-border bg-white/[0.025] p-4">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-neon-cyan/15 text-xs font-bold text-neon-cyan">
        {number}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <div className="mt-1.5 space-y-2 text-xs leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

export default function AffiliatesPage() {
  const { data, isLoading } = useListAffiliateCatalogQuery();
  const { data: managedData, isLoading: managedLoading } = useListManagedAffiliateCoursesQuery();
  const { data: platformsData } = useAffiliatePlatformsQuery();
  const [prefillCourse, { isLoading: isPrefilling }] = usePrefillAffiliateCourseAction();
  const [createCourse, { isLoading: isCreating }] = useCreateAffiliateCourseMutation();
  const [setCourseStatus, { isLoading: isUpdatingStatus }] = useSetAffiliateCourseStatusMutation();
  const [query, setQuery] = useState("");
  const [lastCopied, setLastCopied] = useState<string | null>(null);
  const [platform, setPlatform] = useState("Udemy");
  const [courseUrl, setCourseUrl] = useState("");
  const [hint, setHint] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftSkills, setDraftSkills] = useState("");
  const [draftLevel, setDraftLevel] = useState("Intermediate");
  const [draftDuration, setDraftDuration] = useState("Self-paced");
  const [draftFree, setDraftFree] = useState(false);
  const [aiFilled, setAiFilled] = useState(false);

  const courses = (data as AffiliateCourse[] | undefined) ?? [];
  const managed = (managedData as ManagedAffiliateCourse[] | undefined) ?? [];
  const platforms = (platformsData as string[] | undefined) ?? ["Udemy", "Coursera", "Other"];

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return courses;
    return courses.filter((course) =>
      [course.course_id, course.title, course.provider, ...course.skills].join(" ").toLowerCase().includes(term),
    );
  }, [courses, query]);

  const configured = courses.filter((course) => course.affiliate);
  const currentJson = useMemo(() => {
    const entries = configured.map((course) => [course.course_id, course.url] as const);
    return JSON.stringify(Object.fromEntries(entries), null, 2);
  }, [configured]);

  const cliCommand = `npx convex env set ${ENV_NAME} '${JSON.stringify(Object.fromEntries(configured.map((course) => [course.course_id, course.url])))}'`;

  const handlePrefill = async () => {
    if (!courseUrl.trim()) {
      toast.error("Paste the affiliate course URL first.");
      return;
    }
    try {
      const result = (await prefillCourse({ provider: platform, url: courseUrl.trim(), hint: hint.trim() || undefined }).unwrap()) as {
        title: string;
        description: string;
        skills: string[];
        level: string;
        duration: string;
        free: boolean;
      };
      setDraftTitle(result.title);
      setDraftDescription(result.description);
      setDraftSkills(result.skills.join(", "));
      setDraftLevel(result.level);
      setDraftDuration(result.duration);
      setDraftFree(result.free);
      setAiFilled(true);
      toast.success("Filled from the course page and AI.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not pre-fill this course.");
    }
  };

  const handleCreate = async () => {
    if (!draftTitle.trim() || !courseUrl.trim()) {
      toast.error("A title and course URL are required.");
      return;
    }
    try {
      await createCourse({
        provider: platform,
        title: draftTitle.trim(),
        description: draftDescription.trim(),
        url: courseUrl.trim(),
        skills: draftSkills.split(",").map((skill) => skill.trim()).filter(Boolean),
        level: draftLevel,
        duration: draftDuration,
        free: draftFree,
        aiFilled,
      }).unwrap();
      toast.success("Affiliate course published.");
      setCourseUrl("");
      setHint("");
      setDraftTitle("");
      setDraftDescription("");
      setDraftSkills("");
      setDraftFree(false);
      setAiFilled(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the course.");
    }
  };

  const handleCourseStatus = async (course: ManagedAffiliateCourse, status: "draft" | "published" | "archived") => {
    try {
      await setCourseStatus({ courseId: course.id, status }).unwrap();
      toast.success(`“${course.title}” is now ${status}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the course.");
    }
  };

  return (
    <div className="min-h-full">
      <PageHeader
        title="Affiliate courses"
        description="How to attach affiliate tracking links to the external skill courses shown in the candidate Courses page."
      />

      <div className="space-y-6 p-5 md:p-8">
        <section className="rounded-2xl border border-glass-border bg-white/[0.025] p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-neon-cyan" />
            <h2 className="text-sm font-bold">Add an affiliate course</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Pick a platform, paste the partner link, then let the agent pre-fill the card. Review and publish.
          </p>

          <div className="mt-4 grid gap-3 lg:grid-cols-[160px_1fr_1fr_auto] lg:items-end">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="affiliate-platform">Platform</label>
              <select
                id="affiliate-platform"
                value={platform}
                onChange={(event) => setPlatform(event.target.value)}
                className="h-9 w-full rounded-xl border border-glass-border bg-[#0c0d16] px-3 text-xs font-medium text-white outline-none"
              >
                {platforms.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="affiliate-url">Course URL</label>
              <input
                id="affiliate-url"
                value={courseUrl}
                onChange={(event) => setCourseUrl(event.target.value)}
                placeholder="https://..."
                className="h-9 w-full rounded-xl border border-glass-border bg-white/[0.03] px-3 text-xs text-white placeholder:text-white/30 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="affiliate-hint">Context (optional)</label>
              <input
                id="affiliate-hint"
                value={hint}
                onChange={(event) => setHint(event.target.value)}
                placeholder="e.g. advanced React, for frontend roles"
                className="h-9 w-full rounded-xl border border-glass-border bg-white/[0.03] px-3 text-xs text-white placeholder:text-white/30 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => void handlePrefill()}
              disabled={isPrefilling || !courseUrl.trim()}
              className="h-9 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink px-4 text-xs font-bold text-white disabled:opacity-50"
            >
              {isPrefilling ? "Filling…" : "Pre-fill with AI"}
            </button>
          </div>

          {draftTitle || aiFilled ? (
            <div className="mt-5 grid gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 lg:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="affiliate-title">Title</label>
                <input id="affiliate-title" value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} className="h-9 w-full rounded-xl border border-glass-border bg-white/[0.03] px-3 text-xs text-white outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="affiliate-skills">Skills (comma separated)</label>
                <input id="affiliate-skills" value={draftSkills} onChange={(event) => setDraftSkills(event.target.value)} className="h-9 w-full rounded-xl border border-glass-border bg-white/[0.03] px-3 text-xs text-white outline-none" />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="affiliate-description">Description</label>
                <textarea id="affiliate-description" rows={2} value={draftDescription} onChange={(event) => setDraftDescription(event.target.value)} className="w-full rounded-xl border border-glass-border bg-white/[0.03] p-3 text-xs text-white outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="affiliate-level">Level</label>
                <select id="affiliate-level" value={draftLevel} onChange={(event) => setDraftLevel(event.target.value)} className="h-9 w-full rounded-xl border border-glass-border bg-[#0c0d16] px-3 text-xs text-white outline-none">
                  {["Beginner", "Intermediate", "Advanced"].map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="affiliate-duration">Duration</label>
                <input id="affiliate-duration" value={draftDuration} onChange={(event) => setDraftDuration(event.target.value)} className="h-9 w-full rounded-xl border border-glass-border bg-white/[0.03] px-3 text-xs text-white outline-none" />
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={draftFree} onChange={(event) => setDraftFree(event.target.checked)} />
                Free course
              </label>
              <div className="flex justify-end lg:col-span-2">
                <button
                  type="button"
                  onClick={() => void handleCreate()}
                  disabled={isCreating || !draftTitle.trim()}
                  className="rounded-xl bg-emerald-400/15 px-4 py-2 text-xs font-bold text-emerald-300 disabled:opacity-50"
                >
                  {isCreating ? "Saving…" : "Publish course"}
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="overflow-hidden rounded-2xl border border-glass-border bg-white/[0.02]">
          <div className="border-b border-glass-border px-5 py-4">
            <h2 className="text-sm font-bold">Managed affiliate courses</h2>
            <p className="mt-1 text-xs text-muted-foreground">These appear in the candidate Skill courses tab and in Qelsa Agent recommendations.</p>
          </div>
          {managedLoading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : managed.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">No managed affiliate courses yet.</p>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {managed.map((course) => (
                <div key={course.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold">{course.title}</p>
                      <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/50">{course.status}</span>
                      {course.ai_filled ? <span className="rounded-md bg-neon-cyan/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neon-cyan">AI filled</span> : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{course.provider} · {course.level} · {course.duration} · {course.free ? "Free" : "Paid"}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <a href={course.url} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white/60 hover:text-white">Open</a>
                    {course.status !== "published" ? (
                      <button type="button" disabled={isUpdatingStatus} onClick={() => void handleCourseStatus(course, "published")} className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 disabled:opacity-50">Publish</button>
                    ) : (
                      <button type="button" disabled={isUpdatingStatus} onClick={() => void handleCourseStatus(course, "draft")} className="rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-white/60 disabled:opacity-50">Unpublish</button>
                    )}
                    <button type="button" disabled={isUpdatingStatus} onClick={() => void handleCourseStatus(course, "archived")} className="rounded-lg border border-rose-400/20 bg-rose-400/[0.06] px-3 py-1.5 text-[11px] font-semibold text-rose-300 disabled:opacity-50">Archive</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="space-y-3">
            <Step number={1} title="Pick the course">
              <p>
                Find the course in the catalog table below. Copy its <span className="font-mono text-white/80">course_id</span> — that is the key used in the environment variable.
              </p>
            </Step>
            <Step number={2} title="Join the provider's affiliate program">
              <p>
                Apply with the provider (Udemy, Coursera, DataCamp, etc.), then generate a tracking URL for the course. Keep the destination course the same; only the URL changes.
              </p>
            </Step>
            <Step number={3} title="Set the environment variable">
              <p>
                Open the Convex dashboard for this deployment → <span className="text-white/80">Settings → Environment Variables</span>, then add or edit <span className="font-mono text-white/80">{ENV_NAME}</span>.
              </p>
              <p>Or use the CLI from the repo root:</p>
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-glass-border bg-black/30 p-2.5">
                <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-emerald-200">cd packages/backend && {cliCommand}</code>
                <CopyButton label="Copy command" value={`cd packages/backend && ${cliCommand}`} onCopied={setLastCopied} />
              </div>
            </Step>
            <Step number={4} title="Keep existing mappings">
              <p>
                <span className="font-mono text-white/80">{ENV_NAME}</span> is a single JSON object and the value you save replaces the old one. Copy the current mappings, add the new entry, and save the whole object.
              </p>
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-glass-border bg-black/30 p-2.5">
                <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-sky-200">{currentJson.replace(/\s+/g, " ")}</code>
                <CopyButton label="Copy current JSON" value={currentJson} onCopied={setLastCopied} />
              </div>
            </Step>
            <Step number={5} title="Verify on the candidate side">
              <p>
                Refresh <span className="font-mono text-white/80">/courses</span> → <span className="text-white/80">Skill courses</span>. A configured course shows <span className="text-white/80">Partner link · Qelsa may earn a commission</span>. Clicks are recorded in the <span className="font-mono text-white/80">course_clicks</span> table for attribution.
              </p>
            </Step>
            <Step number={6} title="Adding a course that is not in the catalog">
              <p>
                The external catalog is code-managed today. Add the course to <span className="font-mono text-white/80">packages/backend/convex/lib/courseCatalog.ts</span> with provider, title, URL, level, duration, price, description, and skills, deploy the backend, then attach the affiliate URL with the steps above.
              </p>
            </Step>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-glass-border bg-white/[0.025] p-5">
              <div className="flex items-center gap-2">
                <Handshake className="size-4 text-neon-cyan" />
                <h2 className="text-sm font-bold">Rules to keep</h2>
              </div>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
                <li className="flex gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
                  Ranking is based on skill relevance only. Never rank by commission.
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
                  Every affiliate card is labeled as a partner link.
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
                  Keep the original provider URL in the catalog; only the environment mapping changes.
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
                  Internal Qelsa interview prep is always recommended ahead of an external course.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-glass-border bg-white/[0.025] p-5">
              <div className="flex items-center gap-2">
                <Terminal className="size-4 text-neon-cyan" />
                <h2 className="text-sm font-bold">Where each value goes</h2>
              </div>
              <dl className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
                <div>
                  <dt className="font-mono text-white/80">course_id</dt>
                  <dd>The JSON key. Comes from the catalog table below.</dd>
                </div>
                <div>
                  <dt className="font-mono text-white/80">affiliate URL</dt>
                  <dd>The JSON value. Must start with <span className="font-mono">https://</span>.</dd>
                </div>
                <div>
                  <dt className="font-mono text-white/80">{ENV_NAME}</dt>
                  <dd>Deployment-level env var on Convex. Not committed to the repo.</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-glass-border bg-white/[0.025] p-5">
              <p className="text-sm font-bold">Current status</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {configured.length} of {courses.length} catalog courses have an affiliate link configured.
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple"
                  style={{ width: `${courses.length ? (configured.length / courses.length) * 100 : 0}%` }}
                />
              </div>
              {lastCopied ? <p className="mt-3 text-[11px] text-emerald-300">Copied {lastCopied}.</p> : null}
            </div>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-glass-border bg-white/[0.02]">
          <div className="flex flex-col gap-3 border-b border-glass-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold">
                <Link2 className="size-4 text-neon-cyan" />
                External course catalog
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">Use the course_id as the key in {ENV_NAME}.</p>
            </div>
            <div className="flex w-full items-center gap-2 rounded-xl border border-glass-border bg-white/[0.03] px-3 sm:max-w-xs">
              <Search className="size-3.5 shrink-0 text-white/35" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search course, provider, or skill"
                aria-label="Search catalog"
                className="h-9 min-w-0 flex-1 bg-transparent text-xs text-white placeholder:text-white/35 focus:outline-none"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">No catalog courses match that search.</p>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {filtered.map((course) => (
                <div key={course.course_id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold">{course.title}</p>
                      {course.affiliate ? (
                        <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                          Affiliate set
                        </span>
                      ) : (
                        <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/45">
                          Direct link
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {course.provider} · {course.level} · {course.free ? "Free" : "Paid"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {course.skills.slice(0, 4).map((skill) => (
                        <span key={skill} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/45">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <code className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 font-mono text-[11px] text-sky-200">
                      {course.course_id}
                    </code>
                    <CopyButton label="Copy ID" value={course.course_id} onCopied={setLastCopied} />
                    <a
                      href={course.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-medium text-white/60 transition-colors hover:border-white/25 hover:text-white"
                    >
                      <ExternalLink className="size-3" />
                      Open
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
