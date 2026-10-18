import type { InputHTMLAttributes } from 'react';

export function TextField(props: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            className="bg-paper border border-line rounded-md px-2 py-2 text-ink outline-none focus:border-green focus:ring-2 focus:ring-green-wash"
            {...props}
        />
    );
}
