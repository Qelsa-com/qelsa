import { SkillOverflowTags } from "@/components/skills/SkillOverflowTags";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { skillRoleSubtitle } from "@/constants/skills";
import { useDeleteExperienceMutation } from "@/features/api/experiencesApi";
import { toastUnknownError } from "@/lib/errors";
import { Experience } from "@/types/experience";
import { Building, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ProfileCard, ProfileCardDivider, ProfileCardEmpty } from "./ProfileCard";
import { experienceBullets, experienceMeta, experienceMonths, formatDuration, toDate } from "./profileFormat";

const COLLAPSED_BULLETS = 2;

interface WorkExperienceCardProps {
  experiences: Experience[];
  isOwner: boolean;
  onAdd?: () => void;
  onEdit?: () => void;
  /** Per-row edit affordance (owner only). */
  onEditItem?: (experience: Experience) => void;
  /** Optional custom per-row delete affordance. */
  onDeleteItem?: (experience: Experience) => void;
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
function RoleBody({
  experience,
  showCompany,
  companyName,
  onEdit,
  onDelete,
}: {
  experience: Experience;
  showCompany?: boolean;
  companyName?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const bullets = experienceBullets(experience);
  const skills = (experience.skills ?? []).map((skill) => skill.name).filter(Boolean);
  const visibleBullets = expanded ? bullets : bullets.slice(0, COLLAPSED_BULLETS);
  const canExpand = bullets.length > COLLAPSED_BULLETS;
  const roleTitle = experience.job_title?.name || experience.position || "Role";
  const company = experience.company?.name || companyName || "";

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-base font-bold text-white">{roleTitle}</p>
        {onEdit && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit ${roleTitle}`}
              title="Edit role"
              className="flex size-7 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-neon-cyan focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-cyan"
            >
              <Pencil className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {showCompany && experience.company?.name && <p className="text-sm font-medium text-[#00d4ff]">{experience.company.name}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs sm:text-[13px] text-white/60">{experienceMeta(experience)}</p>
        {experience.employment_type && <span className="rounded-full bg-neon-cyan/8 px-2 py-0.5 text-[11px] font-medium text-neon-cyan/80">{experience.employment_type}</span>}
      </div>

      {visibleBullets.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-1">
          {visibleBullets.map((bullet, index) => (
            <div key={index} className="flex gap-2">
              <span className="text-sm text-[#00d4ff]">•</span>
              <p className="min-w-0 flex-1 text-sm leading-relaxed text-white/85">{bullet}</p>
            </div>
          ))}
        </div>
      )}

      {canExpand && (
        <button type="button" onClick={() => setExpanded((value) => !value)} className="w-fit py-1 text-xs font-medium text-neon-cyan transition-opacity hover:opacity-80">
          {expanded ? "Show less" : "Show more"}
        </button>
      )}

      {skills.length > 0 && <SkillOverflowTags skills={skills} size="sm" subtitle={skillRoleSubtitle(roleTitle, company)} sectionLabel="Skills used" />}
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

export function WorkExperienceCard({
  experiences,
  isOwner,
  onAdd,
  onEditItem,
  onDeleteItem,
}: WorkExperienceCardProps) {
  const groups = groupByCompany(experiences);
  const [deletingExperience, setDeletingExperience] = useState<Experience | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteExperience] = useDeleteExperienceMutation();

  const rowEdit = isOwner ? onEditItem : undefined;
  const rowDelete = isOwner ? (experience: Experience) => setDeletingExperience(experience) : undefined;

  const handleDeleteConfirm = async () => {
    if (!deletingExperience) return;
    const expId = deletingExperience.id ?? (deletingExperience as unknown as { _id?: string })._id;
    if (!expId) return;

    setIsDeleting(true);
    try {
      if (onDeleteItem) {
        await onDeleteItem(deletingExperience);
      } else {
        await deleteExperience(expId).unwrap();
        toast.success("Work experience deleted");
      }
      setDeletingExperience(null);
    } catch (error) {
      toastUnknownError(error, "Failed to delete work experience. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const deletingRoleTitle = deletingExperience?.job_title?.name || deletingExperience?.position || "this role";
  const deletingCompany = deletingExperience?.company?.name;

  return (
    <>
      <ProfileCard title={isOwner ? "Work Experience" : "Work experience"} onAdd={isOwner ? onAdd : undefined}>
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
                          <RoleBody
                            experience={role}
                            companyName={group.name}
                            onEdit={rowEdit ? () => rowEdit(role) : undefined}
                            onDelete={rowDelete ? () => rowDelete(role) : undefined}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    <CompanyLogo />
                    <RoleBody
                      experience={group.roles[0]}
                      showCompany
                      companyName={group.name}
                      onEdit={rowEdit ? () => rowEdit(group.roles[0]) : undefined}
                      onDelete={rowDelete ? () => rowDelete(group.roles[0]) : undefined}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ProfileCard>

      <AlertDialog
        open={deletingExperience !== null}
        onOpenChange={(open) => {
          if (isDeleting) return;
          if (!open) setDeletingExperience(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl border border-white/12 bg-[#161622] p-6 text-white shadow-2xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-white">Delete work experience?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-white/70">
              Are you sure you want to delete <span className="font-semibold text-white">"{deletingRoleTitle}"</span>
              {deletingCompany ? (
                <>
                  {" "}at <span className="font-semibold text-white">{deletingCompany}</span>
                </>
              ) : null}
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <AlertDialogCancel
              disabled={isDeleting}
              className="rounded-full border border-white/15 bg-white/5 text-white hover:bg-white/10"
            >
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              className="rounded-full bg-red-600 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              disabled={isDeleting}
              onClick={handleDeleteConfirm}
            >
              {isDeleting ? "Deleting..." : "Delete experience"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
