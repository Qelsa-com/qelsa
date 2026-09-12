"use client";

import { GhostButton, GradientButton } from "@/components/profile/modals/ModalShell";
import { ChoiceChip, Field, inputClass } from "@/components/profile/modals/fields";
import { useExtractCareerGoalAction, useGetMyCareerGoalQuery, useUpsertCareerGoalMutation } from "@/features/api/careerGoalsApi";
import { useLazySearchCompaniesQuery } from "@/features/api/companiesApi";
import { useLazySearchSkillsQuery } from "@/features/api/userSkillsApi";
import { GOAL_EXPERIENCE_OPTIONS, GOAL_FOCUS_OPTIONS, GOAL_TIMELINE_OPTIONS, descriptionFingerprint, parseCareerGoalText } from "@/lib/careerGoal";
import { toastUnknownError } from "@/lib/errors";
import type { CareerGoal, CareerGoalExperienceLevel, CareerGoalFocus, CareerGoalTimeline, ExtractedCareerGoal } from "@/types/careerGoal";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { GoalTagField } from "./GoalTagField";

type GoalForm = {
  description: string;
  target_role: string;
  dream_companies: string[];
  timeline?: CareerGoalTimeline;
  experience_level?: CareerGoalExperienceLevel;
  skills: string[];
  primary_focus?: CareerGoalFocus;
};

const EMPTY_FORM: GoalForm = {
  description: "",
  target_role: "",
  dream_companies: [],
  skills: [],
};

function formFromGoal(goal: CareerGoal | null | undefined): GoalForm {
  if (!goal) return EMPTY_FORM;
  return {
    description: goal.description ?? "",
    target_role: goal.target_role ?? "",
    dream_companies: goal.dream_companies ?? [],
    timeline: goal.timeline,
    experience_level: goal.experience_level,
    skills: goal.skills ?? [],
    primary_focus: goal.primary_focus,
  };
}

function applyExtract(current: GoalForm, extracted: ExtractedCareerGoal, overwriteEmptyOnly: boolean): GoalForm {
  const take = <T,>(existing: T | undefined, next: T | null | undefined, isEmpty: (value: T | undefined) => boolean) => {
    if (next == null) return existing;
    if (!overwriteEmptyOnly) return next;
    return isEmpty(existing) ? next : existing;
  };
  return {
    ...current,
    target_role: take(current.target_role, extracted.target_role, (value) => !value?.trim()) ?? "",
    dream_companies: take(current.dream_companies, extracted.dream_companies, (value) => !value?.length) ?? current.dream_companies,
    timeline: take(current.timeline, extracted.timeline, (value) => !value),
    experience_level: take(current.experience_level, extracted.experience_level, (value) => !value),
    skills: take(current.skills, extracted.skills, (value) => !value?.length) ?? current.skills,
    primary_focus: take(current.primary_focus, extracted.primary_focus, (value) => !value),
  };
}

