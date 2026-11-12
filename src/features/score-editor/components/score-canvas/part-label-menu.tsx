import { useEffect, useRef, useState } from 'react';
import { PARTS } from '@/domain/music';
import { useScoreInteractions } from '@/features/score-editor/components/score-canvas/score-interactions-context';
import { PART_ROW_HEIGHT_PX } from '@/features/score-editor/layout/page-geometry';
import { cn } from '@/lib/utils';

type PartDefinition = (typeof PARTS)[number];

/**
 * A part's name, and the menu of things that belong to the part.
 *
 * The label is the natural place to ask for lyrics: they are written under a
 * part, not under the score as a whole. The menu is local and small rather than
 * a second dialog, so adding lyrics is one click from the music it belongs to.
 */
export function PartLabelMenu({ part, hasLyrics }: { part: PartDefinition; hasLyrics: boolean }) {
    const { onBeginLyrics, onRemoveLyrics } = useScoreInteractions();
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        const closeOnOutsidePointer = (event: PointerEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };

        document.addEventListener('pointerdown', closeOnOutsidePointer);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('pointerdown', closeOnOutsidePointer);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [open]);

    const beginLyrics = () => {
        setOpen(false);
        onBeginLyrics(part.id);
    };

    const removeLyrics = () => {
        setOpen(false);
        onRemoveLyrics(part.id);
    };

    return (
        <div
            ref={rootRef}
            className="relative flex items-center"
            style={{ height: PART_ROW_HEIGHT_PX }}
        >
            <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={`${part.label} options`}
                title={`${part.label} options`}
                onClick={() => setOpen((current) => !current)}
                className={cn(
                    'flex h-6 w-full items-center rounded px-0.5 text-left font-serif text-[10px] font-bold text-green-dark',
                    'hover:bg-green-wash/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green',
                    open && 'bg-green-wash',
                )}
            >
                {part.shortLabel}
            </button>

            {open ? (
                <div
                    role="menu"
                    aria-label={`${part.label} options`}
                    className="absolute left-0 top-full z-30 min-w-40 rounded-md border border-line bg-paper p-1 shadow-sheet"
                    onClick={(event) => event.stopPropagation()}
                >
                    <button
                        type="button"
                        role="menuitem"
                        onClick={beginLyrics}
                        className="block w-full rounded px-2 py-1.5 text-left text-xs text-ink hover:bg-green-wash focus:bg-green-wash focus:outline-none"
                    >
                        {hasLyrics ? 'Edit lyrics' : 'Add lyrics'}
                    </button>
                    {hasLyrics ? (
                        <button
                            type="button"
                            role="menuitem"
                            onClick={removeLyrics}
                            className="block w-full rounded px-2 py-1.5 text-left text-xs text-red-600 hover:bg-red-500/10 focus:bg-red-500/10 focus:outline-none"
                        >
                            Remove lyrics
                        </button>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
