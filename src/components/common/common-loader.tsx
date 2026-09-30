import { Loader2 } from "lucide-react";

export function CommonLoader(): React.JSX.Element {
  return (
    <div className="flex justify-center py-8" role="status" aria-label="Loading">
      <Loader2 className="h-6 w-6 animate-spin text-[var(--gos-primary)]" />
    </div>
  );
}
