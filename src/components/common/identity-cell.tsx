interface IdentityCellProps {
  // Avatar or icon tile shown before the text.
  readonly leading: React.ReactNode;
  readonly title: string;
  readonly subtitle?: string;
}

// Table "who/what" cell: leading visual + a name that wraps (long names never widen the page) + a muted sub-line.
export function IdentityCell({ leading, title, subtitle }: IdentityCellProps): React.JSX.Element {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {leading}
      <div className="min-w-0 max-w-[14rem] whitespace-normal sm:max-w-xs">
        <p className="font-semibold text-[var(--gos-text)] [overflow-wrap:anywhere]">{title}</p>
        {subtitle && <p className="text-xs text-[var(--gos-text-muted)] [overflow-wrap:anywhere]">{subtitle}</p>}
      </div>
    </div>
  );
}
