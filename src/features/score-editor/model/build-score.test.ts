import { describe, expect, it } from 'vitest';
import {
    createEmptyScoreDocument,
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

describe('building a score from voice sources', () => {
    it('opens with the document’s two silent measures', () => {
        const view = buildScoreView(createEmptyScoreDocument());

        expect(view.measureCount).toBe(2);
        expect(view.measureNumbers).toEqual([1, 2]);
        expect(view.parts.soprano.measures).toHaveLength(2);
        expect(view.parts.soprano.measures[0]?.beats).toHaveLength(4);
        expect(view.parts.soprano.measures[0]?.beats.every((beat) => beat.items.length === 0)).toBe(
            true,
        );
        expect(validateScore(view.score)).toEqual([]);
    });

    it('grows to hold the music when a voice needs more measures', () => {
        const view = viewOf(':d:d:d:d:d');

        expect(view.measureCount).toBe(2);
        expect(sopranoMeasure(view, 2)?.beats[0]?.items[0]?.syllable).toBe('d');
    });

    it('gives every part the same measures', () => {
        const view = buildScoreView(
            withVoice(documentWith({ soprano: ':sssssssss' }), 'alto', ':d'),
        );

        expect(view.measureCount).toBe(3);
        expect(view.parts.soprano.measures).toHaveLength(3);
        expect(view.parts.alto.measures).toHaveLength(3);
        expect(view.parts.alto.measures[2]?.beats.every((beat) => beat.items.length === 0)).toBe(
            true,
        );
    });

    it('places notes in their beats', () => {
        const view = viewOf(':drs');
        const beats = sopranoMeasure(view, 1)?.beats ?? [];

        expect(beats.map((beat) => beat.items.map((item) => item.syllable))).toEqual([
            ['d'],
            ['r'],
            ['s'],
            [],
        ]);
    });

    it('keeps two eighth notes in one divided beat', () => {
        const view = viewOf(':.drsf');
        const beats = sopranoMeasure(view, 1)?.beats ?? [];

        expect(beats[0]?.division).toBe(2);
        expect(beats[0]?.items.map((item) => item.syllable)).toEqual(['d', 'r']);
        expect(beats[1]?.division).toBe(2);
        expect(beats[1]?.items.map((item) => item.syllable)).toEqual(['s', 'f']);
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

        expect(view.measureCount).toBe(2);
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

    it('keeps rests in the score without drawing them as notes', () => {
        const view = viewOf(':d ');
        const measure = view.score.measures.find(
            (candidate) => candidate.part === 'soprano' && candidate.number === 1,
        );

        expect(measure?.events[0]).toBeInstanceOf(Note);
        expect(measure?.events[1]).toBeInstanceOf(Rest);
        expect(sopranoMeasure(view, 1)?.beats[0]?.items).toHaveLength(1);
        expect(sopranoMeasure(view, 1)?.beats[1]?.items).toHaveLength(0);
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
        expect(view.parts.soprano.measures).toHaveLength(2);
        expect(view.parts.soprano.measures[0]?.beats).toHaveLength(4);
    });

    it('keeps the parts’ sources independent', () => {
        const view = buildScoreView(withVoice(documentWith({ soprano: ':d' }), 'bass', ':s'));

        expect(view.parts.soprano.source).toBe(':d');
        expect(view.parts.bass.source).toBe(':s');
        expect(sopranoMeasure(view, 1)?.beats[0]?.items[0]?.syllable).toBe('d');
        expect(view.parts.bass.measures[0]?.beats[0]?.items[0]?.syllable).toBe('s');
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
