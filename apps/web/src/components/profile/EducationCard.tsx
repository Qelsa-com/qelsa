import { Education } from "@/types/education";
import { GraduationCap, Pencil } from "lucide-react";
import { Fragment } from "react";
import { ProfileCard, ProfileCardDivider, ProfileCardEmpty } from "./ProfileCard";
import { educationDegree, educationMeta } from "./profileFormat";

interface EducationCardProps {
  educations: Education[];
  isOwner: boolean;
  onAdd?: () => void;
  onEdit?: () => void;
  onEditItem?: (education: Education) => void;
}

export function EducationCard({ educations, isOwner, onAdd, onEdit, onEditItem }: EducationCardProps) {
  return (
    <ProfileCard title="Education" onAdd={isOwner ? onAdd : undefined} onEdit={isOwner ? onEdit : undefined}>
      {educations.length === 0 ? (
        <ProfileCardEmpty message={isOwner ? "Add where you studied." : "No education added yet."} />
      ) : (
        <div className="flex flex-col gap-5">
          {educations.map((education, index) => {
            const meta = educationMeta(education);

            return (
              <Fragment key={education.id}>
                {index > 0 && <ProfileCardDivider />}
                <div className="flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-[8px] border border-white/12 bg-white/8">
                    <GraduationCap className="size-6 text-white/70" />
                  </div>

                  <div className="group flex min-w-0 flex-1 flex-col items-start gap-1.5">
                    <div className="flex w-full items-start justify-between gap-2">
                      <p className="text-base font-semibold text-white">{educationDegree(education)}</p>
                      {isOwner && onEditItem && (
                        <button
                          type="button"
                          onClick={() => onEditItem(education)}
                          aria-label="Edit education"
                          className="shrink-0 text-white/30 opacity-0 transition-opacity hover:text-neon-cyan group-hover:opacity-100"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                      )}
                    </div>
                    {education.college?.name && <p className="text-sm text-[#00d4ff]">{education.college.name}</p>}
                    {meta && <p className="text-[13px] text-white/70">{meta}</p>}
                    {education.grade && (
                      <span className="rounded-full border border-white/12 bg-neon-cyan/8 px-2 py-1 text-xs font-bold text-neon-cyan">{education.grade}</span>
                    )}
                  </div>
                </div>
              </Fragment>
            );
          })}
        </div>
      )}
    </ProfileCard>
  );
}
