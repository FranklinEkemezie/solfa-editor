import { describe, expect, it } from 'vitest';
import {
    createEmptyScoreDocument,
    emptyLyricsByPart,
    fraction,
    Note,
    Rest,
    validateScore,
    withVoice,
    type ScoreDocument,
} from '@/domain/music';
import { buildScoreView } from '@/features/score-editor/model/build-score';
import { activeBeat } from '@/features/score-editor/model/score-view';

function documentWith(voices: Partial<Record<'soprano' | 'alto' | 'tenor' | 'bass', string>>) {
    let document: ScoreDocument = createEmptyScoreDocument();
    for (const [part, source] of Object.entries(voices)) {
        document = withVoice(document, part as 'soprano', source);
    }
    return document;
}

function viewOf(source: string) {
    return buildScoreView(documentWith({ soprano: source }));
}

function sopranoMeasure(view: ReturnType<typeof viewOf>, number: number) {
    return view.parts.soprano.measures[number - 1];
}

function syllables(
    beat: NonNullable<ReturnType<typeof sopranoMeasure>>['beats'][number] | undefined,
) {
    return beat?.items.flatMap((item) => (item.kind === 'rest' ? [] : [item.syllable])) ?? [];
}

describe('building a score from voice sources', () => {
    it('opens with the document’s four silent measures', () => {
        const view = buildScoreView(createEmptyScoreDocument());

        expect(view.measureCount).toBe(4);
        expect(view.measureNumbers).toEqual([1, 2, 3, 4]);
        expect(view.parts.soprano.measures).toHaveLength(4);
        expect(view.parts.soprano.measures[0]?.beats).toHaveLength(4);
        expect(view.parts.soprano.measures[0]?.beats.every((beat) => beat.items.length === 0)).toBe(
            true,
        );
        expect(validateScore(view.score)).toEqual([]);
    });

    it('grows to hold the music when a voice needs more measures', () => {
        const view = viewOf(`:${'d'.repeat(17)}`);

        expect(view.measureCount).toBe(5);
        expect(sopranoMeasure(view, 5)?.beats[0]?.items[0]).toMatchObject({
            kind: 'note',
            syllable: 'd',
        });
    });

    it('gives every part the same measures', () => {
        const view = buildScoreView(
            withVoice(documentWith({ soprano: ':sssssssss' }), 'alto', ':d'),
        );

        expect(view.measureCount).toBe(4);
        expect(view.parts.soprano.measures).toHaveLength(4);
        expect(view.parts.alto.measures).toHaveLength(4);
        expect(view.parts.alto.measures[3]?.beats.every((beat) => beat.items.length === 0)).toBe(
            true,
        );
    });

    it('places notes in their beats', () => {
        const view = viewOf(':drs');
        const beats = sopranoMeasure(view, 1)?.beats ?? [];

        expect(beats.map(syllables)).toEqual([['d'], ['r'], ['s'], []]);
    });

    it('keeps two eighth notes in one divided beat', () => {
        const view = viewOf(':.drsf');
        const beats = sopranoMeasure(view, 1)?.beats ?? [];

        expect(beats[0]?.division).toBe(2);
        expect(syllables(beats[0])).toEqual(['d', 'r']);
        expect(beats[1]?.division).toBe(2);
        expect(syllables(beats[1])).toEqual(['s', 'f']);
    });

    it('quarters a beat that holds four sixteenths', () => {
        const view = viewOf(':,drsf');

        expect(sopranoMeasure(view, 1)?.beats[0]?.division).toBe(4);
        expect(sopranoMeasure(view, 1)?.beats[0]?.items).toHaveLength(4);
    });

    it('shows a held note as a continuation in the next beat', () => {
        const view = viewOf(':d-');
        const beats = sopranoMeasure(view, 1)?.beats ?? [];

        expect(beats[0]?.items[0]).toMatchObject({ kind: 'note', syllable: 'd' });
        expect(beats[1]?.items[0]).toMatchObject({ kind: 'continuation', syllable: 'd' });
        expect(beats[1]?.division).toBe(1);
    });

    it('splits a note that crosses the barline into tied measures', () => {
        const view = viewOf(':sss. d-');

        expect(view.measureCount).toBe(4);
        const second = view.score.measures.find(
            (measure) => measure.part === 'soprano' && measure.number === 2,
        );
        expect(second?.events).toHaveLength(1);
        const tied = second?.events[0];
        expect(tied).toBeInstanceOf(Note);
        if (tied instanceof Note) {
            expect(tied.continuation).toBe(true);
            expect(tied.duration).toEqual(fraction(1, 2));
        }

        expect(sopranoMeasure(view, 2)?.beats[0]?.items[0]).toMatchObject({
            kind: 'continuation',
            syllable: 'd',
        });
        expect(validateScore(view.score)).toEqual([]);
    });

    it('keeps rests in the score as silence in their own beat', () => {
        const view = viewOf(':d ');
        const measure = view.score.measures.find(
            (candidate) => candidate.part === 'soprano' && candidate.number === 1,
        );

        expect(measure?.events[0]).toBeInstanceOf(Note);
        expect(measure?.events[1]).toBeInstanceOf(Rest);
        expect(sopranoMeasure(view, 1)?.beats[0]?.items).toHaveLength(1);
        expect(sopranoMeasure(view, 1)?.beats[1]?.items).toEqual([
            expect.objectContaining({ kind: 'rest' }),
        ]);
    });

    it('keeps an eighth rest in the beat it divides', () => {
        const view = viewOf('. d');
        const beat = sopranoMeasure(view, 1)?.beats[0];

        expect(beat?.division).toBe(2);
        expect(beat?.items).toEqual([
            expect.objectContaining({ kind: 'rest', start: fraction(0) }),
            expect.objectContaining({ kind: 'note', syllable: 'd', start: fraction(1, 2) }),
        ]);
    });

    it('carries an explicit accidental into the page', () => {
        const view = viewOf(':d#');

        expect(sopranoMeasure(view, 1)?.beats[0]?.items[0]).toMatchObject({
            accidental: 'SHARP',
        });
    });

    it('maps each beat to the end of the event sounding there', () => {
        const view = viewOf(':d-');
        const beats = sopranoMeasure(view, 1)?.beats ?? [];

        expect(beats[0]?.sourceOffset).toBe(3);
        expect(beats[1]?.sourceOffset).toBe(3);
        expect(beats[3]?.sourceOffset).toBe(3);
    });

    it('maps a trailing beat to the end of the source', () => {
        const view = viewOf(':d ');

        expect(sopranoMeasure(view, 1)?.beats[1]?.sourceOffset).toBe(3);
    });

    it('reports a source it cannot read and still lays out the page', () => {
        const view = viewOf(':dx');

        expect(view.diagnostics).toHaveLength(1);
        expect(view.diagnostics[0]?.part).toBe('soprano');
        expect(view.parts.soprano.voice).toBeNull();
        expect(view.parts.soprano.measures).toHaveLength(4);
        expect(view.parts.soprano.measures[0]?.beats).toHaveLength(4);
    });

    it('keeps the parts’ sources independent', () => {
        const view = buildScoreView(withVoice(documentWith({ soprano: ':d' }), 'bass', ':s'));

        expect(view.parts.soprano.source).toBe(':d');
        expect(view.parts.bass.source).toBe(':s');
        expect(sopranoMeasure(view, 1)?.beats[0]?.items[0]).toMatchObject({
            kind: 'note',
            syllable: 'd',
        });
        expect(view.parts.bass.measures[0]?.beats[0]?.items[0]).toMatchObject({
            kind: 'note',
            syllable: 's',
        });
    });
});

