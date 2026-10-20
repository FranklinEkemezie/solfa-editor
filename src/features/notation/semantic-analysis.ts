import { Accidental } from '@/domain/accidental';
import { addFractions, ZERO_FRACTION, type Fraction } from '@/domain/fraction';
import { NOTE_VALUE_UNITS } from '@/domain/note-value';
import { Note } from '@/domain/note';
import { Pitch } from '@/domain/pitch';
import { Rest } from '@/domain/rest';
import { SOLFA_TO_DEGREE } from '@/domain/solfa';
import type { NoteValue } from '@/domain/note-value';
import type { VoiceSettings } from '@/domain/voice';
import type {
    DurationChange,
    NotationEvent,
    NotationNote,
    VoiceNotation,
} from '@/features/notation/musical-ir';
import type {
    ParsedPitch,
    ParseItem,
    VoiceParseTree,
} from '@/features/notation/parser';
import type { SourceRange } from '@/features/notation/source-position';

/** The note currently being read, which continuations may still lengthen. */
type WorkingNote = {
    kind: 'note';
    note: Note;
    start: Fraction;
    source: SourceRange;
    sourceEnd: number;
    accidentalModifier: Accidental | null;
    octaveOffset: number;
    continuationSources: SourceRange[];
};

function resolvePitch(
    item: ParsedPitch,
    referenceOctave: number,
): { pitch: Pitch; accidentalModifier: Accidental | null; octaveOffset: number } {
    const spec = SOLFA_TO_DEGREE[item.token.syllable];
    let accidental = spec.accidental;
    let accidentalModifier: Accidental | null = null;
    let octaveOffset = 0;

    for (const modifier of item.modifiers) {
        if (modifier.kind === 'accidental') {
            // An explicit accidental overrides the syllable's own alteration;
            // it does not stack on top of it. Writing `deb` is D♭, not D𝄫.
            accidental = modifier.accidental;
            accidentalModifier = modifier.accidental;
        } else {
            // Octave modifiers override each other for the same reason: `d''1`
            // is the octave below the reference, not two octaves up and one down.
            octaveOffset = modifier.offset;
        }
    }

    return {
        pitch: new Pitch(spec.degree, accidental, referenceOctave + octaveOffset),
        accidentalModifier,
        octaveOffset,
    };
}

/**
 * Read a parse tree as musical time.
 *
 * Every note and rest gets an exact start and duration in quarter-note units.
 * A continuation adds the duration currently in force to the note it follows,
 * which is why a duration may be changed between a note and its continuation.
 */
export function analyseVoice(
    source: string,
    tree: VoiceParseTree,
    settings: VoiceSettings,
): VoiceNotation {
    const events: NotationEvent[] = [];
    const durationChanges: DurationChange[] = [];

    let duration: NoteValue | null = null;
    let cursor = ZERO_FRACTION;
    let lastNote: WorkingNote | null = null;

    for (const item of tree.items) {
        switch (item.kind) {
            case 'duration': {
                duration = item.token.value;
                durationChanges.push({ value: item.token.value, range: item.token.range });
                break;
            }

            case 'rest': {
                const restDuration = currentDuration(duration, item);
                events.push({
                    kind: 'rest',
                    rest: new Rest(restDuration),
                    start: cursor,
                    source: item.token.range,
                    sourceEnd: item.token.range.end,
                });
                cursor = addFractions(cursor, restDuration);
                lastNote = null;
                break;
            }

            case 'pitch': {
                const noteDuration = currentDuration(duration, item);
                const { pitch, accidentalModifier, octaveOffset } = resolvePitch(
                    item,
                    settings.referenceOctave,
                );
                const note: WorkingNote = {
                    kind: 'note',
                    note: new Note(pitch, noteDuration, item.token.syllable),
                    start: cursor,
                    source: item.token.range,
                    sourceEnd:
                        item.modifiers[item.modifiers.length - 1]?.range.end ??
                        item.token.range.end,
                    accidentalModifier,
                    octaveOffset,
                    continuationSources: [],
                };
                events.push(note);
                cursor = addFractions(cursor, noteDuration);
                lastNote = note;
                break;
            }

            case 'continuation': {
                if (!lastNote) {
                    throw new Error('The parser accepted a continuation with no note to extend.');
                }
                const extension = currentDuration(duration, item);
                lastNote.note = new Note(
                    lastNote.note.pitch,
                    addFractions(lastNote.note.duration, extension),
                    lastNote.note.syllable,
                    false,
                    lastNote.note.lyric,
                );
                lastNote.continuationSources.push(item.token.range);
                lastNote.sourceEnd = item.token.range.end;
                cursor = addFractions(cursor, extension);
                break;
            }
        }
    }

    return {
        source,
        events,
        tokens: tree.tokens,
        durationChanges,
        duration,
    };
}

function currentDuration(duration: NoteValue | null, item: ParseItem): Fraction {
    if (!duration) {
        throw new Error(`The parser accepted ${item.kind} before any duration was set.`);
    }
    return NOTE_VALUE_UNITS[duration];
}

/** Narrow a notation event to a note, which is useful to callers walking a voice. */
export function isNotationNote(
    event: NotationEvent,
): event is NotationNote {
    return event.kind === 'note';
}
