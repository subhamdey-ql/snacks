import { useQueryClient } from "@tanstack/react-query";
import { openErrorToast, openSuccessToast } from "@/components/common/toast";
import { useAllowanceAPI } from "@/modules/settings/hooks/useAllowanceAPI";
import type { AllowanceMap } from "@/modules/settings/types";

export const useAllowanceActions = () => {
  const queryClient = useQueryClient();
  const mutation = useAllowanceAPI().useSaveAllowanceMutation;
  const saveAllowance = (dto: AllowanceMap): void =>
    mutation.mutate(dto, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["allowance"] });
        // Balances are derived from the allowance.
        queryClient.invalidateQueries({ queryKey: ["employee-month"] });
        openSuccessToast({ message: "Monthly credits saved" });
      },
      onError: (error) => openErrorToast({ error }),
    });
  return { saveAllowance, isSaving: mutation.isPending };
};
