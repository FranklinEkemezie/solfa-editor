import { describe, expect, it } from 'vitest';
import { Accidental } from '@/domain/music';
import { parseVoiceSource, type ParseItem } from '@/features/notation/parser';

function parsed(source: string) {
    const result = parseVoiceSource(source);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.diagnostic.message);
    return result.tree;
}

function itemKinds(source: string): string[] {
    return parsed(source).items.map((item: ParseItem) => item.kind);
}

function failure(source: string) {
    const result = parseVoiceSource(source);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected the source to fail.');
    return result.diagnostic;
}

describe('the notation parser', () => {
    it('accepts the empty voice', () => {
        expect(parsed('')).toEqual({ items: [], tokens: [] });
    });

    it('requires the first symbol to set a duration', () => {
        expect(failure('d')).toMatchObject({ range: { start: 0, end: 1 } });
        expect(failure('d').message).toContain('duration');
        expect(failure('-')).toMatchObject({ range: { start: 0, end: 1 } });
    });

    it('accepts a duration on its own', () => {
        expect(itemKinds(':')).toEqual(['duration']);
    });

    it('reads a pitch after its duration', () => {
        expect(itemKinds(':d')).toEqual(['duration', 'pitch']);
    });

    it('lets a later duration override an earlier one and keeps both', () => {
        const tree = parsed(':.d');
        expect(tree.items.map((item) => item.kind)).toEqual(['duration', 'duration', 'pitch']);
        expect(tree.tokens.map((token) => token.text)).toEqual([':', '.', 'd']);
    });

    it('accepts consecutive rests and consecutive continuations', () => {
        expect(itemKinds(':d  r')).toEqual(['duration', 'pitch', 'rest', 'rest', 'pitch']);
        expect(itemKinds(':d--')).toEqual(['duration', 'pitch', 'continuation', 'continuation']);
    });

    it('attaches modifiers to their pitch in either order', () => {
        const sharpThenOctave = parsed(":d#'");
        expect(sharpThenOctave.items[1]).toMatchObject({
            kind: 'pitch',
            modifiers: [
                { kind: 'accidental', accidental: Accidental.SHARP },
                { kind: 'octave', offset: 1 },
            ],
        });

        const octaveThenSharp = parsed(":d'#");
        expect(octaveThenSharp.items[1]).toMatchObject({
            kind: 'pitch',
            modifiers: [
                { kind: 'octave', offset: 1 },
                { kind: 'accidental', accidental: Accidental.SHARP },
            ],
        });
    });

    it('lets the latest octave modifier override the earlier one', () => {
        const pitch = parsed(":d''1").items[1];
        expect(pitch).toMatchObject({
            kind: 'pitch',
            modifiers: [
                { kind: 'octave', offset: 2 },
                { kind: 'octave', offset: -1 },
            ],
        });
    });

    it('allows a duration between a note and the continuation that extends it', () => {
        expect(itemKinds(':d:-')).toEqual(['duration', 'pitch', 'duration', 'continuation']);
    });

    it('rejects a continuation with no note to extend', () => {
        expect(failure(':-')).toMatchObject({ range: { start: 1, end: 2 } });
        expect(failure(':d -')).toMatchObject({ range: { start: 3, end: 4 } });
    });

    it('rejects a modifier after a rest or a continuation', () => {
        expect(failure(':d b')).toMatchObject({ range: { start: 3, end: 4 } });
        expect(failure(':d-#')).toMatchObject({ range: { start: 3, end: 4 } });
    });

    it('rejects a modifier after a duration has intervened', () => {
        expect(failure(':d:#')).toMatchObject({ range: { start: 3, end: 4 } });
    });

    it('rejects an accidental before the first note', () => {
        expect(failure(':#')).toMatchObject({ range: { start: 1, end: 2 } });
    });

    it('points at the character that could not be read', () => {
        const diagnostic = failure(':m x');
        expect(diagnostic.range).toEqual({ start: 3, end: 4 });
        expect(diagnostic.message).toContain('x');
    });

    it('accepts the compact pitch run from the language specification', () => {
        expect(
            parsed(':ddemdsfeltasebam')
                .items.slice(1)
                .map((item) => (item.kind === 'pitch' ? item.token.text : item.kind)),
        ).toEqual(['d', 'de', 'm', 'd', 's', 'fe', 'l', 'ta', 'se', 'ba', 'm']);
    });
});
