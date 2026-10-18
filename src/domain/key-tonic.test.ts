import { describe, expect, it } from 'vitest';
import { Accidental, Key, KeySignature, Letter, Mode, tonicPitchClass } from '@/domain/music';

function key(letter: Letter, accidental: Accidental, count: number, mode = Mode.MAJOR): Key {
    return new Key(letter, new KeySignature(accidental, count), mode);
}

describe('tonicPitchClass', () => {
    it('leaves doh where it is written in C', () => {
        expect(tonicPitchClass(key(Letter.C, Accidental.NATURAL, 0))).toBe(0);
    });

    it('walks up a fifth for every sharp', () => {
        expect(tonicPitchClass(key(Letter.G, Accidental.SHARP, 1))).toBe(7);
        expect(tonicPitchClass(key(Letter.D, Accidental.SHARP, 2))).toBe(2);
        expect(tonicPitchClass(key(Letter.A, Accidental.SHARP, 3))).toBe(9);
        expect(tonicPitchClass(key(Letter.E, Accidental.SHARP, 4))).toBe(4);
        expect(tonicPitchClass(key(Letter.B, Accidental.SHARP, 5))).toBe(11);
        expect(tonicPitchClass(key(Letter.F, Accidental.SHARP, 6))).toBe(6);
    });

    it('walks down a fifth for every flat', () => {
        expect(tonicPitchClass(key(Letter.F, Accidental.FLAT, 1))).toBe(5);
        expect(tonicPitchClass(key(Letter.B, Accidental.FLAT, 2))).toBe(10);
        expect(tonicPitchClass(key(Letter.E, Accidental.FLAT, 3))).toBe(3);
        expect(tonicPitchClass(key(Letter.A, Accidental.FLAT, 4))).toBe(8);
        expect(tonicPitchClass(key(Letter.D, Accidental.FLAT, 5))).toBe(1);
    });

    it('puts a minor key a minor third under its relative major', () => {
        expect(tonicPitchClass(key(Letter.A, Accidental.NATURAL, 0, Mode.MINOR))).toBe(9);
        expect(tonicPitchClass(key(Letter.E, Accidental.SHARP, 1, Mode.MINOR))).toBe(4);
        expect(tonicPitchClass(key(Letter.D, Accidental.FLAT, 1, Mode.MINOR))).toBe(2);
        expect(tonicPitchClass(key(Letter.C, Accidental.FLAT, 3, Mode.MINOR))).toBe(0);
        expect(tonicPitchClass(key(Letter.F, Accidental.FLAT, 4, Mode.MINOR))).toBe(5);
    });
});
