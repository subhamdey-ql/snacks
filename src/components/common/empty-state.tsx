import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  readonly title: string;
  readonly icon?: LucideIcon;
  readonly hint?: string;
}

// Centred "nothing here yet" block: optional icon in a soft circle, a title, an optional hint.
export function EmptyState({ title, icon: Icon, hint }: EmptyStateProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      {Icon && (
        <span aria-hidden className="mb-1 flex size-12 items-center justify-center rounded-full bg-[var(--gos-surface-muted)] text-[var(--gos-text-muted)]">
          <Icon className="size-6" />
        </span>
      )}
      <p className="text-sm font-medium text-[var(--gos-text)]">{title}</p>
      {hint && <p className="text-sm text-[var(--gos-text-muted)]">{hint}</p>}
    </div>
  );
}
