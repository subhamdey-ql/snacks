import { AlertTriangle, CircleSlash, Info, CircleCheck, type LucideIcon } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { BadgeTone } from "@/types/enums";

// Same tone set as StatusBadge so a page speaks one colour language for status.
const TONE: Readonly<Record<BadgeTone, { readonly className: string; readonly icon: LucideIcon }>> = {
  [BadgeTone.INFO]: { className: "bg-[var(--gos-blue-light)] text-[var(--gos-blue-text)]", icon: Info },
  [BadgeTone.SUCCESS]: { className: "bg-[var(--gos-green-light)] text-[var(--gos-green)]", icon: CircleCheck },
  [BadgeTone.WARNING]: { className: "bg-[var(--gos-orange-light)] text-[var(--gos-orange)]", icon: AlertTriangle },
  [BadgeTone.DANGER]: { className: "bg-[var(--gos-red-light)] text-[var(--gos-red)]", icon: AlertTriangle },
  [BadgeTone.MUTED]: { className: "bg-[var(--gos-surface-muted)] text-[var(--gos-text)]", icon: CircleSlash },
};

interface InlineNoticeProps {
  readonly tone: BadgeTone;
  readonly children: React.ReactNode;
  // Overrides the tone's default icon.
  readonly icon?: LucideIcon;
  readonly className?: string;
}

// Soft tinted callout with a leading icon, for errors and explanations inside a page or card.
export function InlineNotice({ tone, children, icon, className }: InlineNoticeProps): React.JSX.Element {
  const Icon = icon ?? TONE[tone].icon;
  return (
    // Alert's default border, grid layout and icon offset are overridden so the callout looks exactly as before.
    <Alert
      className={cn(
        "flex items-start gap-2.5 rounded-xl border-0 p-3 text-sm has-[>svg]:gap-x-2.5 *:[svg]:translate-y-0",
        TONE[tone].className,
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span className="min-w-0">{children}</span>
    </Alert>
  );
}
