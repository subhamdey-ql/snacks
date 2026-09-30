import { useRouter } from "next/navigation";
import { openErrorToast } from "@/components/common/toast";
import { useAuthAPI } from "@/modules/auth/hooks/useAuthAPI";
import type { LoginDto } from "@/modules/auth/types";

export const useLogin = () => {
  const router = useRouter();
  const mutation = useAuthAPI().useLoginMutation;
  const login = (dto: LoginDto): void =>
    mutation.mutate(dto, {
      onSuccess: () => router.replace("/"),
      onError: (error) => openErrorToast({ error }),
    });
  return { login, isPending: mutation.isPending };
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
