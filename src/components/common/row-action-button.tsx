import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RowActionButtonProps extends Omit<React.ComponentProps<typeof Button>, "children"> {
  readonly icon: LucideIcon;
  readonly label: string;
}

// Icon + label action inside a table row. h-10 below sm keeps the >=40px mobile tap target; compact h-8 from sm.
export function RowActionButton({ icon: Icon, label, variant = "outline", className, ...props }: RowActionButtonProps): React.JSX.Element {
  return (
    <Button variant={variant} className={cn("h-10 gap-1.5 px-3 sm:h-8 sm:px-2.5", className)} {...props}>
      <Icon className="size-4" aria-hidden />
      {label}
    </Button>
  );
}
