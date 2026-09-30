import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// Clears the selection (the template drops ?emp). 40px tall on mobile, compact from sm.
export function BackToSearch({ onBack }: { readonly onBack: () => void }): React.JSX.Element {
  return (
    <Button variant="ghost" className="h-10 self-start px-2.5 text-[var(--gos-text-muted)] hover:text-[var(--gos-text)] sm:h-9" onClick={onBack}>
      <ArrowLeft className="size-4" aria-hidden />
      Search another employee
    </Button>
  );
}
