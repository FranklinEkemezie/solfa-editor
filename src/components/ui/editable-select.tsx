import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type EditableSelectOption = { label: string; value: string };

/**
 * A dropdown that reads as plain text until opened.
 *
 * The trigger keeps the surrounding typography so score details look like a
 * printed header, while the popup is a full shadcn Select with keyboard
 * support and an accessible name.
 */
export function EditableSelect({
    value,
    options,
    onChange,
    label,
    className,
}: {
    value: string;
    options: EditableSelectOption[];
    onChange: (value: string) => void;
    label: string;
    className?: string;
}) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger
                aria-label={label}
                className={cn(
                    'h-auto w-auto gap-1 rounded-md border-0 bg-transparent px-1.5 py-0.5 text-sm font-medium text-green-dark',
                    'hover:bg-green-wash focus:border-0 focus:ring-2 focus:ring-green/30 [&>span]:line-clamp-none',
                    className,
                )}
            >
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
