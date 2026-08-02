import { useGetProfileQuery, useGetPublicProfileQuery } from "@/features/api/authApi";
import { useGetCertificationsQuery } from "@/features/api/certificationsApi";
import { useGetEducationsQuery } from "@/features/api/educationsApi";
import { useGetExperiencesQuery } from "@/features/api/experiencesApi";
import { useGetUserSkillsQuery } from "@/features/api/userSkillsApi";
import { skipToken } from "@reduxjs/toolkit/query";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { CertificationsCard } from "./CertificationsCard";
import { EducationCard } from "./EducationCard";
import { ProfileCompletionBar } from "./ProfileCompletionBar";
import { ProfileFooter } from "./ProfileFooter";
import { ProfileHero } from "./ProfileHero";
import { SkillsCard } from "./SkillsCard";
import { WorkExperienceCard } from "./WorkExperienceCard";
import { profileCompletion } from "./profileFormat";

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

  const {
    data: publicProfile,
    isLoading: isPublicLoading,
    isError: isPublicError,
  } = useGetPublicProfileQuery(isPublicView && username ? username : skipToken);

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
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#06060f]">
        <p className="text-sm text-white/45">Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#06060f]">
      <ProfileHero
        user={user}
        experiences={experienceList}
        isOwner={isOwner}
        isFollowing={isFollowing}
        onEdit={() => router.push("/profile/edit")}
        onFollow={handleFollow}
        onShare={handleShare}
      />

      {isOwner && completion < 100 && <ProfileCompletionBar percent={completion} onComplete={() => router.push("/profile/edit")} />}

      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-6 px-6 pb-20 pt-6 md:px-12 lg:grid-cols-[minmax(0,1fr)_520px] lg:px-20">
        <div className="flex min-w-0 flex-col gap-6">
          <WorkExperienceCard
            experiences={experienceList}
            isOwner={isOwner}
            onAdd={() => router.push("/profile/work-experience")}
            onEdit={() => router.push("/profile/work-experience")}
          />
          <CertificationsCard
            certifications={certificationList}
            isOwner={isOwner}
            onAdd={() => router.push("/profile/certifications")}
            onEdit={() => router.push("/profile/certifications")}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <SkillsCard skills={skillList} isOwner={isOwner} onAdd={() => router.push("/profile/skills/edit")} onEdit={() => router.push("/profile/skills/edit")} />
          <EducationCard educations={educationList} isOwner={isOwner} onAdd={() => router.push("/profile/educations")} onEdit={() => router.push("/profile/educations")} />
        </div>
      </div>

      <ProfileFooter />
    </div>
  );
}
