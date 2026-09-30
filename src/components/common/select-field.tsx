import React, { forwardRef, useState } from "react";

import { type SelectOption } from "@/types/api";
import { cn } from "@/lib/utils";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface SelectFieldProps {
	value: string;
	onChange: (value: string) => void;
	options: SelectOption[];
	rightIcon?: React.ReactNode;
	leftIcon?: React.ReactNode;
	placeholder?: string;
	className?: string;
	width?: string;
	id?: string;
}

const DropdownIconDown = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
		<path d="M11.9994 14.308L8.19141 10.5H15.8074L11.9994 14.308Z" fill="currentColor" />
	</svg>
);

const DropdownIconUp = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
		<path d="M11.9994 9.692L8.19141 13.5H15.8074L11.9994 9.692Z" fill="currentColor" />
	</svg>
);

export const SelectField = forwardRef<HTMLButtonElement, SelectFieldProps>(
	({ id, options, value, onChange, leftIcon, rightIcon, placeholder, className, width }, ref) => {
		const isValue = value !== undefined && value !== "";
		const selectedOption = isValue ? options.find((option) => option.value === value) : null;
		const [isOpen, setIsOpen] = useState(false);

		return (
			<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
				<DropdownMenuTrigger asChild>
					<button
						ref={ref}
						id={id}
						type="button"
						aria-label={placeholder}
						style={width ? { width } : undefined}
						className={cn("flex h-11 w-full min-w-0 items-center rounded-xl border border-input bg-[var(--gos-surface)] px-3.5 text-left transition-[color,box-shadow,border-color] duration-150 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 data-[state=open]:border-ring", className)}
					>
						<div className="flex w-full min-w-0 items-center justify-between gap-2">
							<div className="flex min-w-0 gap-2">
								{leftIcon}
								<span className="truncate text-base">{selectedOption ? selectedOption.label : placeholder}</span>
							</div>
							{rightIcon || (isOpen ? <DropdownIconUp /> : <DropdownIconDown />)}
						</div>
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					style={width ? { width } : undefined}
					className="w-[var(--radix-dropdown-menu-trigger-width)] hide-scrollbar max-h-[200px] overflow-hidden overflow-y-scroll"
				>
					{options.map((option) => {
						const isSelected = value === option.value;
						return (
							<DropdownMenuItem key={option.value} selected={isSelected} onSelect={() => onChange(option.value)}>
								<div className="flex items-center gap-2">
									{option.label}
								</div>
							</DropdownMenuItem>
						);
					})}
				</DropdownMenuContent>
			</DropdownMenu>
		);
	}
);

SelectField.displayName = "SelectField";
