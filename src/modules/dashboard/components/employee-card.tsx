import { History } from "lucide-react";
import { Card } from "@/components/ui/card";
import { BackToSearch } from "@/modules/dashboard/components/back-to-search";
import { EmployeeProfile } from "@/modules/dashboard/components/employee-profile";
import { MonthEntries } from "@/modules/dashboard/components/month-entries";
import { RecordForm } from "@/modules/dashboard/components/record-form";
import type { EmployeeMonth } from "@/modules/dashboard/types";

interface Props {
  readonly month: EmployeeMonth;
  readonly onBack: () => void;
}

// Two columns from lg (at md the sidebar leaves ~450px, too narrow for two); stacked below.
// A soft blue wash across the top ties the card to the brand without a heavy header bar.
export function EmployeeCard({ month, onBack }: Props): React.JSX.Element {
  const { employee, balance, entries } = month;
  return (
    <div className="animate-fade-in-up flex flex-col gap-4">
      <Card className="gap-3 bg-[linear-gradient(180deg,var(--gos-primary-light),var(--gos-surface)_10rem)] p-4 sm:p-6">
        <BackToSearch onBack={onBack} />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-8">
          <EmployeeProfile month={month} />
          {employee.active && <RecordForm employeeId={employee.id} remaining={balance.remaining} />}
        </div>
      </Card>
      <Card className="gap-4 p-4 sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--gos-text)]">
          <History className="size-4 text-[var(--gos-text-muted)]" aria-hidden />
          This month
        </h2>
        <MonthEntries employeeId={employee.id} entries={entries} />
      </Card>
    </div>
  );
}
