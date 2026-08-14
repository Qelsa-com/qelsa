import { Certification } from "@/types/certification";
import { GraduationCap } from "lucide-react";
import { Fragment } from "react";
import { ProfileCard, ProfileCardDivider, ProfileCardEmpty, ProfileTag } from "./ProfileCard";
import { certificationMeta } from "./profileFormat";

interface CertificationsCardProps {
  certifications: Certification[];
  isOwner: boolean;
  onAdd?: () => void;
  onEdit?: () => void;
}

export function CertificationsCard({ certifications, isOwner, onAdd, onEdit }: CertificationsCardProps) {
  return (
    <ProfileCard title="Certifications" onAdd={isOwner ? onAdd : undefined} onEdit={isOwner ? onEdit : undefined}>
      {certifications.length === 0 ? (
        <ProfileCardEmpty message={isOwner ? "Add certifications to back up your expertise." : "No certifications added yet."} />
      ) : (
        <div className="flex flex-col gap-5">
          {certifications.map((certification, index) => {
            const meta = certificationMeta(certification);
            const skills = (certification.skills ?? []).map((skill) => skill.name).filter(Boolean);

            return (
              <Fragment key={certification.id}>
                {index > 0 && <ProfileCardDivider />}
                <div className="flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-[8px] border border-white/12 bg-white/8">
                    <GraduationCap className="size-6 text-white/70" />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-5">
                    <div className="flex flex-col gap-1.5">
                      <p className="text-base font-semibold text-white">{certification.certification?.name}</p>
                      {certification.issuing_body?.name && <p className="text-sm text-[#00d4ff]">{certification.issuing_body.name}</p>}
                      {meta && <p className="text-[13px] text-white/45">{meta}</p>}
                    </div>

                    {skills.length > 0 && (
                      <div className="flex flex-wrap items-start gap-2">
                        {skills.map((skill, skillIndex) => (
                          <ProfileTag key={skillIndex}>{skill}</ProfileTag>
                        ))}
                      </div>
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
