import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Primary/submit button in the brand blue (shadcn's default variant would use --primary instead).
// Gradient runs from a lighter mix of the brand blue down to the brand blue; hover lifts and brightens,
// press scales down. 44px tap target; 40px only on a wide screen with a mouse (md-fine), so touch devices keep 44px in any orientation.
export function CommonButton({ className, ...props }: React.ComponentProps<typeof Button>): React.JSX.Element {
  return (
    <Button
      className={cn(
        "h-11 px-4 md-fine:h-10 rounded-xl text-white font-semibold",
        "bg-[linear-gradient(180deg,color-mix(in_oklab,var(--gos-blue),white_14%),var(--gos-blue))] shadow-[var(--gos-shadow-btn)]",
        "transition-[transform,box-shadow,filter] duration-150 ease-out hover:-translate-y-px hover:brightness-110 active:not-aria-[haspopup]:translate-y-0 active:scale-[0.98]",
        "focus-visible:ring-3 focus-visible:ring-ring/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--gos-page-bg)]",
        "disabled:opacity-55 disabled:shadow-none",
        className,
      )}
      {...props}
    />
  );
}
