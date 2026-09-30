import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { MenuSnack, TodayMenu } from "@/modules/menu/types";

export const useMenuAPI = () => {
  const useTodayMenuQuery = () => useQuery({ queryKey: ["menu", "today"], queryFn: () => apiFetch.get<TodayMenu>("/menu") });
  // Same key as the dashboard's list of active snacks, so the two screens share one cached request.
  const useActiveSnacksQuery = () => useQuery({ queryKey: ["snacks", "active"], queryFn: () => apiFetch.get<MenuSnack[]>("/snacks") });
  const useSaveMenuMutation = useMutation({ mutationFn: (snackIds: number[]) => apiFetch.put<TodayMenu>("/menu", { snackIds }) });
  const useCopyYesterdayMutation = useMutation({ mutationFn: () => apiFetch.post<TodayMenu>("/menu/copy-yesterday") });
  return { useTodayMenuQuery, useActiveSnacksQuery, useSaveMenuMutation, useCopyYesterdayMutation };
};
