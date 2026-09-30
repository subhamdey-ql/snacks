import type { Report } from "@/modules/reports/types";

export interface ReportStats {
  readonly creditsUsed: number;
  readonly snacksRecorded: number;
  readonly employeesWithUsage: number;
}

// Headline numbers derived from the already-loaded report (no extra request).
// Credits come from perSnack so they match the snack table's total exactly.
export function reportStats(report: Report): ReportStats {
  return {
    creditsUsed: report.perSnack.reduce((sum, s) => sum + s.credits, 0),
    snacksRecorded: report.perSnack.reduce((sum, s) => sum + s.qty, 0),
    employeesWithUsage: report.perEmployee.filter((e) => e.used > 0).length,
  };
}
