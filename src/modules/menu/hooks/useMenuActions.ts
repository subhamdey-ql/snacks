import { useQueryClient } from "@tanstack/react-query";
import { openErrorToast, openSuccessToast } from "@/components/common/toast";
import { useMenuAPI } from "@/modules/menu/hooks/useMenuAPI";
import type { TodayMenu } from "@/modules/menu/types";

export const useMenuActions = () => {
  const queryClient = useQueryClient();
  const { useSaveMenuMutation, useCopyYesterdayMutation } = useMenuAPI();
  const saveMutation = useSaveMenuMutation;
  const copyMutation = useCopyYesterdayMutation;

  // The response is the saved menu, so the cache is updated directly instead of refetching.
  const store = (menu: TodayMenu, message: string): void => {
    queryClient.setQueryData(["menu", "today"], menu);
    openSuccessToast({ message });
  };

  const saveMenu = (snackIds: number[]): void =>
    saveMutation.mutate(snackIds, { onSuccess: (menu) => store(menu, "Today's menu saved"), onError: (error) => openErrorToast({ error }) });
  const copyYesterday = (): void =>
    copyMutation.mutate(undefined, { onSuccess: (menu) => store(menu, "Copied yesterday's menu"), onError: (error) => openErrorToast({ error }) });

  return { saveMenu, isSaving: saveMutation.isPending, copyYesterday, isCopying: copyMutation.isPending };
};
