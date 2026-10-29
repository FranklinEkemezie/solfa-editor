import {
    Accidental,
    addFractions,
    ceilFraction,
    compareFractions,
    divideFractions,
    fraction,
    isSolfaSyllable,
    multiplyFractions,
    NoteValue,
    Pitch,
    SOLFA_TO_DEGREE,
    type PartId,
    type ScoreDocument,
    type SolfaSyllable,
    VOICE_SETTINGS,
    voiceSource,
    withMeasureCount,
    withVoice,
} from '@/domain/music';
import {
    caretAt,
    offsetAfter,
    offsetBefore,
    siblingCaret,
    type EditorPosition,
} from '@/features/score-editor/editing/caret';
import type { Diagnostic } from '@/features/notation/diagnostics';
import type { VoiceNotation } from '@/features/notation/musical-ir';
import { parseVoice } from '@/features/notation/notation-engine';
import { clampOffset, containsOffset, type SourceRange } from '@/features/notation/source-position';
import type { Token } from '@/features/notation/tokens';

/** What an editing command did, and what to tell the writer about it. */
export type EditOutcome = {
    readonly document: ScoreDocument;
    readonly position: EditorPosition;
    /** True when the document changed; navigation only moves the caret. */
    readonly changed: boolean;
    readonly status?: string;
    readonly rejected?: string;
};

export type DurationMark = ':' | '.' | ',';

const DURATION_VALUES: Record<DurationMark, NoteValue> = {
    ':': NoteValue.QUARTER,
    '.': NoteValue.EIGHTH,
    ',': NoteValue.SIXTEENTH,
};

const DURATION_NAMES: Record<string, string> = {
    QUARTER: 'a quarter note',
    EIGHTH: 'an eighth note',
    SIXTEENTH: 'a sixteenth note',
};

function reject(document: ScoreDocument, position: EditorPosition, message: string): EditOutcome {
    return { document, position, changed: false, rejected: message };
}

function splice(source: string, range: SourceRange, text: string): string {
    return source.slice(0, range.start) + text + source.slice(range.end);
}

function settingsFor(part: PartId) {
    return VOICE_SETTINGS[part];
}

function firstDiagnostic(diagnostics: readonly Diagnostic[]): string {
    return diagnostics[0]?.message ?? 'That edit is not valid notation.';
}

/**
 * Keep one empty measure after music that ends exactly on a barline.
 *
 * The page already grows when a voice overflows, but a writer who has just
 * filled the last beat has nowhere to click for the next note until they type
 * one. Adding the trailing measure at the moment the previous one is filled
 * gives them that slot, and keeps the score one measure ahead of the music.
 *
 * This only applies to an edit at the end of the voice. Editing a note in the
 * middle must not append a measure, and deleting a note must not either: the
 * measure that is already there has room again.
 */
function withRoomForNextMeasure(
    document: ScoreDocument,
    source: string,
    offset: number,
    notation: VoiceNotation,
): ScoreDocument {
    if (offset !== source.length) return document;

    const last = notation.events[notation.events.length - 1];
    if (!last) return document;

    const end = addFractions(
        last.start,
        last.kind === 'note' ? last.note.duration : last.rest.duration,
    );
    const capacity = document.timeSignature.capacity();
    const measures = ceilFraction(divideFractions(end, capacity));
    const boundary = multiplyFractions(capacity, fraction(measures));

    if (compareFractions(end, boundary) !== 0) return document;

    return withMeasureCount(document, Math.max(document.measureCount, measures + 1));
}

/**
 * Accept a candidate source only when the engine can read it.
 *
 * Invalid edits are never left in the document: the writer keeps the score
 * they had, and the diagnostic explains what the language would accept.
 */
function accept(
    document: ScoreDocument,
    position: EditorPosition,
    source: string,
    offset: number,
    status?: string,
): EditOutcome {
    const parsed = parseVoice(source, settingsFor(position.part));
    if (!parsed.ok) {
        return reject(document, position, firstDiagnostic(parsed.diagnostics));
    }
    const next = withVoice(document, position.part, source);
    return {
        document: withRoomForNextMeasure(next, source, offset, parsed.notation),
        position: { part: position.part, offset },
        changed: true,
        status,
    };
}

