import { beatMarkBetween, markAfterBeat } from '@/domain/music';
import type { EditorMeasure } from '@/features/score-editor/adapters/editor-document-schema';
import { FinalBarline } from '@/features/score-editor/components/score-canvas/final-barline';
import { cn } from '@/lib/utils';

/**
 * One measure of one part, as it is printed.
 *
 * The subdivision marks and the marks that close a beat are notation, not
 * decoration, so they are set at the note's own size and colour and never fade
 * into the paper: a colon carries on to the next beat, a slash marks the middle
 * of a bar that reads in two halves. The final measure closes with the double
 * barline. Beats share the measure's width evenly, which keeps the four parts of
 * a system aligned beat for beat.
 */
export function PrintMeasure({
    measure,
    width,
    isFinal,
}: {
    measure?: EditorMeasure;
    width: number;
    isFinal: boolean;
}) {
    const slots = measure?.slots ?? [];
    const lastSlot = slots.length - 1;
    const beatCount = measure?.timeSignature.count ?? 0;

    return (
        <div
            className={cn(
                'relative flex h-full shrink-0 items-center',
                !isFinal && 'border-r border-r-ink-muted/60',
            )}
            style={{ width }}
        >
            {slots.map((slot, slotIndex) => (
                <span
                    key={slot.id}
                    className="relative flex h-full flex-1 items-center justify-center font-mono text-[10pt] leading-none text-ink"
                >
                    <span className="flex items-baseline">
                        {slot.notes.map((note, noteIndex) => (
                            <span key={note.id} className="flex items-baseline">
                                {noteIndex > 0 ? (
                                    <span aria-hidden="true" className="px-[1px]">
                                        {beatMarkBetween(slot.division, noteIndex - 1)}
                                    </span>
                                ) : null}
                                <span className="relative flex flex-col items-center">
                                    <span>{note.continuation ? '—' : (note.syllable ?? '')}</span>
                                    {note.lyric ? (
                                        <span className="absolute -bottom-3 text-[7pt] font-bold uppercase tracking-[0.08em] text-ink-muted">
                                            {note.lyric}
                                        </span>
                                    ) : null}
                                </span>
                            </span>
                        ))}
                    </span>
                    {slotIndex < lastSlot ? (
                        <span
                            aria-hidden="true"
                            className="absolute right-0 top-1/2 leading-none"
                            style={{ transform: 'translateY(-50%)' }}
                        >
                            {markAfterBeat(slotIndex, beatCount)}
                        </span>
                    ) : null}
                </span>
            ))}
            {isFinal ? <FinalBarline /> : null}
        </div>
    );
}
