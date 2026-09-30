interface PageHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly actions?: React.ReactNode;
}

// The one strong headline per screen; actions wrap under the title on mobile.
export function PageHeader({ title, description, actions }: PageHeaderProps): React.JSX.Element {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--gos-text)] [overflow-wrap:anywhere] md:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-[var(--gos-text-muted)] md:text-base">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
