import { useQueryClient } from "@tanstack/react-query";
import { openErrorToast, openSuccessToast, openWarningToast } from "@/components/common/toast";
import { useEmployeeAPI } from "@/modules/employees/hooks/useEmployeeAPI";
import type { SaveEmployeeDto } from "@/modules/employees/types";

export const useEmployeeActions = () => {
  const queryClient = useQueryClient();
  const { useSaveEmployeeMutation, useImportEmployeesMutation } = useEmployeeAPI();
  const saveMutation = useSaveEmployeeMutation;
  const importMutation = useImportEmployeesMutation;

  const saveEmployee = (dto: SaveEmployeeDto, onDone?: () => void): void =>
    saveMutation.mutate(dto, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["employees"] });
        openSuccessToast({ message: "Employee saved" });
        onDone?.();
      },
      onError: (error) => openErrorToast({ error }),
    });

  const importEmployees = (file: File, onDone?: () => void): void =>
    importMutation.mutate(file, {
      onSuccess: ({ imported, errors }) => {
        queryClient.invalidateQueries({ queryKey: ["employees"] });
        if (imported === 0 && errors.length === 0) openWarningToast({ message: "No employees found in the file" });
        if (imported > 0) openSuccessToast({ message: `Imported ${imported}` });
        if (errors.length > 0) {
          const more = errors.length > 3 ? ` and ${errors.length - 3} more` : "";
          openWarningToast({ message: `Skipped: ${errors.slice(0, 3).join("; ")}${more}` });
        }
        onDone?.();
      },
      onError: (error) => openErrorToast({ error }),
    });

  return { saveEmployee, isSaving: saveMutation.isPending, importEmployees, isImporting: importMutation.isPending };
};
