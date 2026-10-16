import { NoteValue, fraction, NOTE_VALUE_UNITS } from './music';

export class Duration {
    public readonly noteValue: NoteValue;
    public readonly dots: number;

    public constructor(noteValue: NoteValue, dots = 0) {
        if (!Number.isInteger(dots) || dots < 0 || dots > 3) {
            throw new Error('A duration can have between zero and three dots.');
        }
        this.noteValue = noteValue;
        this.dots = dots;
    }

    public toQuarterUnits() {
        const base = NOTE_VALUE_UNITS[this.noteValue];
        if (this.dots === 0) return base;
        return fraction(
            base.numerator * (2 ** (this.dots + 1) - 1),
            base.denominator * 2 ** this.dots,
        );
    }
}

export default Duration;
