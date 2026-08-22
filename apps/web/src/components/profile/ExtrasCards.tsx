"use client";

import { UserLanguage } from "@/types/user";
import { Fragment } from "react";
import { ProfileCard, ProfileCardDivider, ProfileCardEmpty, ProfileTag } from "./ProfileCard";

interface LanguagesCardProps {
  languages: UserLanguage[];
  isOwner: boolean;
  onAdd?: () => void;
  onEdit?: () => void;
}

export function LanguagesCard({ languages, isOwner, onAdd, onEdit }: LanguagesCardProps) {
  return (
    <ProfileCard title="Languages" onAdd={isOwner ? onAdd : undefined} onEdit={isOwner && languages.length > 0 ? onEdit : undefined}>
      {languages.length === 0 ? (
        <ProfileCardEmpty message={isOwner ? "Add the languages you speak." : "No languages added yet."} />
      ) : (
        <div className="flex flex-col">
          {languages.map((language, index) => (
            <Fragment key={`${language.name}-${index}`}>
              {index > 0 && <ProfileCardDivider />}
              <div className="flex items-center justify-between gap-3 py-2.5">
                <p className="text-sm font-medium text-white">{language.name}</p>
                {language.proficiency && <p className="text-xs text-white/45">{language.proficiency}</p>}
              </div>
            </Fragment>
          ))}
        </div>
      )}
    </ProfileCard>
  );
}

interface InterestsCardProps {
  interests: string[];
  isOwner: boolean;
  onAdd?: () => void;
  onEdit?: () => void;
}

export function InterestsCard({ interests, isOwner, onAdd, onEdit }: InterestsCardProps) {
  return (
    <ProfileCard title="Interests" onAdd={isOwner ? onAdd : undefined} onEdit={isOwner && interests.length > 0 ? onEdit : undefined}>
      {interests.length === 0 ? (
        <ProfileCardEmpty message={isOwner ? "Add topics you follow." : "No interests added yet."} />
      ) : (
        <div className="flex flex-wrap items-start gap-2">
          {interests.map((interest) => (
            <ProfileTag key={interest}>{interest}</ProfileTag>
          ))}
        </div>
      )}
    </ProfileCard>
  );
}
