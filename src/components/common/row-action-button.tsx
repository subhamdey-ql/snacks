import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RowActionButtonProps extends Omit<React.ComponentProps<typeof Button>, "children"> {
  readonly icon: LucideIcon;
  readonly label: string;
}

// Icon + label action inside a table row: 44px tap target; 40px on a wide screen with a mouse (md-fine), where a row is >=40px tall anyway.
export function RowActionButton({ icon: Icon, label, variant = "outline", className, ...props }: RowActionButtonProps): React.JSX.Element {
  return (
    <Button variant={variant} className={cn("h-11 gap-1.5 px-3 md-fine:h-10", className)} {...props}>
      <Icon className="size-4" aria-hidden />
      {label}
    </Button>
  );
}
