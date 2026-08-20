"use client";

/**
 * JobPostingPage — Figma "qelsa-post-job-screen" (Qelsa-Screen, node 230:773 / 214:541).
 *
 * A single-page posting form (the old multi-step wizard was replaced) wired to
 * `POST jobs/with-questions`. Sections: Basic information (catalog title /
 * location / company, then Generate with AI), Job description, What this role
 * uses daily, Competency framework, Screening questions, Internal Only (static),
 * preview + actions.
 *
 * Screening questions round-trip the backend fields: category, type, is_knockout,
 * knockout_condition, knockout_value, expected_answer, and options[].is_correct.
 * Private budget, approvers and drafts are still static. AI generation fills
 * work type, workplace, experience, salary, description, and skills from a
 * Qelsa-locked title/location/company context; the recruiter reviews before publish.
 */

import { Autocomplete } from "@/components/ui/autocomplete";
import { formatCity } from "@/constants/city";
import { JOB_SKILL_TYPES, JobSkillType, jobSkillTypeLabel, PROFICIENCY_LEVELS, ProficiencyLevel, proficiencyLabel } from "@/constants/skills";
import { useCreateJobMutation, useGenerateJobDraftAction } from "@/features/api/jobsApi";
import { useLazySearchJobTitlesQuery } from "@/features/api/jobTitlesApi";
import { useLazyGetMyPagesQuery } from "@/features/api/pagesApi";
import { useLazyGetSkillsQuery, useLazySearchCitiesQuery } from "@/features/api/seedApi";
import { toastUnknownError } from "@/lib/errors";
import { City } from "@/types/city";
import type { Id } from "@qelsa/backend";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronDown,
  ClipboardList,
  Edit2,
  ExternalLink,
  Eye,
  GripVertical,
  Info,
  Lock,
  Plus,
  Building2,
  MapPin,
  Search,
  Send,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

/* -------------------------------- helpers --------------------------------- */

const SALARY_CURRENCY = "INR";
const CARD = "rounded-[20px] border border-glass-border bg-white/[0.03] p-6";
const INPUT =
  "h-11 w-full rounded-xl border border-glass-border bg-white/[0.04] px-4 text-sm text-white placeholder:text-white/45 transition-colors focus:border-neon-cyan focus:outline-none";
const GRADIENT = "bg-gradient-to-r from-neon-purple to-neon-pink";

/** The company page a job is posted under, narrowed to what Autocomplete needs. */
type CompanyOption = { id: string | number; name: string };
type CatalogOption = { id: string | number; name: string };

