import {
  Apple,
  Banana,
  Cake,
  Candy,
  Cherry,
  Citrus,
  Coffee,
  Cookie,
  Croissant,
  CupSoda,
  Donut,
  Drumstick,
  Egg,
  Grape,
  IceCreamCone,
  Pizza,
  Popcorn,
  Sandwich,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: readonly LucideIcon[] = [
  Cookie, Pizza, Coffee, Popcorn, Apple, Sandwich, IceCreamCone, Croissant, CupSoda, Candy,
  Donut, Cherry, Cake, Banana, Citrus, Drumstick, Egg, Grape,
];

// Sticker colours cycle through the food palette (mango, tomato, herb, amber, berry).
const TINTS: readonly string[] = [
  "text-[var(--gos-yellow)]",
  "text-[var(--gos-primary)]",
  "text-[var(--gos-green)]",
  "text-[var(--gos-orange)]",
  "text-[var(--gos-red)]",
];

// Enough cells to cover a large desktop; the grid below clips the overflow.
const CELLS = 120;

// Faint food "stickers" behind every page. Fixed to the viewport and sent behind all content (-z-10), so cards,
// sidebar and bars cover them and they only show in the gaps. The grid auto-fills any screen size; icons are
// picked with a stride of 7 (coprime with the list length) so neighbours rarely match, and tilt alternates.
export function FoodBackdrop(): React.JSX.Element {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] auto-rows-[7.5rem] overflow-hidden opacity-[0.13] dark:opacity-[0.1]"
    >
      {Array.from({ length: CELLS }, (_, i) => {
        const Icon = ICONS[(i * 7) % ICONS.length] ?? Cookie;
        return (
          <span key={i} className="flex items-center justify-center">
            <Icon
              strokeWidth={1.5}
              className={cn("size-9", TINTS[(i * 3) % TINTS.length], i % 2 ? "rotate-12" : "-rotate-12", i % 3 === 0 && "scale-125")}
            />
          </span>
        );
      })}
    </div>
  );
}
