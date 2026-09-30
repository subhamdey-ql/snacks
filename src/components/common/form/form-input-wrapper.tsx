import React from "react";
import { type UseFormReturn, type FieldValues } from "react-hook-form";
import { FormMessage, FormControl, FormField, FormItem, FormLabel } from "@/components/common/form/form";
import { type FormFieldProps, RenderFormInput } from "@/components/common/form/renderFormInput";

interface IProps<TData extends FieldValues> {
	form: UseFormReturn<TData>;
	fieldConfig: FormFieldProps<TData>;
}

export function FormInputWrapper<TData extends FieldValues>({
	form,
	fieldConfig: { renderError = true, ...fieldConfig },
}: IProps<TData>) {
	return (
		<FormField
			control={form.control}
			name={fieldConfig.name}
			render={({ field }) => (
				<FormItem className="flex flex-col">
					{fieldConfig.label && <FormLabel>{fieldConfig?.label}</FormLabel>}
					<FormControl>
						<RenderFormInput field={field} sectionField={fieldConfig} />
					</FormControl>
					{renderError && (
						<FormMessage className="text-sm text-[var(--gos-red)]" />
					)}
				</FormItem>
			)}
		/>
	);
}
