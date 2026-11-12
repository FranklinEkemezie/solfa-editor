import { BeatGlyphs } from '@/features/score-editor/components/score-canvas/beat-glyphs';
import type { BeatView } from '@/features/score-editor/model/score-view';

/**
 * One beat of one part.
 *
 * The subdivision marks are notation rather than interface, so `d.m` and
 * `d,r.m,f` are set at the note's own size and colour, and the mark that closes
 * the beat is drawn the same way: a colon to the next beat, or a slash where
 * the bar falls into its two halves. The button fills its row, which gives the
 * note a generous target without crowding the beats beside it.
 */
export function BeatButton({
    beat,
    closingMark,
    isActive,
    isPlaying,
    ariaLabel,
    onSelect,
}: {
    beat: BeatView;
    /** The mark after this beat, or null for the beat that ends the bar. */
    closingMark: string | null;
    isActive: boolean;
    isPlaying: boolean;
    ariaLabel: string;
    onSelect: () => void;
}) {
    const isEmpty = !beat.items.some((item) => item.kind !== 'rest');

    return (
        <button
            type="button"
            className={`group relative flex h-full flex-1 items-center justify-center rounded-md border-0 bg-transparent font-mono text-[0.65rem] leading-none transition-colors hover:bg-green-wash/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-green ${
                isEmpty ? 'text-ghost' : 'text-ink'
            }`}
            onClick={onSelect}
            aria-label={ariaLabel}
        >
            <span className="flex items-baseline pr-px">
                <BeatGlyphs beat={beat} />
            </span>
            {closingMark ? (
                <span
                    aria-hidden="true"
                    className="absolute right-0 top-1/2 leading-none text-ink"
                    style={{ transform: 'translateY(-50%)' }}
                >
                    {closingMark}
                </span>
            ) : null}
            {isActive || isPlaying ? (
                <span className="absolute bottom-1 h-[3px] w-1/2 rounded-full bg-green-dark" />
            ) : null}
        </button>
    );
}