function tokensOf(document: ScoreDocument, part: PartId): readonly Token[] {
    const parsed = parseVoice(voiceSource(document, part), settingsFor(part));
    return parsed.ok ? parsed.notation.tokens : [];
}

/** The duration in force at a character position, or null before the first one. */
function durationAt(document: ScoreDocument, part: PartId, offset: number): NoteValue | null {
    const parsed = parseVoice(voiceSource(document, part), settingsFor(part));
    if (!parsed.ok) return null;

    let inForce: NoteValue | null = null;
    for (const change of parsed.notation.durationChanges) {
        if (change.range.end <= offset) inForce = change.value;
    }
    return inForce;
}

/** The text of a new event, with a duration in front when none is in force yet. */
function eventText(document: ScoreDocument, position: EditorPosition, text: string): string {
    return durationAt(document, position.part, position.offset) === null ? `:${text}` : text;
}

/**
 * The duration key in force at the caret, for the on-screen keyboard.
 *
 * Before the first duration is written a note would be entered as a quarter,
 * so the quarter key is the one in force.
 */
export function activeDurationMark(
    document: ScoreDocument,
    position: EditorPosition,
): DurationMark {
    const value = durationAt(document, position.part, position.offset);
    if (value === NoteValue.EIGHTH) return '.';
    if (value === NoteValue.SIXTEENTH) return ',';
    return ':';
}

function textAt(document: ScoreDocument, position: EditorPosition): string {
    return voiceSource(document, position.part);
}

function offsetOf(document: ScoreDocument, position: EditorPosition): number {
    return clampOffset(textAt(document, position), position.offset);
}

/**
 * A note, complete in one command — what the on-screen keyboard sends.
 *
 * An octave mark is written in the same edit as the syllable it belongs to, so
 * choosing an octave costs no extra undo step and the note is never briefly
 * left without the register the writer asked for.
 */
export function insertSyllable(
    document: ScoreDocument,
    position: EditorPosition,
    syllable: SolfaSyllable,
    octaveMark = '',
): EditOutcome {
    const offset = offsetOf(document, position);
    const text = eventText(document, position, `${syllable}${octaveMark}`);
    const next = textAt(document, position);
    return accept(
        document,
        position,
        next.slice(0, offset) + text + next.slice(offset),
        offset + text.length,
        `Added ${syllable}.`,
    );
}

/** A duration symbol; choosing the one already in force does nothing. */
export function insertDuration(
    document: ScoreDocument,
    position: EditorPosition,
    mark: DurationMark,
): EditOutcome {
    const value = DURATION_VALUES[mark];
    const offset = offsetOf(document, position);
    if (durationAt(document, position.part, offset) === value) {
        return {
            document,
            position,
            changed: false,
            status: `Already ${DURATION_NAMES[value]}.`,
        };
    }

    const source = textAt(document, position);
    return accept(
        document,
        position,
        source.slice(0, offset) + mark + source.slice(offset),
        offset + 1,
        `Duration is now ${DURATION_NAMES[value]}.`,
    );
}

export function insertRest(document: ScoreDocument, position: EditorPosition): EditOutcome {
    const offset = offsetOf(document, position);
    const text = eventText(document, position, ' ');
    const source = textAt(document, position);
    return accept(
        document,
        position,
        source.slice(0, offset) + text + source.slice(offset),
        offset + text.length,
        'Added a rest.',
    );
}

export function insertContinuation(document: ScoreDocument, position: EditorPosition): EditOutcome {
    const offset = offsetOf(document, position);
    const source = textAt(document, position);
    const next = source.slice(0, offset) + '-' + source.slice(offset);
    const parsed = parseVoice(next, settingsFor(position.part));
    if (!parsed.ok) {
        return reject(
            document,
            position,
            'A continuation can only follow a note. Write the note first, then hold it with -.',
        );
    }
    return {
        document: withRoomForNextMeasure(
            withVoice(document, position.part, next),
            next,
            offset + 1,
            parsed.notation,
        ),
        position: { part: position.part, offset: offset + 1 },
        changed: true,
        status: 'Held the note on.',
    };
}

