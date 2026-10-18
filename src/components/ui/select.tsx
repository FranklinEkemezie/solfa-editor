import type { ReactNode, SelectHTMLAttributes } from 'react';

type Option = { label: string; value: string };

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
    options: Option[];
    label?: string;
    children?: ReactNode;
};

export function Select({ options, label, className = '', ...props }: SelectProps) {
    return (
        <label className="flex flex-col gap-2">
            {label ? <span className="text-xs font-bold uppercase text-muted">{label}</span> : null}
            <select
                className={`bg-paper border border-line rounded-md px-2 py-2 text-ink outline-none focus:border-green focus:ring-2 focus:ring-green-wash ${className}`.trim()}
                {...props}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </label>
    );
}
