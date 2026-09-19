import { MAX_VISIBLE_SKILLS } from "@/constants/skills";
import { useState } from "react";

/** Visible slice + overflow count, plus the view-all modal open state. */
export function useSkillOverflow<T>(skills: T[], max = MAX_VISIBLE_SKILLS) {
  const [open, setOpen] = useState(false);
  const visible = skills.slice(0, max);
  const hiddenCount = Math.max(0, skills.length - visible.length);

  return {
    visible,
    hiddenCount,
    open,
    openModal: () => setOpen(true),
    closeModal: () => setOpen(false),
  };
}
