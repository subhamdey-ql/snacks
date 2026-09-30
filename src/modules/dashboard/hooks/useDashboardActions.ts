import { useQueryClient } from "@tanstack/react-query";
import { openErrorToast, openSuccessToast } from "@/components/common/toast";
import { useDashboardAPI } from "@/modules/dashboard/hooks/useDashboardAPI";
import type { RecordDto } from "@/modules/dashboard/types";

export const useDashboardActions = () => {
  const queryClient = useQueryClient();
  const { useRecordMutation, useVoidMutation } = useDashboardAPI();
  const recordMutation = useRecordMutation;
  const voidMutation = useVoidMutation;

  // This employee's month and the home tiles are the only datasets a record/void changes.
  const refresh = (employeeId: number): Promise<unknown> =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["employee-month", employeeId] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
    ]);

  const record = (dto: RecordDto, onDone?: () => void): void =>
    recordMutation.mutate(dto, {
      onSuccess: () => {
        refresh(dto.employeeId);
        openSuccessToast({ message: "Recorded" });
        onDone?.();
      },
      // Surfaces the server's "Not enough credits…" (422) message.
      onError: (error) => openErrorToast({ error }),
    });

  const voidEntry = (id: number, employeeId: number): void =>
    voidMutation.mutate(id, {
      onSuccess: () => {
        refresh(employeeId);
        openSuccessToast({ message: "Entry undone" });
      },
      onError: (error) => openErrorToast({ error }),
    });

  return { record, isRecording: recordMutation.isPending, voidEntry, isVoiding: voidMutation.isPending };
};
