import { Apple, Candy, Coffee, Cookie, Croissant, CupSoda, IceCreamCone, Pizza, Popcorn, Sandwich, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Spot {
  readonly icon: LucideIcon;
  // Position (% of the banner), size and tilt. Fixed, not random, so server and client render the same.
  readonly className: string;
}

const SPOTS: readonly Spot[] = [
  { icon: Cookie, className: "top-[8%] left-[6%] size-9 -rotate-12" },
  { icon: Coffee, className: "top-[14%] left-[38%] size-8 rotate-6" },
  { icon: Popcorn, className: "top-[6%] right-[26%] size-10 rotate-12" },
  { icon: Pizza, className: "top-[46%] left-[2%] size-10 rotate-12" },
  { icon: IceCreamCone, className: "right-[6%] top-[38%] size-9 -rotate-6" },
  { icon: Sandwich, className: "bottom-[10%] left-[24%] size-9 rotate-6" },
  { icon: Candy, className: "right-[30%] bottom-[8%] size-8 -rotate-12" },
  { icon: Croissant, className: "right-[12%] bottom-[30%] size-9 rotate-12" },
  { icon: CupSoda, className: "top-[52%] left-[46%] size-8 -rotate-6" },
  { icon: Apple, className: "bottom-[6%] left-[5%] size-8 rotate-6" },
];

// Decorative layer of faint food outlines for a gradient banner. Put it inside a `relative overflow-hidden` parent.
export function FoodPattern({ className }: { readonly className?: string }): React.JSX.Element {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 text-[var(--gos-hero-ink)] opacity-15", className)}>
      {SPOTS.map(({ icon: Icon, className: spot }, i) => (
        <Icon key={i} className={cn("absolute", spot)} strokeWidth={1.5} />
      ))}
    </div>
  );
}
