interface Props {
  readonly data: readonly unknown[];
  readonly emptyMessage: string;
  readonly children: React.ReactNode;
}

export function DataEmptyHandler({ data, emptyMessage, children }: Props): React.JSX.Element {
  if (data.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  return <>{children}</>;
}
