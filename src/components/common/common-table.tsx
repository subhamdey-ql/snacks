import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface CommonTableColumn {
  readonly key: string;
  readonly label: string;
  readonly align?: "left" | "right";
}

interface CommonTableProps {
  readonly columns: readonly CommonTableColumn[];
  readonly data: readonly Record<string, React.ReactNode>[];
}

// Config-driven table; shadcn's Table already scrolls horizontally on narrow screens.
export function CommonTable({ columns, data }: CommonTableProps): React.JSX.Element {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((c) => (
            <TableHead key={c.key} className={cn(c.align === "right" && "text-right")}>{c.label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, i) => (
          <TableRow key={i}>
            {columns.map((c) => (
              <TableCell key={c.key} className={cn(c.align === "right" && "text-right")}>{row[c.key]}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
