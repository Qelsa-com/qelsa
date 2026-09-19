"use client";

import { ProfileTag } from "@/components/profile/ProfileCard";
import { ModalShell } from "@/components/profile/modals/ModalShell";
import { MAX_TOP_SKILLS, ProficiencyLevel, proficiencyBadgeLabel } from "@/constants/skills";
import { Star } from "lucide-react";

export type ViewTopSkill = {
  name: string;
  proficiency?: ProficiencyLevel | "" | null;
};

interface ViewSkillsModalProps {
  open: boolean;
  onClose: () => void;
  /** Role · company (experience) or job title. Omitted on the profile skills modal. */
  subtitle?: string;
  /** "Skills" on the profile modal, "Skills used" on experience/job. */
  sectionLabel?: string;
  skills: string[];
  topSkills?: ViewTopSkill[];
}

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

/** Read-only skills dialog. Profile view includes starred top skills; experience/job view lists pills only. */
export function ViewSkillsModal({ open, onClose, subtitle, sectionLabel = "Skills", skills, topSkills }: ViewSkillsModalProps) {
  if (!open) return null;

  const featured = (topSkills ?? []).filter((skill) => skill.name);

  return (
    <ModalShell title="Skills & Expertise" subtitle={subtitle} onClose={onClose} headerBorder={false}>
      <div className="flex flex-col gap-5">
        {featured.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="text-xs text-white/45">Top Skills</p>
            <div className="flex flex-col">
              {featured.map((skill, index) => (
                <div key={`${skill.name}-${index}`} className="flex items-center justify-between gap-3 py-2.5">
                  <p className="min-w-0 text-sm font-medium text-white">{skill.name}</p>
                  {skill.proficiency ? (
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${proficiencyClass(skill.proficiency)}`}>
                      {proficiencyBadgeLabel(skill.proficiency)}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-neon-yellow">
              <Star className="size-3.5 fill-neon-yellow text-neon-yellow" />
              {featured.length}/{MAX_TOP_SKILLS} top skills
            </p>
            <div className="mt-4 h-px w-full bg-white/10" />
          </div>
        )}

        <div className="flex flex-col gap-3">
          <p className="text-xs text-white/45">{sectionLabel}</p>
          {skills.length === 0 ? (
            <p className="text-sm text-white/45">No skills to show.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <ProfileTag key={`${skill}-${index}`}>{skill}</ProfileTag>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
