import type { LucideIcon } from "lucide-react";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

interface EmptyStateProps {
  readonly title: string;
  readonly icon?: LucideIcon;
  readonly hint?: string;
}

// Centred "nothing here yet" block: optional icon in a soft circle, a title, an optional hint.
// Empty's defaults (padding, balanced wrapping, max width, 32px icon tile) are overridden to keep the original look.
export function EmptyState({ title, icon: Icon, hint }: EmptyStateProps): React.JSX.Element {
  return (
    <Empty className="flex-none gap-2 p-0 py-6 text-wrap">
      <EmptyHeader className="max-w-none gap-2">
        {Icon && (
          <EmptyMedia
            variant="icon"
            aria-hidden
            className="mb-1 size-12 rounded-full bg-[var(--gos-surface-muted)] text-[var(--gos-text-muted)] [&_svg:not([class*='size-'])]:size-6"
          >
            <Icon className="size-6" />
          </EmptyMedia>
        )}
        <EmptyTitle className="font-sans text-sm font-medium tracking-normal text-[var(--gos-text)]">{title}</EmptyTitle>
        {hint && <EmptyDescription className="text-sm leading-5 text-[var(--gos-text-muted)]">{hint}</EmptyDescription>}
      </EmptyHeader>
    </Empty>
  );
}