export function GoalSettingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: savedGoal, isLoading: goalLoading } = useGetMyCareerGoalQuery({ skip: !isAuthenticated });
  const [upsertGoal, { isLoading: saving }] = useUpsertCareerGoalMutation();
  const extractGoal = useExtractCareerGoalAction();
  const extractGoalRef = useRef(extractGoal);
  extractGoalRef.current = extractGoal;
  const [searchCompanies, { data: companyResults = [] }] = useLazySearchCompaniesQuery();
  const [searchSkills, { data: skillResults = [] }] = useLazySearchSkillsQuery();

  const [form, setForm] = useState<GoalForm>(EMPTY_FORM);
  const [hydrated, setHydrated] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const lastFingerprint = useRef("");

  useEffect(() => {
    if (authLoading || (isAuthenticated && goalLoading) || hydrated) return;
    if (savedGoal) {
      setForm(formFromGoal(savedGoal));
      setHydrated(true);
      return;
    }
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("qelsa_career_goal_draft");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            setForm((current) => ({ ...current, ...parsed }));
            setHydrated(true);
            return;
          }
        }
      } catch {}
    }
    setForm(EMPTY_FORM);
    setHydrated(true);
  }, [authLoading, isAuthenticated, goalLoading, savedGoal, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const description = form.description.trim();
    if (description.length < 24) return;
    const fingerprint = descriptionFingerprint(description);
    if (fingerprint === lastFingerprint.current) return;

    const timer = setTimeout(() => {
      const rules = parseCareerGoalText(description);
      setForm((current) => applyExtract(current, rules, true));
      lastFingerprint.current = fingerprint;
      setExtracting(true);
      void extractGoalRef.current({ description })
        .then((extracted) => {
          setForm((current) => applyExtract(current, extracted, true));
        })
        .catch(() => undefined)
        .finally(() => setExtracting(false));
    }, 1200);

    return () => clearTimeout(timer);
  }, [form.description, hydrated]);

  const patch = (partial: Partial<GoalForm>) => setForm((current) => ({ ...current, ...partial }));

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/profile");
  };

  const handleSave = async () => {
    const target_role = form.target_role.trim();
    if (!target_role) {
      toast.error("What role are you aiming for is required");
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
        target_role,
        dream_companies: form.dream_companies,
        timeline: form.timeline,
        experience_level: form.experience_level,
        skills: form.skills,
        primary_focus: form.primary_focus,
      }).unwrap();
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("qelsa_career_goal_draft");
        } catch {}
      }
      toast.success(savedGoal ? "Goal updated" : "Goal set");
      goBack();
    } catch (error) {
      toastUnknownError(error, "Could not save your career goal. Please try again.");
    }
  };

  const companyNames = (companyResults as Array<{ name?: string }>).map((row) => row.name).filter((name): name is string => Boolean(name));
  const skillNames = (skillResults as Array<{ name?: string }>).map((row) => row.name).filter((name): name is string => Boolean(name));

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-8 text-white sm:px-6 md:px-12">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Set Your Career Goal</h1>
      <p className="mt-2 text-sm text-white/50 sm:text-base">Define where you want to be - Qelsa will help you get there.</p>

      <div className="mt-8 flex flex-col gap-7">
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-1.5 text-[13px] font-medium text-neon-cyan">
            <Sparkles className="size-3.5" />
            Describe your goal in your own words
          </label>
          <textarea
            value={form.description}
            onChange={(event) => patch({ description: event.target.value })}
            placeholder="e.g. I'm a student looking for job opportunities in engineering."
            rows={4}
            className={`${inputClass} resize-none`}
          />
          <p className="text-xs text-white/40">
            {extracting ? "Qelsa AI is extracting your goal details…" : "Qelsa AI will extract your goal details automatically."}
          </p>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.14em] text-white/35 uppercase">
          <span className="h-px flex-1 bg-white/10" />
          or fill in manually
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <Field label="What role are you aiming for?" required>
          <input value={form.target_role} onChange={(event) => patch({ target_role: event.target.value })} placeholder="e.g. Senior Product Manager" className={inputClass} />
        </Field>

        <Field label="Dream companies? (optional)">
          <GoalTagField
            values={form.dream_companies}
            onChange={(dream_companies) => patch({ dream_companies })}
            placeholder="Add a company..."
            suggestions={companyNames}
            onSearch={(query) => searchCompanies(query)}
            max={12}
          />
        </Field>

        <Field label="What is your timeline?">
          <div className="flex flex-wrap gap-2">
            {GOAL_TIMELINE_OPTIONS.map((option) => (
              <ChoiceChip key={option.value} selected={form.timeline === option.value} onClick={() => patch({ timeline: form.timeline === option.value ? undefined : option.value })}>
                {option.label}
              </ChoiceChip>
            ))}
          </div>
        </Field>

        <Field label="Current experience level">
          <div className="flex flex-wrap gap-2">
            {GOAL_EXPERIENCE_OPTIONS.map((option) => (
              <ChoiceChip key={option.value} selected={form.experience_level === option.value} onClick={() => patch({ experience_level: form.experience_level === option.value ? undefined : option.value })}>
                {option.label}
              </ChoiceChip>
            ))}
          </div>
        </Field>

        <Field label="What skills do you want to build?">
          <GoalTagField
            values={form.skills}
            onChange={(skills) => patch({ skills })}
            placeholder="Add a skill..."
            suggestions={skillNames}
            onSearch={(query) => searchSkills(query)}
            max={16}
          />
        </Field>

        <Field label="What is your primary focus?">
          <div className="flex flex-col gap-2">
            {GOAL_FOCUS_OPTIONS.map((option) => {
              const selected = form.primary_focus === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => patch({ primary_focus: selected ? undefined : option.value })}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                    selected ? "border-neon-cyan/60 bg-neon-cyan/10 text-white" : "border-white/10 bg-white/[0.03] text-white/70 hover:text-white"
                  }`}
                >
                  <span className={`flex size-4 items-center justify-center rounded-full border ${selected ? "border-neon-cyan" : "border-white/30"}`}>
                    {selected && <span className="size-2 rounded-full bg-neon-cyan" />}
                  </span>
                  {option.label}
                </button>
              );
            })}
          </div>
        </Field>
      </div>

      <div className="mt-10 flex items-center justify-between gap-3">
        <GhostButton onClick={goBack} disabled={saving}>
          Cancel
        </GhostButton>
        <GradientButton onClick={handleSave} disabled={saving || !form.target_role.trim()}>
          {saving ? "Saving…" : savedGoal ? "Update goal" : "Set goal"}
        </GradientButton>
      </div>
    </div>
  );
}
