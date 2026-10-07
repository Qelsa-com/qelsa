"use client";

import { MAX_TOP_SKILLS, MAX_USER_SKILLS, ProficiencyLevel, proficiencyBadgeLabel } from "@/constants/skills";
import { useBulkModifyUserSkillsMutation, useGetUserSkillsQuery } from "@/features/api/userSkillsApi";
import { toastUnknownError } from "@/lib/errors";
import { Star, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { GhostButton, GradientButton, ModalShell } from "./ModalShell";
import { PickedSkill, SkillPicker } from "./SkillPicker";

type SkillDraft = {
  id?: string | number;
  skill: PickedSkill;
  /** Stored estimate. Display only — the editor never writes this field. */
  proficiency?: ProficiencyLevel | "" | null;
  is_top_skill: boolean;
};

function proficiencyClass(proficiency?: ProficiencyLevel | "" | null) {
  switch (proficiency) {
    case "expert":
      return "bg-[#ef4444]/15 border-[#ef4444]/25 text-[#ef4444]";
    case "advance":
      return "bg-[#f97316]/15 border-[#f97316]/25 text-[#f97316]";
    case "intermediate":
      return "bg-neon-yellow/15 border-neon-yellow/25 text-neon-yellow";
    case "beginner":
      return "bg-neon-green/15 border-neon-green/25 text-neon-green";
    default:
      return "bg-white/10 border-white/12 text-white/70";
  }
}

interface SkillsModalProps {
  open: boolean;
  onClose: () => void;
  initialSkills?: string[];
  onCustomSave?: (skills: string[]) => void;
}

/**
 * Add/edit skills modal: search & attach skills and star up to three top
 * skills. Proficiency is inferred and is not editable here.
 */
export function SkillsModal({ open, onClose, initialSkills, onCustomSave }: SkillsModalProps) {
  const { data: userSkills } = useGetUserSkillsQuery(undefined, { skip: !open || Boolean(initialSkills) });
  const [bulkModify] = useBulkModifyUserSkillsMutation();

  const [drafts, setDrafts] = useState<SkillDraft[]>([]);
  const [pickerSelection, setPickerSelection] = useState<PickedSkill[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initialSkills) {
      setDrafts(
        initialSkills.map((name) => ({
          skill: { id: name, name },
          is_top_skill: false,
        })),
      );
      setPickerSelection([]);
      return;
    }
    if (!userSkills) return;
    setDrafts(
      userSkills.map((row) => ({
        id: row.id,
        skill: { id: row.skill?.id ?? "", name: row.skill?.name ?? "Skill" },
        proficiency: row.proficiency,
        is_top_skill: Boolean(row.is_top_skill),
      })),
    );
    setPickerSelection([]);
  }, [open, userSkills, initialSkills]);

  if (!open) return null;

  const topCount = drafts.filter((d) => d.is_top_skill).length;
  const atLimit = drafts.length >= MAX_USER_SKILLS;

  const toggleTop = (index: number) => {
    const target = drafts[index];
    if (!target.is_top_skill && topCount >= MAX_TOP_SKILLS) {
      return toast.error(`You can mark up to ${MAX_TOP_SKILLS} top skills`);
    }
    setDrafts(drafts.map((d, i) => (i === index ? { ...d, is_top_skill: !d.is_top_skill } : d)));
  };

  const removeSkill = (index: number) => setDrafts(drafts.filter((_, i) => i !== index));

  /** Picker holds to-be-added skills; committing moves them into the draft list. */
  const stageSkill = (skills: PickedSkill[]) => {
    const added = skills[skills.length - 1];
    setPickerSelection(skills);
    if (added && skills.length > 0) {
      if (drafts.length >= MAX_USER_SKILLS) {
        setPickerSelection([]);
        return toast.error(`You can add up to ${MAX_USER_SKILLS} skills`);
      }
      const exists = drafts.some((d) => String(d.skill.id) === String(added.id));
      if (!exists) setDrafts([...drafts, { skill: added, is_top_skill: false }]);
      setPickerSelection([]);
    }
  };

  const handleSave = async () => {
    if (onCustomSave) {
      onCustomSave(drafts.map((d) => d.skill.name));
      toast.success("Skills saved");
      onClose();
      return;
    }
    setSaving(true);
    try {
      await bulkModify(
        drafts.map((d) => ({
          id: d.id,
          skill_id: d.id ? undefined : d.skill.id,
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
      subtitle="Search and add skills, then star up to 3 as top skills"
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
        <SkillPicker selected={pickerSelection} onChange={stageSkill} excludeSelected={false} disabled={atLimit} />
        {atLimit && <p className="text-xs text-white/45">You can add up to {MAX_USER_SKILLS} skills.</p>}

        {drafts.length === 0 && <p className="py-8 text-center text-sm text-white/40">No skills added yet</p>}

        <div className="flex flex-col divide-y divide-white/8">
          {drafts.map((draft, index) => (
            <div key={`${draft.id ?? draft.skill.id}-${index}`} className="py-3">
              <div className="flex items-center gap-3">
                <span className="min-w-0 flex-1 truncate px-2 py-1.5 text-sm font-medium text-white">{draft.skill.name}</span>
                {draft.proficiency ? (
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${proficiencyClass(draft.proficiency)}`}>
                    {proficiencyBadgeLabel(draft.proficiency)}
                  </span>
                ) : null}

                <button type="button" onClick={() => toggleTop(index)} aria-label={draft.is_top_skill ? "Remove from top skills" : "Mark as top skill"} className="shrink-0 text-white/40 transition-colors hover:text-neon-yellow">
                  <Star className={`size-4 ${draft.is_top_skill ? "fill-neon-yellow text-neon-yellow" : ""}`} />
                </button>
                <button type="button" onClick={() => removeSkill(index)} aria-label="Remove skill" className="shrink-0 text-white/30 transition-colors hover:text-white">
                  <X className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {drafts.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="flex items-center gap-1.5 text-xs font-medium text-neon-yellow">
              <Star className="size-3.5 fill-neon-yellow" />
              {topCount}/{MAX_TOP_SKILLS} top skills selected
            </p>
            <p className="text-xs text-white/40">
              {drafts.length}/{MAX_USER_SKILLS} skills
            </p>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
