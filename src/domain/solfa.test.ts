import { describe, expect, it } from 'vitest';
import {
    Accidental,
    Degree,
    Key,
    KeySignature,
    Letter,
    Mode,
    solfaPitch,
    soundingMidi,
} from '@/domain/music';
import {
    CHROMATIC_SOLFA_SYLLABLES,
    isSolfaSyllable,
    NATURAL_SOLFA_SYLLABLES,
    SOLFA_SYLLABLES,
    SOLFA_TO_DEGREE,
} from '@/domain/solfa';

const C_MAJOR = new Key(Letter.C, new KeySignature(Accidental.NATURAL, 0), Mode.MAJOR);

describe('solfa syllables', () => {
    it('keeps the diatonic set as single letters', () => {
        expect(NATURAL_SOLFA_SYLLABLES).toEqual(['d', 'r', 'm', 'f', 's', 'l', 't']);
        for (const syllable of NATURAL_SOLFA_SYLLABLES) {
            expect(syllable).toHaveLength(1);
        }
    });

    it('gives each syllable its degree and inherent accidental', () => {
        expect(SOLFA_TO_DEGREE.d).toEqual({
            degree: Degree.I,
            accidental: Accidental.NATURAL,
        });
        expect(SOLFA_TO_DEGREE.de).toEqual({
            degree: Degree.I,
            accidental: Accidental.SHARP,
        });
        expect(SOLFA_TO_DEGREE.ma).toEqual({
            degree: Degree.III,
            accidental: Accidental.FLAT,
        });
        expect(SOLFA_TO_DEGREE.ta).toEqual({
            degree: Degree.VII,
            accidental: Accidental.FLAT,
        });
    });

    it('covers every accepted syllable with a degree', () => {
        expect(Object.keys(SOLFA_TO_DEGREE).sort()).toEqual([...SOLFA_SYLLABLES].sort());
    });

    it('treats re/ma and fe/ba as enharmonic pairs', () => {
        expect(soundingMidi(solfaPitch('re'), C_MAJOR)).toBe(
            soundingMidi(solfaPitch('ma'), C_MAJOR),
        );
        expect(soundingMidi(solfaPitch('fe'), C_MAJOR)).toBe(
            soundingMidi(solfaPitch('ba'), C_MAJOR),
        );
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
