import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** A labelled control in a dialog form. */
export function FormField({
    label,
    hint,
    children,
    className,
}: {
    label: string;
    hint?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <label className={cn('grid gap-1.5', className)}>
            <span className="text-sm font-medium text-ink-muted">{label}</span>
            {children}
            {hint ? <span className="text-xs text-muted">{hint}</span> : null}
        </label>
    );
}
