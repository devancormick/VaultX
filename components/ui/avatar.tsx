import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm", lg: "w-12 h-12 text-base" };
const pxSizes = { sm: 28, md: 36, lg: 48 };

export function Avatar({ src, name, email, size = "md", className }: AvatarProps) {
  const initials = (name ?? email ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (src) {
    return (
      <div className={cn("relative rounded-full overflow-hidden flex-shrink-0", sizes[size], className)}>
        <Image src={src} alt={name ?? "Avatar"} width={pxSizes[size]} height={pxSizes[size]} className="object-cover" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center font-medium text-accent flex-shrink-0",
        sizes[size],
        className
      )}
      aria-label={name ?? email ?? "User avatar"}
    >
      {initials}
    </div>
  );
}
