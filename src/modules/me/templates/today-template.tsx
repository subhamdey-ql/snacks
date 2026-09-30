"use client";

import { UtensilsCrossed } from "lucide-react";
import { DataEmptyHandler } from "@/components/common/data-empty-handler";
import { InlineNotice } from "@/components/common/inline-notice";
import { PageHeader } from "@/components/common/page-header";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { Card } from "@/components/ui/card";
import { BalanceBanner } from "@/modules/me/components/balance-banner";
import { MenuItemCard } from "@/modules/me/components/menu-item-card";
import { useMeAPI } from "@/modules/me/hooks/useMeAPI";
import { formatDay } from "@/modules/me/utils/format";
import { BadgeTone } from "@/types/enums";

export function TodayTemplate(): React.JSX.Element {
  const { data, isLoading, isError } = useMeAPI().useMyMenuQuery();
  return (
    <div className="stagger flex min-w-0 flex-col gap-4">
      <PageHeader title="Today's menu" description={data ? formatDay(data.date) : "What's on the counter today"} />
      {isError && <InlineNotice tone={BadgeTone.DANGER}>Could not load the menu. Try again in a moment.</InlineNotice>}
      {data && <BalanceBanner remaining={data.remaining} />}
      {isLoading ? (
        <Card className="gap-0 px-4 py-2"><TableSkeleton rows={3} /></Card>
      ) : (
        data && (
          <DataEmptyHandler data={data.items} icon={UtensilsCrossed} emptyMessage="The menu isn't set yet today." hint="Check back in a little while.">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {data.items.map((item) => (
                <MenuItemCard key={item.snackId} item={item} />
              ))}
            </div>
          </DataEmptyHandler>
        )
      )}
    </div>
  );
}
