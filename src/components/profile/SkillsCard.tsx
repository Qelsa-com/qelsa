import { ProficiencyLevel, proficiencyLabel } from "@/constants/skills";
import { UserSkill } from "@/types/userSkill";
import { ProfileCard, ProfileCardEmpty, ProfileTag } from "./ProfileCard";

interface SkillsCardProps {
  skills: UserSkill[];
  isOwner: boolean;
  onAdd?: () => void;
  onEdit?: () => void;
}

/** Warm-to-hot scale, strongest proficiency first. */
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

function SectionLabel({ children }: { children: string }) {
  return <p className="text-xs font-medium uppercase tracking-[0.96px] text-white/50">{children}</p>;
}

export function SkillsCard({ skills, isOwner, onAdd, onEdit }: SkillsCardProps) {
  const topSkills = skills.filter((skill) => skill.is_top_skill);
  const otherSkills = skills.filter((skill) => !skill.is_top_skill);

  return (
    <ProfileCard title="Skills & Expertise" onAdd={isOwner ? onAdd : undefined} onEdit={isOwner ? onEdit : undefined}>
      {skills.length === 0 ? (
        <ProfileCardEmpty message={isOwner ? "Add skills so recruiters can match you to roles." : "No skills added yet."} />
      ) : (
        <div className="flex flex-col gap-6">
          {topSkills.length > 0 && (
            <div className="flex flex-col gap-3">
              <SectionLabel>Top Skills</SectionLabel>
              <div className="flex flex-col gap-2">
                {topSkills.map((skill) => (
                  <div key={skill.id} className="flex items-center justify-between gap-3 rounded-[12px] border border-white/8 bg-white/2 p-3">
                    <p className="min-w-0 text-sm font-medium text-white">{skill.skill?.name}</p>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase ${proficiencyClass(skill.proficiency)}`}>
                      {proficiencyLabel(skill.proficiency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {otherSkills.length > 0 && (
            <div className="flex flex-col gap-3">
              {topSkills.length > 0 && <div className="h-px w-full bg-white/8" />}
              <SectionLabel>Skills</SectionLabel>
              <div className="flex flex-wrap items-start gap-2">
                {otherSkills.map((skill) => (
                  <ProfileTag key={skill.id}>{skill.skill?.name}</ProfileTag>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </ProfileCard>
  );
}
