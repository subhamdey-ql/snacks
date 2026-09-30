import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Employee, EmployeeListQuery, ImportResult, SaveEmployeeDto } from "@/modules/employees/types";
import type { Paginated } from "@/types/api";

export const useEmployeeAPI = () => {
  // Primitives in the key, so an unchanged search/page never refetches.
  const useGetEmployeesQuery = (query: EmployeeListQuery) =>
    useQuery({
      queryKey: ["employees", query.q, query.page, query.limit],
      queryFn: () => apiFetch.get<Paginated<Employee>>("/employees", query),
    });
  const useSaveEmployeeMutation = useMutation({
    mutationFn: ({ id, ...body }: SaveEmployeeDto) =>
      id ? apiFetch.patch<Employee>(`/employees/${id}`, body) : apiFetch.post<Employee>("/employees", body),
  });
  const useImportEmployeesMutation = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return apiFetch.post<ImportResult>("/employees/import", fd);
    },
  });
  return { useGetEmployeesQuery, useSaveEmployeeMutation, useImportEmployeesMutation };
};
