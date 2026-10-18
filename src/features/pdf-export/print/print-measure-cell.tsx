import { beatMarkBetween } from '@/domain/music';
import type { EditorMeasure } from '@/features/score-editor/adapters/editor-document-schema';

export function PrintMeasureCell({
    measure,
    isLast,
}: {
    measure?: EditorMeasure;
    isLast: boolean;
}) {
    const slots = measure?.slots ?? [];

    return (
        <div
            className={`flex items-stretch border-l border-line ${
                isLast ? 'border-r-[2.5pt] border-r-ink-muted' : ''
            }`}
        >
            {slots.map((slot, slotIndex) => (
                <span
                    key={slot.id}
                    className="relative flex flex-1 items-baseline justify-center px-[1pt] py-[7pt]"
                >
                    <span className="inline-flex items-baseline">
                        {slot.notes.map((note, index) => (
                            <span key={note.id} className="inline-flex items-baseline">
                                {index > 0 ? (
                                    <span className="px-[0.5pt] text-[9pt] leading-none text-faint">
                                        {beatMarkBetween(slot.division, index - 1)}
                                    </span>
                                ) : null}
                                <span className="relative flex flex-col items-center">
                                    <span
                                        className={`text-[15pt] leading-none ${
                                            note.syllable ? 'text-ink' : 'text-faint'
                                        }`}
                                    >
                                        {note.continuation ? '—' : (note.syllable ?? ' ')}
                                    </span>
                                    {note.lyric ? (
                                        <span className="absolute top-[13pt] text-[6.5pt] font-bold uppercase tracking-[0.1em] text-ink-muted">
                                            {note.lyric}
                                        </span>
                                    ) : null}
                                </span>
                            </span>
                        ))}
                    </span>
                    {slotIndex < slots.length - 1 ? (
                        <span
                            aria-hidden="true"
                            className="absolute right-0 top-1/2 -translate-y-1/2 text-[12pt] leading-none text-faint"
                        >
                            :
                        </span>
                    ) : null}
                </span>
            ))}
        </div>
    );
}
