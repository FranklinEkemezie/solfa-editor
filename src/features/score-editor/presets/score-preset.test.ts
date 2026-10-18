import { describe, expect, it } from 'vitest';
import { editorToDomain } from '@/features/score-editor/adapters/editor-to-domain';
import {
    ScorePresetError,
    parseScorePreset,
    type ScorePreset,
} from '@/features/score-editor/presets';

function preset(parts: Partial<ScorePreset['parts']> = {}): ScorePreset {
    return {
        title: 'Test',
        key: 'D-MAJOR-SHARP-2',
        timeSignature: '4/QUARTER',
        tempo: { beatsPerMinute: 96, description: 'Andante' },
        parts: {
            soprano: '',
            alto: '',
            tenor: '',
            bass: '',
            ...parts,
        },
    };
}

describe('parseScorePreset', () => {
    it('reads the details off the preset', () => {
        const document = parseScorePreset(preset({ soprano: 'd : m : s : l' }));

        expect(document.title).toBe('Test');
        expect(document.key.letter).toBe('D');
        expect(document.key.signature.count).toBe(2);
        expect(document.timeSignature.count).toBe(4);
        expect(document.tempo.beatsPerMinute).toBe(96);
        expect(document.tempo.description).toBe('Andante');
    });

    it('gives every part the same number of measures, ordered by part', () => {
        const document = parseScorePreset(
            preset({ soprano: 'd : : : | m : : :', alto: 's : : :' }),
        );

        expect(document.measures.map((measure) => measure.id)).toEqual([
            'soprano-1',
            'soprano-2',
            'alto-1',
            'alto-2',
            'tenor-1',
            'tenor-2',
            'bass-1',
            'bass-2',
        ]);
    });

    it('fills a measure with one beat per colon', () => {
        const document = parseScorePreset(preset({ soprano: 'd : m : s : l' }));

        expect(document.measures[0].slots.map((slot) => slot.notes[0]?.syllable)).toEqual([
            'd',
            'm',
            's',
            'l',
        ]);
    });

    it('leaves the beats a part stops writing empty', () => {
        const document = parseScorePreset(preset({ soprano: 'd : m' }));

        expect(document.measures[0].slots).toHaveLength(4);
        expect(document.measures[0].slots[2].notes).toEqual([]);
        expect(document.measures[0].slots[2].division).toBe(1);
    });

    it('halves a beat at a dot and quarters it at a comma', () => {
        const document = parseScorePreset(preset({ soprano: 'm.d : d,r.m,f' }));
        const [halved, quartered] = document.measures[0].slots;

        expect(halved.division).toBe(2);
        expect(halved.notes.map((note) => note.syllable)).toEqual(['m', 'd']);
        expect(quartered.division).toBe(4);
        expect(quartered.notes.map((note) => note.syllable)).toEqual(['d', 'r', 'm', 'f']);
    });

    it('lets a comma win when a beat mixes the two marks', () => {
        expect(parseScorePreset(preset({ soprano: 'd,r.m' })).measures[0].slots[0].division).toBe(
            4,
        );
    });

    it('sustains the note before a dash, across the barline', () => {
        const document = parseScorePreset(preset({ soprano: 'd : - | - : m' }));

        expect(document.measures[0].slots[1].notes).toEqual([
            expect.objectContaining({ syllable: 'd', continuation: true }),
        ]);
        expect(document.measures[1].slots[0].notes).toEqual([
            expect.objectContaining({ syllable: 'd', continuation: true }),
        ]);
    });

    it('ignores octave marks, which the parts already supply', () => {
        expect(parseScorePreset(preset({ soprano: "d' : m," })).measures[0].slots[0].notes).toEqual(
            [expect.objectContaining({ syllable: 'd' })],
        );
    });

    it('reads the chromatic syllables as one note', () => {
        const document = parseScorePreset(preset({ soprano: 'de : ma : se : ta' }));

        expect(document.measures[0].slots.map((slot) => slot.notes[0].syllable)).toEqual([
            'de',
            'ma',
            'se',
            'ta',
        ]);
    });

    it('keeps a measure that is written empty', () => {
        const document = parseScorePreset(preset({ soprano: 'd : : : | | m : : :' }));
        const soprano = document.measures.filter((measure) => measure.part === 'soprano');

        expect(soprano).toHaveLength(3);
        expect(soprano[1].slots.every((slot) => slot.notes.length === 0)).toBe(true);
        expect(soprano[2].slots[0].notes[0].syllable).toBe('m');
    });

    it('rejects more beats than the time signature holds', () => {
        expect(() => parseScorePreset(preset({ soprano: 'd : m : s : l : d' }))).toThrow(
            ScorePresetError,
        );
    });

    it('rejects a syllable it does not know', () => {
        expect(() => parseScorePreset(preset({ soprano: 'd : x : :' }))).toThrow(ScorePresetError);
    });

    it('rejects a dash with nothing before it to sustain', () => {
        expect(() => parseScorePreset(preset({ soprano: '- : d : :' }))).toThrow(ScorePresetError);
    });

    it('produces a score the domain accepts', () => {
        const document = parseScorePreset(
            preset({ soprano: 'd : m : s : l', bass: 'd,r.m,f : : :' }),
        );

        expect(() => editorToDomain(document)).not.toThrow();
    });
});
