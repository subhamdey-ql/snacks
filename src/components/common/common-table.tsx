import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface CommonTableColumn {
  readonly key: string;
  readonly label: string;
  readonly align?: "left" | "right";
  // Stacked mode only: drop the "Label" prefix for self-explanatory cells (the name cell, the action buttons).
  readonly hideLabelOnMobile?: boolean;
}

interface CommonTableProps {
  readonly columns: readonly CommonTableColumn[];
  readonly data: readonly Record<string, React.ReactNode>[];
  // Below md, render each row as a stacked card (label: value lines) instead of a wide scrolling table.
  readonly stackOnMobile?: boolean;
}

// Stacking is CSS-only: the same <table> DOM is kept (no duplicated cells or buttons), the header row is hidden and
// every cell prints its column label from `data-label` via ::before (above its value).
const STACK = {
  table: "max-md:block",
  header: "max-md:hidden",
  body: "max-md:block",
  // Two-column grid: labelled cells pair up side by side, label-less cells (name, actions) span the full width.
  row: "max-md:grid max-md:grid-cols-2 max-md:gap-x-4 max-md:gap-y-3 max-md:px-1 max-md:py-4 max-md:hover:bg-transparent",
  cell: "max-md:flex max-md:min-w-0 max-md:flex-col max-md:items-start max-md:gap-1 max-md:p-0 max-md:text-left max-md:whitespace-normal max-md:before:text-xs max-md:before:font-medium max-md:before:text-muted-foreground max-md:before:content-[attr(data-label)]",
  bare: "max-md:col-span-2 max-md:before:content-none",
} as const;

// Config-driven table; shadcn's Table already scrolls horizontally on narrow screens.
export function CommonTable({ columns, data, stackOnMobile = false }: CommonTableProps): React.JSX.Element {
  const s = (cls: string): string | false => stackOnMobile && cls;
  return (
    <Table className={cn(s(STACK.table))}>
      <TableHeader className={cn(s(STACK.header))}>
        <TableRow className="hover:bg-transparent">
          {columns.map((c) => (
            <TableHead
              key={c.key}
              className={cn("h-10 text-xs font-semibold text-[var(--gos-text-muted)]", c.align === "right" && "text-right")}
            >
              {c.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody className={cn(s(STACK.body))}>
        {data.map((row, i) => (
          <TableRow key={i} className={cn(s(STACK.row))}>
            {columns.map((c) => (
              <TableCell
                key={c.key}
                data-label={c.label}
                className={cn("py-3", c.align === "right" && "text-right", s(STACK.cell), c.hideLabelOnMobile && s(STACK.bare))}
              >
                {row[c.key]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
