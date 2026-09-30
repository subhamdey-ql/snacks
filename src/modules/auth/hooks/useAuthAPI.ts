import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { RequestOtpDto, RequestOtpResult, VerifyOtpDto, VerifyOtpResult } from "@/modules/auth/types";

export const useAuthAPI = () => {
  const useRequestOtpMutation = useMutation({
    mutationFn: (dto: RequestOtpDto) => apiFetch.post<RequestOtpResult>("/auth/otp/request", dto),
  });
  const useVerifyOtpMutation = useMutation({
    mutationFn: (dto: VerifyOtpDto) => apiFetch.post<VerifyOtpResult>("/auth/otp/verify", dto),
  });
  const useLogoutMutation = useMutation({
    mutationFn: () => apiFetch.post<{ ok: boolean }>("/auth/logout"),
  });
  return { useRequestOtpMutation, useVerifyOtpMutation, useLogoutMutation };
};
