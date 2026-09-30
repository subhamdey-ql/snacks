"use client";

import { parseAsInteger, useQueryState } from "nuqs";
import { CommonLoader } from "@/components/common/common-loader";
import { InlineNotice } from "@/components/common/inline-notice";
import { BackToSearch } from "@/modules/dashboard/components/back-to-search";
import { EmployeeCard } from "@/modules/dashboard/components/employee-card";
import { HeroSearch } from "@/modules/dashboard/components/hero-search";
import { SummaryTiles } from "@/modules/dashboard/components/summary-tiles";
import { useDashboardAPI } from "@/modules/dashboard/hooks/useDashboardAPI";
import { BadgeTone } from "@/types/enums";

export function DashboardTemplate(): React.JSX.Element {
  // ?emp= keeps the selection across a refresh.
  const [emp, setEmp] = useQueryState("emp", parseAsInteger);
  const { data, isLoading, isError } = useDashboardAPI().useEmployeeMonthQuery(emp);
  const clear = (): void => void setEmp(null);

  if (emp === null) {
    return (
      <div className="flex flex-col gap-4 sm:gap-6">
        <HeroSearch onSelect={(id) => setEmp(id)} />
        <SummaryTiles />
      </div>
    );
  }
  if (data) return <EmployeeCard month={data} onBack={clear} />;
  // Loading/error keep the way back visible so the desk is never stuck on a bad ?emp.
  return (
    <div className="flex flex-col gap-4">
      <BackToSearch onBack={clear} />
      {isLoading && <CommonLoader />}
      {isError && <InlineNotice tone={BadgeTone.DANGER}>Could not load this employee. Search again or refresh.</InlineNotice>}
    </div>
  );
}
