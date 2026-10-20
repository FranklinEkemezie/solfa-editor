import type { Accidental } from '@/domain/accidental';
import type { Fraction } from '@/domain/fraction';
import type { Note } from '@/domain/note';
import type { Rest } from '@/domain/rest';
import type { NoteValue } from '@/domain/note-value';
import type { SourceRange } from '@/features/notation/source-position';
import type { Token } from '@/features/notation/tokens';

/**
 * The musical events a voice's notation stands for.
 *
 * These are the domain's own `Note` and `Rest` events, with two things the
 * editor needs added beside them: where the event starts in exact quarter-note
 * time, and the source text it came from. Nothing here is a second model of a
 * pitch — `note.pitch` is the degree-based pitch the rest of the app plays and
 * prints.
 */
export type NotationNote = {
    readonly kind: 'note';
    readonly note: Note;
    /** Start in quarter-note units from the beginning of the voice. */
    readonly start: Fraction;
    /** The written pitch and its modifiers, excluding continuations. */
    readonly source: SourceRange;
    /** The last explicit `#` or `b`, or null when the syllable's own accidental stands. */
    readonly accidentalModifier: Accidental | null;
    /** The last octave modifier, in octaves from the voice's reference. */
    readonly octaveOffset: number;
    /** One range per `-` that lengthened this note. */
    readonly continuationSources: readonly SourceRange[];
};

export type NotationRest = {
    readonly kind: 'rest';
    readonly rest: Rest;
    readonly start: Fraction;
    readonly source: SourceRange;
};

export type NotationEvent = NotationNote | NotationRest;

/** A duration symbol and where it was written. */
export type DurationChange = {
    readonly value: NoteValue;
    readonly range: SourceRange;
};

/** A whole voice, read from one source string. */
export type VoiceNotation = {
    readonly source: string;
    readonly events: readonly NotationEvent[];
    readonly tokens: readonly Token[];
    readonly durationChanges: readonly DurationChange[];
    /** The duration in force at the end of the source, or null when none was written. */
    readonly duration: NoteValue | null;
};
