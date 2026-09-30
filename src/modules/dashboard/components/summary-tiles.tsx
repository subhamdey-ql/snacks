"use client";

import { Coins, Cookie, Users } from "lucide-react";
import { StatCard } from "@/components/common/stat-card";
import { useDashboardAPI } from "@/modules/dashboard/hooks/useDashboardAPI";
import { AccentTone } from "@/types/enums";

export function SummaryTiles(): React.JSX.Element {
  const { data, isLoading, isError } = useDashboardAPI().useSummaryQuery();
  // Loading shows a skeleton, an error shows a dash; the line below says why.
  const pick = (n: number | undefined): number | null | undefined => (isLoading ? null : n);
  return (
    <section aria-label="This month so far" className="flex flex-col gap-2">
      <div className="stagger grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard icon={Cookie} label="Snacks today" value={pick(data?.todayEntries)} tone={AccentTone.YELLOW} />
        <StatCard icon={Coins} label="Credits used this month" value={pick(data?.monthCredits)} tone={AccentTone.BLUE} />
        <StatCard icon={Users} label="Employees served this month" value={pick(data?.monthEmployees)} tone={AccentTone.GREEN} />
      </div>
      {isError && <p className="text-sm text-[var(--gos-text-muted)]">Could not load today&apos;s numbers. Refresh to try again.</p>}
    </section>
  );
}
