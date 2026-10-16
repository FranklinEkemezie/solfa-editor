import { fraction } from './fraction';
import { NoteValue, NOTE_VALUE_UNITS } from './note-value';

export class TimeSignature {
    public readonly note: NoteValue;
    public readonly count: number;

    public constructor(note = NoteValue.QUARTER, count = 4) {
        if (!Number.isInteger(count) || count < 1 || count > 32) {
            throw new Error('A time signature count must be between one and thirty-two.');
        }
        this.note = note;
        this.count = count;
    }

    public capacity() {
        return fraction(
            NOTE_VALUE_UNITS[this.note].numerator * this.count,
            NOTE_VALUE_UNITS[this.note].denominator,
        );
    }
}

export default TimeSignature;
