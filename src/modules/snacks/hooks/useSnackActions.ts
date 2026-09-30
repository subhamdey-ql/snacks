import { useQueryClient } from "@tanstack/react-query";
import { openErrorToast, openSuccessToast } from "@/components/common/toast";
import { useSnackAPI } from "@/modules/snacks/hooks/useSnackAPI";
import type { SaveSnackDto } from "@/modules/snacks/types";

export const useSnackActions = () => {
  const queryClient = useQueryClient();
  const mutation = useSnackAPI().useSaveSnackMutation;
  const saveSnack = (dto: SaveSnackDto, onDone?: () => void): void =>
    mutation.mutate(dto, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["snacks"] });
        openSuccessToast({ message: "Snack saved" });
        onDone?.();
      },
      onError: (error) => openErrorToast({ error }),
    });
  return { saveSnack, isSaving: mutation.isPending };
};
