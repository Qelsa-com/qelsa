"use client";

import { ProfileOverflowTag, ProfileTag } from "@/components/profile/ProfileCard";
import { MAX_VISIBLE_SKILLS } from "@/constants/skills";
import { MouseEvent } from "react";
import { ViewSkillsModal, ViewTopSkill } from "./ViewSkillsModal";
import { useSkillOverflow } from "./useSkillOverflow";

interface SkillOverflowTagsProps {
  skills: string[];
  /** Skills shown in the view-all modal. Defaults to `skills`. */
  modalSkills?: string[];
  max?: number;
  size?: "sm" | "md";
  subtitle?: string;
  sectionLabel?: string;
  topSkills?: ViewTopSkill[];
  /** Custom handler when overflow "+N" tag is clicked. */
  onOverflowClick?: () => void;
  /** Parent owns the modal; this only renders the truncated pills. */
  hideModal?: boolean;
}

/**
 * Renders up to `max` skill pills, then a "+N" chip that opens a view-all modal.
 * Only the "+N" overflow button is clickable when there are more skills than `max`.
 * Individual skill chips are non-clickable display tags.
 */
export function SkillOverflowTags({
  skills,
  modalSkills,
  max = MAX_VISIBLE_SKILLS,
  size = "md",
  subtitle,
  sectionLabel = "Skills used",
  topSkills,
  onOverflowClick,
  hideModal,
}: SkillOverflowTagsProps) {
  const { visible, hiddenCount, open, openModal, closeModal } = useSkillOverflow(skills, max);

  if (skills.length === 0) return null;

  const handleOverflowClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (onOverflowClick) {
      onOverflowClick();
    } else {
      openModal();
    }
  };

  const hasClickableOverflow = hiddenCount > 0 && (!hideModal || Boolean(onOverflowClick));

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {visible.map((skill, index) => (
          <ProfileTag key={`${skill}-${index}`} size={size}>
            {skill}
          </ProfileTag>
        ))}
        {hiddenCount > 0 && (
          <ProfileOverflowTag
            count={hiddenCount}
            onClick={hasClickableOverflow ? handleOverflowClick : undefined}
          />
        )}
      </div>
      {!hideModal && !onOverflowClick && (
        <ViewSkillsModal
          open={open}
          onClose={closeModal}
          subtitle={subtitle}
          sectionLabel={sectionLabel}
          skills={modalSkills ?? skills}
          topSkills={topSkills}
        />
      )}
    </>
  );
}
