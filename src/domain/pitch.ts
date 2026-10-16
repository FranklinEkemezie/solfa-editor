import { Letter } from '@/domain/letter';
import { Accidental } from '@/domain/accidental';

export class Pitch {
    public readonly letter: Letter;
    public readonly accidental: Accidental;
    public readonly octave: number;

    public constructor(letter: Letter, accidental = Accidental.NATURAL, octave = 4) {
        this.letter = letter;
        this.accidental = accidental;
        this.octave = octave;
    }

    public toMidi(): number {
        const semitone: Record<Letter, number> = {
            [Letter.C]: 0,
            [Letter.D]: 2,
            [Letter.E]: 4,
            [Letter.F]: 5,
            [Letter.G]: 7,
            [Letter.A]: 9,
            [Letter.B]: 11,
        };
        const accidentalOffset: Record<Accidental, number> = {
            [Accidental.DOUBLE_FLAT]: -2,
            [Accidental.FLAT]: -1,
            [Accidental.NATURAL]: 0,
            [Accidental.SHARP]: 1,
            [Accidental.DOUBLE_SHARP]: 2,
        };
        return (this.octave + 1) * 12 + semitone[this.letter] + accidentalOffset[this.accidental];
    }
}

export default Pitch;
