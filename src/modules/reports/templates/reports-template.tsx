"use client";

import { useQueryState } from "nuqs";
import { CommonLoader } from "@/components/common/common-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmployeeReportTable } from "@/modules/reports/components/employee-report-table";
import { SnackReportTable } from "@/modules/reports/components/snack-report-table";
import { useReportAPI } from "@/modules/reports/hooks/useReportAPI";

const MONTH_RE = /^\d{4}-\d{2}$/;

export function ReportsTemplate(): React.JSX.Element {
  const [m, setM] = useQueryState("m");
  const { data: report, isLoading } = useReportAPI().useGetReportQuery(m);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* Before a month is picked, show the server's current IST month. */}
        <Input
          type="month"
          className="w-full sm:w-48"
          value={m && MONTH_RE.test(m) ? m : (report?.month ?? "")}
          onChange={(e) => setM(e.target.value || null)}
        />
        {report && (
          // Base UI button has no asChild; `render` swaps in a plain link (nativeButton off since it is an <a>).
          <Button variant="outline" nativeButton={false} render={<a href={`/api/reports/export?m=${report.month}`} />}>
            Download CSV
          </Button>
        )}
      </div>
      {isLoading || !report ? (
        <CommonLoader />
      ) : (
        <>
          <h2 className="text-lg font-semibold">Employees</h2>
          <EmployeeReportTable rows={report.perEmployee} />
          <h2 className="text-lg font-semibold">Snacks</h2>
          <SnackReportTable rows={report.perSnack} />
        </>
      )}
    </div>
  );
}
