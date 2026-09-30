import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Pagination as PaginationNav,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";

interface Props {
  readonly page: number;
  readonly totalPages: number;
  readonly onPageChange: (page: number) => void;
}

// Previous/Next are real buttons (no URLs to link to), wrapped in shadcn's pagination landmark + list.
// 44px tap targets; 40px only on a wide screen with a mouse (md-fine).
export function Pagination({ page, totalPages, onPageChange }: Props): React.JSX.Element | null {
  if (totalPages <= 1) return null;
  return (
    <PaginationNav className="mx-0 mt-4">
      <PaginationContent className="w-full justify-between gap-2">
        <PaginationItem>
          <Button variant="outline" className="h-11 gap-1 px-3 md-fine:h-10" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            <ChevronLeft className="size-4" aria-hidden />
            Previous
          </Button>
        </PaginationItem>
        <PaginationItem>
          <span className="text-sm text-[var(--gos-text-muted)] tabular-nums">
            Page <span className="font-semibold text-[var(--gos-text)]">{page}</span> of {totalPages}
          </span>
        </PaginationItem>
        <PaginationItem>
          <Button variant="outline" className="h-11 gap-1 px-3 md-fine:h-10" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            Next
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </PaginationNav>
  );
}
