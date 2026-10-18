import type { ReactNode } from 'react';

type FieldProps = { label: string; hint?: string; children: ReactNode };

export function Field({ label, hint, children }: FieldProps) {
    return (
        <label className="block flex flex-col gap-2">
            {label ? <span className="text-sm text-muted mb-1">{label}</span> : null}
            {children}
            {hint ? <span className="text-xs text-muted">{hint}</span> : null}
        </label>
    );
}
