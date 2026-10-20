import { Delete } from 'lucide-react';
import type { ReactNode } from 'react';
import {
    Accidental,
    CHROMATIC_SOLFA_SYLLABLES,
    NATURAL_SOLFA_SYLLABLES,
    SOLFA_TO_DEGREE,
    type SolfaSyllable,
} from '@/domain/music';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { OctaveDirection, OctaveStep } from '@/features/score-editor/editing/octave';
import { cn } from '@/lib/utils';

const ACCIDENTAL_SYMBOLS: Record<Accidental, string> = {
    [Accidental.DOUBLE_FLAT]: '𝄫',
    [Accidental.FLAT]: '♭',
    [Accidental.NATURAL]: '',
    [Accidental.SHARP]: '♯',
    [Accidental.DOUBLE_SHARP]: '𝄪',
};

/**
 * The degree a syllable stands for, which is how a movable-doh score names its
 * notes. The old label showed an absolute letter, which was only ever true in
 * C major.
 */
function degreeLabel(syllable: SolfaSyllable): string {
    const spec = SOLFA_TO_DEGREE[syllable];
    return `${ACCIDENTAL_SYMBOLS[spec.accidental]}${spec.degree}`;
}

function KeyboardKey({
    label,
    tooltip,
    onPress,
    className,
    pressed,
    children,
}: {
    label: string;
    tooltip: string;
    onPress: () => void;
    className?: string;
    pressed?: boolean;
    children?: ReactNode;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    onClick={onPress}
                    aria-label={label}
                    aria-pressed={pressed}
                    className={cn(
                        'flex select-none items-center justify-center rounded-lg border border-line bg-paper text-ink shadow-key',
                        'transition-[transform,box-shadow,background-color,color] duration-100 ease-out',
                        'hover:bg-green-wash/60 active:translate-y-px active:scale-[0.98] active:bg-green-wash active:shadow-key-pressed',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40',
                        className,
                    )}
                >
                    {children ?? label}
                </button>
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
    );
}

/**
 * A touch-friendly sol-fa keyboard, in a drawer docked to the bottom of the
 * editor.
 *
 * It carries the full syllable vocabulary (diatonic and chromatic) plus the
 * rhythmic and editing keys that the physical keyboard otherwise provides, so
 * the whole editor is usable on a device without a hardware keyboard. Every
 * syllable is one press: `fe` and `ba` are whole notes, not two letters. On a
 * desktop the physical keyboard types every syllable, so the dock is hidden
 * from the `lg` breakpoint up.
 *
 * The layout is a writer's rather than a piano's: the duration keys sit on
 * their own line above the notes, with the accidentals at the other end of it,
 * so the row reads as "how long" on the left and "what colour" on the right.
 * The syllable keys occupy the middle. The bottom line keeps the hand's editing
 * keys: octave selectors, the continuation key, the wide space bar (a rest) and
 * delete.
 *
 * The three duration keys choose the length of the notes that follow; the one
 * in force at the caret is lit, so the writer can see the current value rather
 * than remember it. `.` is an eighth, `:` a quarter and `,` a sixteenth — the
 * same absolute lengths the source language writes.
 *
 * The octave keys choose the register of the notes being entered — one octave
 * up, two up, or the same below. One side is lit at a time (or neither), and
 * the chosen mark is written with the next syllable, so the writer cannot
 * forget to add it. Pressing a lit key again moves one octave further, then
 * turns the shift off. When there is already a note at the caret, the same
 * press moves that note too, so the page and the playback answer immediately.
 * The selector state lives in `useScoreEditing` rather than in this component,
 * so it survives re-renders and is shared by every drawn key.
 *
 * The drawer belongs to the score, not to the editor's fields: while a field in
 * the document is being typed into it is shut, because the phone's own keyboard
 * has the bottom of the screen and the drawn keys would only sit under it. That
 * is decided in `styles/index.css`, where the shell asks whether any field has
 * focus; see the drawer rules there.
 */
