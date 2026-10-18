import { Pencil } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type EditableTextProps = {
    value: string;
    /** Called with the new value after a successful edit. */
    onCommit: (value: string) => void;
    /** Used as the accessible name and in the "Edit …" hint. */
    label: string;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
    inputProps?: InputHTMLAttributes<HTMLInputElement>;
    /**
     * Normalise or reject the raw draft. Return a string to commit it, or
     * `null` to discard the edit (for example when a number is out of range).
     */
    transform?: (raw: string) => string | null;
};

/**
 * Text that reads as ordinary content until it is activated, then becomes an
 * input. Enter or blur commits, Escape restores the previous value.
 */
export function EditableText({
    value,
    onCommit,
    label,
    placeholder,
    className,
    inputClassName,
    inputProps,
    transform,
}: EditableTextProps) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!editing) setDraft(value);
    }, [value, editing]);

    useEffect(() => {
        if (editing) inputRef.current?.select();
    }, [editing]);

    const commit = () => {
        const next = transform ? transform(draft) : draft;
        setEditing(false);
        if (next === null || next === value) return;
        onCommit(next);
    };

    if (editing) {
        return (
            <input
                {...inputProps}
                ref={inputRef}
                aria-label={label}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onBlur={commit}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        commit();
                    }
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        setDraft(value);
                        setEditing(false);
                    }
                    event.stopPropagation();
                }}
                className={cn(
                    'rounded-md border border-line bg-paper px-2 py-1 text-ink outline-none',
                    'focus:border-green focus:ring-2 focus:ring-green-wash',
                    inputClassName,
                )}
            />
        );
    }

    return (
        <button
            type="button"
            onClick={() => setEditing(true)}
            title={`Edit ${label.toLowerCase()}`}
            className={cn(
                'group/edit inline-flex max-w-full items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left',
                'hover:bg-green-wash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/30',
                className,
            )}
        >
            <span className={cn('truncate', value ? '' : 'text-muted')}>
                {value || placeholder}
            </span>
            <Pencil className="h-3.5 w-3.5 shrink-0 text-muted opacity-0 transition-opacity group-hover/edit:opacity-100 group-focus-visible/edit:opacity-100" />
        </button>
    );
}
