import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Primary/submit button in the brand blue (shadcn's default variant would use --primary instead).
export function CommonButton({ className, ...props }: React.ComponentProps<typeof Button>): React.JSX.Element {
  return <Button className={cn("h-10 sm:h-8 bg-[var(--gos-blue)] text-white hover:bg-[var(--gos-blue-dark)]", className)} {...props} />;
}
