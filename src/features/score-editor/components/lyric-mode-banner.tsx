import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { PARTS } from '@/domain/music';
import type { LyricTarget } from '@/features/score-editor/hooks/use-lyric-editing';

/**
 * The bar that says a lyric line is being written.
 *
 * Lyric mode changes what the keyboard does, so it must be visible and easy to
 * leave. The note counter doubles as feedback that Space really did move to the
 * next note a singer would sing, skipping rests and held notes.
 */
export function LyricModeBanner({
    target,
    onPrevious,
    onNext,
    onDone,
}: {
    target: LyricTarget | null;
    onPrevious: () => void;
    onNext: () => void;
    onDone: () => void;
}) {
    if (!target) return null;

    const part = PARTS.find((definition) => definition.id === target.part);
    const label = part?.label ?? target.part;

    return (
        <div
            role="status"
            className="flex flex-none flex-wrap items-center gap-x-3 gap-y-1 border-b border-green/30 bg-green-wash/70 px-4 py-1.5 text-xs text-green-dark"
        >
            <span className="font-semibold uppercase tracking-[0.12em]">Lyrics · {label}</span>
            <span className="text-ink-muted">
                Note {target.index + 1} of {target.count}
            </span>
            <span className="hidden text-ink-muted md:inline">
                Type a syllable · Space for the next note · Esc when done
            </span>

            <div className="ml-auto flex items-center gap-1">
                <button
                    type="button"
                    aria-label="Previous note"
                    onClick={onPrevious}
                    disabled={target.index === 0}
                    className="grid size-6 place-items-center rounded text-green-dark hover:bg-paper/70 disabled:opacity-40"
                >
                    <ChevronLeft size={14} strokeWidth={2} />
                </button>
                <button
                    type="button"
                    aria-label="Next note"
                    onClick={onNext}
                    disabled={target.index + 1 >= target.count}
                    className="grid size-6 place-items-center rounded text-green-dark hover:bg-paper/70 disabled:opacity-40"
                >
                    <ChevronRight size={14} strokeWidth={2} />
                </button>
                <button
                    type="button"
                    onClick={onDone}
                    className="ml-1 flex items-center gap-1 rounded border border-green/40 bg-paper px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-green-dark hover:bg-green-wash focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green"
                >
                    <Check size={12} strokeWidth={2.5} />
                    Done
                </button>
            </div>
        </div>
    );
}
