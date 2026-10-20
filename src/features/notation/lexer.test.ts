import { describe, expect, it } from 'vitest';
import { NoteValue } from '@/domain/music';
import { CHROMATIC_SOLFA_SYLLABLES, NATURAL_SOLFA_SYLLABLES } from '@/domain/solfa';
import { tokenCandidatesAt } from '@/features/notation/lexer';
import { tokenize } from '@/features/notation/parser';

function tokens(source: string) {
    const result = tokenize(source);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.diagnostic.message);
    return result.tokens;
}

function shape(source: string) {
    return tokens(source).map((token) => `${token.kind}:${token.text}`);
}

describe('the notation lexer', () => {
    it('recognises every natural syllable', () => {
        for (const syllable of NATURAL_SOLFA_SYLLABLES) {
            expect(shape(`:${syllable}`)).toEqual(['duration::', `pitch:${syllable}`]);
        }
    });

    it('recognises every chromatic syllable as a single pitch', () => {
        for (const syllable of CHROMATIC_SOLFA_SYLLABLES) {
            expect(tokens(`:${syllable}`)).toHaveLength(2);
            expect(tokens(`:${syllable}`)[1]).toMatchObject({
                kind: 'pitch',
                syllable,
                range: { start: 1, end: 3 },
            });
        }
    });

    it('gives each duration symbol its value', () => {
        expect(tokens(':')).toMatchObject([{ kind: 'duration', value: NoteValue.QUARTER }]);
        expect(tokens('.')).toMatchObject([{ kind: 'duration', value: NoteValue.EIGHTH }]);
        expect(tokens(',')).toMatchObject([{ kind: 'duration', value: NoteValue.SIXTEENTH }]);
    });

    it('recognises both accidentals', () => {
        expect(shape(':d#')).toEqual(['duration::', 'pitch:d', 'accidental:#']);
        expect(shape(':db')).toEqual(['duration::', 'pitch:d', 'accidental:b']);
    });

    it('reads an octave run as one modifier, with negative digits', () => {
        expect(tokens(":d''")[2]).toMatchObject({
            kind: 'octave',
            text: "''",
            offset: 2,
        });
        expect(tokens(":d'")[2]).toMatchObject({ kind: 'octave', offset: 1 });
        expect(tokens(':d1')[2]).toMatchObject({ kind: 'octave', offset: -1 });
        expect(tokens(':d12')[2]).toMatchObject({ kind: 'octave', offset: -12 });
    });

    it('recognises continuations and literal-space rests', () => {
        expect(shape(':d- ')).toEqual(['duration::', 'pitch:d', 'continuation:-', 'rest: ']);
    });

    it('offers the longer pitch first at an ambiguous position', () => {
        expect(tokenCandidatesAt('de', 0).map((token) => token.text)).toEqual(['de', 'd']);
        expect(tokenCandidatesAt('se', 0).map((token) => token.text)).toEqual(['se', 's']);
    });

    it('offers the pitch ba before the accidental b after a note', () => {
        expect(tokenCandidatesAt('sba', 1).map((token) => token.kind)).toEqual([
            'pitch',
            'accidental',
        ]);
    });

    it('prefers the longer octave modifier', () => {
        expect(
            tokenCandidatesAt("''", 0).map((token) =>
                token.kind === 'octave' ? token.offset : null,
            ),
        ).toEqual([2, 1]);
    });

    it('takes the chromatic reading when it is the only valid one', () => {
        expect(tokens(':se')[1]).toMatchObject({ kind: 'pitch', syllable: 'se' });
    });

    it('backtracks away from a flat when the syllable needs both letters', () => {
        expect(tokens(':sba')).toMatchObject([
            { kind: 'duration' },
            { kind: 'pitch', syllable: 's' },
            { kind: 'pitch', syllable: 'ba' },
        ]);
    });

    it('keeps a flat when no syllable follows it', () => {
        expect(tokens(':sb')).toMatchObject([
            { kind: 'duration' },
            { kind: 'pitch', syllable: 's' },
            { kind: 'accidental', accidental: 'FLAT' },
        ]);
    });

    it('reads a compact run of pitches without separators', () => {
        expect(tokens(':ddemdsfeltasebam').map((token) => token.kind)).toEqual([
            'duration',
            'pitch',
            'pitch',
            'pitch',
            'pitch',
            'pitch',
            'pitch',
            'pitch',
            'pitch',
            'pitch',
            'pitch',
            'pitch',
        ]);
        expect(
            tokens(':ddemdsfeltasebam').map((token) =>
                token.kind === 'pitch' ? token.syllable : undefined,
            ),
        ).toEqual([undefined, 'd', 'de', 'm', 'd', 's', 'fe', 'l', 'ta', 'se', 'ba', 'm']);
    });

    it('keeps exact source ranges', () => {
        expect(tokens(':d.de')).toEqual([
            expect.objectContaining({ kind: 'duration', range: { start: 0, end: 1 } }),
            expect.objectContaining({ kind: 'pitch', range: { start: 1, end: 2 } }),
            expect.objectContaining({ kind: 'duration', range: { start: 2, end: 3 } }),
            expect.objectContaining({ kind: 'pitch', range: { start: 3, end: 5 } }),
        ]);
    });

    it('rejects tabs and line breaks as whitespace', () => {
        const tab = tokenize(':d\tr');
        expect(tab.ok).toBe(false);
        if (tab.ok) return;
        expect(tab.diagnostic.range).toEqual({ start: 2, end: 3 });
        expect(tab.diagnostic.message).toContain('tabs and line breaks');

        expect(tokenize(':d\nr').ok).toBe(false);
    });

    it('rejects a character it does not know', () => {
        const result = tokenize(':x');
        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.diagnostic.range).toEqual({ start: 1, end: 2 });
        expect(result.diagnostic.message).toContain('x');
    });
});
