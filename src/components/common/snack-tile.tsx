import {
  Candy,
  Coffee,
  Cookie,
  Croissant,
  CupSoda,
  IceCreamCone,
  Pizza,
  Popcorn,
  Sandwich,
  Apple,
  type LucideIcon,
} from "lucide-react";
import { ACCENT_CLASSES } from "@/components/common/accent-classes";
import { snackKind } from "@/lib/snack-kind";
import { cn } from "@/lib/utils";
import { AccentTone, SnackKind } from "@/types/enums";

const LOOK: Readonly<Record<SnackKind, { readonly icon: LucideIcon; readonly tone: AccentTone }>> = {
  [SnackKind.COOKIE]: { icon: Cookie, tone: AccentTone.ORANGE },
  [SnackKind.COFFEE]: { icon: Coffee, tone: AccentTone.ORANGE },
  [SnackKind.POPCORN]: { icon: Popcorn, tone: AccentTone.YELLOW },
  [SnackKind.PIZZA]: { icon: Pizza, tone: AccentTone.PRIMARY },
  [SnackKind.SANDWICH]: { icon: Sandwich, tone: AccentTone.GREEN },
  [SnackKind.FRUIT]: { icon: Apple, tone: AccentTone.GREEN },
  [SnackKind.ICE_CREAM]: { icon: IceCreamCone, tone: AccentTone.RED },
  [SnackKind.DRINK]: { icon: CupSoda, tone: AccentTone.BLUE },
  [SnackKind.SWEET]: { icon: Candy, tone: AccentTone.RED },
  [SnackKind.BAKERY]: { icon: Croissant, tone: AccentTone.ORANGE },
};

interface SnackTileProps {
  readonly name: string;
  readonly className?: string;
}

// Rounded tile with a food icon that matches the snack's name (tea -> cup, chips -> popcorn, ...).
export function SnackTile({ name, className }: SnackTileProps): React.JSX.Element {
  const { icon: Icon, tone } = LOOK[snackKind(name)];
  return (
    <span aria-hidden className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", ACCENT_CLASSES[tone], className)}>
      <Icon className="size-5" />
    </span>
  );
}
