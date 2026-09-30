import { InlineNotice } from "@/components/common/inline-notice";
import { StatusBadge } from "@/components/common/status-badge";
import { UserAvatar } from "@/components/common/user-avatar";
import { CreditMeter } from "@/modules/dashboard/components/credit-meter";
import type { EmployeeMonth } from "@/modules/dashboard/types";
import { BadgeTone } from "@/types/enums";

// Left column: who this is, their credit meter, and any notice blocking or explaining recording.
export function EmployeeProfile({ month: { employee, balance } }: { readonly month: EmployeeMonth }): React.JSX.Element {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar name={employee.name} seed={employee.code} className="size-14 text-lg" />
        <div className="min-w-0">
          <h1 className="text-xl leading-tight font-bold tracking-tight text-[var(--gos-text)] [overflow-wrap:anywhere] sm:text-2xl">{employee.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--gos-text-muted)]">
            {employee.code}
            <StatusBadge tone={BadgeTone.INFO}>{employee.type}</StatusBadge>
            {!employee.active && <StatusBadge tone={BadgeTone.MUTED}>Inactive</StatusBadge>}
          </p>
        </div>
      </div>
      <CreditMeter balance={balance} />
      {balance.allowance === 0 && (
        <InlineNotice tone={BadgeTone.DANGER}>Monthly credits are not set for this employee type. Set them in Settings.</InlineNotice>
      )}
      {!employee.active && <InlineNotice tone={BadgeTone.MUTED}>Inactive employee. Recording is turned off.</InlineNotice>}
    </div>
  );
}
