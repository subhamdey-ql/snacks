import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  readonly rows?: number;
}

// Placeholder rows while a list loads: a circle (avatar/icon) + two text lines + a trailing pill per row,
// so the page keeps its shape instead of jumping from a spinner to a table.
export function TableSkeleton({ rows = 5 }: TableSkeletonProps): React.JSX.Element {
  return (
    <div role="status" aria-label="Loading" className="flex flex-col divide-y divide-[var(--gos-border)]">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-2/5 rounded-md" />
            <Skeleton className="h-3 w-1/4 rounded-md" />
          </div>
          <Skeleton className="hidden h-6 w-16 rounded-full sm:block" />
        </div>
      ))}
    </div>
  );
}
