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
  // When the table's own box is narrower than 36rem (every phone, and a tablet or landscape phone next to the
  // sidebar), render each row as a stacked card instead of a wide, cramped or sideways-scrolling table.
  readonly stackOnMobile?: boolean;
}

// Stacking is CSS-only and keyed to a container query (the wrapper's width, not the viewport's), because the
// sidebar appears at md and leaves a 768px tablet only ~400px for the table. It keeps the same <table> DOM
// (no duplicated cells or buttons, one source of truth for screen readers): the header row is hidden and every
// labelled cell prints its column label from `data-label` via ::before. The first column is the card title; the
// actions column is the card's full-width button row.
const STACK = {
  table: "@max-xl:block",
  header: "@max-xl:hidden",
  body: "@max-xl:block",
  // Two-column grid: labelled cells pair up side by side, title/actions span the full width.
  row: "@max-xl:grid @max-xl:grid-cols-2 @max-xl:gap-x-4 @max-xl:gap-y-3 @max-xl:px-1 @max-xl:py-4 @max-xl:hover:bg-transparent",
  cell: "@max-xl:flex @max-xl:min-w-0 @max-xl:flex-col @max-xl:items-start @max-xl:gap-1 @max-xl:p-0 @max-xl:text-left @max-xl:whitespace-normal @max-xl:before:text-xs @max-xl:before:font-medium @max-xl:before:text-muted-foreground @max-xl:before:content-[attr(data-label)]",
  bare: "@max-xl:col-span-2 @max-xl:before:content-none",
  hidden: "@max-xl:hidden",
  // Children stretch to the full width and every button/link inside shares the row equally at 44px tall.
  actions:
    "@max-xl:items-stretch @max-xl:*:w-full @max-xl:[&_:is(button,a)]:h-11 @max-xl:[&_:is(button,a)]:flex-1 @max-xl:border-t @max-xl:border-[var(--gos-border)] @max-xl:pt-3",
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
  const table = (
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
  return stackOnMobile ? <div className="@container">{table}</div> : table;
}
