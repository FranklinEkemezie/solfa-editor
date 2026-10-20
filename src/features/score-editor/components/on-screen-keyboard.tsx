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
    children,
}: {
    label: string;
    tooltip: string;
    onPress: () => void;
    className?: string;
    children?: ReactNode;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    onClick={onPress}
                    aria-label={label}
                    className={cn(
                        'flex select-none items-center justify-center rounded-lg border border-line bg-paper text-ink',
                        'transition-colors hover:bg-green-wash active:scale-[0.97] active:bg-green-wash',
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
 * The three duration keys choose the length of the notes that follow; the one
 * in force at the caret is lit, so the writer can see the current value rather
 * than remember it. `.` is an eighth, `:` a quarter and `,` a sixteenth — the
 * same absolute lengths the source language writes.
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
}: {
    onInput: (token: string) => void;
    onBackspace: () => void;
    /** The duration key in force at the caret. */
    activeDuration?: ':' | '.' | ',';
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
                    <div className="grid grid-cols-7 gap-1.5">
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
                    <div className="mt-1.5 grid grid-cols-5 gap-1.5">
                        {durationKeys.map((key) => (
                            <KeyboardKey
                                key={key.mark}
                                label={`${key.name} note`}
                                tooltip={key.tooltip}
                                onPress={() => onInput(key.mark)}
                                className={cn(
                                    'h-11 font-mono text-lg font-semibold',
                                    activeDuration === key.mark &&
                                        'border-green bg-green-wash text-green-dark ring-1 ring-green',
                                )}
                            >
                                {key.mark}
                            </KeyboardKey>
                        ))}
                        <KeyboardKey
                            label="Rest"
                            tooltip="Rest for the current duration (Space)"
                            onPress={() => onInput(' ')}
                            className="h-11 font-mono text-lg text-ink-muted"
                        >
                            ␣
                        </KeyboardKey>
                        <KeyboardKey
                            label="Hold the note"
                            tooltip="Hold the previous note (-)"
                            onPress={() => onInput('-')}
                            className="h-11 font-mono text-lg"
                        >
                            -
                        </KeyboardKey>
                    </div>
                    <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                        <KeyboardKey
                            label="Sharp"
                            tooltip="Raise the note (#)"
                            onPress={() => onInput('#')}
                            className="h-11 text-lg"
                        >
                            ♯
                        </KeyboardKey>
                        <KeyboardKey
                            label="Flat"
                            tooltip="Lower the note (b)"
                            onPress={() => onInput('b')}
                            className="h-11 text-lg"
                        >
                            ♭
                        </KeyboardKey>
                        <KeyboardKey
                            label="Backspace"
                            tooltip="Delete the symbol before the caret (Backspace)"
                            onPress={onBackspace}
                            className="h-11"
                        >
                            <Delete size={18} strokeWidth={2} />
                        </KeyboardKey>
                    </div>
                </section>
            </div>
        </div>
    );
}
