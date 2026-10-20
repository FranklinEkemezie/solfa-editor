import { Accidental } from '@/domain/accidental';
import { Degree } from '@/domain/degree';
import type { Key } from '@/domain/key';
import { tonicPitchClass } from '@/domain/key-tonic';
import type { Pitch } from '@/domain/pitch';

/** Semitones above the tonic for each (major-scale) degree. */
export const DEGREE_SEMITONES: Record<Degree, number> = {
    [Degree.I]: 0,
    [Degree.II]: 2,
    [Degree.III]: 4,
    [Degree.IV]: 5,
    [Degree.V]: 7,
    [Degree.VI]: 9,
    [Degree.VII]: 11,
};

/** Semitones added by each accidental the domain can represent. */
export const ACCIDENTAL_SEMITONES: Record<Accidental, number> = {
    [Accidental.DOUBLE_FLAT]: -2,
    [Accidental.FLAT]: -1,
    [Accidental.NATURAL]: 0,
    [Accidental.SHARP]: 1,
    [Accidental.DOUBLE_SHARP]: 2,
};

/**
 * The MIDI number a written pitch sounds at in a key.
 *
 * Movable doh is applied here and only here: the degree is measured from the
 * key's tonic, the accidental alters it, and the pitch's absolute octave says
 * which register. The stored note never learns a letter name.
 */
export function soundingMidi(pitch: Pitch, key: Key): number {
    return (
        (pitch.octave + 1) * 12 +
        tonicPitchClass(key) +
        DEGREE_SEMITONES[pitch.degree] +
        ACCIDENTAL_SEMITONES[pitch.accidental]
    );
}

/** The sounding pitch class, from 0 (C) to 11, of a written pitch in a key. */
export function soundingPitchClass(pitch: Pitch, key: Key): number {
    return ((soundingMidi(pitch, key) % 12) + 12) % 12;
}
