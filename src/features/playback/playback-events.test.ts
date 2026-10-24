import { describe, expect, it } from 'vitest';
import {
    Accidental,
    createEmptyScoreDocument,
    fractionToNumber,
    Key,
    KeySignature,
    Letter,
    Mode,
    NOTE_VALUE_ORDER,
    NOTE_VALUE_UNITS,
    NoteValue,
    Tempo,
    withVoice,
    type PartId,
    type ScoreDocument,
} from '@/domain/music';
import { buildScoreView } from '@/features/score-editor/model/build-score';
import type { ScoreView } from '@/features/score-editor/model/score-view';
import {
    buildPlaybackEvents,
    secondsPerQuarter,
    type PlaybackEvent,
} from '@/features/playback/playback-events';

function scoreOf(
    voices: Partial<Record<PartId, string>>,
    patch: Partial<ScoreDocument> = {},
): ScoreView {
    let document = createEmptyScoreDocument();
    for (const [part, source] of Object.entries(voices) as [PartId, string][]) {
        document = withVoice(document, part, source);
    }
    return buildScoreView({ ...document, ...patch });
}

function part(view: ScoreView, id: PlaybackEvent['part']): PlaybackEvent[] {
    return buildPlaybackEvents(view).filter((event) => event.part === id);
}

const D_MAJOR = new Key(Letter.D, new KeySignature(Accidental.SHARP, 2), Mode.MAJOR);
const F_MAJOR = new Key(Letter.F, new KeySignature(Accidental.FLAT, 1), Mode.MAJOR);

describe('buildPlaybackEvents', () => {
    it('sounds a plain quarter note for one quarter note of time', () => {
        const view = scoreOf({ soprano: ':d' });
        const events = part(view, 'soprano');

        expect(events).toHaveLength(1);
        expect(events[0].time).toBeCloseTo(0);
        expect(events[0].durationSeconds).toBeCloseTo(secondsPerQuarter(view.document));
    });

    it('sounds the two halves of an eighth-note pair', () => {
        const view = scoreOf({ soprano: ':.dm' });
        const events = part(view, 'soprano');
        const quarter = secondsPerQuarter(view.document);

        expect(events.map((event) => event.syllable)).toEqual(['d', 'm']);
        expect(events[0].time).toBeCloseTo(0);
        expect(events[1].time).toBeCloseTo(quarter / 2);
        expect(events[0].durationSeconds).toBeCloseTo(quarter / 2);
        expect(events[1].durationSeconds).toBeCloseTo(quarter / 2);
    });

    it('sounds the four quarters of a sixteenth-note group', () => {
        const view = scoreOf({ soprano: ':,drmf' });
        const events = part(view, 'soprano');
        const quarter = secondsPerQuarter(view.document);

        expect(events.map((event) => event.syllable)).toEqual(['d', 'r', 'm', 'f']);
        expect(events[3].time).toBeCloseTo((quarter * 3) / 4);
        expect(events[3].durationSeconds).toBeCloseTo(quarter / 4);
    });

    it('prolongs the previous note for a continuation instead of sounding again', () => {
        const view = scoreOf({ soprano: ':d-' });
        const events = part(view, 'soprano');

        expect(events).toHaveLength(1);
        expect(events[0].durationSeconds).toBeCloseTo(secondsPerQuarter(view.document) * 2);
    });

    it('keeps a note that crosses a barline as one sound', () => {
        const view = scoreOf({ soprano: ':d----' });
        const events = part(view, 'soprano');

        expect(events).toHaveLength(1);
        expect(events[0].durationSeconds).toBeCloseTo(secondsPerQuarter(view.document) * 5);
    });

    it('lets rests take time without sounding', () => {
        const view = scoreOf({ soprano: ':d s' });
        const events = part(view, 'soprano');
        const quarter = secondsPerQuarter(view.document);

        expect(events.map((event) => event.syllable)).toEqual(['d', 's']);
        expect(events[0].time).toBeCloseTo(0);
        expect(events[1].time).toBeCloseTo(quarter * 2);
    });

    it('places each part at its own reference octave', () => {
        const view = scoreOf({
            soprano: ':d',
            alto: ':d',
            tenor: ':d',
            bass: ':d',
        });

        expect(part(view, 'soprano')[0].note).toBe('C4');
        expect(part(view, 'alto')[0].note).toBe('C4');
        expect(part(view, 'tenor')[0].note).toBe('C3');
        expect(part(view, 'bass')[0].note).toBe('C3');
    });

    it('sounds written octave marks above and below the voice', () => {
        const view = scoreOf({ soprano: ":d':d''d1d2" });

        expect(part(view, 'soprano').map((event) => event.note)).toEqual(['C5', 'C6', 'C3', 'C2']);
    });

    it('sounds doh on the key tonic, leaving the notation alone', () => {
        const view = scoreOf({ soprano: ':dr' }, { key: D_MAJOR });

        expect(view.parts.soprano.voice?.events[0]).toMatchObject({
            kind: 'note',
            note: { syllable: 'd' },
        });
        expect(part(view, 'soprano').map((event) => event.note)).toEqual(['D4', 'E4']);
    });

    it('keys a flat score without rewriting a single syllable', () => {
        const view = scoreOf({ soprano: ':dmsl' }, { key: F_MAJOR });

        expect(part(view, 'soprano').map((event) => event.note)).toEqual(['F4', 'A4', 'C5', 'D5']);
    });

    it('sounds an explicit accidental over the syllable’s own degree', () => {
        const view = scoreOf({ soprano: ':d#' }, { key: D_MAJOR });

        expect(part(view, 'soprano').map((event) => event.note)).toEqual(['D#4']);
    });

    it('gives every note a key the page can use to mark it', () => {
        const view = scoreOf({ soprano: ':dm' });
        const events = part(view, 'soprano');

        expect(events.map((event) => event.noteKey)).toEqual(['soprano:0', 'soprano:1']);
    });

    it('skips a voice that could not be read', () => {
        const view = scoreOf({ soprano: ':dx', alto: ':d' });

        expect(part(view, 'soprano')).toEqual([]);
        expect(part(view, 'alto')).toHaveLength(1);
    });

    it('times at every note value the tempo can use', () => {
        const view = scoreOf({ soprano: ':d' });
        const bpm = view.document.tempo.beatsPerMinute;

        for (const beatUnit of NOTE_VALUE_ORDER) {
            const beatQuarters = fractionToNumber(NOTE_VALUE_UNITS[beatUnit]);
            const document: ScoreDocument = {
                ...view.document,
                tempo: new Tempo(beatUnit, bpm, ''),
            };

            expect(secondsPerQuarter(document)).toBeCloseTo(60 / bpm / beatQuarters);
        }
    });

    it('turns an eighth-note beat into the seconds sent to the player', () => {
        const view = scoreOf({ soprano: ':d:d' }, { tempo: new Tempo(NoteValue.EIGHTH, 120, '') });
        const events = part(view, 'soprano');

        expect(events[0].time).toBeCloseTo(0);
        expect(events[1].time).toBeCloseTo(1);
        expect(events[0].durationSeconds).toBeCloseTo(1);
    });
});
