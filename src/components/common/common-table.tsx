import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface CommonTableColumn {
  readonly key: string;
  readonly label: string;
  readonly align?: "left" | "right";
  // Stacked mode only: drop the "Label" prefix for a self-explanatory cell.
  readonly hideLabelOnMobile?: boolean;
  // Stacked mode only: leave this cell out of the phone card (e.g. a detail the card title already carries).
  readonly hideOnMobile?: boolean;
  // Stacked mode only: this column holds the row's buttons; it becomes a full-width row of >=44px buttons at the card's foot.
  readonly isActions?: boolean;
}

interface CommonTableProps {
  readonly columns: readonly CommonTableColumn[];
  readonly data: readonly Record<string, React.ReactNode>[];
  // Below md, render each row as a stacked card instead of a wide scrolling table.
  readonly stackOnMobile?: boolean;
}

// Stacking is CSS-only: the same <table> DOM is kept (no duplicated cells or buttons, one source of truth for
// screen readers), the header row is hidden and every labelled cell prints its column label from `data-label`
// via ::before. The first column is the card title; the actions column is the card's full-width button row.
const STACK = {
  table: "max-md:block",
  header: "max-md:hidden",
  body: "max-md:block",
  // Two-column grid: labelled cells pair up side by side, title/actions span the full width.
  row: "max-md:grid max-md:grid-cols-2 max-md:gap-x-4 max-md:gap-y-3 max-md:px-1 max-md:py-4 max-md:hover:bg-transparent",
  cell: "max-md:flex max-md:min-w-0 max-md:flex-col max-md:items-start max-md:gap-1 max-md:p-0 max-md:text-left max-md:whitespace-normal max-md:before:text-xs max-md:before:font-medium max-md:before:text-muted-foreground max-md:before:content-[attr(data-label)]",
  bare: "max-md:col-span-2 max-md:before:content-none",
  hidden: "max-md:hidden",
  // Children stretch to the full width and every button/link inside shares the row equally at 44px tall.
  actions:
    "max-md:items-stretch max-md:*:w-full max-md:[&_:is(button,a)]:h-11 max-md:[&_:is(button,a)]:flex-1 max-md:border-t max-md:border-[var(--gos-border)] max-md:pt-3",
} as const;

function stackedCellClass(column: CommonTableColumn, index: number): string {
  if (column.hideOnMobile) return STACK.hidden;
  if (column.isActions) return cn(STACK.cell, STACK.bare, STACK.actions);
  // The first column is the card title: full width, no label.
  if (index === 0 || column.hideLabelOnMobile) return cn(STACK.cell, STACK.bare);
  return STACK.cell;
}

// Config-driven table; without stackOnMobile, shadcn's Table scrolls horizontally on narrow screens.
export function CommonTable({ columns, data, stackOnMobile = false }: CommonTableProps): React.JSX.Element {
  return (
    <Table className={cn(stackOnMobile && STACK.table)}>
      <TableHeader className={cn(stackOnMobile && STACK.header)}>
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
      <TableBody className={cn(stackOnMobile && STACK.body)}>
        {data.map((row, i) => (
          <TableRow key={i} className={cn(stackOnMobile && STACK.row)}>
            {columns.map((c, ci) => (
              <TableCell
                key={c.key}
                data-label={c.label}
                className={cn("py-3", c.align === "right" && "text-right", stackOnMobile && stackedCellClass(c, ci))}
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
