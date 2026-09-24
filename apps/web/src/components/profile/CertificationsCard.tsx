import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SkillOverflowTags } from "@/components/skills/SkillOverflowTags";
import { skillRoleSubtitle } from "@/constants/skills";
import { useDeleteCertificationMutation } from "@/features/api/certificationsApi";
import { Certification } from "@/types/certification";
import { GraduationCap, Pencil, Trash2 } from "lucide-react";
import { Fragment, useState } from "react";
import { toast } from "sonner";
import { ProfileCard, ProfileCardDivider, ProfileCardEmpty } from "./ProfileCard";
import { certificationMeta } from "./profileFormat";

interface CertificationsCardProps {
  certifications: Certification[];
  isOwner: boolean;
  onAdd?: () => void;
  onEditItem?: (certification: Certification) => void;
}

export function CertificationsCard({ certifications, isOwner, onAdd, onEditItem }: CertificationsCardProps) {
  const [deleteCertification] = useDeleteCertificationMutation();
  const [deletingCert, setDeletingCert] = useState<Certification | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deletingCert) return;
    const certId = deletingCert.id ?? (deletingCert as unknown as { _id?: string })._id;
    if (!certId) return;
    setIsDeleting(true);
    try {
      await deleteCertification(certId).unwrap();
      toast.success("Certification deleted");
      setDeletingCert(null);
    } catch {
      toast.error("Could not delete certification. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getCertName = (cert: Certification) => {
    return (cert as unknown as { name?: string }).name ?? cert.certification?.name ?? "Certification";
  };

  return (
    <>
      <ProfileCard title="Certifications" onAdd={isOwner ? onAdd : undefined}>
        {certifications.length === 0 ? (
          <ProfileCardEmpty message={isOwner ? "Add certifications to back up your expertise." : "No certifications added yet."} />
        ) : (
          <div className="flex flex-col gap-5">
            {certifications.map((certification, index) => {
              const meta = certificationMeta(certification);
              const skills = (certification.skills ?? []).map((skill) => skill.name).filter(Boolean);
              const name = getCertName(certification);
              const issuer = certification.issuing_body?.name ?? (certification as unknown as { issuingOrganization?: string }).issuingOrganization;
              const certKey = certification.id ?? (certification as unknown as { _id?: string })._id ?? index;

              return (
                <Fragment key={certKey}>
                  {index > 0 && <ProfileCardDivider />}
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-[8px] border border-white/12 bg-white/8">
                      <GraduationCap className="size-6 text-white/70" />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-5">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-base font-semibold text-white">{name}</p>
                          {isOwner && (
                            <div className="flex shrink-0 items-center gap-1">
                              {onEditItem && (
                                <button
                                  type="button"
                                  onClick={() => onEditItem(certification)}
                                  aria-label={`Edit ${name}`}
                                  className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                                >
                                  <Pencil className="size-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setDeletingCert(certification)}
                                aria-label={`Delete ${name}`}
                                className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-red-500/15 hover:text-red-400"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        {(certification.issuing_body?.name || (certification as unknown as { issuingOrganization?: string }).issuingOrganization) && (
                          <p className="text-sm font-medium text-[#00d4ff]">{certification.issuing_body?.name ?? (certification as unknown as { issuingOrganization?: string }).issuingOrganization}</p>
                        )}
                        {meta && <p className="text-xs sm:text-[13px] text-white/60">{meta}</p>}
                      </div>

                      {skills.length > 0 && <SkillOverflowTags skills={skills} subtitle={skillRoleSubtitle(name, issuer)} sectionLabel="Skills used" />}
                    </div>
                  </div>
                </Fragment>
              );
            })}
          </div>
        )}
      </ProfileCard>

      <AlertDialog open={Boolean(deletingCert)} onOpenChange={(open) => !open && setDeletingCert(null)}>
        <AlertDialogContent className="border border-white/12 bg-[#0c0c1a] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-white">Delete certification?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-white/60">
              Are you sure you want to delete <span className="font-medium text-white">{deletingCert ? getCertName(deletingCert) : "this certification"}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="border-white/12 bg-white/5 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={handleDeleteConfirm}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
