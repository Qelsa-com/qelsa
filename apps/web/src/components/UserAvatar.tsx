"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/components/profile/profileFormat";
import { cn } from "@/components/ui/utils";

/**
 * Avatar with an initials fallback for both a missing and a broken image.
 * Radix only renders the fallback after the image fails, so callers don't need
 * to track image error state themselves.
 */
export function UserAvatar({
  name,
  src,
  alt,
  className,
  fallbackClassName,
}: {
  name?: string | null;
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const label = initials(name ?? undefined) || "?";
  return (
    <Avatar className={cn("size-10", className)}>
      {src ? <AvatarImage src={src} alt={alt ?? name ?? "Profile"} className="object-cover" /> : null}
      <AvatarFallback
        className={cn(
          "bg-white/10 text-sm font-semibold text-white",
          fallbackClassName,
        )}
      >
        {label}
      </AvatarFallback>
    </Avatar>
  );
}
