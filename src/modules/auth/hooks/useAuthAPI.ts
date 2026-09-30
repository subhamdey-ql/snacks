import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { LoginDto } from "@/modules/auth/types";

export const useAuthAPI = () => {
  const useLoginMutation = useMutation({
    mutationFn: (dto: LoginDto) => apiFetch.post<{ ok: boolean }>("/auth/login", dto),
  });
  const useLogoutMutation = useMutation({
    mutationFn: () => apiFetch.post<{ ok: boolean }>("/auth/logout"),
  });
  return { useLoginMutation, useLogoutMutation };
};
