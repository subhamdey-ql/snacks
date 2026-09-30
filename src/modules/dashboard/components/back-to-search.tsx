import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// Clears the selection (the template drops ?emp). 44px tap target, 40px on a wide screen with a mouse.
export function BackToSearch({ onBack }: { readonly onBack: () => void }): React.JSX.Element {
  return (
    <Button variant="ghost" className="h-11 self-start px-2.5 text-[var(--gos-text-muted)] hover:text-[var(--gos-text)] md-fine:h-10" onClick={onBack}>
      <ArrowLeft className="size-4" aria-hidden />
      Search another employee
    </Button>
  );
}
