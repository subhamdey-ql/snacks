import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { Input as UiInput } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Only what the form kit adds on top of shadcn's Input: the 650px cap, 2-line-safe padding and placeholder sizing.
const inputVariants = cva("max-w-[650px] py-2 disabled:cursor-not-allowed disabled:opacity-50", {
	defaultVariants: {
		variant: "default",
	},
	variants: {
		variant: {
			accent: "bg-accent/10 placeholder:text-xs placeholder:font-light",
			default: "placeholder:text-xs",
		},
	},
});

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, VariantProps<typeof inputVariants> {
	PrefixIcon?: React.ReactNode;
	prefixIconClassName?: string;
	inputContainerClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, inputContainerClassName, prefixIconClassName, type, variant, PrefixIcon, ...props }, ref) => {
		return (
			<div className={cn("flex w-full items-center", inputContainerClassName)}>
				{PrefixIcon && <div className={cn("pl-3", prefixIconClassName)}>{PrefixIcon}</div>}
				<UiInput type={type} className={cn(inputVariants({ className, variant }))} ref={ref} {...props} />
			</div>
		);
	}
);
Input.displayName = "Input";

export { Input };
