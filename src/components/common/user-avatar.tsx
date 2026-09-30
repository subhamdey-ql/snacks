import { ACCENT_CLASSES } from "@/components/common/accent-classes";
import { cn, initials } from "@/lib/utils";
import { AccentTone } from "@/types/enums";

const TONES: readonly AccentTone[] = Object.values(AccentTone);

interface UserAvatarProps {
  readonly name: string;
  // Stable key (e.g. employee code) so the same person always gets the same colour.
  readonly seed: string;
  readonly className?: string;
}

// Initials in a soft coloured circle; a tiny string hash picks one of the five accent tones.
export function UserAvatar({ name, seed, className }: UserAvatarProps): React.JSX.Element {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const tone = TONES[hash % TONES.length] ?? AccentTone.BLUE;
  return (
    <span
      aria-hidden
      className={cn("flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold", ACCENT_CLASSES[tone], className)}
    >
      {initials(name)}
    </span>
  );
}
