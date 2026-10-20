import { describe, expect, it } from 'vitest';
import {
    Accidental,
    createEmptyScoreDocument,
    withVoice,
    type ScoreDocument,
} from '@/domain/music';
import { caretAt, type EditorPosition } from '@/features/score-editor/editing/caret';
import {
    applyAccidental,
    applyOctave,
    composeKey,
    deleteNext,
    deletePrevious,
    insertContinuation,
    insertDuration,
    insertRest,
    insertSyllable,
    moveCaret,
    type EditOutcome,
} from '@/features/score-editor/editing/notation-editing';

function caret(offset: number, part: EditorPosition['part'] = 'soprano'): EditorPosition {
    return { part, offset };
}

function source(outcome: EditOutcome, part: EditorPosition['part'] = 'soprano'): string {
    return outcome.document.voices[part];
}

function write(
    document: ScoreDocument,
    position: EditorPosition,
    keys: string[],
): EditOutcome {
    let outcome: EditOutcome = { document, position, changed: false };
    for (const key of keys) {
        outcome = composeKey(outcome.document, outcome.position, key);
        if (outcome.rejected) return outcome;
    }
    return outcome;
}

describe('editing a voice source', () => {
    it('writes a whole note with the duration it needs', () => {
        const outcome = insertSyllable(createEmptyScoreDocument(), caret(0), 'd');

        expect(source(outcome)).toBe(':d');
        expect(outcome.position).toEqual(caret(2));
        expect(outcome.changed).toBe(true);
    });

    it('writes the next note after the caret', () => {
        const first = insertSyllable(createEmptyScoreDocument(), caret(0), 'd');
        const second = insertSyllable(first.document, first.position, 'r');

        expect(source(second)).toBe(':dr');
        expect(second.position).toEqual(caret(3));
    });

    it('does not add a duration when one is already in force', () => {
        const document = withVoice(createEmptyScoreDocument(), 'soprano', ':.d');
        const outcome = insertSyllable(document, caret(3), 'r');

        expect(source(outcome)).toBe(':.dr');
    });

    it('keeps each part’s source separate', () => {
        const first = insertSyllable(createEmptyScoreDocument(), caret(0), 'd');
        const second = insertSyllable(first.document, caret(0, 'alto'), 's');

        expect(source(second)).toBe(':d');
        expect(source(second, 'alto')).toBe(':s');
    });

    it('changes the duration and reports it', () => {
        const outcome = insertDuration(createEmptyScoreDocument(), caret(0), '.');

        expect(source(outcome)).toBe('.');
        expect(outcome.position).toEqual(caret(1));
        expect(outcome.status).toContain('eighth');
    });

    it('does nothing when the chosen duration is already active', () => {
        const document = withVoice(createEmptyScoreDocument(), 'soprano', ':d');
        const outcome = insertDuration(document, caret(2), ':');

        expect(outcome.changed).toBe(false);
        expect(outcome.document).toBe(document);
        expect(outcome.status).toContain('Already');
    });

    it('adds a rest of the current duration', () => {
        const document = withVoice(createEmptyScoreDocument(), 'soprano', ':d');
        const outcome = insertRest(document, caret(2));

        expect(source(outcome)).toBe(':d ');
        expect(outcome.position).toEqual(caret(3));
    });

    it('holds a note on with a continuation', () => {
        const document = withVoice(createEmptyScoreDocument(), 'soprano', ':d');
        const outcome = insertContinuation(document, caret(2));

        expect(source(outcome)).toBe(':d-');
        expect(outcome.position).toEqual(caret(3));
    });

    it('refuses a continuation with no note before it', () => {
        const document = withVoice(createEmptyScoreDocument(), 'soprano', ':d');
        const outcome = insertContinuation(document, caret(0));

        expect(outcome.document).toBe(document);
        expect(outcome.rejected).toContain('follow a note');
    });

    it('raises and lowers a note', () => {
        const document = withVoice(createEmptyScoreDocument(), 'soprano', ':d');

        expect(source(applyAccidental(document, caret(2), Accidental.SHARP))).toBe(':d#');
        expect(source(applyAccidental(document, caret(2), Accidental.FLAT))).toBe(':db');
    });

    it('refuses an accidental before a note', () => {
        const document = createEmptyScoreDocument();
        const outcome = applyAccidental(document, caret(0), Accidental.SHARP);

        expect(outcome.rejected).toContain('follow a note');
        expect(outcome.document).toBe(document);
    });

    it('writes octave marks after a note', () => {
        const document = withVoice(createEmptyScoreDocument(), 'soprano', ':d');

        expect(source(applyOctave(document, caret(2), "'"))).toBe(":d'");
        expect(source(applyOctave(document, caret(2), '1'))).toBe(':d1');
        expect(applyOctave(document, caret(0), "'").rejected).toContain('only follow a note');
    });

    it('deletes a whole syllable', () => {
        const document = withVoice(createEmptyScoreDocument(), 'soprano', ':de');
        const outcome = deletePrevious(document, caret(3));

        expect(source(outcome)).toBe(':');
        expect(outcome.position).toEqual(caret(1));
    });

    it('deletes a duration, rest, accidental, octave and continuation as whole tokens', () => {
        for (const [written, expected] of [
            [':d-', ':d'],
            [':d#', ':d'],
            [":d''", ':d'],
            [':d ', ':d'],
        ] as const) {
            const document = withVoice(createEmptyScoreDocument(), 'soprano', written);
            const outcome = deletePrevious(document, caret(written.length));
            expect(source(outcome)).toBe(expected);
        }
    });

    it('refuses a deletion that would leave unreadable notation', () => {
        const document = withVoice(createEmptyScoreDocument(), 'soprano', ':d');
        const outcome = deletePrevious(document, caret(1));

        expect(outcome.document).toBe(document);
        expect(outcome.rejected).toContain('duration');
    });

    it('deletes forward without moving the caret', () => {
        const document = withVoice(createEmptyScoreDocument(), 'soprano', ':dr');
        const outcome = deleteNext(document, caret(2));

        expect(source(outcome)).toBe(':d');
        expect(outcome.position).toEqual(caret(2));
    });

    it('composes a chromatic syllable from a vowel', () => {
        const document = withVoice(createEmptyScoreDocument(), 'soprano', ':d');
        const outcome = composeKey(document, caret(2), 'e');

        expect(source(outcome)).toBe(':de');
        expect(outcome.position).toEqual(caret(3));
    });

    it('composes every chromatic pair the vowel completes', () => {
        for (const [letter, vowel, syllable] of [
            ['d', 'e', 'de'],
            ['r', 'e', 're'],
            ['m', 'a', 'ma'],
            ['f', 'e', 'fe'],
            ['s', 'e', 'se'],
            ['t', 'a', 'ta'],
        ] as const) {
            const document = withVoice(createEmptyScoreDocument(), 'soprano', `:${letter}`);
            const outcome = composeKey(document, caret(2), vowel);
            expect(source(outcome)).toBe(`:${syllable}`);
        }
    });

    it('rejects a vowel that completes nothing', () => {
        const document = withVoice(createEmptyScoreDocument(), 'soprano', ':d');
        const outcome = composeKey(document, caret(2), 'a');

        expect(outcome.rejected).toContain('does not complete');
        expect(outcome.document).toBe(document);
    });

    it('reads b as a new ba note where a note belongs', () => {
        const outcome = composeKey(createEmptyScoreDocument(), caret(0), 'b');

        expect(source(outcome)).toBe(':ba');
        expect(outcome.position).toEqual(caret(3));
    });

    it('reads b as a flat after a note, and a as the ba completion', () => {
        const flat = composeKey(
            withVoice(createEmptyScoreDocument(), 'soprano', ':d'),
            caret(2),
            'b',
        );
        expect(source(flat)).toBe(':db');

        const note = composeKey(flat.document, flat.position, 'a');
        expect(source(note)).toBe(':dba');
        expect(note.position).toEqual(caret(4));
    });

    it('accepts upper-case letters as their lower-case key', () => {
        const document = withVoice(createEmptyScoreDocument(), 'soprano', ':d');
        const outcome = composeKey(document, caret(2), 'E');

        expect(source(outcome)).toBe(':de');
    });

    it('writes durations, rests, continuations and octaves from the keyboard', () => {
        const durations = write(createEmptyScoreDocument(), caret(0), [':', '.', ',']);
        expect(source(durations)).toBe(':.,');

        expect(source(write(createEmptyScoreDocument(), caret(0), ['d', ' ']))).toBe(':d ');
        expect(source(write(createEmptyScoreDocument(), caret(0), ['d', '-']))).toBe(':d-');
        expect(source(write(createEmptyScoreDocument(), caret(0), ['d', "'", '1']))).toBe(
            ":d'1",
        );
    });

    it('writes an accidental from the keyboard', () => {
        const document = withVoice(createEmptyScoreDocument(), 'soprano', ':d');
        const outcome = composeKey(document, caret(2), '#');

        expect(source(outcome)).toBe(':d#');
    });

    it('rejects a key the language does not know', () => {
        const outcome = composeKey(createEmptyScoreDocument(), caret(0), 'z');

        expect(outcome.rejected).toContain('not part of the notation');
        expect(outcome.changed).toBe(false);
    });

    it('moves the caret by whole tokens', () => {
        const document = withVoice(createEmptyScoreDocument(), 'soprano', ':d.r');

        expect(moveCaret(document, caret(4), 'left').position).toEqual(caret(3));
        expect(moveCaret(document, caret(3), 'left').position).toEqual(caret(2));
        expect(moveCaret(document, caret(2), 'left').position).toEqual(caret(1));
        expect(moveCaret(document, caret(1), 'right').position).toEqual(caret(2));
        expect(moveCaret(document, caret(3), 'right').position).toEqual(caret(4));
        expect(moveCaret(document, caret(4), 'right').position).toEqual(caret(4));
    });

    it('moves between voices, keeping the character position where it fits', () => {
        const document = withVoice(
            withVoice(createEmptyScoreDocument(), 'soprano', ':de'),
            'alto',
            ':d',
        );

        expect(moveCaret(document, caret(3), 'down').position).toEqual(caret(2, 'alto'));
        expect(moveCaret(document, caret(2, 'alto'), 'up').position).toEqual(caret(2));
        expect(moveCaret(document, caret(0, 'bass'), 'down').position).toEqual(caret(0, 'bass'));
    });

    it('makes the caret from a click and keeps it inside the source', () => {
        expect(caretAt('soprano', ':d', 99)).toEqual(caret(2));
        expect(caretAt('soprano', ':d', -1)).toEqual(caret(0));
    });
});