export function applyAccidental(
    document: ScoreDocument,
    position: EditorPosition,
    accidental: Accidental.SHARP | Accidental.FLAT,
): EditOutcome {
    const mark = accidental === Accidental.SHARP ? '#' : 'b';
    const offset = offsetOf(document, position);
    const source = textAt(document, position);
    const next = source.slice(0, offset) + mark + source.slice(offset);
    const parsed = parseVoice(next, settingsFor(position.part));
    if (!parsed.ok) {
        return reject(document, position, 'An accidental can only follow a note.');
    }
    return {
        document: withRoomForNextMeasure(
            withVoice(document, position.part, next),
            next,
            offset + 1,
            parsed.notation,
        ),
        position: { part: position.part, offset: offset + 1 },
        changed: true,
        status: accidental === Accidental.SHARP ? 'Raised the note.' : 'Lowered the note.',
    };
}

export function applyOctave(
    document: ScoreDocument,
    position: EditorPosition,
    mark: string,
): EditOutcome {
    if (!/^'+$/.test(mark) && !/^[1-9]$/.test(mark)) {
        return reject(document, position, 'An octave mark is one or two apostrophes, or a digit.');
    }

    const offset = offsetOf(document, position);
    const source = textAt(document, position);
    const next = source.slice(0, offset) + mark + source.slice(offset);
    const parsed = parseVoice(next, settingsFor(position.part));
    if (!parsed.ok) {
        return reject(document, position, 'An octave mark can only follow a note.');
    }
    return {
        document: withRoomForNextMeasure(
            withVoice(document, position.part, next),
            next,
            offset + mark.length,
            parsed.notation,
        ),
        position: { part: position.part, offset: offset + mark.length },
        changed: true,
        status: mark.startsWith("'") ? 'Moved the note up.' : 'Moved the note down.',
    };
}

/**
 * The note immediately before the caret, with the modifiers written after it.
 *
 * A note "at the caret" means a pitch and any accidentals or octave marks that
 * follow it, with nothing else in between. A rest, a continuation or a new
 * duration ends the run, because those are separate events rather than part of
 * the note.
 */
function noteBeforeCaret(
    tokens: readonly Token[],
    offset: number,
): { pitch: Token; modifiers: Token[] } | null {
    let index = -1;
    for (let scan = tokens.length - 1; scan >= 0; scan -= 1) {
        if (tokens[scan].range.end === offset) {
            index = scan;
            break;
        }
    }
    if (index === -1) return null;

    const last = tokens[index];
    if (last.kind !== 'pitch' && last.kind !== 'accidental' && last.kind !== 'octave') {
        return null;
    }

    let pitchIndex = index;
    while (pitchIndex >= 0 && tokens[pitchIndex].kind !== 'pitch') {
        const kind = tokens[pitchIndex].kind;
        if (kind !== 'accidental' && kind !== 'octave') return null;
        pitchIndex -= 1;
    }
    if (pitchIndex < 0) return null;

    return { pitch: tokens[pitchIndex], modifiers: tokens.slice(pitchIndex + 1, index + 1) };
}

/**
 * The written pitch of the note ending at the caret, if there is one.
 *
 * This is what the editor sounds as a writer types: the note they just wrote
 * or changed, in its voice's register, with any accidental or octave marks
 * that belong to it. A caret after a rest, a continuation or a duration has no
 * note to sound and returns null.
 */
export function noteAtCaret(document: ScoreDocument, position: EditorPosition): Pitch | null {
    const offset = offsetOf(document, position);
    const note = noteBeforeCaret(tokensOf(document, position.part), offset);
    if (!note || note.pitch.kind !== 'pitch') return null;

    const spec = SOLFA_TO_DEGREE[note.pitch.syllable];
    let accidental = spec.accidental;
    let octaveOffset = 0;

    for (const modifier of note.modifiers) {
        if (modifier.kind === 'accidental') accidental = modifier.accidental;
        else if (modifier.kind === 'octave') octaveOffset += modifier.offset;
    }

    return new Pitch(
        spec.degree,
        accidental,
        settingsFor(position.part).referenceOctave + octaveOffset,
    );
}

