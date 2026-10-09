"use client";

import { useAuth } from "@/contexts/AuthContext";
import {
  useExtractCareerGoalAction,
  useGetMyCareerGoalQuery,
  useLazySearchIndustriesQuery,
  useUpsertCareerGoalMutation,
} from "@/features/api/careerGoalsApi";
import { useGetExperiencesQuery } from "@/features/api/experiencesApi";
import { useLazySearchJobTitlesQuery } from "@/features/api/jobTitlesApi";
import { useGetUserSkillsQuery, useLazySearchSkillsQuery } from "@/features/api/userSkillsApi";
import {
  GOAL_EXPERIENCE_OPTIONS,
  GOAL_TIMELINE_OPTIONS,
  STANDARD_INDUSTRIES,
  parseCareerGoalText,
} from "@/lib/careerGoal";
import { toastUnknownError } from "@/lib/errors";
import type {
  CareerGoal,
  CareerGoalExperienceLevel,
  CareerGoalTimeline,
} from "@/types/careerGoal";
import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { GoalTagField } from "./GoalTagField";

type GoalForm = {
  description: string;
  target_roles: string[];
  skills: string[];
  industries: string[];
  timeline?: CareerGoalTimeline;
  experience_level?: CareerGoalExperienceLevel;
};

const EMPTY_FORM: GoalForm = {
  description: "",
  target_roles: [],
  skills: [],
  industries: [],
};

function formFromSaved(goal: CareerGoal | null | undefined): GoalForm {
  if (!goal) return EMPTY_FORM;
  const roles =
    goal.target_roles && goal.target_roles.length > 0
      ? goal.target_roles
      : goal.target_role
        ? [goal.target_role]
        : [];
  return {
    description: goal.description ?? "",
    target_roles: roles,
    skills: goal.skills ?? [],
    industries: goal.industries ?? [],
    timeline: goal.timeline,
    experience_level: goal.experience_level,
  };
}

