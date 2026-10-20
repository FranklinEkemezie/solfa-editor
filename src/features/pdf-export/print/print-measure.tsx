import { beatMarkBetween, markAfterBeat } from '@/domain/music';
import { ACCIDENTAL_MARKS } from '@/features/score-editor/components/score-canvas/accidental-mark';
import { FinalBarline } from '@/features/score-editor/components/score-canvas/final-barline';
import { OctaveMark } from '@/features/score-editor/components/score-canvas/octave-mark';
import type { MeasureView } from '@/features/score-editor/model/score-view';
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
    measure?: MeasureView;
    width: number;
    isFinal: boolean;
}) {
    const beats = measure?.beats ?? [];

    return (
        <div
            className={cn(
                'relative flex h-full shrink-0 items-center',
                !isFinal && 'border-r border-r-ink-muted/60',
            )}
            style={{ width }}
        >
            {beats.map((beat, beatIndex) => (
                <span
                    key={beat.number}
                    className="relative flex h-full flex-1 items-center justify-center font-mono text-[10pt] leading-none text-ink"
                >
                    <span className="flex items-baseline">
                        {beat.items.map((item, itemIndex) => (
                            <span
                                key={`${item.noteKey}-${itemIndex}`}
                                className="flex items-baseline"
                            >
                                {itemIndex > 0 ? (
                                    <span aria-hidden="true" className="px-[1px]">
                                        {beatMarkBetween(beat.division, itemIndex - 1) ?? ' '}
                                    </span>
                                ) : null}
                                <span className="relative flex flex-col items-center">
                                    <span>
                                        {item.kind === 'continuation' ? (
                                            '—'
                                        ) : (
                                            <>
                                                {item.syllable}
                                                {item.accidental ? (
                                                    <span className="align-super text-[0.7em]">
                                                        {ACCIDENTAL_MARKS[item.accidental] ?? ''}
                                                    </span>
                                                ) : null}
                                                <OctaveMark offset={item.octaveOffset} />
                                            </>
                                        )}
                                    </span>
                                    {item.lyric ? (
                                        <span className="absolute -bottom-3 text-[7pt] font-bold uppercase tracking-[0.08em] text-ink-muted">
                                            {item.lyric}
                                        </span>
                                    ) : null}
                                </span>
                            </span>
                        ))}
                    </span>
                    {beatIndex < beats.length - 1 ? (
                        <span
                            aria-hidden="true"
                            className="absolute right-0 top-1/2 leading-none"
                            style={{ transform: 'translateY(-50%)' }}
                        >
                            {markAfterBeat(beatIndex, beats.length)}
                        </span>
                    ) : null}
                </span>
            ))}
            {isFinal ? <FinalBarline /> : null}
        </div>
    );
}
