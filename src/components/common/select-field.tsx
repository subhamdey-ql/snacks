import React, { forwardRef, useState } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { type SelectOption } from "@/types/api";

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

const DropdownIconDown = (): React.JSX.Element => (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0">
		<path d="M11.9994 14.308L8.19141 10.5H15.8074L11.9994 14.308Z" fill="currentColor" />
	</svg>
);

const DropdownIconUp = (): React.JSX.Element => (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0">
		<path d="M11.9994 9.692L8.19141 13.5H15.8074L11.9994 9.692Z" fill="currentColor" />
	</svg>
);

// Trigger look: unchanged from the original field. The data-[size=default] and dark: variants beat shadcn's defaults
// (h-8, dark:bg-input/30), which plain h-11 / bg-[...] would not override.
const TRIGGER_CLASS =
	"data-[size=default]:h-11 h-11 w-full min-w-0 justify-start gap-0 rounded-xl border-input bg-[var(--gos-surface)] px-3.5 py-0 text-left text-base transition-[color,box-shadow,border-color] duration-150 focus-visible:ring-ring/20 data-popup-open:border-ring dark:bg-[var(--gos-surface)] dark:hover:bg-[var(--gos-surface)]";

// Popup look: same card as the old dropdown (rounded-xl, hairline border, lg shadow, 200px cap, hidden scrollbar).
const CONTENT_CLASS =
	"max-h-[200px] min-w-[8rem] rounded-xl border border-[var(--gos-border)] p-1.5 text-xs shadow-[var(--gos-shadow-lg)] ring-0 hide-scrollbar";

// Row look: 44px touch rows (36px with a fine pointer); the selected row is tinted blue instead of showing a check.
const ITEM_CLASS =
	"min-h-11 md-fine:min-h-9 rounded-lg px-3 py-1.5 text-sm font-normal transition-colors focus:bg-muted hover:bg-muted data-selected:bg-[var(--gos-blue-light)] data-selected:font-medium data-selected:text-[var(--gos-blue-text)] data-selected:hover:bg-[var(--gos-blue-light)]";

export const SelectField = forwardRef<HTMLButtonElement, SelectFieldProps>(
	({ id, options, value, onChange, leftIcon, rightIcon, placeholder, className, width }, ref) => {
		const [isOpen, setIsOpen] = useState(false);
		const hasValue = value !== undefined && value !== "";
		const selected = hasValue ? options.find((option) => option.value === value) : undefined;

		return (
			<Select
				value={hasValue ? value : null}
				onValueChange={(next) => {
					if (typeof next === "string") onChange(next);
				}}
				open={isOpen}
				onOpenChange={setIsOpen}
				items={options}
			>
				<SelectTrigger
					ref={ref}
					id={id}
					aria-label={placeholder}
					style={width ? { width } : undefined}
					className={cn(TRIGGER_CLASS, className)}
					icon={null}
				>
					<div className="flex w-full min-w-0 items-center justify-between gap-2">
						<div className="flex min-w-0 gap-2">
							{leftIcon}
							<SelectValue className="min-w-0 flex-none truncate text-base">{selected ? selected.label : placeholder}</SelectValue>
						</div>
						{rightIcon || (isOpen ? <DropdownIconUp /> : <DropdownIconDown />)}
					</div>
				</SelectTrigger>
				<SelectContent
					alignItemWithTrigger={false}
					scrollArrows={false}
					style={width ? { width } : undefined}
					className={CONTENT_CLASS}
				>
					{options.map((option) => (
						<SelectItem key={option.value} value={option.value} indicator={false} className={ITEM_CLASS}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		);
	}
);

SelectField.displayName = "SelectField";
