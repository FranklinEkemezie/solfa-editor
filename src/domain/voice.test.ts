import { describe, expect, it } from 'vitest';
import { PARTS } from '@/domain/parts';
import { referenceOctave, VOICE_SETTINGS } from '@/domain/voice';

describe('the voice registers', () => {
    it('sounds soprano and alto in the middle octave', () => {
        expect(referenceOctave('soprano')).toBe(4);
        expect(referenceOctave('alto')).toBe(4);
    });

    it('sounds tenor and bass an octave below them', () => {
        expect(referenceOctave('tenor')).toBe(3);
        expect(referenceOctave('bass')).toBe(3);
    });

    it('gives every part a setting', () => {
        for (const part of PARTS) {
            expect(VOICE_SETTINGS[part.id].referenceOctave).toBe(referenceOctave(part.id));
        }
    });
});
