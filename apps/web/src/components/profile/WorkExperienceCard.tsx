import { Experience } from "@/types/experience";
import { Building, Pencil } from "lucide-react";
import { useState } from "react";
import { ProfileCard, ProfileCardDivider, ProfileCardEmpty, ProfileOverflowTag, ProfileTag } from "./ProfileCard";
import { experienceBullets, experienceMeta, experienceMonths, formatDuration, toDate } from "./profileFormat";

const COLLAPSED_BULLETS = 2;
const COLLAPSED_SKILLS = 2;

interface WorkExperienceCardProps {
  experiences: Experience[];
  isOwner: boolean;
  onAdd?: () => void;
  onEdit?: () => void;
  /** Per-row edit affordance (owner only). */
  onEditItem?: (experience: Experience) => void;
}

/** 40px tile that stands in for a company logo. */
function CompanyLogo() {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-white/12 bg-[#1a1a2e]">
      <Building className="size-[18px] text-white/70" />
    </div>
  );
}

/** Marker on the rail that links the roles held at one company. */
function TimelineDot() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="#00D4FF" />
    </svg>
  );
}

/** Title, dates, bullets and skills for a single role. */
function RoleBody({ experience, showCompany, onEdit }: { experience: Experience; showCompany?: boolean; onEdit?: () => void }) {
  const [expanded, setExpanded] = useState(false);

  const bullets = experienceBullets(experience);
  const skills = (experience.skills ?? []).map((skill) => skill.name).filter(Boolean);
  const visibleBullets = expanded ? bullets : bullets.slice(0, COLLAPSED_BULLETS);
  const visibleSkills = expanded ? skills : skills.slice(0, COLLAPSED_SKILLS);
  const hiddenSkills = skills.length - visibleSkills.length;
  const canExpand = bullets.length > COLLAPSED_BULLETS || skills.length > COLLAPSED_SKILLS;

  return (
    <div className="group flex min-w-0 flex-1 flex-col gap-1.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-base font-bold text-white">{experience.job_title?.name || experience.position || "Role"}</p>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit role"
            className="shrink-0 text-white/30 opacity-0 transition-opacity hover:text-neon-cyan group-hover:opacity-100"
          >
            <Pencil className="size-3.5" />
          </button>
        )}
      </div>

      {showCompany && experience.company?.name && <p className="text-sm text-[#00d4ff]">{experience.company.name}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[13px] text-white/45">{experienceMeta(experience)}</p>
        {experience.employment_type && (
          <span className="rounded-full bg-neon-cyan/8 px-2 py-0.5 text-[11px] font-medium text-neon-cyan/80">{experience.employment_type}</span>
        )}
      </div>

      {visibleBullets.length > 0 && (
        <div className="flex flex-col gap-1 pt-1">
          {visibleBullets.map((bullet, index) => (
            <div key={index} className="flex gap-2">
              <span className="text-sm text-[#00d4ff]">•</span>
              <p className="min-w-0 flex-1 text-sm leading-relaxed text-white/70">{bullet}</p>
            </div>
          ))}
        </div>
      )}

      {canExpand && (
        <button type="button" onClick={() => setExpanded((value) => !value)} className="w-fit text-xs font-medium text-neon-cyan transition-opacity hover:opacity-80">
          {expanded ? "Show less" : "Show more"}
        </button>
      )}

      {visibleSkills.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {visibleSkills.map((skill, index) => (
            <ProfileTag key={index} size="sm">
              {skill}
            </ProfileTag>
          ))}
          {hiddenSkills > 0 && <ProfileOverflowTag count={hiddenSkills} />}
        </div>
      )}
    </div>
  );
}

/**
 * Groups roles under the company they were held at, keeping companies in
 * most-recent-first order.
 */
function groupByCompany(experiences: Experience[]) {
  const groups = new Map<string, { name: string; roles: Experience[] }>();

  for (const experience of experiences) {
    const key = String(experience.company?.id ?? experience.company?.name ?? `role-${experience.id}`);
    if (!groups.has(key)) groups.set(key, { name: experience.company?.name ?? "", roles: [] });
    groups.get(key)!.roles.push(experience);
  }

  const startedAt = (experience: Experience) => toDate(experience.start_date)?.getTime() ?? 0;

  return Array.from(groups.entries())
    .map(([key, group]) => {
      const roles = [...group.roles].sort((a, b) => startedAt(b) - startedAt(a));
      const months = roles.reduce((sum, role) => sum + experienceMonths(role), 0);
      return { key, name: group.name, roles, totalDuration: months ? formatDuration(months) : "" };
    })
    .sort((a, b) => startedAt(b.roles[0]) - startedAt(a.roles[0]));
}

export function WorkExperienceCard({ experiences, isOwner, onAdd, onEdit, onEditItem }: WorkExperienceCardProps) {
  const groups = groupByCompany(experiences);
  const rowEdit = isOwner ? onEditItem : undefined;

  return (
    <ProfileCard title={isOwner ? "Work Experience" : "Work experience"} onAdd={isOwner ? onAdd : undefined} onEdit={isOwner ? onEdit : undefined}>
      {groups.length === 0 ? (
        <ProfileCardEmpty message={isOwner ? "Add your roles to show where you've worked." : "No work experience added yet."} />
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((group, groupIndex) => (
            <div key={group.key} className="flex flex-col gap-8">
              {groupIndex > 0 && <ProfileCardDivider />}

              {group.roles.length > 1 ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                    <CompanyLogo />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="text-base font-bold text-white">{group.name}</p>
                      {group.totalDuration && <p className="text-sm text-white/70">{group.totalDuration}</p>}
                    </div>
                  </div>

                  <div className="relative flex flex-col gap-6">
                    {/* Rail connecting every role held at this company. */}
                    <div className="absolute bottom-0 left-6 top-0 w-px bg-white/10" />
                    {group.roles.map((role) => (
                      <div key={role.id} className="relative flex items-start gap-4">
                        <TimelineDot />
                        <RoleBody experience={role} onEdit={rowEdit ? () => rowEdit(role) : undefined} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <CompanyLogo />
                  <RoleBody experience={group.roles[0]} showCompany onEdit={rowEdit ? () => rowEdit(group.roles[0]) : undefined} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </ProfileCard>
  );
}
