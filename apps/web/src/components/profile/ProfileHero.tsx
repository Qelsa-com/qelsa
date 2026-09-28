import { AccountBadge } from "@/components/AccountBadge";
import { Experience } from "@/types/experience";
import { User } from "@/types/user";
import { Briefcase, ChevronDown, ChevronUp, Clock, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { cn } from "../ui/utils";
import { compactCount, currentExperience, formatCity, initials, totalExperienceSummary } from "./profileFormat";

interface ProfileHeroProps {
  user: User;
  experiences: Experience[];
  /** Owner sees Edit; everyone else sees Follow. */
  isOwner: boolean;
  isFollowing?: boolean;
  /** "3 Mutual" style badge — only meaningful on someone else's profile. */
  mutualLabel?: string;
  followers?: number;
  following?: number;
  onEdit?: () => void;
  onFollow?: () => void;
  onShare?: () => void;
}

export function ProfileHero({ user, experiences, isOwner, isFollowing, mutualLabel, followers, following, onEdit, onFollow, onShare }: ProfileHeroProps) {
  const latest = currentExperience(experiences);
  const currentRole = latest?.job_title?.name || user.title || "";
  const companyName = latest?.company?.name || "";
  const location = formatCity(user.city) || user.relocate_location || "";
  const tenure = totalExperienceSummary(experiences);
  const bio = user.professional_summary || user.about || "";
  const avatarUrl = user.profile_image || user.avatar || undefined;

  return (
    <section className="relative w-full shadow-[0_40px_120px_rgba(0,212,255,0.08)]" style={{ backgroundImage: "linear-gradient(19deg, rgb(6, 6, 15) 25%, rgba(0, 212, 255, 0.094) 50%, rgba(168, 85, 247, 0.071) 75%)" }}>
      {/* Fades the hero back into the page background along its bottom edge. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40" style={{ backgroundImage: "linear-gradient(173deg, rgba(6, 6, 15, 0) 25%, rgb(6, 6, 15) 75%)" }} />

      <div className="relative mx-auto flex w-full max-w-[1280px] flex-col items-center gap-10 px-6 py-12 sm:flex-row sm:items-center md:px-12 lg:px-20 lg:py-16">
        <Avatar className="size-[140px] shrink-0">
          <AvatarImage src={avatarUrl} alt={user.name || "Profile photo"} className="object-cover" />
          <AvatarFallback className="bg-white/10 text-3xl font-bold text-white">{initials(user.name)}</AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col items-center gap-4 text-center sm:items-start sm:text-left">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              <h1 className="text-4xl font-extrabold text-white lg:text-5xl">
                {user.name || (user.username ? `@${user.username}` : "User")}
              </h1>
              {isOwner && (
                <>
                  <AccountBadge accountType={user.account_type} hiringRole={user.hiring_role} size="md" showRoleDetail />
                  {user.role === "admin" && <AccountBadge role="admin" size="md" />}
                </>
              )}
              {mutualLabel && <span className="rounded-full border border-neon-green/50 bg-neon-green/15 px-2.5 py-[3px] text-xs font-medium uppercase text-neon-green">{mutualLabel}</span>}
            </div>
            {user.name && user.username && <p className="text-xl text-[#00d4ff]">@{user.username}</p>}
            {user.headline && (
              <p className="mt-1 text-base font-medium text-white/90 sm:text-lg">
                {user.headline}
              </p>
            )}
          </div>

          {(currentRole || companyName) && (
            <div className="flex items-center gap-2 text-base text-white/70">
              <Briefcase className="size-[18px] shrink-0" />
              <p>
                {currentRole}
                {companyName && (
                  <>
                    {currentRole ? " at " : ""}
                    <span className="font-semibold text-white">{companyName}</span>
                  </>
                )}
              </p>
            </div>
          )}

          {(location || tenure) && (
            <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-start">
              {location && (
                <div className="flex items-center gap-2 text-base text-white/70">
                  <MapPin className="size-[18px] shrink-0" />
                  <span>{location}</span>
                </div>
              )}
              {tenure && (
                <div className="flex items-center gap-2 text-base text-white/70">
                  <Clock className="size-[18px] shrink-0" />
                  <span>{tenure}</span>
                </div>
              )}
            </div>
          )}

          {(typeof followers === "number" || typeof following === "number") && (
            <div className="flex flex-wrap items-center justify-center gap-8 sm:justify-start">
              {typeof followers === "number" && (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">{compactCount(followers)}</span>
                  <span className="text-base text-white/45">Followers</span>
                </div>
              )}
              {/* Following is a private-to-you number, so it stays off other people's profiles. */}
              {isOwner && typeof following === "number" && (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">{compactCount(following)}</span>
                  <span className="text-base text-white/45">Following</span>
                </div>
              )}
            </div>
          )}

          {bio && <ProfileBio bio={bio} />}

          <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            {isOwner ? (
              <button type="button" onClick={onEdit} className="rounded-full border border-white/12 bg-white/4 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10">
                Edit
              </button>
            ) : (
              <button type="button" onClick={onFollow} className="rounded-full bg-gradient-to-r from-[#7c2ff3] to-[#d73e9d] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90">
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
            <button type="button" onClick={onShare} className="rounded-full border border-white/25 bg-white/12 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20">
              Share profile
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileBio({ bio }: { bio: string }) {
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    setExpanded(false);
  }, [bio]);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const checkOverflow = () => {
      // 2 lines with text-base (16px) and leading-relaxed (~26px) is ~52px.
      // Anything above 58px means a 3rd line exists.
      const lineHeight = parseFloat(window.getComputedStyle(el).lineHeight) || 26;
      setCanExpand(el.scrollHeight > lineHeight * 2 + 6);
    };

    checkOverflow();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => checkOverflow());
      ro.observe(el);
    }

    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(checkOverflow);
    }

    return () => ro?.disconnect();
  }, [bio]);

  return (
    <div className="flex max-w-3xl flex-col items-center sm:items-start">
      <div
        className={cn(
          "relative w-full overflow-hidden transition-[max-height] duration-300 ease-in-out",
          canExpand && !expanded ? "max-h-[68px]" : "max-h-none"
        )}
      >
        <p ref={textRef} className="text-base leading-relaxed text-white/70">
          {bio}
        </p>

        {/* Faded overlay on the 3rd line with Show more button sitting on top */}
        {canExpand && !expanded && (
          <div className="absolute inset-x-0 bottom-0 flex h-11 items-end justify-center bg-gradient-to-t from-[#06060f] via-[#06060f]/85 to-transparent pb-0.5 sm:justify-start">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="flex items-center gap-1 text-xs font-semibold text-neon-cyan transition-opacity hover:opacity-80"
            >
              <span>Show more</span>
              <ChevronDown className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {canExpand && expanded && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mt-2 flex items-center gap-1 text-xs font-semibold text-neon-cyan transition-opacity hover:opacity-80"
        >
          <span>Show less</span>
          <ChevronUp className="size-3.5" />
        </button>
      )}
    </div>
  );
}