describe('part lyrics', () => {
    function viewWithLyrics(source: string, syllables: readonly string[]) {
        return buildScoreView({
            ...documentWith({ soprano: source }),
            lyricsByPart: { ...emptyLyricsByPart(), soprano: syllables },
        });
    }

    it('puts one syllable under each note that begins', () => {
        const view = viewWithLyrics(':drmf', ['Glo', 'ri', 'a', 'Deo']);
        const beats = sopranoMeasure(view, 1)?.beats ?? [];

        expect(beats.map((beat) => (beat.items[0] as { lyric?: string }).lyric)).toEqual([
            'Glo',
            'ri',
            'a',
            'Deo',
        ]);
    });

    it('does not spend a syllable on a rest', () => {
        const view = viewWithLyrics(':d r', ['Glo', 'ri']);
        const beats = sopranoMeasure(view, 1)?.beats ?? [];

        expect(beats[0]?.items[0]).toMatchObject({ kind: 'note', lyric: 'Glo' });
        expect(beats[1]?.items[0]).toMatchObject({ kind: 'rest' });
        expect(beats[2]?.items[0]).toMatchObject({ kind: 'note', lyric: 'ri' });
    });

    it('draws an em dash under a held note once a line exists', () => {
        const view = viewWithLyrics(':d-', ['Glo']);
        const beats = sopranoMeasure(view, 1)?.beats ?? [];

        expect(beats[0]?.items[0]).toMatchObject({ kind: 'note', lyric: 'Glo' });
        expect(beats[1]?.items[0]).toMatchObject({ kind: 'continuation', lyric: '\u2014' });
    });

    it('draws no dash when the part has no lyric line', () => {
        const view = viewWithLyrics(':d-', []);
        const beats = sopranoMeasure(view, 1)?.beats ?? [];

        expect(beats[1]?.items[0]).toMatchObject({ kind: 'continuation', lyric: '' });
        expect(view.parts.soprano.hasLyrics).toBe(false);
    });

    it('reads a syllable from the part line, not from the note', () => {
        const view = viewWithLyrics(':d', ['Glo']);

        expect(view.parts.soprano.lyrics).toEqual(['Glo']);
        expect(view.parts.soprano.hasLyrics).toBe(true);
    });
});

describe('activeBeat', () => {
    it('points an empty voice at its opening beat', () => {
        const view = buildScoreView(createEmptyScoreDocument());

        expect(activeBeat(view.parts.soprano, 0)).toEqual({ measure: 1, beat: 1 });
    });

    it('points a caret after an event at the last beat that event sounds in', () => {
        const view = viewOf(':d-');

        expect(activeBeat(view.parts.soprano, 3)).toEqual({ measure: 1, beat: 2 });
    });

    it('points a caret before a note at the beat the note starts in', () => {
        const view = viewOf(':d-');

        expect(activeBeat(view.parts.soprano, 2)).toEqual({ measure: 1, beat: 1 });
    });

    it('points into a later measure when the music reaches it', () => {
        const view = viewOf(':d:d:d:d:d');

        expect(activeBeat(view.parts.soprano, 9)).toEqual({ measure: 2, beat: 1 });
    });

    it('points a caret past the end at the last beat that holds music', () => {
        const view = viewOf(':d');

        expect(activeBeat(view.parts.soprano, 999)).toEqual({ measure: 1, beat: 1 });
    });
});