function formatMoney(value: number): string {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: SALARY_CURRENCY, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${SALARY_CURRENCY} ${value.toLocaleString("en-IN")}`;
  }
}

const AMOUNT_MULTIPLIERS: Record<string, number> = { k: 1e3, l: 1e5, lac: 1e5, lakh: 1e5, lakhs: 1e5, lpa: 1e5, cr: 1e7, crore: 1e7, crores: 1e7, m: 1e6 };

function parseAmount(raw: string): number | null {
  const cleaned = raw.trim().toLowerCase().replace(/[₹,\s]/g, "");
  if (!cleaned) return null;
  const match = cleaned.match(/^(\d+(?:\.\d+)?)([a-z]*)$/);
  if (!match) return null;
  const [, digits, suffix] = match;
  const multiplier = suffix ? AMOUNT_MULTIPLIERS[suffix] : 1;
  if (!multiplier) return null;
  return Math.round(parseFloat(digits) * multiplier);
}

function parseSalaryRange(input: string): { min: number | null; max: number | null; valid: boolean } {
  const raw = (input ?? "").trim();
  if (!raw) return { min: null, max: null, valid: true };
  const parts = raw
    .split(/\s*(?:-|–|—|\bto\b)\s*/i)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length > 2) return { min: null, max: null, valid: false };
  const amounts = parts.map(parseAmount);
  if (amounts.some((a) => a === null)) return { min: null, max: null, valid: false };
  const [min, max = null] = amounts as number[];
  if (max != null && max < min) return { min, max, valid: false };
  return { min, max, valid: true };
}

function formatSalaryRange(input: string): string | null {
  const { min, max, valid } = parseSalaryRange(input);
  if (!valid || min == null) return null;
  if (max == null) return `${formatMoney(min)}+`;
  return min === max ? formatMoney(min) : `${formatMoney(min)} - ${formatMoney(max)}`;
}

const slug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

let idCounter = 0;
const uid = () => `q_${Date.now().toString(36)}_${idCounter++}`;

/* ------------------------------ screening data ---------------------------- */

type QAnswerType = "yes_no" | "multiple_choice" | "short_text";
type QCategory = "essential" | "skills" | "logistics" | "custom";

interface SQOption {
  title: string;
  is_correct: boolean;
}

interface ScreeningQ {
  id: string;
  category: QCategory;
  title: string;
  type: QAnswerType;
  is_knockout: boolean;
  expected_answer?: string | null; // yes_no -> "yes" | "no"
  options?: SQOption[]; // multiple_choice
  min_length?: number; // short_text (UI only)
}

const CATEGORY_ORDER: QCategory[] = ["essential", "skills", "logistics", "custom"];

const CATEGORY_META: Record<QCategory, { tag: string; title: string; description: string; badge: string }> = {
  essential: { tag: "essentials", title: "Essential Requirements", description: "Core eligibility questions", badge: "bg-neon-cyan/15 text-neon-cyan" },
  skills: { tag: "skills", title: "Skills Assessment", description: "Technical and soft skills evaluation", badge: "bg-neon-purple/15 text-neon-purple" },
  logistics: { tag: "logistics", title: "Logistics & Availability", description: "Work arrangement preferences", badge: "bg-neon-pink/15 text-neon-pink" },
  custom: { tag: "custom", title: "Custom Questions", description: "Your own questions", badge: "bg-white/10 text-white/70" },
};

const TEMPLATE_ORDER: Exclude<QCategory, "custom">[] = ["essential", "skills", "logistics"];

const TEMPLATE_QUESTIONS: Record<Exclude<QCategory, "custom">, Omit<ScreeningQ, "id" | "category">[]> = {
  essential: [
    { title: "Are you legally authorized to work in this country?", type: "yes_no", is_knockout: true, expected_answer: "yes" },
    { title: "Can you start within the next 30 days?", type: "yes_no", is_knockout: false, expected_answer: "yes" },
  ],
  skills: [
    { title: "How many years of relevant experience do you have?", type: "short_text", is_knockout: false },
    { title: "Are you proficient with the core tools listed for this role?", type: "yes_no", is_knockout: false, expected_answer: "yes" },
  ],
  logistics: [
    {
      title: "What is your preferred work arrangement?",
      type: "multiple_choice",
      is_knockout: false,
      options: [
        { title: "Fully remote", is_correct: true },
        { title: "Hybrid (2-3 days in office)", is_correct: true },
        { title: "On-site full time", is_correct: false },
      ],
    },
    { title: "Are you willing to relocate if required?", type: "yes_no", is_knockout: false, expected_answer: "yes" },
  ],
};

/* --------------------------------- page ----------------------------------- */

interface SkillRow {
  id: string | number;
  name: string;
  type: JobSkillType;
  proficiency: ProficiencyLevel;
  weight: number | "";
}

export function JobPostingPage() {
  const router = useRouter();
  const [createJob, { isLoading }] = useCreateJobMutation();
  const generateDraft = useGenerateJobDraftAction();
  const [searchMyPages, { data: pageResults = [] }] = useLazyGetMyPagesQuery();

  const [aiPrompt, setAiPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [jobTitle, setJobTitle] = useState<CatalogOption | null>(null);
  const [company, setCompany] = useState<CompanyOption | null>(null);
  // What the user typed, whether or not it matched one of their pages.
  const [companyName, setCompanyName] = useState("");
  const [city, setCity] = useState<City | null>(null);
  const [workType, setWorkType] = useState("full-time");
  const [workplaceType, setWorkplaceType] = useState("on-site");
  const [experience, setExperience] = useState(0);
  const [salaryRange, setSalaryRange] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [questions, setQuestions] = useState<ScreeningQ[]>([]);
  const [targetBudget, setTargetBudget] = useState(""); // static / not submitted

  const [searchJobTitles, { data: jobTitleResults = [] }] = useLazySearchJobTitlesQuery();
  const [searchCities, { data: cityResults = [] }] = useLazySearchCitiesQuery();
  const [searchSkills, { data: skillResults = [] }] = useLazyGetSkillsQuery();

  // Jobs can only be posted on a page the user owns, so the search is scoped to
  // their own pages. A name that matches none of them is sent as `page_name` and
  // the backend creates the page in the same transaction as the job.
  const companyOptions: CompanyOption[] = pageResults.flatMap((p) => (p.id == null ? [] : [{ id: p.id, name: p.name }]));

  /* ----------------------------- skills logic ---------------------------- */
  const [skillsEditMode, setSkillsEditMode] = useState(false);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [skillsBackup, setSkillsBackup] = useState<SkillRow[]>([]);
  // Bumping the key remounts the field, which is how it gets cleared after an add.
  const [skillFieldKey, setSkillFieldKey] = useState(0);

  const enteredWeights = skills.filter((s) => s.weight !== "" && s.weight != null);
  const anyWeight = enteredWeights.length > 0;
  const allWeights = skills.length > 0 && enteredWeights.length === skills.length;
  const weightTotal = enteredWeights.reduce((sum, s) => sum + Number(s.weight || 0), 0);
  const weightsValid = !anyWeight || (allWeights && weightTotal === 100);

  const addSkill = (sel: CatalogOption | null) => {
    if (!sel) return;
    setSkills((prev) => (prev.some((s) => s.id === sel.id) ? prev : [...prev, { id: sel.id, name: sel.name, type: "preferred", proficiency: "beginner", weight: "" }]));
    setSkillFieldKey((k) => k + 1);
  };
  const updateSkillField = <K extends "type" | "proficiency" | "weight">(id: string | number, field: K, value: SkillRow[K]) =>
    setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  const removeSkill = (id: string | number) => setSkills((prev) => prev.filter((s) => s.id !== id));

  const enterSkillsEdit = () => {
    setSkillsBackup(skills);
    setSkillsEditMode(true);
  };
  const cancelSkillsEdit = () => {
    setSkills(skillsBackup);
    setSkillsEditMode(false);
    setShowAddSkill(false);
  };
  const saveSkillsEdit = () => {
    if (!weightsValid) {
      toast.error("Weights must be set on every skill and sum to exactly 100 — or left blank on all.");
      return;
    }
    setSkillsEditMode(false);
    setShowAddSkill(false);
  };

  const typeTag = (t: JobSkillType) =>
    t === "core" ? "bg-orange-500/10 text-orange-400" : t === "preferred" ? "bg-neon-yellow/10 text-neon-yellow" : "bg-white/10 text-white/60";

  /* --------------------------- screening logic --------------------------- */
  const categoriesPresent = new Set(questions.map((q) => q.category));

  const addTemplate = (cat: Exclude<QCategory, "custom">) => {
    setQuestions((prev) => {
      if (prev.some((q) => q.category === cat)) return prev;
      const added = TEMPLATE_QUESTIONS[cat].map((q) => ({ ...q, id: uid(), category: cat }));
      return [...prev, ...added];
    });
  };
  const removeCategory = (cat: QCategory) => setQuestions((prev) => prev.filter((q) => q.category !== cat));
  const addCustomQuestion = () =>
    setQuestions((prev) => [...prev, { id: uid(), category: "custom", title: "", type: "yes_no", is_knockout: false, expected_answer: "yes" }]);
  const updateQuestion = (id: string, patch: Partial<ScreeningQ>) => setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  const removeQuestion = (id: string) => setQuestions((prev) => prev.filter((q) => q.id !== id));

  const changeAnswerType = (id: string, type: QAnswerType) => {
    const patch: Partial<ScreeningQ> = { type };
    if (type === "multiple_choice") {
      patch.options = [
        { title: "Option 1", is_correct: true },
        { title: "Option 2", is_correct: false },
      ];
      patch.expected_answer = null;
    } else if (type === "yes_no") {
      patch.expected_answer = "yes";
      patch.options = undefined;
    } else {
      patch.expected_answer = null;
      patch.options = undefined;
    }
    updateQuestion(id, patch);
  };

  const updateOption = (qId: string, idx: number, patch: Partial<SQOption>) =>
    setQuestions((prev) => prev.map((q) => (q.id === qId ? { ...q, options: q.options?.map((o, i) => (i === idx ? { ...o, ...patch } : o)) } : q)));
  const addOption = (qId: string) =>
    setQuestions((prev) => prev.map((q) => (q.id === qId ? { ...q, options: [...(q.options ?? []), { title: `Option ${(q.options?.length ?? 0) + 1}`, is_correct: false }] } : q)));
  const removeOption = (qId: string, idx: number) =>
    setQuestions((prev) => prev.map((q) => (q.id === qId ? { ...q, options: (q.options ?? []).filter((_, i) => i !== idx) } : q)));

  /* ------------------------------- submit -------------------------------- */
  const salaryRangeInvalid = !parseSalaryRange(salaryRange).valid;

  function buildSkillsPayload() {
    const allHaveWeight = skills.length > 0 && skills.every((s) => s.weight !== "" && s.weight != null);
    return skills.map((s) => ({ id: s.id, type: s.type, proficiency: s.proficiency, ...(allHaveWeight && { weight: Number(s.weight) }) }));
  }

  function buildQuestionsPayload() {
    return questions.map((q) => {
      const base: Record<string, unknown> = {
        title: q.title,
        type: q.type,
        category: q.category,
        is_knockout: q.is_knockout,
        weight: 0,
      };
      if (q.type === "multiple_choice") {
        base.options = (q.options ?? []).map((o, i) => ({
          title: o.title,
          value: slug(o.title) || `option_${i + 1}`,
          order: i,
          is_correct: o.is_correct,
        }));
      } else if (q.type === "yes_no" && q.expected_answer) {
        base.expected_answer = q.expected_answer;
      }
      if (q.is_knockout) {
        base.knockout_condition = "equals";
        if (q.type === "yes_no" && q.expected_answer) {
          base.knockout_value = q.expected_answer;
        }
      }
      return base;
    });
  }

  const canGenerate = Boolean(jobTitle && city && (company || companyName.trim()));

  const handleGenerate = async () => {
    if (!jobTitle) return toast.error("Select a job title from the Qelsa catalog.");
    if (!city) return toast.error("Select a location from the Qelsa catalog.");
    if (!company && !companyName.trim()) return toast.error("Select a company page or enter a company name.");

    setGenerating(true);
    try {
      const draft = await generateDraft({
        jobTitleId: String(jobTitle.id) as Id<"job_titles">,
        cityId: String(city.id) as Id<"cities">,
        pageId: company ? (String(company.id) as Id<"pages">) : undefined,
        companyName: company ? undefined : companyName.trim() || undefined,
        existingSkillIds: skills.map((s) => String(s.id) as Id<"skills">),
        notes: aiPrompt.trim() || undefined,
      });
      setWorkType(draft.work_type);
      setWorkplaceType(draft.workplace_type);
      setExperience(draft.experience);
      setSalaryRange(draft.salary_range);
      setDescription(draft.description);
      setSkills(draft.skills.map((s) => ({ id: s.id, name: s.name, type: s.type, proficiency: s.proficiency, weight: "" })));
      setAiGenerated(true);
      if (draft.warnings.length) {
        toast.warning(draft.warnings[0]);
      } else {
        toast.success("AI draft ready — review and edit before publishing.");
      }
    } catch (err) {
      console.error("Job generation failed:", err);
      toastUnknownError(err, "Could not generate a job description. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!jobTitle) return toast.error("Job title is required.");
    if (!company && !companyName.trim()) return toast.error("Company is required — pick one of your pages or type a new company name.");
    if (!description.trim()) return toast.error("Job description is required.");
    if (!weightsValid) return toast.error("Skill weights must be set on all skills and add up to exactly 100 (or left blank on all).");
    if (salaryRangeInvalid) return toast.error("Enter a valid salary range (max ≥ min).");
    const invalidCustom = questions.find((q) => q.category === "custom" && !q.title.trim());
    if (invalidCustom) return toast.error("Every custom question needs a title.");

    const { min: salaryMin, max: salaryMax } = parseSalaryRange(salaryRange);
    const payload = {
      job: {
        job_title: jobTitle,
        description,
        city,
        work_type: workType,
        workplace_type: workplaceType,
        experience,
        salary_min: salaryMin,
        salary_max: salaryMax,
        salary_currency: SALARY_CURRENCY,
        resource: "qelsa",
        // Either an existing page, or a name the backend turns into one.
        page_id: company?.id ?? null,
        page_name: company ? null : companyName.trim(),
      },
      questionSet: { title: `Screening - ${new Date().toISOString()}` },
      questions: buildQuestionsPayload(),
      skills: buildSkillsPayload(),
    };

    try {
      const result = await createJob(payload).unwrap();
      toast.success("Job published successfully.");
      const newId = (result as { id?: number })?.id;
      router.push(newId ? `/jobs/${newId}` : "/jobs/smart_matches");
    } catch (err) {
      console.error("Job creation failed:", err);
      toast.error("Could not publish the job. Please try again.");
    }
  };

  const grouped = CATEGORY_ORDER.filter((c) => categoriesPresent.has(c)).map((c) => ({ category: c, items: questions.filter((q) => q.category === c) }));

  /* -------------------------------- render ------------------------------- */
  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 pb-32 pt-6 text-white md:px-12">
      {/* Breadcrumb */}
      <button onClick={() => router.push("/jobs/smart_matches")} className="mb-6 flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white">
        <ArrowLeft className="size-4" />
        Back to Jobs
      </button>

      <div className="flex flex-col gap-6">
        {/* Locked identity fields + generate */}
        <section className={CARD}>
          <h2 className="mb-6 text-lg font-semibold text-white">Basic information</h2>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
            <Field label="Job Title" required>
              <Autocomplete
                value={jobTitle}
                onChange={setJobTitle}
                onSearch={(q) => searchJobTitles(q)}
                options={jobTitleResults}
                placeholder="e.g., Senior Backend Engineer"
                icon={<Search className="h-4 w-4" />}
                inputClassName={INPUT}
              />
            </Field>
            <Field label="Company" required>
              <Autocomplete
                value={company}
                onChange={(page) => {
                  setCompany(page);
                  setCompanyName(page?.name ?? "");
                }}
                onSearch={(q) => searchMyPages({ search: q })}
                onQueryChange={setCompanyName}
                allowFreeText
                options={companyOptions}
                minChars={0}
                placeholder="Pick one of your pages, or type a new company name"
                icon={<Building2 className="h-4 w-4" />}
                inputClassName={INPUT}
              />
            </Field>
            <Field label="City" required>
              <Autocomplete<City>
                value={city}
                onChange={setCity}
                onSearch={(q) => searchCities(q)}
                options={cityResults}
                placeholder="Search city..."
                icon={<MapPin className="h-4 w-4" />}
                getInputLabel={formatCity}
                renderOption={(c) => formatCity(c)}
                inputClassName={INPUT}
              />
            </Field>
          </div>

          <div className="mt-6 rounded-2xl border border-neon-purple/25 bg-neon-purple/5 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="size-4 text-neon-purple" />
              <h3 className="text-sm font-semibold text-white">Generate with AI</h3>
            </div>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Optional notes — e.g. payments domain, 3–5 years, Node.js & AWS. Title, location, and company stay as selected above."
              className="min-h-24 w-full rounded-xl border border-glass-border bg-white/[0.04] p-3 text-sm text-white placeholder:text-white/45 focus:border-neon-cyan focus:outline-none"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-xs text-white/45">
                <Info className="size-3.5" /> AI will not invent the job title or location.
              </p>
              <button
                onClick={handleGenerate}
                disabled={!canGenerate || generating}
                className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 ${GRADIENT}`}
              >
                <Sparkles className="size-4" /> {generating ? "Generating…" : "Generate with AI"}
              </button>
            </div>
          </div>

          {aiGenerated && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-neon-purple/30 bg-neon-purple/10 px-4 py-3">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-neon-purple" />
              <div>
                <p className="text-sm font-semibold text-white">AI-generated job details</p>
                <p className="mt-1 text-xs leading-relaxed text-white/70">
                  Review and edit anything before publishing. Job title, location, and company came from Qelsa and were not changed.
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
            <Field label="Work Type" required>
              <SelectInput value={workType} onChange={setWorkType}>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </SelectInput>
            </Field>
            <Field label="Workplace Type" required>
              <SelectInput value={workplaceType} onChange={setWorkplaceType}>
                <option value="on-site">On-site</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
              </SelectInput>
            </Field>
            <Field label="Experience">
              <SelectInput value={String(experience)} onChange={(v) => setExperience(Number(v))}>
                <option value="0">Fresher (0 years)</option>
                {[1, 2, 3, 5, 7, 10, 12, 15].map((y) => (
                  <option key={y} value={String(y)}>
                    {y}+ years
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Salary Range" hint={salaryRangeInvalid ? undefined : formatSalaryRange(salaryRange) ?? undefined} error={salaryRangeInvalid ? "Enter a range like “5L - 8L”, “80k - 120k” or “500000 - 800000”." : undefined}>
              <input value={salaryRange} onChange={(e) => setSalaryRange(e.target.value)} placeholder="e.g., 5L - 8L" className={INPUT} />
            </Field>
          </div>
        </section>

        {/* Job description */}
        <section className={CARD}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Job description</h2>
            <button onClick={() => toast.info("AI improve is coming soon.")} className="flex items-center gap-1.5 rounded-full border border-neon-purple/30 px-3 py-1.5 text-xs font-semibold text-neon-purple transition-colors hover:bg-neon-purple/10">
              <Wand2 className="size-3.5" /> AI Improve
            </button>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the role, responsibilities, and what makes this position unique..."
            className="min-h-44 w-full rounded-xl border border-glass-border bg-white/[0.04] p-4 text-sm leading-relaxed text-white placeholder:text-white/45 focus:border-neon-cyan focus:outline-none"
          />
          {description && description.length < 100 && (
            <p className="mt-2 flex items-center gap-1 text-xs text-neon-yellow">
              <AlertCircle className="size-3" /> Add more details (min 100 characters for better reach)
            </p>
          )}
        </section>

        {/* What this role uses daily */}
        <section className={CARD}>
          <h2 className="mb-4 text-lg font-semibold text-white">What this role uses daily</h2>
          {skills.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s.id} className="inline-flex items-center gap-1.5 rounded-full border border-neon-cyan/20 bg-neon-cyan/10 px-3 py-1.5 text-xs font-medium text-neon-cyan">
                  {s.name}
                  <button onClick={() => removeSkill(s.id)} aria-label={`Remove ${s.name}`} className="text-neon-cyan/60 hover:text-neon-cyan">
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <Autocomplete
            key={skillFieldKey}
            value={null}
            onChange={(sel) => addSkill(sel)}
            onSearch={(q) => searchSkills(q || undefined)}
            options={skillResults}
            placeholder="Add an extra skill and press Enter..."
            icon={<Search className="h-4 w-4" />}
            inputClassName={INPUT}
          />
        </section>

        {/* Competency framework */}
        <section className={CARD}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Competency framework</h2>
            {!skillsEditMode ? (
              <button onClick={enterSkillsEdit} className="flex items-center gap-1 text-sm font-semibold text-neon-cyan hover:opacity-80">
                <Edit2 className="size-4" /> Edit
              </button>
            ) : (
              <button onClick={cancelSkillsEdit} className="text-sm font-medium text-white/60 hover:text-white">
                Cancel
              </button>
            )}
          </div>

          <div className="mb-4 flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2.5">
            <Info className="size-4 shrink-0 text-blue-400" />
            <span className="text-xs text-blue-200">Candidates see match scores only — not this framework.</span>
          </div>

          {skills.length === 0 ? (
            <p className="text-sm text-white/45">No competencies yet. Add skills above or use Edit → Add skill.</p>
          ) : !skillsEditMode ? (
            /* view */
            <div>
              <div className="grid grid-cols-12 border-b border-glass-border pb-2 text-[10px] font-medium uppercase tracking-wide text-white/45">
                <span className="col-span-7">Skill</span>
                <span className="col-span-3">Proficiency</span>
                <span className="col-span-2">Type</span>
              </div>
              {skills.map((s) => (
                <div key={s.id} className="grid grid-cols-12 items-center border-b border-glass-border py-3 last:border-0">
                  <span className="col-span-7 text-sm text-white">{s.name}</span>
                  <span className="col-span-3 text-sm text-white/70">{proficiencyLabel(s.proficiency)}</span>
                  <span className="col-span-2">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${typeTag(s.type)}`}>{jobSkillTypeLabel(s.type)}</span>
                  </span>
                </div>
              ))}
              <div className="pt-3 text-xs text-white/45">
                {skills.length} competenc{skills.length === 1 ? "y" : "ies"}
                {anyWeight && <span className={weightsValid ? " text-neon-green" : " text-red-400"}> · Total {weightTotal}/100</span>}
              </div>
            </div>
          ) : (
            /* edit */
            <div>
              <div className="hidden grid-cols-12 gap-2 px-1 pb-2 text-[10px] font-medium uppercase tracking-wide text-white/45 md:grid">
                <span className="col-span-5 pl-6">Skill</span>
                <span className="col-span-3">Proficiency</span>
                <span className="col-span-2">Type</span>
                <span className="col-span-2">Weight</span>
              </div>
              <div className="flex flex-col gap-2">
                {skills.map((s) => (
                  <div key={s.id} className="grid grid-cols-12 items-center gap-2">
                    <div className="col-span-12 flex items-center gap-2 md:col-span-5">
                      <GripVertical className="size-4 shrink-0 text-white/30" />
                      <span className="truncate rounded-lg border border-glass-border bg-white/[0.04] px-3 py-2 text-sm text-white">{s.name}</span>
                    </div>
                    <select
                      value={s.proficiency}
                      onChange={(e) => updateSkillField(s.id, "proficiency", e.target.value as ProficiencyLevel)}
                      className="col-span-6 rounded-lg border border-glass-border bg-white/[0.04] px-2 py-2 text-sm text-white focus:border-neon-cyan focus:outline-none md:col-span-3"
                    >
                      {PROFICIENCY_LEVELS.map((p) => (
                        <option key={p.value} value={p.value} className="bg-[#0d0d1a]">
                          {p.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={s.type}
                      onChange={(e) => updateSkillField(s.id, "type", e.target.value as JobSkillType)}
                      className="col-span-4 rounded-lg border border-glass-border bg-white/[0.04] px-2 py-2 text-sm text-white focus:border-neon-cyan focus:outline-none md:col-span-2"
                    >
                      {JOB_SKILL_TYPES.map((t) => (
                        <option key={t.value} value={t.value} className="bg-[#0d0d1a]">
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <div className="relative col-span-6 md:col-span-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={s.weight}
                        onChange={(e) => updateSkillField(s.id, "weight", e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full rounded-lg border border-glass-border bg-white/[0.04] px-2 py-2 pr-5 text-sm text-white focus:border-neon-cyan focus:outline-none"
                      />
                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white/45">%</span>
                    </div>
                    <button onClick={() => removeSkill(s.id)} aria-label="Remove skill" className="col-span-2 justify-self-end text-white/40 hover:text-red-400 md:col-span-1">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>

              {showAddSkill && (
                <div className="mt-3">
                  <Autocomplete
                    value={null}
                    onChange={(sel) => {
                      addSkill(sel);
                      setShowAddSkill(false);
                    }}
                    onSearch={(q) => searchSkills(q || undefined)}
                    options={skillResults}
                    placeholder="Search a skill to add..."
                    icon={<Search className="h-4 w-4" />}
                    inputClassName={INPUT}
                  />
                </div>
              )}
              {anyWeight && !weightsValid && <p className="mt-3 text-xs text-red-400">Weights must be filled on every skill and sum to exactly 100 — or left blank on all.</p>}

              <div className="mt-4 flex items-center justify-between border-t border-glass-border pt-3">
                <span className="text-xs text-white/45">
                  {skills.length} competenc{skills.length === 1 ? "y" : "ies"}
                  {anyWeight && <span className={weightsValid ? " text-neon-green" : " text-red-400"}> · Total {weightTotal}/100</span>}
                </span>
                <div className="flex items-center gap-4">
                  <button onClick={() => setShowAddSkill((v) => !v)} className="flex items-center gap-1 text-sm font-semibold text-neon-cyan hover:opacity-80">
                    <Plus className="size-4" /> Add skill
                  </button>
                  <button onClick={saveSkillsEdit} className="text-sm font-semibold text-neon-cyan hover:opacity-80">
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Screening questions */}
        <section className={CARD}>
          <div className="mb-1 flex items-center gap-2">
            <ClipboardList className="size-5 text-neon-cyan" />
            <h2 className="text-lg font-semibold text-white">Screening questions</h2>
          </div>
          <p className="mb-5 text-sm text-white/45">Pre-screen candidates with smart questions</p>

          {/* Template cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {TEMPLATE_ORDER.map((cat) => {
              const meta = CATEGORY_META[cat];
              const added = categoriesPresent.has(cat);
              return (
                <div key={cat} className="flex flex-col gap-2 rounded-2xl border border-glass-border bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${meta.badge}`}>{meta.tag}</span>
                    <button
                      onClick={() => (added ? removeCategory(cat) : addTemplate(cat))}
                      aria-label={added ? "Remove" : "Add"}
                      className={`flex size-6 items-center justify-center rounded-full transition-colors ${added ? "bg-neon-cyan text-[#06060f]" : "border border-glass-border text-white/70 hover:border-neon-cyan/40 hover:text-white"}`}
                    >
                      {added ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-white">{meta.title}</p>
                  <p className="text-xs text-white/45">{meta.description}</p>
                  <p className="mt-1 text-xs text-white/45">{TEMPLATE_QUESTIONS[cat].length} questions</p>
                </div>
              );
            })}
          </div>

          {/* Grouped questions */}
          {grouped.map(({ category, items }) => {
            const meta = CATEGORY_META[category];
            return (
              <div key={category} className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${meta.badge}`}>{meta.tag}</span>
                    <span className="text-sm font-semibold text-white">{meta.title}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-white/45">{items.length} question{items.length === 1 ? "" : "s"} added</span>
                    <button onClick={() => removeCategory(category)} className="font-semibold text-red-400 hover:opacity-80">
                      Remove
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  {items.map((q, i) => (
                    <QuestionCard
                      key={q.id}
                      index={i}
                      q={q}
                      onChangeTitle={(t) => updateQuestion(q.id, { title: t })}
                      onChangeType={(t) => changeAnswerType(q.id, t)}
                      onChangeExpected={(v) => updateQuestion(q.id, { expected_answer: v })}
                      onToggleKnockout={(v) => updateQuestion(q.id, { is_knockout: v })}
                      onDelete={() => removeQuestion(q.id)}
                      onOptionChange={(idx, patch) => updateOption(q.id, idx, patch)}
                      onOptionAdd={() => addOption(q.id)}
                      onOptionRemove={(idx) => removeOption(q.id, idx)}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          <button onClick={addCustomQuestion} className="mt-6 flex items-center gap-2 rounded-full border border-glass-border px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-neon-cyan/40">
            <Plus className="size-4" /> Add Custom Question
          </button>
        </section>

        {/* Internal Only (static) */}
        <section className={CARD}>
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Lock className="size-5 text-neon-cyan" />
                <h2 className="text-lg font-semibold text-white">Internal Only (Private)</h2>
              </div>
              <p className="text-sm text-white/45">This information is visible only to you and designated approvers</p>
            </div>
            <span className="shrink-0 rounded-full bg-neon-purple/10 px-3 py-1.5 text-xs font-semibold text-neon-purple">Confidential</span>
          </div>
          <div className="flex flex-col gap-6">
            <div>
              <label className="mb-2 block text-[13px] text-white/70">Target Budget / Salary Ceiling (Optional)</label>
              <input value={targetBudget} onChange={(e) => setTargetBudget(e.target.value)} placeholder="e.g., 150,000" className={`${INPUT} max-w-[220px]`} />
              <p className="mt-2 text-xs text-white/40">This budget is never shown to candidates and won&apos;t appear in the public job posting</p>
            </div>
            <div>
              <label className="mb-2 block text-[13px] text-white/70">Invite Approvers (Optional)</label>
              <div className="flex max-w-md items-center gap-2 rounded-xl border border-glass-border bg-white/[0.04] px-4 py-2.5">
                <Search className="size-4 shrink-0 text-white/45" />
                <input placeholder="Search for team members to approve this job..." className="w-full bg-transparent text-sm text-white placeholder:text-white/45 focus:outline-none" />
              </div>
              <p className="mt-2 text-xs text-white/40">Selected approvers will receive an email notification to review and approve this job post</p>
            </div>
          </div>
        </section>

        {/* Preview bar (static) */}
        <div className="flex items-center justify-between rounded-[20px] border border-glass-border bg-white/[0.06] px-5 py-4">
          <span className="flex items-center gap-2 text-sm text-white/80">
            <Eye className="size-5" /> Preview: What candidates will see
          </span>
          <button onClick={() => toast.info("Live preview is coming soon.")} className="flex items-center gap-1.5 text-sm font-semibold text-neon-cyan hover:opacity-80">
            Live Preview <ExternalLink className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-glass-border bg-[#06060f]/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4 md:px-12">
          <button onClick={() => toast.info("Draft saving is coming soon.")} className="rounded-full border border-white/20 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/5">
            Save draft
          </button>
          <button
            onClick={handlePublish}
            disabled={isLoading}
            className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 ${GRADIENT}`}
          >
            <Send className="size-4" /> {isLoading ? "Publishing..." : "Publish job"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ sub-components ----------------------------- */

function Field({ label, required, hint, error, children }: { label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[13px] text-white/70">
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      {children}
      {error ? <p className="text-xs text-red-400">{error}</p> : hint ? <p className="text-xs text-white/45">{hint}</p> : null}
    </div>
  );
}

function SelectInput({ value, onChange, children, placeholder }: { value: string; onChange: (v: string) => void; children: React.ReactNode; placeholder?: string }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT} cursor-pointer appearance-none pr-10 ${value ? "" : "text-white/45"}`}
      >
        {placeholder && (
          <option value="" disabled className="bg-[#0d0d1a] text-white/45">
            {placeholder}
          </option>
        )}
        <>{children}</>
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/45" />
    </div>
  );
}

interface QuestionCardProps {
  index: number;
  q: ScreeningQ;
  onChangeTitle: (t: string) => void;
  onChangeType: (t: QAnswerType) => void;
  onChangeExpected: (v: string) => void;
  onToggleKnockout: (v: boolean) => void;
  onDelete: () => void;
  onOptionChange: (idx: number, patch: Partial<SQOption>) => void;
  onOptionAdd: () => void;
  onOptionRemove: (idx: number) => void;
}

function QuestionCard({ index, q, onChangeTitle, onChangeType, onChangeExpected, onToggleKnockout, onDelete, onOptionChange, onOptionAdd, onOptionRemove }: QuestionCardProps) {
  const isCustom = q.category === "custom";
  const selectCls = `${INPUT} h-9 cursor-pointer appearance-none pr-9`;
  return (
    <div className="rounded-2xl border border-glass-border bg-white/[0.03] p-3">
      {/* top row */}
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-[11px] font-bold text-white">Q{index + 1}</span>
        {isCustom ? (
          <input
            value={q.title}
            onChange={(e) => onChangeTitle(e.target.value)}
            placeholder="Type your question..."
            className="min-w-0 flex-1 rounded-lg border border-glass-border bg-white/[0.04] px-3 py-1.5 text-sm text-white placeholder:text-white/45 focus:border-neon-cyan focus:outline-none"
          />
        ) : (
          <p className="min-w-0 flex-1 text-sm text-white">{q.title}</p>
        )}
        {q.is_knockout && (
          <span className="flex shrink-0 items-center gap-1 rounded-md bg-red-500/10 px-2 py-1 text-[11px] font-semibold text-red-400">
            <AlertCircle className="size-3.5" /> Knockout
          </span>
        )}
        <button onClick={onDelete} aria-label="Delete question" className="shrink-0 text-white/40 hover:text-red-400">
          <Trash2 className="size-4" />
        </button>
      </div>

      {/* config row */}
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div className="min-w-[180px] flex-1">
          <label className="mb-1 block text-xs text-white/45">Answer type</label>
          <div className="relative">
            <select value={q.type} onChange={(e) => onChangeType(e.target.value as QAnswerType)} className={selectCls}>
              <option value="yes_no" className="bg-[#0d0d1a]">Yes / No</option>
              <option value="multiple_choice" className="bg-[#0d0d1a]">Multiple choice</option>
              <option value="short_text" className="bg-[#0d0d1a]">Short text</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/45" />
          </div>
        </div>

        {q.type === "yes_no" && (
          <div className="min-w-[180px] flex-1">
            <label className="mb-1 block text-xs text-white/45">Expected answer</label>
            <div className="relative">
              <select value={q.expected_answer ?? "yes"} onChange={(e) => onChangeExpected(e.target.value)} className={selectCls}>
                <option value="yes" className="bg-[#0d0d1a]">Yes</option>
                <option value="no" className="bg-[#0d0d1a]">No</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/45" />
            </div>
          </div>
        )}

        <div className="w-[160px]">
          <label className="mb-1 block text-xs text-white/45">Knockout</label>
          <Toggle on={q.is_knockout} onChange={onToggleKnockout} />
        </div>
      </div>

      {/* MC options */}
      {q.type === "multiple_choice" && (
        <div className="mt-3">
          <p className="mb-2 text-xs text-white/45">Select acceptable answers — candidates who choose other options will be auto-rejected</p>
          <div className="flex flex-col gap-2">
            {(q.options ?? []).map((o, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <button
                  onClick={() => onOptionChange(idx, { is_correct: !o.is_correct })}
                  aria-label={o.is_correct ? "Acceptable" : "Not acceptable"}
                  className={`flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors ${o.is_correct ? "border-neon-cyan bg-neon-cyan text-[#06060f]" : "border-glass-border bg-white/[0.04]"}`}
                >
                  {o.is_correct && <Check className="size-3.5" />}
                </button>
                <input
                  value={o.title}
                  onChange={(e) => onOptionChange(idx, { title: e.target.value })}
                  className="min-w-0 flex-1 rounded-lg border border-glass-border bg-white/[0.04] px-3 py-1.5 text-sm text-white focus:border-neon-cyan focus:outline-none"
                />
                <button onClick={() => onOptionRemove(idx)} aria-label="Remove option" className="shrink-0 text-white/40 hover:text-red-400">
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
          <button onClick={onOptionAdd} className="mt-2 text-sm font-semibold text-neon-cyan hover:opacity-80">
            + Add option
          </button>
        </div>
      )}

      {q.is_knockout && q.type !== "multiple_choice" && <p className="mt-3 text-xs text-white/40">Auto-reject if answer doesn&apos;t match</p>}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`flex h-9 w-full items-center justify-between rounded-xl border px-3 transition-colors ${on ? "border-neon-cyan/40 bg-neon-cyan/10" : "border-glass-border bg-white/[0.04]"}`}
    >
      <span className={`text-sm font-medium ${on ? "text-neon-cyan" : "text-white/60"}`}>{on ? "On" : "Off"}</span>
      <span className={`relative h-5 w-9 rounded-full transition-colors ${on ? "bg-neon-cyan" : "bg-white/20"}`}>
        <span className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

export default JobPostingPage;
