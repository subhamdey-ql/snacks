import { RecordForm } from "@/modules/dashboard/components/record-form";
import { MonthEntries } from "@/modules/dashboard/components/month-entries";
import type { EmployeeMonth } from "@/modules/dashboard/types";

interface Props {
  readonly month: EmployeeMonth;
}

export function EmployeeCard({ month: { employee, balance, entries } }: Props): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold [overflow-wrap:anywhere]">{employee.name}</h2>
        <p className="text-sm text-muted-foreground">
          {employee.code} · {employee.type}
        </p>
        <p className="mt-2 text-3xl font-bold">{balance.remaining} credits left</p>
      </div>
      {balance.allowance === 0 && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-[var(--gos-red)]">
          Monthly credits are not set for this employee type. Set them in Settings.
        </p>
      )}
      {employee.active ? (
        <RecordForm employeeId={employee.id} remaining={balance.remaining} />
      ) : (
        <p className="rounded-md bg-muted p-3 text-sm">Inactive employee. Recording is turned off.</p>
      )}
      <MonthEntries employeeId={employee.id} entries={entries} />
    </div>
  );
}
