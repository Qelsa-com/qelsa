import { useGetProfileQuery, useGetPublicProfileQuery } from "@/features/api/authApi";
import { useGetCertificationsQuery } from "@/features/api/certificationsApi";
import { useGetEducationsQuery } from "@/features/api/educationsApi";
import { useGetExperiencesQuery } from "@/features/api/experiencesApi";
import { useGetUserSkillsQuery } from "@/features/api/userSkillsApi";
import { Certification } from "@/types/certification";
import { Education } from "@/types/education";
import { Experience } from "@/types/experience";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ProfilePageSkeleton } from "../pageSkeletons";
import { CertificationsCard } from "./CertificationsCard";
import { EducationCard } from "./EducationCard";
import { InterestsCard, LanguagesCard } from "./ExtrasCards";
import { ProfileCompletionBar } from "./ProfileCompletionBar";
import { ProfileFooter } from "./ProfileFooter";
import { ProfileHero } from "./ProfileHero";
import { SkillsCard } from "./SkillsCard";
import { WorkExperienceCard } from "./WorkExperienceCard";
import { CertificationModal } from "./modals/CertificationModal";
import { EducationModal } from "./modals/EducationModal";
import { ExperienceModal } from "./modals/ExperienceModal";
import { InterestsModal, LanguagesModal } from "./modals/ExtrasModals";
import { SkillsModal } from "./modals/SkillsModal";
import { profileCompletion } from "./profileFormat";

type ProfileModal =
  { kind: "experience"; item: Experience | null } | { kind: "education"; item: Education | null } | { kind: "certification"; item: Certification | null } | { kind: "skills" } | { kind: "languages" } | { kind: "interests" };

interface ProfilePageProps {
  /**
   * The owner's own view adds the completion bar plus the Add/Edit affordances
   * on every card; a visitor gets the read-only view with Follow.
   */
  isOwner?: boolean;
  /** Present on the public route, e.g. /profile/alexjohnson. */
  username?: string;
}

export function ProfilePage({ isOwner = false, username }: ProfilePageProps) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(false);
  const [modal, setModal] = useState<ProfileModal | null>(null);
  const closeModal = useCallback(() => setModal(null), []);

  // Two ways into the same page. The owner reads the authenticated endpoints,
  // which is what the editors invalidate after a save; a visitor reads the
  // public by-handle bundle, which works with no token at all. Whichever branch
  // is inactive is skipped, so a signed-out visitor never fires an authed call.
  const isPublicView = !isOwner;

  const { data: ownUser, isLoading: isOwnUserLoading } = useGetProfileQuery(undefined, { skip: !isOwner });
  const { data: ownExperiences } = useGetExperiencesQuery(undefined, { skip: !isOwner });
  const { data: ownEducations } = useGetEducationsQuery(undefined, { skip: !isOwner });
  const { data: ownCertifications } = useGetCertificationsQuery(undefined, { skip: !isOwner });
  const { data: ownSkills } = useGetUserSkillsQuery(undefined, { skip: !isOwner });

  const { data: publicProfile, isLoading: isPublicLoading, isError: isPublicError } = useGetPublicProfileQuery(isPublicView ? username : undefined, { skip: !isPublicView || !username });

  const user = isOwner ? ownUser : publicProfile?.user;
  const isLoading = isOwner ? isOwnUserLoading : isPublicLoading || !username;

  const experienceList = (isOwner ? ownExperiences : publicProfile?.experiences) ?? [];
  const educationList = (isOwner ? ownEducations : publicProfile?.educations) ?? [];
  const certificationList = (isOwner ? ownCertifications : publicProfile?.certifications) ?? [];
  const skillList = (isOwner ? ownSkills : publicProfile?.skills) ?? [];

  const completion = profileCompletion(user, {
    experiences: experienceList.length,
    educations: educationList.length,
    certifications: certificationList.length,
    skills: skillList.length,
  });

  const handleShare = useCallback(async () => {
    const handle = username || user?.username;
    const url = `${window.location.origin}${handle ? `/profile/${handle}` : "/profile"}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Profile link copied to clipboard");
    } catch {
      toast.error("Could not copy the profile link");
    }
  }, [user?.username, username]);

  const handleFollow = useCallback(() => {
    setIsFollowing((value) => !value);
  }, []);

  if (isPublicView && isPublicError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 bg-[#06060f] px-6 text-center">
        <p className="text-lg font-semibold text-white">Profile not found</p>
        <p className="text-sm text-white/45">{username ? `No public profile for @${username}.` : "This profile is not available."}</p>
      </div>
    );
  }

  if (isLoading || !user) {
    return <ProfilePageSkeleton />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#06060f]">
      <ProfileHero user={user} experiences={experienceList} isOwner={isOwner} isFollowing={isFollowing} onEdit={() => router.push("/profile/edit")} onFollow={handleFollow} onShare={handleShare} />

      {isOwner && completion < 100 && <ProfileCompletionBar percent={completion} onComplete={() => router.push("/profile/edit")} />}

      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-6 px-6 pb-20 pt-6 md:px-12 lg:grid-cols-[minmax(0,1fr)_520px] lg:px-20">
        <div className="flex min-w-0 flex-col gap-6">
          <WorkExperienceCard
            experiences={experienceList}
            isOwner={isOwner}
            onAdd={() => setModal({ kind: "experience", item: null })}
            onEdit={() => setModal({ kind: "experience", item: experienceList[0] ?? null })}
            onEditItem={(experience) => setModal({ kind: "experience", item: experience })}
          />
          <CertificationsCard
            certifications={certificationList}
            isOwner={isOwner}
            onAdd={() => setModal({ kind: "certification", item: null })}
            onEdit={() => setModal({ kind: "certification", item: certificationList[0] ?? null })}
            onEditItem={(certification) => setModal({ kind: "certification", item: certification })}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <SkillsCard skills={skillList} isOwner={isOwner} onAdd={() => setModal({ kind: "skills" })} onEdit={() => setModal({ kind: "skills" })} />
          <EducationCard
            educations={educationList}
            isOwner={isOwner}
            onAdd={() => setModal({ kind: "education", item: null })}
            onEdit={() => setModal({ kind: "education", item: educationList[0] ?? null })}
            onEditItem={(education) => setModal({ kind: "education", item: education })}
          />
          <LanguagesCard languages={user?.languages ?? []} isOwner={isOwner} onAdd={() => setModal({ kind: "languages" })} onEdit={() => setModal({ kind: "languages" })} />
          <InterestsCard interests={user?.interests ?? []} isOwner={isOwner} onAdd={() => setModal({ kind: "interests" })} onEdit={() => setModal({ kind: "interests" })} />
        </div>
      </div>

      <ProfileFooter />

      {/* Add/edit modals — owner only; Convex queries refresh the page on save. */}
      <ExperienceModal open={modal?.kind === "experience"} onClose={closeModal} experience={modal?.kind === "experience" ? modal.item : null} />
      <EducationModal open={modal?.kind === "education"} onClose={closeModal} education={modal?.kind === "education" ? modal.item : null} />
      <CertificationModal open={modal?.kind === "certification"} onClose={closeModal} certification={modal?.kind === "certification" ? modal.item : null} />
      <SkillsModal open={modal?.kind === "skills"} onClose={closeModal} />
      <LanguagesModal open={modal?.kind === "languages"} onClose={closeModal} languages={user?.languages ?? []} />
      <InterestsModal open={modal?.kind === "interests"} onClose={closeModal} interests={user?.interests ?? []} />
    </div>
  );
}
