import { describe, expect, it } from 'vitest';
import { validateScore } from '@/domain/music';
import { buildScoreView } from '@/features/score-editor/model/build-score';
import {
    gloriaJudeNnam,
    hallelujahChorus,
    presetDocument,
    ScorePresetError,
    type ScorePreset,
} from '@/features/score-editor/presets';

function preset(parts: Partial<ScorePreset['parts']> = {}, measureCount?: number): ScorePreset {
    return {
        title: 'Test',
        key: 'D-MAJOR-SHARP-2',
        timeSignature: '4/QUARTER',
        tempo: { beatsPerMinute: 96, description: 'Andante' },
        measureCount,
        parts: {
            soprano: '',
            alto: '',
            tenor: '',
            bass: '',
            ...parts,
        },
    };
}

describe('presetDocument', () => {
    it('reads the details off the preset', () => {
        const document = presetDocument(preset({ soprano: ':dmsl' }));

        expect(document.title).toBe('Test');
        expect(document.key.letter).toBe('D');
        expect(document.key.signature.count).toBe(2);
        expect(document.timeSignature.count).toBe(4);
        expect(document.tempo.beatsPerMinute).toBe(96);
        expect(document.tempo.description).toBe('Andante');
    });

    it('keeps the notation as the voices’ sources', () => {
        const document = presetDocument(preset({ soprano: ':dmsl' }));

        expect(document.voices.soprano).toBe(':dmsl');
        expect(document.voices.alto).toBe('');
    });

    it('lays a short voice over the measures the document asks for', () => {
        const view = buildScoreView(presetDocument(preset({ soprano: ':dmsl' }, 3)));

        expect(view.measureCount).toBe(3);
        expect(
            view.parts.soprano.measures[0]?.beats.map((beat) => beat.items[0]?.syllable),
        ).toEqual(['d', 'm', 's', 'l']);
        expect(view.parts.soprano.measures[2]?.beats.every((beat) => beat.items.length === 0)).toBe(
            true,
        );
    });

    it('gives every part the measures the music needs', () => {
        const view = buildScoreView(
            presetDocument(preset({ soprano: ':dmsl:dmsl:dmsl', alto: ':d' })),
        );

        expect(view.measureCount).toBe(3);
        expect(view.parts.alto.measures).toHaveLength(3);
        expect(view.parts.alto.measures[2]?.beats.every((beat) => beat.items.length === 0)).toBe(
            true,
        );
    });

    it('places each voice in its own register', () => {
        const view = buildScoreView(presetDocument(preset({ soprano: ':d', bass: ':d' })));

        const soprano = view.parts.soprano.voice?.events[0];
        const bass = view.parts.bass.voice?.events[0];
        expect(soprano?.kind === 'note' ? soprano.note.pitch.octave : null).toBe(4);
        expect(bass?.kind === 'note' ? bass.note.pitch.octave : null).toBe(3);
    });

    it('rejects a source it cannot read, naming the part', () => {
        expect(() => presetDocument(preset({ soprano: ':dx' }))).toThrow(ScorePresetError);
        expect(() => presetDocument(preset({ soprano: ':dx' }))).toThrow(/soprano/i);
    });

    it('accepts an empty preset as four silent voices', () => {
        const view = buildScoreView(presetDocument(preset()));

        expect(view.measureCount).toBe(1);
        expect(validateScore(view.score)).toEqual([]);
    });
});

describe('the samples', () => {
    it('opens the Hallelujah Chorus as eight measures for four parts', () => {
        const view = buildScoreView(presetDocument(hallelujahChorus));

        expect(view.measureCount).toBe(8);
        for (const part of ['soprano', 'alto', 'tenor', 'bass'] as const) {
            expect(view.parts[part].diagnostics).toEqual([]);
            expect(view.parts[part].measures).toHaveLength(8);
        }
        expect(validateScore(view.score)).toEqual([]);
    });

    it('keeps the written notes of the opening measure', () => {
        const view = buildScoreView(presetDocument(hallelujahChorus));
        const beats = view.parts.soprano.measures[0]?.beats ?? [];

        expect(beats[0]?.items[0]).toMatchObject({ kind: 'note', syllable: 'd' });
        expect(beats[1]?.items[0]).toMatchObject({ kind: 'continuation', syllable: 'd' });
        expect(beats[2]?.items.map((item) => item.syllable)).toEqual(['s', 'l']);
        expect(beats[3]?.items[0]).toMatchObject({ kind: 'note', syllable: 's' });
    });

    it('holds the long notes across their beats', () => {
        const view = buildScoreView(presetDocument(gloriaJudeNnam));
        const measure = view.score.measures.find(
            (candidate) => candidate.part === 'soprano' && candidate.number === 2,
        );

        expect(measure?.events.map((event) => event.duration)).toEqual([
            { numerator: 2, denominator: 1 },
            { numerator: 2, denominator: 1 },
        ]);
    });

    it('keeps Gloria’s details', () => {
        const document = presetDocument(gloriaJudeNnam);

        expect(document.title).toBe('Gloria');
        expect(document.author).toBe('Sir Jude Nnam');
        expect(document.key.letter).toBe('E');
        expect(document.tempo.beatsPerMinute).toBe(110);
    });
});
