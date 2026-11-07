import { ACCIDENTAL_MARKS } from '@/features/score-editor/components/score-canvas/accidental-mark';
import { OctaveMark } from '@/features/score-editor/components/score-canvas/octave-mark';
import { beatNotationTokens } from '@/features/score-editor/model/beat-notation';
import type { BeatView } from '@/features/score-editor/model/score-view';
import { cn } from '@/lib/utils';

/**
 * The notes, rests and subdivision marks of one beat.
 *
 * The editor and the printed sheet share this renderer so a rhythm reads the
 * same in both. Rests draw no glyph, but they keep their place: the mark before
 * the following note is what shows that the beat began with silence.
 */
export function BeatGlyphs({
    beat,
    lyricClassName,
}: {
    beat: BeatView;
    /** The printed and on-screen lyrics differ in size, not in content. */
    lyricClassName?: string;
}) {
    const tokens = beatNotationTokens(beat);

    return (
        <span className="flex items-baseline">
            {tokens.map((token, index) => (
                <span key={`${token.kind}-${index}`} className="flex items-baseline">
                    {token.markBefore ? (
                        <span aria-hidden="true" className="px-[1px]">
                            {token.markBefore}
                        </span>
                    ) : null}
                    {token.kind === 'continuation' ? (
                        <span aria-hidden="true">{'\u2014'}</span>
                    ) : token.kind === 'rest' ? null : (
                        <span className="relative flex flex-col items-center">
                            <span>
                                {token.item.syllable}
                                {token.item.accidental ? (
                                    <span className="align-super text-[0.7em]">
                                        {ACCIDENTAL_MARKS[token.item.accidental] ?? ''}
                                    </span>
                                ) : null}
                                <OctaveMark offset={token.item.octaveOffset} />
                                {token.dotted ? (
                                    <span aria-hidden="true" className="px-[1px]">
                                        .
                                    </span>
                                ) : null}
                            </span>
                            {token.item.lyric ? (
                                <span
                                    className={cn(
                                        'absolute -bottom-3 text-[9px] font-bold uppercase tracking-[0.08em] text-ink-muted',
                                        lyricClassName,
                                    )}
                                >
                                    {token.item.lyric}
                                </span>
                            ) : null}
                        </span>
                    )}
                </span>
            ))}
        </span>
    );
}
