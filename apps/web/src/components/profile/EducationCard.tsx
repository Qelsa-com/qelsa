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
import { useDeleteEducationMutation } from "@/features/api/educationsApi";
import { Education } from "@/types/education";
import { GraduationCap, Pencil, Trash2 } from "lucide-react";
import { Fragment, useState } from "react";
import { toast } from "sonner";
import { ProfileCard, ProfileCardDivider, ProfileCardEmpty } from "./ProfileCard";
import { educationDegree, educationMeta } from "./profileFormat";

interface EducationCardProps {
  educations: Education[];
  isOwner: boolean;
  onAdd?: () => void;
  onEditItem?: (education: Education) => void;
}

export function EducationCard({ educations, isOwner, onAdd, onEditItem }: EducationCardProps) {
  const [deleteEducation] = useDeleteEducationMutation();
  const [deletingEducation, setDeletingEducation] = useState<Education | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deletingEducation) return;
    const eduId = deletingEducation.id ?? (deletingEducation as unknown as { _id?: string })._id;
    if (!eduId) return;
    setIsDeleting(true);
    try {
      await deleteEducation(eduId).unwrap();
      toast.success("Education deleted");
      setDeletingEducation(null);
    } catch {
      toast.error("Could not delete education. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <ProfileCard title="Education" onAdd={isOwner ? onAdd : undefined}>
        {educations.length === 0 ? (
          <ProfileCardEmpty message={isOwner ? "Add where you studied." : "No education added yet."} />
        ) : (
          <div className="flex flex-col gap-5">
            {educations.map((education, index) => {
              const meta = educationMeta(education);
              const eduKey = education.id ?? (education as unknown as { _id?: string })._id ?? index;

              return (
                <Fragment key={eduKey}>
                  {index > 0 && <ProfileCardDivider />}
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-[8px] border border-white/12 bg-white/8">
                      <GraduationCap className="size-6 text-white/70" />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
                      <div className="flex w-full items-start justify-between gap-2">
                        <p className="text-base font-semibold text-white">{educationDegree(education)}</p>
                        {isOwner && (
                          <div className="flex shrink-0 items-center gap-1">
                            {onEditItem && (
                              <button
                                type="button"
                                onClick={() => onEditItem(education)}
                                aria-label={`Edit ${educationDegree(education)}`}
                                className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                              >
                                <Pencil className="size-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setDeletingEducation(education)}
                              aria-label={`Delete ${educationDegree(education)}`}
                              className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-red-500/15 hover:text-red-400"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      {education.college?.name && <p className="text-sm text-[#00d4ff]">{education.college.name}</p>}
                      {meta && <p className="text-[13px] text-white/70">{meta}</p>}
                      {education.grade && <span className="rounded-full border border-white/12 bg-neon-cyan/8 px-2 py-1 text-xs font-bold text-neon-cyan">{education.grade}</span>}
                    </div>
                  </div>
                </Fragment>
              );
            })}
          </div>
        )}
      </ProfileCard>

      <AlertDialog open={Boolean(deletingEducation)} onOpenChange={(open) => !open && setDeletingEducation(null)}>
        <AlertDialogContent className="border border-white/12 bg-[#0c0c1a] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-white">Delete education?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-white/60">
              Are you sure you want to delete{" "}
              <span className="font-medium text-white">{deletingEducation ? educationDegree(deletingEducation) : "this education"}</span>
              {deletingEducation?.college?.name ? ` at ${deletingEducation.college.name}` : ""}? This action cannot be undone.
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
