import { AccentTone } from "@/types/enums";

// Soft fill + ink per accent. Yellow uses the solid fill with dark ink: yellow text is unreadable on white.
export const ACCENT_CLASSES: Readonly<Record<AccentTone, string>> = {
  [AccentTone.BLUE]: "bg-[var(--gos-blue-light)] text-[var(--gos-blue-text)]",
  [AccentTone.YELLOW]: "bg-[var(--gos-yellow)] text-[var(--gos-on-yellow)]",
  [AccentTone.GREEN]: "bg-[var(--gos-green-light)] text-[var(--gos-green)]",
  [AccentTone.ORANGE]: "bg-[var(--gos-orange-light)] text-[var(--gos-orange)]",
  [AccentTone.RED]: "bg-[var(--gos-red-light)] text-[var(--gos-red)]",
};
