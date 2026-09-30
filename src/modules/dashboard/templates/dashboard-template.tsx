"use client";

import { parseAsInteger, useQueryState } from "nuqs";
import { CommonLoader } from "@/components/common/common-loader";
import { Button } from "@/components/ui/button";
import { EmployeeCard } from "@/modules/dashboard/components/employee-card";
import { EmployeeSearch } from "@/modules/dashboard/components/employee-search";
import { useDashboardAPI } from "@/modules/dashboard/hooks/useDashboardAPI";

export function DashboardTemplate(): React.JSX.Element {
  // ?emp= keeps the selection across a refresh.
  const [emp, setEmp] = useQueryState("emp", parseAsInteger);
  const { data, isLoading, isError } = useDashboardAPI().useEmployeeMonthQuery(emp);

  if (emp === null) return <EmployeeSearch onSelect={(id) => setEmp(id)} />;
  return (
    <div className="flex flex-col gap-4">
      <Button variant="outline" className="h-10 self-start sm:h-8" onClick={() => setEmp(null)}>
        Search another employee
      </Button>
      {isLoading && <CommonLoader />}
      {isError && <p className="text-sm text-[var(--gos-red)]">Could not load this employee.</p>}
      {data && <EmployeeCard month={data} />}
    </div>
  );
}
