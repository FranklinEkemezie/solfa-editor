import { ChevronDown, Delete } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import {
    Accidental,
    CHROMATIC_SOLFA_SYLLABLES,
    NATURAL_SOLFA_SYLLABLES,
    SOLFA_TO_DEGREE,
    type SolfaSyllable,
} from '@/domain/music';
import type { OctaveDirection, OctaveStep } from '@/features/score-editor/editing/octave';
import { cn } from '@/lib/utils';

const ACCIDENTAL_SYMBOLS: Record<Accidental, string> = {
    [Accidental.DOUBLE_FLAT]: '𝄫',
    [Accidental.FLAT]: '♭',
    [Accidental.NATURAL]: '',
    [Accidental.SHARP]: '♯',
    [Accidental.DOUBLE_SHARP]: '𝄪',
};

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
        <button
            type="button"
            onClick={onPress}
            aria-label={label}
            aria-pressed={pressed}
            title={tooltip}
            className={cn(
                'flex min-w-0 select-none flex-col items-center justify-center rounded-lg border border-line bg-paper text-ink shadow-key',
                'transition-[transform,box-shadow,background-color,color] duration-100 ease-out',
                'hover:bg-green-wash/60 active:translate-y-px active:scale-[0.98] active:bg-green-wash active:shadow-key-pressed',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40',
                className,
            )}
        >
            {children ?? label}
        </button>
    );
}

function SyllableKey({
    syllable,
    onPress,
}: {
    syllable: SolfaSyllable;
    onPress: () => void;
}) {
    return (
        <KeyboardKey
            label={`${syllable} (${degreeLabel(syllable)})`}
            tooltip={`${syllable} — degree ${degreeLabel(syllable)}`}
            onPress={onPress}
            className="h-11 gap-0.5 font-mono"
        >
            <span className="text-base font-medium leading-none lowercase">{syllable}</span>
            <span className="text-[8px] leading-none text-muted">{degreeLabel(syllable)}</span>
        </KeyboardKey>
    );
}

/**
 * A touch-friendly sol-fa drawbar docked to the bottom of the editor.
 *
 * It carries the full syllable vocabulary (diatonic and chromatic) plus the
 * rhythmic and editing keys that the physical keyboard otherwise provides, so
 * the whole editor is usable on a device without a hardware keyboard. Every
 * syllable is one press: `fe` and `ba` are whole notes, not two letters. On a
 * desktop the physical keyboard types every syllable, so the dock is hidden
 * from the `lg` breakpoint up.
 *
 * The layout is a writer's rather than a piano's: duration keys sit on the top
 * line with the accidentals, the syllables occupy the two middle lines, and the
 * editing keys — octave, hold, rest and delete — close the bottom. The drawer
 * can be folded away to give the page its height back; it also folds itself
 * while a field in the document is being typed into, because the phone's own
 * keyboard then owns the bottom of the screen.
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
    const [expanded, setExpanded] = useState(true);

    const durationKeys = [
        { mark: ':' as const, name: 'Quarter', tooltip: 'Quarter note (:)' },
        { mark: '.' as const, name: 'Eighth', tooltip: 'Eighth note (.)' },
        { mark: ',' as const, name: 'Sixteenth', tooltip: 'Sixteenth note (,)' },
    ];

    return (
        <div className="score-keyboard-dock flex-none border-t border-line bg-paper/95 backdrop-blur lg:hidden">
            <button
                type="button"
                aria-expanded={expanded}
                aria-controls="on-screen-keyboard-body"
                onClick={() => setExpanded((current) => !current)}
                className="flex h-7 w-full items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green/40"
            >
                <span aria-hidden="true" className="h-1 w-8 rounded-full bg-line" />
                <span>Keyboard</span>
                <ChevronDown
                    size={13}
                    strokeWidth={2}
                    className={cn('transition-transform', !expanded && 'rotate-180')}
                />
            </button>

            {expanded ? (
                <section
                    id="on-screen-keyboard-body"
                    aria-label="On-screen sol-fa keyboard"
                    className="px-2.5 pt-1.5"
                    style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
                >
                    <div className="grid grid-cols-5 gap-1.5">
                        {durationKeys.map((key) => (
                            <KeyboardKey
                                key={key.mark}
                                label={`${key.name} note`}
                                tooltip={key.tooltip}
                                onPress={() => onInput(key.mark)}
                                className={cn(
                                    'h-9 font-mono text-base font-semibold',
                                    activeDuration === key.mark &&
                                        'border-green bg-green-wash text-green-dark ring-1 ring-green',
                                )}
                            >
                                {key.mark}
                            </KeyboardKey>
                        ))}
                        <KeyboardKey
                            label="Sharp"
                            tooltip="Raise the note (#)"
                            onPress={() => onInput('#')}
                            className="h-9 text-base"
                        >
                            ♯
                        </KeyboardKey>
                        <KeyboardKey
                            label="Flat"
                            tooltip="Lower the note (b)"
                            onPress={() => onInput('b')}
                            className="h-9 text-base"
                        >
                            ♭
                        </KeyboardKey>
                    </div>

                    <div className="mt-1.5 grid grid-cols-7 gap-1.5">
                        {NATURAL_SOLFA_SYLLABLES.map((syllable) => (
                            <SyllableKey
                                key={syllable}
                                syllable={syllable}
                                onPress={() => onInput(syllable)}
                            />
                        ))}
                    </div>

                    <div className="mt-1.5 grid grid-cols-7 gap-1.5">
                        {CHROMATIC_SOLFA_SYLLABLES.map((syllable) => (
                            <SyllableKey
                                key={syllable}
                                syllable={syllable}
                                onPress={() => onInput(syllable)}
                            />
                        ))}
                    </div>

                    <div className="mt-1.5 grid grid-cols-[1fr_1fr_1.4fr_2.2fr_1.4fr] items-stretch gap-1.5">
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
                                'h-10 w-full px-0 font-mono text-[10px] font-semibold leading-none',
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
                                'h-10 w-full px-0 font-mono text-[10px] font-semibold leading-none',
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
                            className="h-10 w-full font-mono text-lg text-ink-muted"
                        >
                            —
                        </KeyboardKey>
                        <KeyboardKey
                            label="Space (rest)"
                            tooltip="Rest for the current duration (Space)"
                            onPress={() => onInput(' ')}
                            className="h-10 w-full text-[10px] font-medium uppercase tracking-[0.16em] text-muted"
                        >
                            rest
                        </KeyboardKey>
                        <KeyboardKey
                            label="Backspace"
                            tooltip="Delete the symbol before the caret (Backspace)"
                            onPress={onBackspace}
                            className="h-10 w-full border-red-300/60 bg-red-500/10 text-red-500 hover:bg-red-500/15 active:bg-red-500/20 focus-visible:ring-red-300/50"
                        >
                            <Delete size={17} strokeWidth={2} />
                        </KeyboardKey>
                    </div>
                </section>
            ) : null}
        </div>
    );
}
