import { describe, expect, it } from 'vitest';
import { Accidental, Letter, Pitch } from '@/domain/music';
import {
    CHROMATIC_SOLFA_SYLLABLES,
    isSolfaSyllable,
    NATURAL_SOLFA_SYLLABLES,
    SOLFA_SYLLABLES,
    SOLFA_TO_PITCH,
} from '@/domain/solfa';

describe('solfa syllables', () => {
    it('keeps the diatonic set as single letters', () => {
        expect(NATURAL_SOLFA_SYLLABLES).toEqual(['d', 'r', 'm', 'f', 's', 'l', 't']);
        for (const syllable of NATURAL_SOLFA_SYLLABLES) {
            expect(syllable).toHaveLength(1);
        }
    });

    it('raises "de" and lowers "ta" when spelling chromatics', () => {
        expect(SOLFA_TO_PITCH.de).toEqual(new Pitch(Letter.C, Accidental.SHARP, 4));
        expect(SOLFA_TO_PITCH.ta).toEqual(new Pitch(Letter.B, Accidental.FLAT, 4));
        expect(SOLFA_TO_PITCH.se).toEqual(new Pitch(Letter.G, Accidental.SHARP, 4));
        expect(SOLFA_TO_PITCH.ma).toEqual(new Pitch(Letter.E, Accidental.FLAT, 4));
    });

    it('treats re/ma and fe/ba as enharmonic pairs', () => {
        expect(SOLFA_TO_PITCH.re.toMidi()).toBe(SOLFA_TO_PITCH.ma.toMidi());
        expect(SOLFA_TO_PITCH.fe.toMidi()).toBe(SOLFA_TO_PITCH.ba.toMidi());
    });

    it('covers every accepted syllable with a pitch', () => {
        expect(Object.keys(SOLFA_TO_PITCH).sort()).toEqual([...SOLFA_SYLLABLES].sort());
    });

    it('recognises only the declared syllables', () => {
        for (const syllable of SOLFA_SYLLABLES) {
            expect(isSolfaSyllable(syllable)).toBe(true);
        }
        expect(isSolfaSyllable('z')).toBe(false);
        expect(isSolfaSyllable('dd')).toBe(false);
        expect(CHROMATIC_SOLFA_SYLLABLES).toContain('de');
    });
});
