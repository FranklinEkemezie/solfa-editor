import { ACCIDENTAL_MARKS } from '@/features/score-editor/components/score-canvas/accidental-mark';
import { OctaveMark } from '@/features/score-editor/components/score-canvas/octave-mark';
import { useScoreInteractions } from '@/features/score-editor/components/score-canvas/score-interactions-context';
import { beatNotationTokens } from '@/features/score-editor/model/beat-notation';
import type { BeatView } from '@/features/score-editor/model/score-view';
import { cn } from '@/lib/utils';

/**
 * One syllable of the lyric line.
 *
 * It hangs below its note rather than taking a row of its own, so a part with
 * lyrics stays the same height as one without. The active cell is outlined even
 * when it is still empty: that is the writer's caret in the lyric line.
 */
function LyricGlyph({
    text,
    active,
    className,
}: {
    text: string;
    active: boolean;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'absolute -bottom-2.5 whitespace-nowrap text-[10px] font-medium leading-none text-ink-muted',
                active && 'rounded-sm bg-green-wash px-0.5 text-green-dark ring-1 ring-green/50',
                className,
            )}
        >
            {text || (active ? '\u00a0' : '')}
        </span>
    );
}

/**
 * The notes, rests and subdivision marks of one beat.
 *
 * The editor and the printed sheet share this renderer so a rhythm reads the
 * same in both. Rests draw no glyph, but they keep their place: the mark before
 * the following note is what shows that the beat began with silence.
 *
 * A lyric syllable sits under the note that begins it, and a held note carries
 * an em dash instead, the way a singer reads a melisma. Only the note that
 * starts a sound can be the active lyric cell; a continuation is the same note
 * still sounding.
 */
export function BeatGlyphs({
    beat,
    lyricClassName,
}: {
    beat: BeatView;
    /** The printed and on-screen lyrics differ in size, not in content. */
    lyricClassName?: string;
}) {
    const { lyricTarget } = useScoreInteractions();
    const tokens = beatNotationTokens(beat);

    return (
        <span className="flex items-baseline">
            {tokens.map((token, index) => (
                <span key={`${token.kind}-${index}`} className="flex items-baseline">
                    {token.markBefore ? (
                        <span aria-hidden="true" className="px-px">
                            {token.markBefore}
                        </span>
                    ) : null}
                    {token.kind === 'continuation' ? (
                        <span className="relative flex flex-col items-center">
                            <span aria-hidden="true">{'\u2014'}</span>
                            {token.item.lyric ? (
                                <LyricGlyph
                                    text={token.item.lyric}
                                    active={false}
                                    className={lyricClassName}
                                />
                            ) : null}
                        </span>
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
                                    <span aria-hidden="true" className="px-px">
                                        .
                                    </span>
                                ) : null}
                            </span>
                            {token.item.lyric || lyricTarget?.noteKey === token.item.noteKey ? (
                                <LyricGlyph
                                    text={token.item.lyric}
                                    active={lyricTarget?.noteKey === token.item.noteKey}
                                    className={lyricClassName}
                                />
                            ) : null}
                        </span>
                    )}
                </span>
            ))}
        </span>
    );
}
