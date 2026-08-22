"use client";

import { PROFICIENCY_LEVELS, ProficiencyLevel, proficiencyLabel } from "@/constants/skills";
import { useBulkModifyUserSkillsMutation, useGetUserSkillsQuery } from "@/features/api/userSkillsApi";
import { toastUnknownError } from "@/lib/errors";
import { Star, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Field } from "./fields";
import { GradientButton, GhostButton, ModalShell } from "./ModalShell";
import { PickedSkill, SkillPicker } from "./SkillPicker";

const MAX_TOP_SKILLS = 3;

const LEVEL_DESCRIPTIONS: Record<ProficiencyLevel, string> = {
  expert: "Deep mastery; can architect solutions and guide others",
  advance: "Can work independently and deliver end-to-end tasks",
  intermediate: "Can apply the skill with some guidance",
  beginner: "Basic understanding; follows instructions",
};

const LEVEL_DOT: Record<ProficiencyLevel, string> = {
  expert: "bg-[#ef4444]",
  advance: "bg-[#f97316]",
  intermediate: "bg-neon-yellow",
  beginner: "bg-neon-green",
};

type SkillDraft = {
  id?: string | number;
  skill: PickedSkill;
  proficiency: ProficiencyLevel | "";
  is_top_skill: boolean;
};

interface SkillsModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Add/edit skills modal: search & attach skills, set proficiency per skill,
 * star up to three top skills, then save the whole set in one bulk call.
 */
export function SkillsModal({ open, onClose }: SkillsModalProps) {
  const { data: userSkills } = useGetUserSkillsQuery(undefined, { skip: !open });
  const [bulkModify] = useBulkModifyUserSkillsMutation();

  const [drafts, setDrafts] = useState<SkillDraft[]>([]);
  const [levelPickerFor, setLevelPickerFor] = useState<number | null>(null);
  const [pickerSelection, setPickerSelection] = useState<PickedSkill[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !userSkills) return;
    setDrafts(
      userSkills.map((row) => ({
        id: row.id,
        skill: { id: row.skill?.id ?? "", name: row.skill?.name ?? "Skill" },
        proficiency: (row.proficiency || "") as ProficiencyLevel | "",
        is_top_skill: Boolean(row.is_top_skill),
      })),
    );
    setPickerSelection([]);
    setLevelPickerFor(null);
  }, [open, userSkills]);

  if (!open) return null;

  const topCount = drafts.filter((d) => d.is_top_skill).length;

  const toggleTop = (index: number) => {
    const target = drafts[index];
    if (!target.is_top_skill && topCount >= MAX_TOP_SKILLS) {
      return toast.error(`You can mark up to ${MAX_TOP_SKILLS} top skills`);
    }
    setDrafts(drafts.map((d, i) => (i === index ? { ...d, is_top_skill: !d.is_top_skill } : d)));
  };

  const setLevel = (index: number, proficiency: ProficiencyLevel) => {
    setDrafts(drafts.map((d, i) => (i === index ? { ...d, proficiency } : d)));
    setLevelPickerFor(null);
  };

  const removeSkill = (index: number) => setDrafts(drafts.filter((_, i) => i !== index));

  /** Picker holds to-be-added skills; committing moves them into the draft list. */
  const stageSkill = (skills: PickedSkill[]) => {
    const added = skills[skills.length - 1];
    setPickerSelection(skills);
    if (added && skills.length > 0) {
      const exists = drafts.some((d) => String(d.skill.id) === String(added.id));
      if (!exists) setDrafts([...drafts, { skill: added, proficiency: "", is_top_skill: false }]);
      setPickerSelection([]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await bulkModify(
        drafts.map((d) => ({
          id: d.id,
          skill_id: d.id ? undefined : d.skill.id,
          proficiency: d.proficiency || undefined,
          is_top_skill: d.is_top_skill,
        })),
      ).unwrap();
      toast.success("Skills saved");
      onClose();
    } catch (error) {
      toastUnknownError(error, "Could not save your skills. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={drafts.length ? "Edit skills & expertise" : "Add skills & expertise"}
      subtitle={drafts.length ? "Click on a skill to set proficiency level" : "Search and add skills to your profile"}
      onClose={onClose}
      footer={
        <>
          <GhostButton onClick={onClose} disabled={saving}>
            Cancel
          </GhostButton>
          <GradientButton onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : drafts.length ? "Save changes" : "Add skills"}
          </GradientButton>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Search first — adding a skill is the primary action in this modal. */}
        <SkillPicker selected={pickerSelection} onChange={stageSkill} excludeSelected={false} />

        {drafts.length === 0 && <p className="py-8 text-center text-sm text-white/40">No skills added yet</p>}

        <div className="flex flex-col divide-y divide-white/8">
          {drafts.map((draft, index) => (
            <div key={`${draft.id ?? draft.skill.id}-${index}`} className="py-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setLevelPickerFor(levelPickerFor === index ? null : index)}
                  className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${levelPickerFor === index ? "bg-white/[0.06] ring-1 ring-neon-cyan/50" : "hover:bg-white/[0.04]"}`}
                >
                  <span className="min-w-0 truncate text-sm font-medium text-white">{draft.skill.name}</span>
                  {draft.proficiency ? (
                    <span className="shrink-0 rounded-full border border-[#f97316]/40 bg-[#f97316]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#f97316]">
                      {proficiencyLabel(draft.proficiency)}
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs font-medium text-neon-cyan">Set level</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => toggleTop(index)}
                  aria-label={draft.is_top_skill ? "Remove from top skills" : "Mark as top skill"}
                  className="shrink-0 text-white/40 transition-colors hover:text-neon-yellow"
                >
                  <Star className={`size-4 ${draft.is_top_skill ? "fill-neon-yellow text-neon-yellow" : ""}`} />
                </button>
                <button type="button" onClick={() => removeSkill(index)} aria-label="Remove skill" className="shrink-0 text-white/30 transition-colors hover:text-white">
                  <X className="size-4" />
                </button>
              </div>

              {levelPickerFor === index && (
                <div className="mt-2 flex flex-col gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-2">
                  {([...PROFICIENCY_LEVELS].reverse() as { value: ProficiencyLevel; label: string }[]).map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setLevel(index, level.value)}
                      className={`flex items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors ${draft.proficiency === level.value ? "bg-neon-cyan/10" : "hover:bg-white/[0.05]"}`}
                    >
                      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${LEVEL_DOT[level.value]}`} />
                      <span>
                        <span className="block text-sm font-semibold text-white">{level.label === "Advance" ? "Advanced" : level.label}</span>
                        <span className="block text-xs text-white/50">{LEVEL_DESCRIPTIONS[level.value]}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {drafts.length > 0 && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-neon-yellow">
            <Star className="size-3.5 fill-neon-yellow" />
            {topCount}/{MAX_TOP_SKILLS} top skills selected
          </p>
        )}
      </div>
    </ModalShell>
  );
}