export function GoalSettingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: savedGoal, isLoading: goalLoading } = useGetMyCareerGoalQuery({
    skip: !isAuthenticated,
  });
  const { data: userSkillsData } = useGetUserSkillsQuery(undefined, { skip: !isAuthenticated });
  const { data: userExperiencesData } = useGetExperiencesQuery(undefined, { skip: !isAuthenticated });
  const [upsertGoal, { isLoading: saving }] = useUpsertCareerGoalMutation();
  const extractGoalAction = useExtractCareerGoalAction();

  // Catalog searches
  const [searchJobTitles, { data: titleResults = [] }] = useLazySearchJobTitlesQuery();
  const [searchSkills, { data: skillResults = [] }] = useLazySearchSkillsQuery();
  const [searchIndustries, { data: industryResults = [] }] = useLazySearchIndustriesQuery();

  const profileContext = useMemo(() => {
    const existingSkills: string[] = [];
    if (Array.isArray(userSkillsData)) {
      for (const item of userSkillsData) {
        const name = (item as { skill?: { name?: string }; name?: string })?.skill?.name || (item as { name?: string })?.name;
        if (name && typeof name === "string") existingSkills.push(name);
      }
    }
    const currentTitles: string[] = [];
    if (user?.headline) currentTitles.push(user.headline);
    if (Array.isArray(userExperiencesData)) {
      for (const item of userExperiencesData) {
        const title = (item as { job_title?: { name?: string }; title?: string })?.job_title?.name || (item as { title?: string })?.title;
        if (title && typeof title === "string") currentTitles.push(title);
      }
    }
    return { currentTitles, existingSkills };
  }, [userSkillsData, userExperiencesData, user?.headline]);

  const [form, setForm] = useState<GoalForm>(EMPTY_FORM);
  const [hydrated, setHydrated] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Hydrate from saved goal or draft
  useEffect(() => {
    if (authLoading || (isAuthenticated && goalLoading) || hydrated) return;
    if (savedGoal) {
      const initial = formFromSaved(savedGoal);
      setForm(initial);
      if (initial.target_roles.length > 0 || initial.skills.length > 0) {
        setIsGenerated(true);
      }
      setHydrated(true);
      return;
    }
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("qelsa_career_goal_draft");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            setForm((cur) => ({ ...cur, ...parsed }));
            if (parsed.target_roles?.length > 0 || parsed.skills?.length > 0) {
              setIsGenerated(true);
            }
            setHydrated(true);
            return;
          }
        }
      } catch {}
    }
    setForm(EMPTY_FORM);
    setHydrated(true);
  }, [authLoading, isAuthenticated, goalLoading, savedGoal, hydrated]);

  const patch = (partial: Partial<GoalForm>) =>
    setForm((current) => ({ ...current, ...partial }));

  const handleGenerate = async () => {
    const text = form.description.trim();
    if (!text) {
      toast.error("Please describe your career goal first");
      return;
    }

    setIsGenerating(true);
    // Instant deterministic parse for zero-latency preview
    const rules = parseCareerGoalText(text, profileContext);

    try {
      const result = await extractGoalAction({ description: text });
      setForm((cur) => ({
        ...cur,
        target_roles:
          result.target_roles && result.target_roles.length > 0
            ? result.target_roles
            : rules.target_roles.length > 0
              ? rules.target_roles
              : cur.target_roles,
        skills:
          result.skills && result.skills.length > 0
            ? result.skills
            : rules.skills.length > 0
              ? rules.skills
              : cur.skills,
        industries:
          result.industries && result.industries.length > 0
            ? result.industries
            : rules.industries.length > 0
              ? rules.industries
              : cur.industries,
        timeline: result.timeline ?? rules.timeline ?? cur.timeline,
        experience_level:
          result.experience_level ?? rules.experience_level ?? cur.experience_level,
      }));
      setIsGenerated(true);
    } catch (err) {
      // Fall back to rule extraction if action fails
      setForm((cur) => ({
        ...cur,
        target_roles: rules.target_roles.length > 0 ? rules.target_roles : cur.target_roles,
        skills: rules.skills.length > 0 ? rules.skills : cur.skills,
        industries: rules.industries.length > 0 ? rules.industries : cur.industries,
        timeline: rules.timeline ?? cur.timeline,
        experience_level: rules.experience_level ?? cur.experience_level,
      }));
      setIsGenerated(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setIsGenerated(false);
  };

  const handleCancel = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/jobs/smart-matches");
    }
  };

  const handleSave = async () => {
    if (form.target_roles.length === 0) {
      toast.error("Please specify at least one role you should aim for");
      return;
    }

    if (!isAuthenticated) {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("qelsa_career_goal_draft", JSON.stringify(form));
        } catch {}
      }
      toast.info("Please sign in to save your career goal");
      router.push("/auth?returnUrl=" + encodeURIComponent("/goals"));
      return;
    }

    try {
      await upsertGoal({
        description: form.description.trim() || undefined,
        target_role: form.target_roles[0],
        target_roles: form.target_roles,
        skills: form.skills,
        industries: form.industries,
        timeline: form.timeline,
        experience_level: form.experience_level,
      }).unwrap();

      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("qelsa_career_goal_draft");
        } catch {}
      }
      toast.success(savedGoal ? "Career goal updated" : "Career goal created");
      router.push("/jobs/smart-matches");
    } catch (error) {
      toastUnknownError(error, "Could not save your career goal. Please try again.");
    }
  };

  // Autocomplete lists
  const titleNames = useMemo(
    () =>
      (titleResults as Array<{ name?: string }>)
        .map((r) => r.name)
        .filter((n): n is string => Boolean(n)),
    [titleResults],
  );

  const skillNames = useMemo(
    () =>
      (skillResults as Array<{ name?: string }>)
        .map((r) => r.name)
        .filter((n): n is string => Boolean(n)),
    [skillResults],
  );

  const industryNames = useMemo(() => {
    const fromApi = (industryResults as string[]) || [];
    return Array.from(new Set([...fromApi, ...STANDARD_INDUSTRIES]));
  }, [industryResults]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 text-white">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Where do you want your career to go?
        </h1>
        <p className="mt-2 text-sm text-white/50 sm:text-base">
          Tell Qelsa where you want to go. We&apos;ll turn your vision into a personalized
          career goal.
        </p>
      </div>

      {/* Main Container */}
      <div className="mt-8 flex flex-col gap-6">
        {/* Describe in your own words */}
        <div className="flex flex-col gap-2.5">
          <label className="flex items-center gap-1.5 text-sm font-semibold text-neon-cyan">
            <span className="text-neon-cyan">✦</span>
            Describe your goal in your own words
          </label>
          <textarea
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder="e.g. I want to grow my career, develop my skills, and find opportunities that are right for me...."
            rows={5}
            className="w-full resize-none rounded-2xl border border-white/10 bg-[#090B16] p-4 text-sm sm:text-base text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none transition-colors"
          />
        </div>

        {/* Qelsa will figure out the rest */}
        <div className="rounded-2xl border border-white/10 bg-[#090B16]/50 p-4 sm:p-5">
          <h4 className="text-sm font-semibold text-neon-cyan">
            Qelsa will figure out the rest
          </h4>
          <p className="mt-1 text-xs sm:text-sm text-white/60">
            From your description, Qelsa will identify your target role, skills, industry,
            career level and timeline.
          </p>
        </div>

        {/* Action Button: Create vs Reset */}
        <div>
          {!isGenerated ? (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !form.description.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#db2777] px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating career goal…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Create my career goal
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full border border-white/20 bg-transparent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/5"
            >
              Reset goal
            </button>
          )}

          <p className="mt-3 text-xs text-white/40">
            Don&apos;t worry about getting it perfect. Just describe what you want in your
            own words.
          </p>
        </div>

        {/* Generated Structured Fields */}
        {isGenerated && (
          <div className="mt-4 flex flex-col gap-6">
            {/* Divider */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <span className="relative bg-[#050814] px-4 text-xs font-medium text-white/40">
                Qelsa suggested
              </span>
            </div>

            {/* Field 1: Target Roles */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white/90">
                What roles you should aim for? <span className="text-white/40">*</span>
              </label>
              <GoalTagField
                values={form.target_roles}
                onChange={(target_roles) => patch({ target_roles })}
                placeholder="Add a role..."
                suggestions={titleNames}
                onSearch={(q) => searchJobTitles(q)}
                max={6}
              />
            </div>

            {/* Field 2: Target Skills */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white/90">
                What skills you should build?
              </label>
              <GoalTagField
                values={form.skills}
                onChange={(skills) => patch({ skills })}
                placeholder="Add a skill..."
                suggestions={skillNames}
                onSearch={(q) => searchSkills(q)}
                max={12}
              />
            </div>

            {/* Field 3: Target Industries */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white/90">
                Industries you&apos;re interested in (optional)
              </label>
              <GoalTagField
                values={form.industries}
                onChange={(industries) => patch({ industries })}
                placeholder="Add an industry..."
                suggestions={industryNames}
                onSearch={(q) => searchIndustries(q)}
                max={6}
              />
            </div>

            {/* Field 4: Timeline */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white/90">
                What is your timeline?
              </label>
              <div className="flex flex-wrap gap-2.5">
                {GOAL_TIMELINE_OPTIONS.map((option) => {
                  const selected = form.timeline === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        patch({ timeline: selected ? undefined : option.value })
                      }
                      className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                        selected
                          ? "border border-neon-cyan bg-neon-cyan/10 text-neon-cyan"
                          : "border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Field 5: Target Seniority */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white/90">
                Target seniority
              </label>
              <div className="flex flex-wrap gap-2.5">
                {GOAL_EXPERIENCE_OPTIONS.map((option) => {
                  const selected = form.experience_level === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        patch({
                          experience_level: selected ? undefined : option.value,
                        })
                      }
                      className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                        selected
                          ? "border border-neon-cyan bg-neon-cyan/10 text-neon-cyan"
                          : "border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="rounded-full border border-white/20 bg-transparent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || form.target_roles.length === 0}
                className="rounded-full bg-gradient-to-r from-[#7c3aed] to-[#db2777] px-8 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Updating…" : savedGoal ? "Update" : "Save goal"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
