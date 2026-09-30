import type { LucideIcon } from "lucide-react";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface FormDialogHeaderProps {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
}

// Dialog header for add/edit forms: brand-tinted icon tile beside the title and a one-line description.
// pr-10 keeps the title clear of the dialog's close button.
export function FormDialogHeader({ icon: Icon, title, description }: FormDialogHeaderProps): React.JSX.Element {
  return (
    <DialogHeader className="flex-row items-start gap-3 pr-10">
      <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--gos-primary-light)] text-[var(--gos-primary-text)]">
        <Icon className="size-5" />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </div>
    </DialogHeader>
  );
}
