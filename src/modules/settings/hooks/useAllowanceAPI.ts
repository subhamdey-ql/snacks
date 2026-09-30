import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { AllowanceMap } from "@/modules/settings/types";

export const useAllowanceAPI = () => {
  const useGetAllowanceQuery = () =>
    useQuery({ queryKey: ["allowance"], queryFn: () => apiFetch.get<AllowanceMap>("/settings/allowance") });
  const useSaveAllowanceMutation = useMutation({
    mutationFn: (dto: AllowanceMap) => apiFetch.put<AllowanceMap>("/settings/allowance", dto),
  });
  return { useGetAllowanceQuery, useSaveAllowanceMutation };
};
