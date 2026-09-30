"use client";

import * as React from "react";
import {
	Controller,
	type ControllerProps,
	type FieldPath,
	type FieldValues,
	FormProvider,
	useFormContext,
} from "react-hook-form";

import { cn } from "@/lib/utils";
type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

const Form = FormProvider;

type FormFieldContextValue<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
	name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue);

const FormField = <
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
	...props
}: ControllerProps<TFieldValues, TName>) => {
	return (
		<FormFieldContext.Provider value={{ name: props.name }}>
			<Controller {...props} />
		</FormFieldContext.Provider>
	);
};

const useFormField = () => {
	const fieldContext = React.useContext(FormFieldContext);
	const itemContext = React.useContext(FormItemContext);
	const { getFieldState, formState } = useFormContext();

	const fieldState = getFieldState(fieldContext.name, formState);

	if (!fieldContext) {
		throw new Error("useFormField should be used within <FormField>");
	}

	const { id } = itemContext;

	return {
		formDescriptionId: `${id}-form-item-description`,
		formItemId: `${id}-form-item`,
		formMessageId: `${id}-form-item-message`,
		id,
		name: fieldContext.name,
		...fieldState,
	};
};

type FormItemContextValue = {
	id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => {
		const id = React.useId();

		return (
			<FormItemContext.Provider value={{ id }}>
				<div ref={ref} className={cn("space-y-2", className)} {...props} />
			</FormItemContext.Provider>
		);
	}
);
FormItem.displayName = "FormItem";

const FormLabel = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => {
	const { formItemId } = useFormField();

	return <label ref={ref} className={cn("text-foreground", className)} htmlFor={formItemId} {...props} />;
});
FormLabel.displayName = "FormLabel";

// Custom Slot implementation
const Slot = React.forwardRef<HTMLElement, React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>>(
	({ children, ...props }, ref) => {
		if (!React.isValidElement(children)) {
			return null;
		}

		const child = children as React.ReactElement<React.HTMLAttributes<HTMLElement>> & {
			ref?: React.Ref<HTMLElement>;
		};

		return React.cloneElement(child, {
			...props,
			...child.props,
			ref: mergeRefs([ref, child.ref].filter(Boolean) as React.Ref<HTMLElement>[]),
		} as React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> });
	}
);
Slot.displayName = "Slot";

const mergeRefs = <T,>(refs: Array<React.Ref<T>>) => {
	return (value: T | null) => {
		refs.forEach((ref) => {
			if (typeof ref === "function") {
				ref(value);
			} else if (ref != null) {
				(ref as React.MutableRefObject<T | null>).current = value;
			}
		});
	};
};

const FormControl = React.forwardRef<React.ElementRef<typeof Slot>, React.ComponentPropsWithoutRef<typeof Slot>>(
	({ ...props }, ref) => {
		const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

		return (
			<Slot
				ref={ref}
				id={formItemId}
				aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
				aria-invalid={!!error}
				{...props}
			/>
		);
	}
);
FormControl.displayName = "FormControl";

const FormDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
	({ className, ...props }, ref) => {
		const { formDescriptionId } = useFormField();

		return (
			<p ref={ref} id={formDescriptionId} className={cn("text-muted-foreground text-xs font-normal", className)} {...props} />
		);
	}
);
FormDescription.displayName = "FormDescription";

const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
	({ className, children, ...props }, ref) => {
		const { error, formMessageId } = useFormField();
		const body = error?.message ? String(error?.message) : children;

		if (!body) {
			return null;
		}

		return (
			<p ref={ref} id={formMessageId} className={cn("text-xs font-normal text-[var(--gos-red)]", className)} {...props}>
				{body}
			</p>
		);
	}
);
FormMessage.displayName = "FormMessage";

function HorizontalFormBlockWrapper({
	children,
	childrenWrapperClassName,
}: React.PropsWithChildren<{
	childrenWrapperClassName?: string;
}>) {
	return <div className={cn("my-3 grid grid-cols-2 gap-4", childrenWrapperClassName)}>{children}</div>;
}

export {
	useFormField,
	Form,
	FormItem,
	FormLabel,
	FormControl,
	FormDescription,
	FormMessage,
	FormField,
	HorizontalFormBlockWrapper,
};
