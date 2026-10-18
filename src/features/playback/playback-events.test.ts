import { describe, expect, it } from 'vitest';
import { createEmptyScore } from '@/domain/music';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import { domainToEditor } from '@/features/score-editor/adapters/domain-to-editor';
import { interpretInput } from '@/features/score-editor/editor/input-rules';
import type { EditorPosition } from '@/features/score-editor/state/editor-position';
import {
    buildPlaybackEvents,
    secondsPerQuarter,
    type PlaybackEvent,
} from '@/features/playback/playback-events';

function write(
    document: EditorDocument,
    keys: string[],
    position: EditorPosition = { measureId: 'soprano-1', slotIndex: 0 },
): EditorDocument {
    let current = document;
    let caret = position;
    for (const key of keys) {
        const result = interpretInput(current, caret, key);
        current = result.document;
        caret = result.position;
    }
    return current;
}

function part(document: EditorDocument, id: PlaybackEvent['part']): PlaybackEvent[] {
    return buildPlaybackEvents(document).filter((event) => event.part === id);
}

describe('buildPlaybackEvents', () => {
    it('sounds a plain quarter note for one quarter note of time', () => {
        const document = write(domainToEditor(createEmptyScore()), ['d']);
        const events = part(document, 'soprano');

        expect(events).toHaveLength(1);
        expect(events[0].time).toBeCloseTo(0);
        expect(events[0].durationSeconds).toBeCloseTo(secondsPerQuarter(document));
    });

    it('sounds the two halves of a halved beat', () => {
        const document = write(domainToEditor(createEmptyScore()), ['d', '.', 'm']);
        const events = part(document, 'soprano');
        const quarter = secondsPerQuarter(document);

        expect(events.map((event) => event.syllable)).toEqual(['d', 'm']);
        expect(events[0].time).toBeCloseTo(0);
        expect(events[1].time).toBeCloseTo(quarter / 2);
        expect(events[0].durationSeconds).toBeCloseTo(quarter / 2);
    });

    it('sounds the four quarters of a quartered beat', () => {
        const document = write(domainToEditor(createEmptyScore()), ['d', ',', 'r', 'm', 'f']);
        const events = part(document, 'soprano');
        const quarter = secondsPerQuarter(document);

        expect(events.map((event) => event.syllable)).toEqual(['d', 'r', 'm', 'f']);
        expect(events[3].time).toBeCloseTo((quarter * 3) / 4);
        expect(events[3].durationSeconds).toBeCloseTo(quarter / 4);
    });

    it('prolongs the previous note for a continuation instead of sounding again', () => {
        const document = write(domainToEditor(createEmptyScore()), ['d', '-']);
        const events = part(document, 'soprano');

        expect(events).toHaveLength(1);
        expect(events[0].durationSeconds).toBeCloseTo(secondsPerQuarter(document) * 2);
    });

    it('separates the parts by whole octaves', () => {
        let document = domainToEditor(createEmptyScore());
        for (const id of ['soprano', 'alto', 'tenor', 'bass'] as const) {
            document = write(document, ['d'], { measureId: `${id}-1`, slotIndex: 0 });
        }

        expect(part(document, 'soprano')[0].note).toBe('C5');
        expect(part(document, 'alto')[0].note).toBe('C4');
        expect(part(document, 'tenor')[0].note).toBe('C3');
        expect(part(document, 'bass')[0].note).toBe('C2');
    });
});
