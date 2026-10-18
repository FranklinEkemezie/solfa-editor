import { Accidental } from '@/domain/accidental';
import type { Key } from '@/domain/key';
import { Mode } from '@/domain/mode';

/**
 * The pitch class of the key's tonic, from 0 (doh sounding as C) to 11.
 *
 * Every syllable is written as though doh were C, so taking a score into
 * another key is one shift by this many semitones: the notation never changes,
 * only what the notes sound as. That is what moveable doh means, and it is why
 * the key is applied when the notes are played rather than written into them.
 *
 * The tonic walks the circle of fifths with the signature — seven semitones per
 * sharp or flat — and the tonic of a minor key lies a minor third below the
 * tonic of its relative major.
 */
export function tonicPitchClass(key: Key): number {
    const direction =
        key.signature.accidental === Accidental.SHARP
            ? 1
            : key.signature.accidental === Accidental.FLAT
              ? -1
              : 0;
    const fifths = direction * 7 * key.signature.count;
    const relativeMajor = key.mode === Mode.MINOR ? 3 : 0;
    return ((((fifths - relativeMajor) % 12) + 12) % 12) as number;
}
