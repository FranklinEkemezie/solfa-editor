import { Accidental } from '@/domain/accidental';
import { Degree } from '@/domain/degree';

/**
 * A written solfa pitch.
 *
 * The degree is the note's identity: it stays put when the score is taken into
 * another key. The accidental alters that degree, and the octave is absolute —
 * the voice's reference octave plus whatever octave modifier was written.
 * Turning this into a sounding MIDI note needs the key, so it lives in
 * `pitch-resolution.ts` rather than here.
 */
export class Pitch {
    public readonly degree: Degree;
    public readonly accidental: Accidental;
    public readonly octave: number;

    public constructor(degree = Degree.I, accidental = Accidental.NATURAL, octave = 4) {
        if (!Number.isInteger(octave)) {
            throw new Error('A pitch octave must be a whole number.');
        }
        this.degree = degree;
        this.accidental = accidental;
        this.octave = octave;
    }
}

export default Pitch;
