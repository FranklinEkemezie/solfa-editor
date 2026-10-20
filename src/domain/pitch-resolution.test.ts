import { describe, expect, it } from 'vitest';
import {
    Accidental,
    Degree,
    Key,
    KeySignature,
    Letter,
    Mode,
    Pitch,
    solfaPitch,
    soundingMidi,
    soundingPitchClass,
} from '@/domain/music';

function key(letter: Letter, accidental: Accidental, count: number, mode = Mode.MAJOR): Key {
    return new Key(letter, new KeySignature(accidental, count), mode);
}

const C_MAJOR = key(Letter.C, Accidental.NATURAL, 0);
const D_MAJOR = key(Letter.D, Accidental.SHARP, 2);
const A_MINOR = key(Letter.A, Accidental.NATURAL, 0, Mode.MINOR);

describe('soundingMidi', () => {
    it('puts the seven degrees on the major scale of the tonic', () => {
        expect(
            ['d', 'r', 'm', 'f', 's', 'l', 't'].map((syllable) =>
                soundingMidi(solfaPitch(syllable as 'd'), C_MAJOR),
            ),
        ).toEqual([60, 62, 64, 65, 67, 69, 71]);
    });

    it('moves every degree with the key instead of with a letter', () => {
        expect(soundingMidi(solfaPitch('d'), D_MAJOR)).toBe(62);
        expect(soundingMidi(solfaPitch('m'), D_MAJOR)).toBe(66);
        expect(soundingMidi(solfaPitch('s'), D_MAJOR)).toBe(69);
    });

    it('puts doh on the tonic of a minor key', () => {
        expect(soundingMidi(solfaPitch('d'), A_MINOR)).toBe(69);
    });

    it('applies the accidental once, whether it came from the syllable or a modifier', () => {
        expect(soundingMidi(solfaPitch('de'), C_MAJOR)).toBe(61);
        expect(soundingMidi(new Pitch(Degree.I, Accidental.SHARP, 4), C_MAJOR)).toBe(61);
        expect(soundingMidi(solfaPitch('ma'), C_MAJOR)).toBe(63);
        expect(soundingMidi(new Pitch(Degree.III, Accidental.FLAT, 4), C_MAJOR)).toBe(63);
    });

    it('keeps enharmonic spellings on the same pitch class', () => {
        expect(soundingPitchClass(new Pitch(Degree.VI, Accidental.SHARP, 4), C_MAJOR)).toBe(
            soundingPitchClass(solfaPitch('ta'), C_MAJOR),
        );
        expect(soundingPitchClass(solfaPitch('se'), C_MAJOR)).toBe(
            soundingPitchClass(new Pitch(Degree.V, Accidental.SHARP, 4), C_MAJOR),
        );
    });

    it('uses the absolute octave stored on the pitch', () => {
        expect(soundingMidi(solfaPitch('d', 5), C_MAJOR)).toBe(72);
        expect(soundingMidi(solfaPitch('d', 3), C_MAJOR)).toBe(48);
    });
});