/**
 * Set (or clear) the octave mark on the note at the caret.
 *
 * The on-screen octave keys are selectors for the notes still to be written,
 * but a writer who has just entered a note expects the key to act on that note
 * too. This replaces any octave already there rather than stacking a second
 * one, so pressing `+8va` twice gives two octaves up, not three marks. When
 * there is no note at the caret the caller only stores the selector.
 */
export function setNoteOctave(
    document: ScoreDocument,
    position: EditorPosition,
    mark: string,
): EditOutcome | null {
    if (mark && !/^'+$/.test(mark) && !/^[1-9]$/.test(mark)) {
        return reject(document, position, 'An octave mark is one or two apostrophes, or a digit.');
    }

    const offset = offsetOf(document, position);
    const note = noteBeforeCaret(tokensOf(document, position.part), offset);
    if (!note) return null;

    const existing = note.modifiers.filter((token) => token.kind === 'octave');
    let next = textAt(document, position);
    for (const token of [...existing].sort((a, b) => b.range.start - a.range.start)) {
        next = splice(next, token.range, '');
    }

    const removed = existing.reduce(
        (total, token) => total + token.range.end - token.range.start,
        0,
    );
    const insertAt = offset - removed;
    if (mark) next = next.slice(0, insertAt) + mark + next.slice(insertAt);

    const caret = insertAt + mark.length;
    const parsed = parseVoice(next, settingsFor(position.part));
    if (!parsed.ok) return reject(document, position, firstDiagnostic(parsed.diagnostics));

    if (next === textAt(document, position)) {
        return { document, position, changed: false };
    }

    return {
        document: withVoice(document, position.part, next),
        position: { part: position.part, offset: caret },
        changed: true,
        status: !mark
            ? 'Removed the octave mark.'
            : mark.startsWith("'")
              ? 'Raised the note.'
              : 'Lowered the note.',
    };
}

/** The token a backward deletion should remove, if any. */
function tokenBefore(tokens: readonly Token[], offset: number): Token | null {
    // At a boundary, the token that ends at the caret is the one behind it.
    for (let index = tokens.length - 1; index >= 0; index -= 1) {
        if (tokens[index].range.end === offset) return tokens[index];
    }
    // Inside a token, delete the whole token rather than half of it.
    const inside = tokens.find((token) => token.range.start < offset && offset < token.range.end);
    if (inside) return inside;
    for (let index = tokens.length - 1; index >= 0; index -= 1) {
        if (tokens[index].range.end <= offset) return tokens[index];
    }
    return null;
}

function removeToken(document: ScoreDocument, position: EditorPosition, token: Token): EditOutcome {
    const source = textAt(document, position);
    const next = splice(source, token.range, '');
    const offset = Math.min(token.range.start, next.length);
    const parsed = parseVoice(next, settingsFor(position.part));
    if (!parsed.ok) {
        // The common refusal is deleting the duration that a remaining note
        // still needs, which the parser reports at that note.
        return reject(document, position, firstDiagnostic(parsed.diagnostics));
    }
    return {
        document: withVoice(document, position.part, next),
        position: { part: position.part, offset },
        changed: true,
        status: `Removed ${source.slice(token.range.start, token.range.end)}.`,
    };
}

/** Delete the whole token before the caret — a syllable, a duration, a modifier, a rest. */
export function deletePrevious(document: ScoreDocument, position: EditorPosition): EditOutcome {
    const offset = offsetOf(document, position);
    const token = tokenBefore(tokensOf(document, position.part), offset);
    if (!token) return { document, position, changed: false };
    return removeToken(document, position, token);
}

/** Delete the whole token after the caret. */
export function deleteNext(document: ScoreDocument, position: EditorPosition): EditOutcome {
    const offset = offsetOf(document, position);
    const tokens = tokensOf(document, position.part);
    const token =
        tokens.find((candidate) => candidate.range.start >= offset) ??
        tokens.find((candidate) => containsOffset(candidate.range, offset));
    if (!token) return { document, position, changed: false };
    return removeToken(document, position, token);
}

