import { Mp3Encoder } from '@breezystack/lamejs';
import {
    fractionToNumber,
    NOTE_VALUE_UNITS,
    PARTS,
    soundingMidi,
    type PartId,
    type ScoreDocument,
} from '@/domain/music';
import type { ScoreView } from '@/features/score-editor/model/score-view';
import { midiToFrequency } from '@/features/score-editor/audio/note-preview';

export type AudioEvent = {
    /** Seconds from the start of the score. */
    readonly time: number;
    /** How long the note sounds, in seconds. */
    readonly duration: number;
    readonly midi: number;
    readonly part: PartId;
};

export type AudioFormat = 'mp3' | 'wav';

const SAMPLE_RATE = 44_100;
const TAIL_SECONDS = 0.8;

function quarterUnits(value: ScoreDocument['tempo']['beatUnit']): number {
    const units = NOTE_VALUE_UNITS[value];
    return units ? units.numerator / units.denominator : 1;
}

export function secondsPerQuarter(document: Pick<ScoreDocument, 'tempo'>): number {
    const beatQuarters = quarterUnits(document.tempo.beatUnit);
    if (beatQuarters <= 0) return 60 / document.tempo.beatsPerMinute;
    return 60 / document.tempo.beatsPerMinute / beatQuarters;
}

/** The score flattened for offline rendering, without the player's Tone graph. */
export function scoreAudioEvents(view: ScoreView): AudioEvent[] {
    const secondsPer = secondsPerQuarter(view.document);
    const events: AudioEvent[] = [];

    for (const part of PARTS) {
        const voice = view.parts[part.id].voice;
        if (!voice) continue;

        for (const event of voice.events) {
            if (event.kind !== 'note') continue;
            events.push({
                time: fractionToNumber(event.start) * secondsPer,
                duration: fractionToNumber(event.note.duration) * secondsPer,
                midi: soundingMidi(event.note.pitch, view.document.key),
                part: part.id,
            });
        }
    }

    return events.sort((left, right) => left.time - right.time);
}

export function scoreDurationSeconds(events: readonly AudioEvent[]): number {
    const last = events.reduce(
        (end, event) => Math.max(end, event.time + event.duration),
        0,
    );
    return last > 0 ? last + TAIL_SECONDS : 0;
}

/**
 * Render the score through an offline graph.
 *
 * The voice is a soft triangle with a short attack and release, the same shape
 * as the editor's note preview. The four parts share one bus and are normalised
 * after rendering, so a dense chord does not clip and a single line is not
 * lost.
 */
export async function renderScoreAudio(view: ScoreView): Promise<AudioBuffer> {
    const events = scoreAudioEvents(view);
    const duration = scoreDurationSeconds(events);
    if (events.length === 0 || duration <= 0) {
        throw new Error('There are no notes to export.');
    }

    const OfflineContext =
        typeof window === 'undefined'
            ? undefined
            : window.OfflineAudioContext ??
              (
                  window as Window & {
                      webkitOfflineAudioContext?: typeof OfflineAudioContext;
                  }
              ).webkitOfflineAudioContext;
    if (!OfflineContext) {
        throw new Error('Audio export is not available in this browser.');
    }

    const context = new OfflineContext(2, Math.ceil(duration * SAMPLE_RATE), SAMPLE_RATE);
    const master = context.createGain();
    master.gain.value = 0.55;
    master.connect(context.destination);

    for (const event of events) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const end = event.time + event.duration;

        oscillator.type = 'triangle';
        oscillator.frequency.value = midiToFrequency(event.midi);
        gain.gain.setValueAtTime(0.0001, event.time);
        gain.gain.exponentialRampToValueAtTime(0.2, event.time + 0.02);
        gain.gain.setValueAtTime(0.2, Math.max(event.time + 0.02, end));
        gain.gain.exponentialRampToValueAtTime(0.0001, end + 0.14);

        oscillator.connect(gain).connect(master);
        oscillator.start(event.time);
        oscillator.stop(end + 0.16);
    }

    const buffer = await context.startRendering();
    normalize(buffer, 0.9);
    return buffer;
}

function normalize(buffer: AudioBuffer, peak: number): void {
    let loudest = 0;
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
        const data = buffer.getChannelData(channel);
        for (let index = 0; index < data.length; index += 1) {
            loudest = Math.max(loudest, Math.abs(data[index]));
        }
    }
    if (loudest <= 0) return;

    const scale = peak / loudest;
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
        const data = buffer.getChannelData(channel);
        for (let index = 0; index < data.length; index += 1) {
            data[index] *= scale;
        }
    }
}

/** A PCM WAV file, 16-bit little-endian, at the buffer's own rate. */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
    return new Blob([audioBufferToWavBytes(buffer)], { type: 'audio/wav' });
}

export function audioBufferToWavBytes(buffer: AudioBuffer): Uint8Array {
    const channels = Math.max(1, Math.min(2, buffer.numberOfChannels));
    const frames = buffer.length;
    const bytesPerSample = 2;
    const dataSize = frames * channels * bytesPerSample;
    const bytes = new Uint8Array(44 + dataSize);
    const view = new DataView(bytes.buffer);

    writeAscii(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeAscii(view, 8, 'WAVE');
    writeAscii(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * channels * bytesPerSample, true);
    view.setUint16(32, channels * bytesPerSample, true);
    view.setUint16(34, 16, true);
    writeAscii(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    const channelData = Array.from({ length: channels }, (_, channel) =>
        buffer.getChannelData(Math.min(channel, buffer.numberOfChannels - 1)),
    );

    let offset = 44;
    for (let frame = 0; frame < frames; frame += 1) {
        for (let channel = 0; channel < channels; channel += 1) {
            const sample = Math.max(-1, Math.min(1, channelData[channel][frame] ?? 0));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
            offset += bytesPerSample;
        }
    }

    return bytes;
}

/** Encode an AudioBuffer as MP3. */
export function audioBufferToMp3(buffer: AudioBuffer, kbps = 192): Uint8Array {
    const channels = Math.max(1, Math.min(2, buffer.numberOfChannels));
    const encoder = new Mp3Encoder(channels, buffer.sampleRate, kbps);
    const left = toInt16(buffer.getChannelData(0));
    const right = channels === 2 ? toInt16(buffer.getChannelData(1)) : left;
    const blockSize = 1152;
    const chunks: Uint8Array[] = [];

    for (let offset = 0; offset < left.length; offset += blockSize) {
        const end = Math.min(left.length, offset + blockSize);
        const chunk = encoder.encodeBuffer(left.subarray(offset, end), right.subarray(offset, end));
        if (chunk.length > 0) chunks.push(chunk);
    }

    const tail = encoder.flush();
    if (tail.length > 0) chunks.push(tail);

    const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const encoded = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        encoded.set(chunk, offset);
        offset += chunk.length;
    }
    return encoded;
}

function toInt16(samples: Float32Array): Int16Array {
    const converted = new Int16Array(samples.length);
    for (let index = 0; index < samples.length; index += 1) {
        const sample = Math.max(-1, Math.min(1, samples[index]));
        converted[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
    return converted;
}

function writeAscii(view: DataView, offset: number, text: string): void {
    for (let index = 0; index < text.length; index += 1) {
        view.setUint8(offset + index, text.charCodeAt(index));
    }
}
