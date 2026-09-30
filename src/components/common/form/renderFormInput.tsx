import { type FieldValues, type Path, type ControllerRenderProps } from "react-hook-form";
import { SelectField } from "@/components/common/select-field";
import { Input } from "@/components/common/Input/Input";
import React from "react";
import { Eye, EyeOff } from "lucide-react";
import { useFormField } from "@/components/common/form/form";
import type { SelectOption } from "@/types/api";

// Trimmed to the four variants this app uses.
// numberInput is a plain integer input (no comma/currency formatting); the field value stays a
// digit string, so schemas should use z.coerce.number().

export interface INumberInputFieldVariant {
	fieldVariant: "numberInput";
}

export interface IInputFieldVariant {
	fieldVariant: "input";
}

export interface ISelectFieldVariant {
	fieldVariant: "selectField";
	options: Array<SelectOption>;
	placeHolder: string;
	rightIcon?: React.ReactNode;
}

export interface IPasswordInputFieldVariant {
	fieldVariant: "passwordInput";
	showPassword: boolean;
	handlePasswordVisibility: () => void;
}

export interface BaseField {
	label?: string;
	className?: string;
	placeHolder?: string;
	renderError?: boolean;
}

export type FormFieldProps<TData> = (
	| IInputFieldVariant
	| ISelectFieldVariant
	| INumberInputFieldVariant
	| IPasswordInputFieldVariant
) &
	BaseField & {
		name: Path<TData>;
		description?: string;
	};

interface IProps<TData extends FieldValues> {
	field: ControllerRenderProps<TData, Path<TData>>;
	sectionField: FormFieldProps<TData>;
}

export function RenderFormInput<TData extends FieldValues>({ field, sectionField }: IProps<TData>): React.JSX.Element {
	// FormControl passes the id to this component, not the DOM input, so read it from context.
	const { formItemId } = useFormField();
	switch (sectionField.fieldVariant) {
		case "numberInput":
			return (
				<Input
					{...field}
					id={formItemId}
					value={field.value ?? ""}
					type="number"
					inputMode="numeric"
					step={1}
					placeholder={sectionField.placeHolder}
					className={sectionField.className}
				/>
			);
		case "passwordInput":
			return (
				<div className="relative flex items-center">
					<Input
						id={formItemId}
						type={sectionField.showPassword ? "text" : "password"}
						placeholder={sectionField.placeHolder}
						className="pr-10"
						{...field}
					/>
					<button
						type="button"
						aria-label={sectionField.showPassword ? "Hide password" : "Show password"}
						onClick={sectionField.handlePasswordVisibility}
						className="absolute right-2 flex h-10 w-10 items-center sm:h-7 sm:w-7 justify-center rounded text-gray-400 hover:bg-transparent hover:text-gray-600"
					>
						{sectionField.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
					</button>
				</div>
			);
		case "selectField":
			return (
				<SelectField
					id={formItemId}
					options={sectionField.options}
					value={field.value}
					onChange={field.onChange}
					placeholder={sectionField.placeHolder}
					rightIcon={sectionField.rightIcon}
				/>
			);
		case "input":
			return <Input {...field} id={formItemId} value={field.value ?? ""} placeholder={sectionField.placeHolder} className={sectionField.className} />;
	}
}
