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
            className={`group relative flex h-10 min-w-[38px] flex-1 items-center justify-center rounded-lg border-0 bg-transparent text-faint focus:outline-none ${slot.syllable ? 'text-ink' : 'text-ghost'}`}
            onClick={(event) => {
                event.stopPropagation();
                onSelect();
            }}
            aria-label={ariaLabel}
        >
            <span className="relative z-[1] font-mono text-[1.2rem] font-normal leading-none">
                {slot.continuation ? '—' : (slot.syllable ?? ' ')}
            </span>
            {slot.lyric ? (
                <span className="absolute -bottom-3 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-muted">
                    {slot.lyric}
                </span>
            ) : null}
            {slot.noteValue !== 'QUARTER' ? (
                <span className="absolute right-1 top-1 text-[1.2rem] font-normal text-amber">
                    {slot.noteValue === 'EIGHTH' ? '½' : '·'}
                </span>
            ) : null}
            <span className="group-last:hidden absolute right-[-2px] top-1/2 z-[2] inline-block -translate-y-1/2 text-[1.2rem] leading-none text-ink">
                :
            </span>
            {isActive || isPlaying ? (
                <span className="absolute bottom-2 w-2/4 h-2 border-b-2 border-green-dark animate-pulse" />
            ) : null}
        </button>
    );
}
