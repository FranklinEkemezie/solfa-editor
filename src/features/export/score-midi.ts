import {
    Accidental,
    Mode,
    NoteValue,
    scoreDisplayTitle,
    type PartId,
} from '@/domain/music';
import { scoreAudioEvents, secondsPerQuarter, type AudioEvent } from '@/features/export/score-audio';
import type { ScoreView } from '@/features/score-editor/model/score-view';

/** Pulses per quarter note. 480 is the common compromise between resolution and size. */
export const MIDI_PPQ = 480;

const NOTE_ON_VELOCITY = 92;
const NOTE_OFF_VELOCITY = 64;
const CHOIR_AAHS_PROGRAM = 52;

const TIME_SIGNATURE_DENOMINATOR_POWER: Record<NoteValue, number> = {
    [NoteValue.WHOLE]: 0,
    [NoteValue.HALF]: 1,
    [NoteValue.QUARTER]: 2,
    [NoteValue.EIGHTH]: 3,
    [NoteValue.SIXTEENTH]: 4,
    [NoteValue.THIRTY_SECOND]: 5,
    [NoteValue.SIXTY_FOURTH]: 6,
};

type TimedMidiEvent = {
    readonly tick: number;
    /** Note-offs sort before note-ons at the same tick. */
    readonly order: 0 | 1;
    readonly pitch: number;
    readonly bytes: readonly number[];
};

function writeAscii(bytes: Uint8Array, offset: number, text: string): void {
    for (let index = 0; index < text.length; index += 1) {
        bytes[offset + index] = text.charCodeAt(index);
    }
}

function writeUint16(bytes: Uint8Array, offset: number, value: number): void {
    bytes[offset] = (value >>> 8) & 0xff;
    bytes[offset + 1] = value & 0xff;
}

function writeUint32(bytes: Uint8Array, offset: number, value: number): void {
    bytes[offset] = (value >>> 24) & 0xff;
    bytes[offset + 1] = (value >>> 16) & 0xff;
    bytes[offset + 2] = (value >>> 8) & 0xff;
    bytes[offset + 3] = value & 0xff;
}

/** A variable-length quantity, as MIDI uses for delta times and meta lengths. */
function variableLength(value: number): number[] {
    let remaining = Math.max(0, Math.floor(value));
    const bytes = [remaining & 0x7f];
    remaining >>>= 7;

    while (remaining > 0) {
        bytes.unshift((remaining & 0x7f) | 0x80);
        remaining >>>= 7;
    }

    return bytes;
}

function chunk(id: string, data: Uint8Array): Uint8Array {
    const result = new Uint8Array(8 + data.length);
    writeAscii(result, 0, id);
    writeUint32(result, 4, data.length);
    result.set(data, 8);
    return result;
}

function meta(type: number, payload: readonly number[]): number[] {
    return [0xff, type, ...variableLength(payload.length), ...payload];
}

function textMeta(type: number, text: string): number[] {
    return meta(type, [...new TextEncoder().encode(text)]);
}

function noteValuePower(note: NoteValue): number {
    return TIME_SIGNATURE_DENOMINATOR_POWER[note];
}

class TrackBuilder {
    private readonly bytes: number[] = [];
    private lastTick = 0;

    public event(tick: number, data: readonly number[]): void {
        const at = Math.max(this.lastTick, Math.floor(tick));
        this.bytes.push(...variableLength(at - this.lastTick), ...data);
        this.lastTick = at;
    }

    public finish(): Uint8Array {
        this.event(this.lastTick, meta(0x2f, []));
        return Uint8Array.from(this.bytes);
    }
}

function partEvents(events: readonly AudioEvent[], part: PartId): AudioEvent[] {
    return events.filter((event) => event.part === part);
}

function ticksForEvent(event: AudioEvent, ticksPerSecond: number): TimedMidiEvent[] {
    const start = Math.max(0, Math.round(event.time * ticksPerSecond));
    const end = Math.max(start + 1, Math.round((event.time + event.duration) * ticksPerSecond));

    return [
        {
            tick: start,
            order: 1,
            pitch: event.midi,
            bytes: [0x90, event.midi, NOTE_ON_VELOCITY],
        },
        {
            tick: end,
            order: 0,
            pitch: event.midi,
            bytes: [0x80, event.midi, NOTE_OFF_VELOCITY],
        },
    ];
}

function partTrack(
    view: ScoreView,
    part: PartId,
    ticksPerSecond: number,
    scoreEvents: readonly AudioEvent[],
): Uint8Array {
    const track = new TrackBuilder();
    track.event(0, textMeta(0x03, view.parts[part].label));
    track.event(0, [0xc0, CHOIR_AAHS_PROGRAM]);

    const events = partEvents(scoreEvents, part)
        .flatMap((event) => ticksForEvent(event, ticksPerSecond))
        .sort(
            (left, right) =>
                left.tick - right.tick ||
                left.order - right.order ||
                left.pitch - right.pitch,
        );

    for (const event of events) {
        track.event(event.tick, event.bytes);
    }

    return track.finish();
}

function conductorTrack(view: ScoreView): Uint8Array {
    const track = new TrackBuilder();
    const document = view.document;
    const microsecondsPerQuarter = Math.round(secondsPerQuarter(document) * 1_000_000);
    const signature = document.timeSignature;
    const key = document.key;
    const sharps =
        key.signature.accidental === Accidental.SHARP
            ? key.signature.count
            : key.signature.accidental === Accidental.FLAT
              ? -key.signature.count
              : 0;

    track.event(0, textMeta(0x03, scoreDisplayTitle(document)));
    track.event(
        0,
        meta(0x51, [
            (microsecondsPerQuarter >>> 16) & 0xff,
            (microsecondsPerQuarter >>> 8) & 0xff,
            microsecondsPerQuarter & 0xff,
        ]),
    );
    track.event(0, meta(0x58, [signature.count, noteValuePower(signature.note), 24, 8]));
    track.event(0, meta(0x59, [sharps & 0xff, key.mode === Mode.MINOR ? 1 : 0]));

    return track.finish();
}

/**
 * The score as a Standard MIDI File.
 *
 * Format 1 gives the conductor its own track and each voice a track of its own,
 * which is what notation software expects when the file is opened for editing.
 * Times are taken from the same flattened score the audio export uses, so the
 * MIDI and the rendered audio agree on tempo and note length.
 */
export function createScoreMidi(view: ScoreView): Uint8Array {
    const ticksPerSecond = MIDI_PPQ / secondsPerQuarter(view.document);
    const scoreEvents = scoreAudioEvents(view);
    const tracks = [
        conductorTrack(view),
        ...(['soprano', 'alto', 'tenor', 'bass'] as const).map((part) =>
            partTrack(view, part, ticksPerSecond, scoreEvents),
        ),
    ];

    const header = new Uint8Array(14);
    writeAscii(header, 0, 'MThd');
    writeUint32(header, 4, 6);
    writeUint16(header, 8, 1);
    writeUint16(header, 10, tracks.length);
    writeUint16(header, 12, MIDI_PPQ);

    const chunks = tracks.map((track) => chunk('MTrk', track));
    const total = header.length + chunks.reduce((sum, track) => sum + track.length, 0);
    const bytes = new Uint8Array(total);
    let offset = header.length;
    bytes.set(header);

    for (const track of chunks) {
        bytes.set(track, offset);
        offset += track.length;
    }

    return bytes;
}

/** The MIDI file as a downloadable blob. */
export function scoreMidiBlob(view: ScoreView): Blob {
    return new Blob([createScoreMidi(view).slice().buffer], { type: 'audio/midi' });
}
