import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Report } from "@/modules/reports/types";

export const useReportAPI = () => {
  const useGetReportQuery = (month: string | null) =>
    useQuery({
      queryKey: ["report", month],
      queryFn: () => apiFetch.get<Report>("/reports", month ? { m: month } : undefined),
    });
  return { useGetReportQuery };
};
