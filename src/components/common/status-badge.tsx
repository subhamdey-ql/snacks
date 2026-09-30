import { Badge } from "@/components/ui/badge";
import { BadgeTone } from "@/types/enums";

interface StatusBadgeProps {
  readonly tone: BadgeTone;
  readonly children: React.ReactNode;
  readonly className?: string;
}

// Soft pill for statuses (Active/Inactive, low balance, ...). Each tone maps 1:1 to a Badge variant.
export function StatusBadge({ tone, children, className }: StatusBadgeProps): React.JSX.Element {
  return (
    <Badge variant={tone} className={className}>
      {children}
    </Badge>
  );
}
