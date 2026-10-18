import { beatMarkBetween } from '@/domain/music';
import type { EditorSlot } from '@/features/score-editor/adapters/editor-document-schema';

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
            className={`group relative flex h-10 min-w-[38px] flex-1 items-center justify-center rounded-lg border-0 bg-transparent font-mono text-[1.2rem] font-normal leading-none focus:outline-none ${slot.notes.length > 0 ? 'text-ink' : 'text-ghost'}`}
            onClick={(event) => {
                event.stopPropagation();
                onSelect();
            }}
            aria-label={ariaLabel}
        >
            {slot.notes.length > 0 ? (
                slot.notes.map((note, index) => (
                    <span key={note.id} className="flex items-baseline">
                        {index > 0 ? (
                            <span aria-hidden="true" className="px-[1px] text-ink-muted">
                                {beatMarkBetween(slot.division, index - 1)}
                            </span>
                        ) : null}
                        <span className="relative flex flex-col items-center">
                            <span className={note.syllable ? 'text-ink' : 'text-ghost'}>
                                {note.continuation ? '—' : (note.syllable ?? ' ')}
                            </span>
                            {note.lyric ? (
                                <span className="absolute -bottom-3 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-muted">
                                    {note.lyric}
                                </span>
                            ) : null}
                        </span>
                    </span>
                ))
            ) : (
                <span aria-hidden="true"> </span>
            )}
            <span className="group-last:hidden absolute right-[-2px] top-1/2 z-[2] inline-block -translate-y-1/2 text-[1.2rem] leading-none text-ink">
                :
            </span>
            {isActive || isPlaying ? (
                <span className="absolute bottom-2 h-2 w-2/4 border-b-2 border-green-dark animate-pulse" />
            ) : null}
        </button>
    );
}
