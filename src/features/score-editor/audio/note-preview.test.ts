import { describe, expect, it } from 'vitest';
import { midiToFrequency } from '@/features/score-editor/audio/note-preview';

describe('the note preview tuning', () => {
    it('puts concert A at 440 Hz', () => {
        expect(midiToFrequency(69)).toBeCloseTo(440, 6);
    });

    it('doubles the frequency an octave higher', () => {
        expect(midiToFrequency(81)).toBeCloseTo(880, 6);
        expect(midiToFrequency(57)).toBeCloseTo(220, 6);
    });

    it('puts middle C near 261.63 Hz', () => {
        expect(midiToFrequency(60)).toBeCloseTo(261.626, 3);
    });
});
