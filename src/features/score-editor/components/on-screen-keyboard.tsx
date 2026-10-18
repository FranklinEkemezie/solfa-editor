import { Delete } from 'lucide-react';
import type { ReactNode } from 'react';
import {
    Accidental,
    CHROMATIC_SOLFA_SYLLABLES,
    NATURAL_SOLFA_SYLLABLES,
    SOLFA_TO_PITCH,
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

function pitchLabel(syllable: SolfaSyllable): string {
    const pitch = SOLFA_TO_PITCH[syllable];
    return `${pitch.letter}${ACCIDENTAL_SYMBOLS[pitch.accidental]}`;
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
 * A touch-friendly sol-fa keyboard docked to the bottom of the editor.
 *
 * It carries the full syllable vocabulary (diatonic and chromatic) plus the
 * rhythmic and editing keys that the physical keyboard otherwise provides, so
 * the whole editor is usable on a device without a hardware keyboard.
 */
export function OnScreenKeyboard({
    onInput,
    onBackspace,
}: {
    onInput: (token: string) => void;
    onBackspace: () => void;
}) {
    return (
        <section
            aria-label="On-screen sol-fa keyboard"
            className="sticky bottom-0 z-30 mt-6 -mx-4 border-t border-line bg-paper/95 px-3 pb-3 pt-2.5 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-4 sm:shadow-panel"
        >
            <div className="grid grid-cols-7 gap-1.5">
                {NATURAL_SOLFA_SYLLABLES.map((syllable) => (
                    <KeyboardKey
                        key={syllable}
                        label={`${syllable} (${pitchLabel(syllable)})`}
                        tooltip={`${syllable} — ${pitchLabel(syllable)}`}
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
                        label={`${syllable} (${pitchLabel(syllable)})`}
                        tooltip={`${syllable} — ${pitchLabel(syllable)}`}
                        onPress={() => onInput(syllable)}
                        className="h-11 bg-cream font-mono text-sm font-medium lowercase text-ink-muted"
                    >
                        {syllable}
                    </KeyboardKey>
                ))}
            </div>
            <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                <KeyboardKey
                    label="Half-length note"
                    tooltip="Halve the note value (.)"
                    onPress={() => onInput('.')}
                    className="h-11 text-lg font-semibold"
                >
                    .
                </KeyboardKey>
                <KeyboardKey
                    label="Quarter-note value"
                    tooltip="Reset the note value (,)"
                    onPress={() => onInput(',')}
                    className="h-11 text-lg font-semibold"
                >
                    ,
                </KeyboardKey>
                <KeyboardKey
                    label="Continuation"
                    tooltip="Continue the previous note (-)"
                    onPress={() => onInput('-')}
                    className="h-11 font-mono text-lg"
                >
                    -
                </KeyboardKey>
                <KeyboardKey
                    label="Backspace"
                    tooltip="Delete the note (Backspace)"
                    onPress={onBackspace}
                    className="h-11"
                >
                    <Delete size={18} strokeWidth={2} />
                </KeyboardKey>
            </div>
        </section>
    );
}
