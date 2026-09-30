"use client";

import { useMemo } from "react";
import { useQueryState } from "nuqs";
import { Cookie, Download, Users } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmployeeReportTable } from "@/modules/reports/components/employee-report-table";
import { ReportSection } from "@/modules/reports/components/report-section";
import { ReportStatCards } from "@/modules/reports/components/report-stats";
import { SnackReportTable } from "@/modules/reports/components/snack-report-table";
import { useReportAPI } from "@/modules/reports/hooks/useReportAPI";
import { reportStats } from "@/modules/reports/utils/report-stats";

const MONTH_RE = /^\d{4}-\d{2}$/;

export function ReportsTemplate(): React.JSX.Element {
  const [m, setM] = useQueryState("m");
  const { data: report, isLoading } = useReportAPI().useGetReportQuery(m);
  const stats = useMemo(() => (report ? reportStats(report) : null), [report]);
  const loading = isLoading || !report;

  return (
    <div className="stagger flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Reports"
        description="Usage by month"
        actions={
          <>
            {/* Before a month is picked, show the server's current IST month. */}
            <Input
              type="month"
              aria-label="Month"
              className="h-10 w-full sm:w-44"
              value={m && MONTH_RE.test(m) ? m : (report?.month ?? "")}
              onChange={(e) => setM(e.target.value || null)}
            />
            {report && (
              // Base UI button has no asChild; `render` swaps in a plain link (nativeButton off since it is an <a>).
              <Button
                variant="outline"
                className="h-10 gap-1.5 px-3.5"
                nativeButton={false}
                render={<a href={`/api/reports/export?m=${report.month}`} />}
              >
                <Download className="size-4" aria-hidden />
                Download CSV
              </Button>
            )}
          </>
        }
      />
      <ReportStatCards stats={loading ? null : stats} />
      <ReportSection icon={Users} title="Employees">
        {loading ? <TableSkeleton /> : <EmployeeReportTable rows={report.perEmployee} />}
      </ReportSection>
      <ReportSection icon={Cookie} title="Snacks">
        {loading ? <TableSkeleton rows={3} /> : <SnackReportTable rows={report.perSnack} />}
      </ReportSection>
    </div>
  );
}
