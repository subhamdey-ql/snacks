import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
    // Avatar's inner ring (after:) is switched off and the fallback takes the accent colours, so the look is unchanged.
    <Avatar aria-hidden className={cn("size-10 text-sm after:hidden", className)}>
      <AvatarFallback className={cn("text-[length:inherit] font-bold", ACCENT_CLASSES[tone])}>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
