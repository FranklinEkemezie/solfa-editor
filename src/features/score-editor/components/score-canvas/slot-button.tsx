import { beatMarkBetween } from '@/domain/music';
import type { EditorSlot } from '@/features/score-editor/adapters/editor-document-schema';

/**
 * One beat of one part.
 *
 * The subdivision marks are notation rather than interface, so `d.m` and
 * `d,r.m,f` are set at the note's own size and colour, and the colon that closes
 * a beat is drawn the same way. The button fills its row, which gives the note
 * a generous target without crowding the beats beside it.
 */
export function SlotButton({
    slot,
    isActive,
    isPlaying,
    ariaLabel,
    onSelect,
}: {
    slot: EditorSlot;
    isActive: boolean;
    isPlaying: boolean;
    ariaLabel: string;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            className={`group relative flex h-full flex-1 items-center justify-center rounded-md border-0 bg-transparent font-mono text-[0.8125rem] leading-none transition-colors hover:bg-green-wash/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-green ${
                slot.notes.length > 0 ? 'text-ink' : 'text-ghost'
            }`}
            onClick={(event) => {
                event.stopPropagation();
                onSelect();
            }}
            aria-label={ariaLabel}
        >
            <span className="flex items-baseline pr-[2px]">
                {slot.notes.map((note, index) => (
                    <span key={note.id} className="flex items-baseline">
                        {index > 0 ? (
                            <span aria-hidden="true" className="px-[1px]">
                                {beatMarkBetween(slot.division, index - 1)}
                            </span>
                        ) : null}
                        <span className="relative flex flex-col items-center">
                            <span>{note.continuation ? '—' : (note.syllable ?? ' ')}</span>
                            {note.lyric ? (
                                <span className="absolute -bottom-3 text-[9px] font-bold uppercase tracking-[0.08em] text-ink-muted">
                                    {note.lyric}
                                </span>
                            ) : null}
                        </span>
                    </span>
                ))}
            </span>
            <span
                aria-hidden="true"
                className="group-last:hidden absolute right-0 top-1/2 leading-none text-ink"
                style={{ transform: 'translateY(-50%)' }}
            >
                :
            </span>
            {isActive || isPlaying ? (
                <span className="absolute bottom-1 h-[3px] w-1/2 rounded-full bg-green-dark" />
            ) : null}
        </button>
    );
}