export function OnScreenKeyboard({
    onInput,
    onBackspace,
    activeDuration = ':',
    octave,
    onOctave,
}: {
    onInput: (token: string) => void;
    onBackspace: () => void;
    /** The duration key in force at the caret. */
    activeDuration?: ':' | '.' | ',';
    /** The register the next drawn syllables will be written in. */
    octave: OctaveStep;
    /** Move that register, and the note already at the caret. */
    onOctave: (direction: OctaveDirection) => void;
}) {
    const durationKeys = [
        { mark: ':' as const, name: 'Quarter', tooltip: 'Quarter note (:)' },
        { mark: '.' as const, name: 'Eighth', tooltip: 'Eighth note (.)' },
        { mark: ',' as const, name: 'Sixteenth', tooltip: 'Sixteenth note (,)' },
    ];

    return (
        <div className="score-keyboard-dock grid flex-none lg:hidden">
            <div className="min-h-0 overflow-hidden">
                <section
                    aria-label="On-screen sol-fa keyboard"
                    className="score-keyboard border-t border-line bg-paper/95 px-3 pb-3 pt-2.5 backdrop-blur"
                >
                    <div className="flex items-center justify-between gap-2 border-b border-line-soft pb-2">
                        <div className="flex items-center gap-1.5">
                            {durationKeys.map((key) => (
                                <KeyboardKey
                                    key={key.mark}
                                    label={`${key.name} note`}
                                    tooltip={key.tooltip}
                                    onPress={() => onInput(key.mark)}
                                    className={cn(
                                        'h-11 w-12 font-mono text-lg font-semibold',
                                        activeDuration === key.mark &&
                                            'border-green bg-green-wash text-green-dark ring-1 ring-green',
                                    )}
                                >
                                    {key.mark}
                                </KeyboardKey>
                            ))}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <KeyboardKey
                                label="Sharp"
                                tooltip="Raise the note (#)"
                                onPress={() => onInput('#')}
                                className="h-11 w-12 text-lg"
                            >
                                ♯
                            </KeyboardKey>
                            <KeyboardKey
                                label="Flat"
                                tooltip="Lower the note (b)"
                                onPress={() => onInput('b')}
                                className="h-11 w-12 text-lg"
                            >
                                ♭
                            </KeyboardKey>
                        </div>
                    </div>

                    <div className="mt-2 grid grid-cols-7 gap-1.5">
                        {NATURAL_SOLFA_SYLLABLES.map((syllable) => (
                            <KeyboardKey
                                key={syllable}
                                label={`${syllable} (${degreeLabel(syllable)})`}
                                tooltip={`${syllable} — degree ${degreeLabel(syllable)}`}
                                onPress={() => onInput(syllable)}
                                className="h-12 font-mono text-lg font-medium lowercase"
                            >
                                {syllable}
                            </KeyboardKey>
                        ))}
                    </div>
                    <div className="mt-1.5 grid grid-cols-7 gap-1.5">
                        {CHROMATIC_SOLFA_SYLLABLES.map((syllable) => (
                            <KeyboardKey
                                key={syllable}
                                label={`${syllable} (${degreeLabel(syllable)})`}
                                tooltip={`${syllable} — degree ${degreeLabel(syllable)}`}
                                onPress={() => onInput(syllable)}
                                className="h-11 bg-cream font-mono text-sm font-medium lowercase text-ink-muted"
                            >
                                {syllable}
                            </KeyboardKey>
                        ))}
                    </div>

                    <div className="mt-2 grid grid-cols-[1fr_1fr_1.5fr_2.5fr_1.5fr] items-stretch gap-1.5">
                        <KeyboardKey
                            label={
                                octave === 2
                                    ? 'Turn off the octave up'
                                    : octave === 1
                                      ? 'Raise the note and the next notes another octave'
                                      : 'Raise the note at the caret and enter the next notes an octave up'
                            }
                            tooltip={
                                octave === 2
                                    ? 'The next notes are two octaves up; press to return to the voice'
                                    : octave === 1
                                      ? 'Two octaves up; press again to turn the shift off'
                                      : 'One octave up: raises the note at the caret, and the notes you enter next'
                            }
                            onPress={() => onOctave('up')}
                            pressed={octave > 0}
                            className={cn(
                                'h-11 w-full px-0 font-mono text-[10px] font-semibold leading-none',
                                octave > 0 &&
                                    'border-green bg-green-wash text-green-dark ring-1 ring-green',
                            )}
                        >
                            {octave === 2 ? '+16va' : '+8va'}
                        </KeyboardKey>
                        <KeyboardKey
                            label={
                                octave === -2
                                    ? 'Turn off the octave down'
                                    : octave === -1
                                      ? 'Lower the note and the next notes another octave'
                                      : 'Lower the note at the caret and enter the next notes an octave down'
                            }
                            tooltip={
                                octave === -2
                                    ? 'The next notes are two octaves down; press to return to the voice'
                                    : octave === -1
                                      ? 'Two octaves down; press again to turn the shift off'
                                      : 'One octave down: lowers the note at the caret, and the notes you enter next'
                            }
                            onPress={() => onOctave('down')}
                            pressed={octave < 0}
                            className={cn(
                                'h-11 w-full px-0 font-mono text-[10px] font-semibold leading-none',
                                octave < 0 &&
                                    'border-green bg-green-wash text-green-dark ring-1 ring-green',
                            )}
                        >
                            {octave === -2 ? '-16va' : '-8va'}
                        </KeyboardKey>
                        <KeyboardKey
                            label="Hold the previous note"
                            tooltip="Hold the previous note (-)"
                            onPress={() => onInput('-')}
                            className="h-11 w-full font-mono text-lg text-ink-muted"
                        >
                            —
                        </KeyboardKey>
                        <KeyboardKey
                            label="Space (rest)"
                            tooltip="Rest for the current duration (Space)"
                            onPress={() => onInput(' ')}
                            className="h-11 w-full text-[10px] font-medium uppercase tracking-[0.18em] text-muted"
                        >
                            space
                        </KeyboardKey>
                        <KeyboardKey
                            label="Backspace"
                            tooltip="Delete the symbol before the caret (Backspace)"
                            onPress={onBackspace}
                            className="h-11 w-full border-red-200 bg-red-50 text-red-500 hover:bg-red-100 active:bg-red-100 focus-visible:ring-red-300"
                        >
                            <Delete size={18} strokeWidth={2} />
                        </KeyboardKey>
                    </div>
                </section>
            </div>
        </div>
    );
}
