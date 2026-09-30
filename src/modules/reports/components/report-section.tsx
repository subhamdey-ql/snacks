import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Props {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly children: React.ReactNode;
}

// Card with an icon heading around one report table.
export function ReportSection({ icon: Icon, title, children }: Props): React.JSX.Element {
  return (
    <Card className="gap-1 px-4 pt-4 pb-2 sm:px-5">
      <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--gos-text)]">
        <Icon className="size-4 text-[var(--gos-text-muted)]" aria-hidden />
        {title}
      </h2>
      {children}
    </Card>
  );
}
