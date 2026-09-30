import { ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/common/status-badge";
import { UserAvatar } from "@/components/common/user-avatar";
import type { EmployeeHit } from "@/modules/dashboard/types";
import { BadgeTone } from "@/types/enums";

interface Props {
  readonly employee: EmployeeHit;
  readonly onSelect: (id: number) => void;
}

// One search hit as a tappable surface card on the hero gradient.
export function SearchResultItem({ employee, onSelect }: Props): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={() => onSelect(employee.id)}
      className="group flex min-h-14 w-full min-w-0 items-center gap-3 rounded-2xl bg-[var(--gos-surface)] p-3 text-left shadow-[var(--gos-shadow)] transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-px hover:shadow-[var(--gos-shadow-lg)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--gos-yellow)]"
    >
      <UserAvatar name={employee.name} seed={employee.code} />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-[var(--gos-text)] [overflow-wrap:anywhere]">{employee.name}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-[var(--gos-text-muted)]">
          {employee.code}
          <StatusBadge tone={BadgeTone.INFO}>{employee.type}</StatusBadge>
        </span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-[var(--gos-text-muted)] transition-transform group-hover:translate-x-0.5" aria-hidden />
    </button>
  );
}
