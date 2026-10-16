import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react';

type LabelProps = { label: string; hint?: string; children: React.ReactNode };

export function Field({ label, hint, children }: LabelProps) {
    return (
        <label className={`block flex flex-col gap-2`}>
            {label ? <span className="text-sm text-muted mb-1">{label}</span> : null}
            {children}
            {hint ? <span className="text-xs text-muted">{hint}</span> : null}
        </label>
    );
}

export function TextField(props: InputHTMLAttributes<HTMLInputElement>) {
    return <input className="bg-paper border border-line rounded-md px-2 py-2 text-ink outline-none focus:border-green focus:ring-2 focus:ring-green-wash" {...props} />;
}

export function SelectField(props: SelectHTMLAttributes<HTMLSelectElement>) {
    return <select className="bg-paper border border-line rounded-md px-2 py-2 text-ink outline-none focus:border-green focus:ring-2 focus:ring-green-wash" {...props} />;
}