/**
 * A physical-keyboard key, interpreted against the notation.
 *
 * This is where letter composition lives: `d` writes a note, a following `e`
 * turns it into `de`, `b` after a note is a flat, and the `a` after that flat
 * re-reads the pair as the `ba` note. The same primitives the on-screen keys
 * call are used here, so both ways of writing produce the same source.
 */
export function composeKey(
    document: ScoreDocument,
    position: EditorPosition,
    key: string,
): EditOutcome {
    if (key.length !== 1) {
        return reject(document, position, 'Type one key at a time.');
    }

    const value = key.toLowerCase();

    if (value in DURATION_VALUES) {
        return insertDuration(document, position, value as DurationMark);
    }
    if (value === '#') return applyAccidental(document, position, Accidental.SHARP);
    if (value === 'b') return composeB(document, position);
    if (value === 'a' || value === 'e') return composeVowel(document, position, value);
    if (value === "'") return applyOctave(document, position, "'");
    if (/^[1-9]$/.test(value)) return applyOctave(document, position, value);
    if (value === ' ') return insertRest(document, position);
    if (value === '-') return insertContinuation(document, position);
    if (isSolfaSyllable(value)) return insertSyllable(document, position, value);

    return reject(
        document,
        position,
        `“${key}” is not part of the notation. Type a solfa letter, a duration, or an accidental.`,
    );
}

/**
 * `b` is two things: the flat sign after a note, and the first letter of `ba`
 * where a new note belongs. Context decides, exactly as it does for a reader.
 */
function composeB(document: ScoreDocument, position: EditorPosition): EditOutcome {
    const offset = offsetOf(document, position);
    const tokens = tokensOf(document, position.part);
    const before = [...tokens].reverse().find((token) => token.range.end <= offset);

    const startsANote =
        !before ||
        before.kind === 'duration' ||
        before.kind === 'rest' ||
        before.kind === 'continuation';

    return startsANote
        ? insertSyllable(document, position, 'ba')
        : applyAccidental(document, position, Accidental.FLAT);
}

function composeVowel(
    document: ScoreDocument,
    position: EditorPosition,
    vowel: 'a' | 'e',
): EditOutcome {
    const offset = offsetOf(document, position);
    const tokens = tokensOf(document, position.part);
    const before = tokens.find((token) => token.range.end === offset);

    if (!before) {
        return reject(
            document,
            position,
            `“${vowel}” completes a note that has not been written yet.`,
        );
    }

    if (before.kind === 'pitch') {
        const candidate = `${before.text}${vowel}`;
        if (!isSolfaSyllable(candidate)) {
            return reject(document, position, `“${vowel}” does not complete ${before.text}.`);
        }
        const source = textAt(document, position);
        return accept(
            document,
            position,
            splice(source, before.range, candidate),
            before.range.start + candidate.length,
            `Wrote ${candidate}.`,
        );
    }

    // A flat was just written; `a` turns it into the lowered-soh note `ba`.
    // This is how the chromatic syllable can be reached after another note,
    // where the `b` alone had to mean a flat.
    if (vowel === 'a' && before.kind === 'accidental' && before.accidental === Accidental.FLAT) {
        const source = textAt(document, position);
        return accept(
            document,
            position,
            splice(source, before.range, 'ba'),
            before.range.start + 2,
            'Wrote ba.',
        );
    }

    return reject(document, position, `“${vowel}” does not complete the symbol before the caret.`);
}

export type CaretDirection = 'left' | 'right' | 'up' | 'down';

/** Move the caret without changing the music. */
export function moveCaret(
    document: ScoreDocument,
    position: EditorPosition,
    direction: CaretDirection,
): EditOutcome {
    const offset = offsetOf(document, position);
    let next = position;

    if (direction === 'up' || direction === 'down') {
        next = siblingCaret(document, position, direction === 'up' ? -1 : 1);
    } else {
        const tokens = tokensOf(document, position.part);
        next = caretAt(
            position.part,
            textAt(document, position),
            direction === 'left'
                ? offsetBefore(tokens, offset)
                : offsetAfter(tokens, offset, textAt(document, position).length),
        );
    }

    return { document, position: next, changed: false };
}
