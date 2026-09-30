import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { SaveSnackDto, Snack } from "@/modules/snacks/types";

export const useSnackAPI = () => {
  const useGetSnacksQuery = (includeInactive: boolean) =>
    useQuery({
      queryKey: ["snacks", "manage", includeInactive],
      queryFn: () => apiFetch.get<Snack[]>("/snacks", { includeInactive }),
    });
  const useSaveSnackMutation = useMutation({
    mutationFn: (dto: SaveSnackDto) =>
      dto.id ? apiFetch.patch<Snack>(`/snacks/${dto.id}`, dto) : apiFetch.post<Snack>("/snacks", dto),
  });
  return { useGetSnacksQuery, useSaveSnackMutation };
};
