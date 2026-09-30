import { Coins, Cookie, Users } from "lucide-react";
import { StatCard } from "@/components/common/stat-card";
import type { ReportStats } from "@/modules/reports/utils/report-stats";
import { AccentTone } from "@/types/enums";

// null = report still loading (StatCard shows skeletons).
export function ReportStatCards({ stats }: { readonly stats: ReportStats | null }): React.JSX.Element {
  return (
    <section aria-label="Month totals" className="stagger grid grid-cols-3 gap-2 sm:gap-4">
      <StatCard icon={Coins} label="Credits used" value={stats && stats.creditsUsed} tone={AccentTone.BLUE} />
      <StatCard icon={Cookie} label="Snacks recorded" value={stats && stats.snacksRecorded} tone={AccentTone.YELLOW} />
      <StatCard icon={Users} label="Employees with usage" value={stats && stats.employeesWithUsage} tone={AccentTone.GREEN} />
    </section>
  );
}
