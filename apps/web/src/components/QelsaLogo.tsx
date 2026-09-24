import Image from "next/image";

export function QelsaLogo({
  className = "h-[26px] w-auto",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return <Image src="/qelsa-logo.svg" alt="Qelsa" width={91} height={29} priority={priority} unoptimized className={className} />;
}
