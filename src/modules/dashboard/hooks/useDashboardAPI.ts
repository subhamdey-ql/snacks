import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { DashboardSummary, EmployeeHit, EmployeeMonth, RecordDto, SnackOption } from "@/modules/dashboard/types";
import type { Paginated } from "@/types/api";

export const useDashboardAPI = () => {
  const useSearchEmployeesQuery = (q: string) =>
    useQuery({
      queryKey: ["employees", "search", q],
      enabled: q.trim().length > 0,
      queryFn: () => apiFetch.get<Paginated<EmployeeHit>>("/employees", { q, limit: 10, active: true }),
    });
  const useActiveSnacksQuery = () =>
    useQuery({ queryKey: ["snacks", "active"], queryFn: () => apiFetch.get<SnackOption[]>("/snacks") });
  const useEmployeeMonthQuery = (id: number | null) =>
    useQuery({
      queryKey: ["employee-month", id],
      enabled: id !== null,
      queryFn: () => apiFetch.get<EmployeeMonth>(`/employees/${id}/month`),
    });
  const useSummaryQuery = () =>
    useQuery({ queryKey: ["dashboard-summary"], queryFn: () => apiFetch.get<DashboardSummary>("/dashboard/summary") });
  const useRecordMutation = useMutation({ mutationFn: (dto: RecordDto) => apiFetch.post<{ ok: true }>("/consumptions", dto) });
  const useVoidMutation = useMutation({ mutationFn: (id: number) => apiFetch.post<{ ok: true }>(`/consumptions/${id}/void`) });
  return { useSummaryQuery, useSearchEmployeesQuery, useActiveSnacksQuery, useEmployeeMonthQuery, useRecordMutation, useVoidMutation };
};
