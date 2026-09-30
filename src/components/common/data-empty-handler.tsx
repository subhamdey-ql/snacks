import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";

interface Props {
  readonly data: readonly unknown[];
  readonly emptyMessage: string;
  readonly children: React.ReactNode;
  // Optional: turns the plain message into an EmptyState with this icon.
  readonly icon?: LucideIcon;
}

export function DataEmptyHandler({ data, emptyMessage, children, icon }: Props): React.JSX.Element {
  if (data.length > 0) return <>{children}</>;
  if (icon) return <EmptyState title={emptyMessage} icon={icon} />;
  return <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
}
