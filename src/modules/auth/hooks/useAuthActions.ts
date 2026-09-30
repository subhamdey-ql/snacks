import { useRouter } from "next/navigation";
import { openErrorToast } from "@/components/common/toast";
import { homeFor } from "@/lib/routes";
import { useAuthAPI } from "@/modules/auth/hooks/useAuthAPI";
import type { RequestOtpDto, RequestOtpResult, VerifyOtpDto } from "@/modules/auth/types";

export const useRequestOtp = () => {
  const mutation = useAuthAPI().useRequestOtpMutation;
  const requestCode = (dto: RequestOtpDto, onSent: (result: RequestOtpResult) => void): void =>
    mutation.mutate(dto, { onSuccess: onSent, onError: (error) => openErrorToast({ error }) });
  return { requestCode, isSending: mutation.isPending };
};

export const useVerifyOtp = () => {
  const router = useRouter();
  const mutation = useAuthAPI().useVerifyOtpMutation;
  const verifyCode = (dto: VerifyOtpDto): void =>
    mutation.mutate(dto, {
      onSuccess: ({ role }) => router.replace(homeFor(role)),
      onError: (error) => openErrorToast({ error }),
    });
  return { verifyCode, isVerifying: mutation.isPending };
};

export const useLogout = () => {
  const router = useRouter();
  const mutation = useAuthAPI().useLogoutMutation;
  const logout = (): void => mutation.mutate(undefined, {
      onSuccess: () => router.replace("/login"),
      onError: (error) => openErrorToast({ error }),
    });
  return { logout, isPending: mutation.isPending };
};
