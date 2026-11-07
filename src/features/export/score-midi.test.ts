import { describe, expect, it } from 'vitest';
import {
    Accidental,
    createEmptyScoreDocument,
    Key,
    KeySignature,
    Letter,
    Mode,
    NoteValue,
    Tempo,
    TimeSignature,
    withVoice,
} from '@/domain/music';
import { createScoreMidi, MIDI_PPQ } from '@/features/export/score-midi';
import { buildScoreView } from '@/features/score-editor/model/build-score';

type MidiEvent =
    | { tick: number; kind: 'meta'; meta: number; payload: number[] }
    | {
          tick: number;
          kind: 'midi';
          command: number;
          channel: number;
          data1: number;
          data2: number | null;
      };

function readUint16(bytes: Uint8Array, offset: number): number {
    return (bytes[offset] << 8) | bytes[offset + 1];
}

function readUint32(bytes: Uint8Array, offset: number): number {
    return (
        ((bytes[offset] << 24) |
            (bytes[offset + 1] << 16) |
            (bytes[offset + 2] << 8) |
            bytes[offset + 3]) >>>
        0
    );
}

function readVariableLength(bytes: Uint8Array, offset: number): [number, number] {
    let value = 0;
    let at = offset;

    while (at < bytes.length) {
        const byte = bytes[at];
        at += 1;
        value = (value << 7) | (byte & 0x7f);
        if ((byte & 0x80) === 0) break;
    }

    return [value, at];
}

function tracks(bytes: Uint8Array): Uint8Array[] {
    const result: Uint8Array[] = [];
    let offset = 14;

    while (offset < bytes.length) {
        const id = String.fromCharCode(...bytes.slice(offset, offset + 4));
        const length = readUint32(bytes, offset + 4);
        expect(id).toBe('MTrk');
        result.push(bytes.slice(offset + 8, offset + 8 + length));
        offset += 8 + length;
    }

    return result;
}

function parseTrack(bytes: Uint8Array): MidiEvent[] {
    const events: MidiEvent[] = [];
    let offset = 0;
    let tick = 0;

    while (offset < bytes.length) {
        const [delta, afterDelta] = readVariableLength(bytes, offset);
        tick += delta;
        offset = afterDelta;
        const status = bytes[offset];
        offset += 1;

        if (status === 0xff) {
            const meta = bytes[offset];
            offset += 1;
            const [length, afterLength] = readVariableLength(bytes, offset);
            offset = afterLength;
            const payload = [...bytes.slice(offset, offset + length)];
            offset += length;
            events.push({ tick, kind: 'meta', meta, payload });
            if (meta === 0x2f) break;
            continue;
        }

        const command = status & 0xf0;
        const channel = status & 0x0f;
        const data1 = bytes[offset];
        offset += 1;
        const data2 = command === 0xc0 || command === 0xd0 ? null : bytes[offset];
        if (data2 !== null) offset += 1;
        events.push({ tick, kind: 'midi', command, channel, data1, data2 });
    }

    return events;
}

function viewOf(source: string) {
    return buildScoreView(withVoice(createEmptyScoreDocument(), 'soprano', source));
}

describe('MIDI export', () => {
    it('writes a format-1 file with a conductor and four part tracks', () => {
        const bytes = createScoreMidi(viewOf(':drm'));
        const header = String.fromCharCode(...bytes.slice(0, 4));

        expect(header).toBe('MThd');
        expect(readUint32(bytes, 4)).toBe(6);
        expect(readUint16(bytes, 8)).toBe(1);
        expect(readUint16(bytes, 10)).toBe(5);
        expect(readUint16(bytes, 12)).toBe(MIDI_PPQ);
        expect(tracks(bytes)).toHaveLength(5);
    });

    it('writes tempo, time signature and key signature on the conductor track', () => {
        const events = parseTrack(tracks(createScoreMidi(viewOf(':d')))[0]);
        const tempo = events.find((event) => event.kind === 'meta' && event.meta === 0x51);
        const time = events.find((event) => event.kind === 'meta' && event.meta === 0x58);
        const key = events.find((event) => event.kind === 'meta' && event.meta === 0x59);

        expect(tempo?.kind === 'meta' ? tempo.payload : null).toEqual([0x09, 0x27, 0xc0]);
        expect(time?.kind === 'meta' ? time.payload : null).toEqual([4, 2, 24, 8]);
        expect(key?.kind === 'meta' ? key.payload : null).toEqual([0, 0]);
    });

    it('writes each note on and off at the score’s own tempo', () => {
        const events = parseTrack(tracks(createScoreMidi(viewOf(':drm')))[1]);
        const notes = events.filter(
            (event) => event.kind === 'midi' && (event.command === 0x90 || event.command === 0x80),
        );

        expect(notes.map((event) => event.tick)).toEqual([0, 480, 480, 960, 960, 1440]);
        expect(
            notes.map((event) =>
                event.kind === 'midi'
                    ? `${event.command === 0x90 ? 'on' : 'off'}:${event.data1}`
                    : '',
            ),
        ).toEqual(['on:60', 'off:60', 'on:62', 'off:62', 'on:64', 'off:64']);
    });

    it('writes a key signature from the document', () => {
        const document = {
            ...createEmptyScoreDocument(),
            key: new Key(Letter.E, new KeySignature(Accidental.FLAT, 3), Mode.MAJOR),
            timeSignature: new TimeSignature(NoteValue.EIGHTH, 6),
            tempo: new Tempo(NoteValue.EIGHTH, 120),
        };
        const events = parseTrack(tracks(createScoreMidi(buildScoreView(document)))[0]);
        const key = events.find((event) => event.kind === 'meta' && event.meta === 0x59);
        const time = events.find((event) => event.kind === 'meta' && event.meta === 0x58);
        const tempo = events.find((event) => event.kind === 'meta' && event.meta === 0x51);

        expect(key?.kind === 'meta' ? key.payload : null).toEqual([0xfd, 0]);
        expect(time?.kind === 'meta' ? time.payload : null).toEqual([6, 3, 24, 8]);
        expect(tempo?.kind === 'meta' ? tempo.payload : null).toEqual([0x0f, 0x42, 0x40]);
    });
});
