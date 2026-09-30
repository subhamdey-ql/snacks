"use client";

import { History } from "lucide-react";
import { CreditMeter } from "@/components/common/credit-meter";
import { InlineNotice } from "@/components/common/inline-notice";
import { PageHeader } from "@/components/common/page-header";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { Card } from "@/components/ui/card";
import { WalletEntries } from "@/modules/me/components/wallet-entries";
import { useMeAPI } from "@/modules/me/hooks/useMeAPI";
import { formatDay } from "@/modules/me/utils/format";
import { BadgeTone } from "@/types/enums";

export function WalletTemplate(): React.JSX.Element {
  const { data, isLoading, isError } = useMeAPI().useMyWalletQuery();
  return (
    <div className="stagger flex min-w-0 flex-col gap-4">
      <PageHeader title="My wallet" description={data ? `${data.employee.name} · credits reset on ${formatDay(data.resetsOn)}` : "Your snack credits this month"} />
      {isError && <InlineNotice tone={BadgeTone.DANGER}>Could not load your wallet. Try again in a moment.</InlineNotice>}
      {isLoading && <Card className="gap-0 px-4 py-2"><TableSkeleton rows={4} /></Card>}
      {data && (
        <>
          <Card className="items-center p-4 sm:p-6">
            <CreditMeter balance={data.balance} />
          </Card>
          <Card className="gap-4 p-4 sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--gos-text)]">
              <History className="size-4 text-[var(--gos-text-muted)]" aria-hidden />
              This month
            </h2>
            <WalletEntries entries={data.entries} />
          </Card>
        </>
      )}
    </div>
  );
}
