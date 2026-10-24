import { describe, expect, it } from 'vitest';
import {
    Accidental,
    createEmptyScoreDocument,
    Degree,
    withVoice,
    type PartId,
    type ScoreDocument,
} from '@/domain/music';
import {
    composeKey,
    insertSyllable,
    noteAtCaret,
} from '@/features/score-editor/editing/notation-editing';

function documentOf(source: string, part: PartId = 'soprano'): ScoreDocument {
    return withVoice(createEmptyScoreDocument(), part, source);
}

function at(source: string, part: PartId = 'soprano') {
    return { part, offset: source.length };
}

describe('the note at the caret', () => {
    it('reads the syllable just written in the voice register', () => {
        const document = documentOf(':d');

        const pitch = noteAtCaret(document, at(':d'));

        expect(pitch?.degree).toBe(Degree.I);
        expect(pitch?.accidental).toBe(Accidental.NATURAL);
        expect(pitch?.octave).toBe(4);
    });

    it('keeps the chromatic syllable’s own accidental', () => {
        const document = documentOf(':se');

        const pitch = noteAtCaret(document, at(':se'));

        expect(pitch?.degree).toBe(Degree.V);
        expect(pitch?.accidental).toBe(Accidental.SHARP);
    });

    it('lets an explicit accidental override the syllable', () => {
        const document = documentOf(':db');

        const pitch = noteAtCaret(document, at(':db'));

        expect(pitch?.accidental).toBe(Accidental.FLAT);
    });

    it('applies the octave marks written after the note', () => {
        expect(noteAtCaret(documentOf(":d'"), at(":d'"))?.octave).toBe(5);
        expect(noteAtCaret(documentOf(':d1'), at(':d1'))?.octave).toBe(3);
    });

    it('uses the voice’s own reference octave', () => {
        expect(noteAtCaret(documentOf(':d', 'tenor'), at(':d', 'tenor'))?.octave).toBe(3);
        expect(noteAtCaret(documentOf(':d', 'bass'), at(':d', 'bass'))?.octave).toBe(3);
    });

    it('has no note after a rest, a continuation or a duration', () => {
        expect(noteAtCaret(documentOf(':d '), at(':d '))).toBeNull();
        expect(noteAtCaret(documentOf(':d-'), at(':d-'))).toBeNull();
        expect(noteAtCaret(documentOf(':d.'), at(':d.'))).toBeNull();
    });

    it('finds the pitch under a trailing accidental or octave mark', () => {
        expect(noteAtCaret(documentOf(':d#'), at(':d#'))?.accidental).toBe(Accidental.SHARP);
        expect(noteAtCaret(documentOf(":d'"), at(":d'"))?.octave).toBe(5);
    });

    it('follows the pitch as a typed syllable is completed and raised', () => {
        const empty = createEmptyScoreDocument();
        const sol = composeKey(empty, { part: 'soprano', offset: 0 }, 's');
        const raised = composeKey(sol.document, sol.position, 'e');
        const octave = composeKey(raised.document, raised.position, "'");

        expect(noteAtCaret(sol.document, sol.position)?.degree).toBe(Degree.V);
        expect(noteAtCaret(raised.document, raised.position)?.accidental).toBe(Accidental.SHARP);
        expect(noteAtCaret(octave.document, octave.position)?.octave).toBe(5);
    });

    it('reads a whole syllable entered from the on-screen keyboard once', () => {
        const outcome = insertSyllable(
            createEmptyScoreDocument(),
            { part: 'soprano', offset: 0 },
            'se',
        );

        expect(outcome.document.voices.soprano).toBe(':se');
        expect(noteAtCaret(outcome.document, outcome.position)?.accidental).toBe(Accidental.SHARP);
    });
});
