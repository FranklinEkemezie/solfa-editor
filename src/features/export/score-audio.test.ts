import { describe, expect, it } from 'vitest';
import { createEmptyScoreDocument, withVoice } from '@/domain/music';
import {
    audioBufferToMp3,
    audioBufferToWavBytes,
    scoreAudioEvents,
    scoreDurationSeconds,
} from '@/features/export/score-audio';
import { buildScoreView } from '@/features/score-editor/model/build-score';

function fakeBuffer(samples: Float32Array, sampleRate = 8000): AudioBuffer {
    return {
        numberOfChannels: 1,
        sampleRate,
        length: samples.length,
        getChannelData: () => samples,
    } as unknown as AudioBuffer;
}

describe('score audio export', () => {
    it('flattens each part into timed note events', () => {
        const document = withVoice(createEmptyScoreDocument(), 'soprano', ':drm');
        const events = scoreAudioEvents(buildScoreView(document));

        expect(events).toHaveLength(3);
        expect(events[0]).toMatchObject({ time: 0, duration: 0.6, part: 'soprano' });
        expect(events[1].time).toBeCloseTo(0.6);
        expect(events[2].time).toBeCloseTo(1.2);
    });

    it('leaves a tail after the last note', () => {
        const document = withVoice(createEmptyScoreDocument(), 'soprano', ':d');
        const events = scoreAudioEvents(buildScoreView(document));

        expect(scoreDurationSeconds(events)).toBeCloseTo(1.4);
        expect(scoreDurationSeconds([])).toBe(0);
    });

    it('writes a 16-bit PCM WAV with a readable header', () => {
        const bytes = audioBufferToWavBytes(fakeBuffer(new Float32Array([0, 0.5, -1])));
        const view = new DataView(bytes.buffer);

        expect(String.fromCharCode(...bytes.slice(0, 4))).toBe('RIFF');
        expect(String.fromCharCode(...bytes.slice(8, 12))).toBe('WAVE');
        expect(String.fromCharCode(...bytes.slice(12, 16))).toBe('fmt ');
        expect(view.getUint16(20, true)).toBe(1);
        expect(view.getUint16(22, true)).toBe(1);
        expect(view.getUint32(24, true)).toBe(8000);
        expect(view.getUint16(34, true)).toBe(16);
        expect(String.fromCharCode(...bytes.slice(36, 40))).toBe('data');
        expect(view.getUint32(40, true)).toBe(6);
        expect(view.getInt16(44, true)).toBe(0);
        expect(view.getInt16(46, true)).toBe(16383);
        expect(view.getInt16(48, true)).toBe(-32768);
    });

    it('encodes the same samples as MP3', () => {
        const samples = new Float32Array(4410);
        for (let index = 0; index < samples.length; index += 1) {
            samples[index] = Math.sin((index / 44100) * Math.PI * 2 * 440) * 0.2;
        }

        const encoded = audioBufferToMp3(fakeBuffer(samples, 44100));
        expect(encoded.length).toBeGreaterThan(0);
    });
});
