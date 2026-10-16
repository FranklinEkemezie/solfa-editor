import { Accidental } from '@/domain/accidental';

export class KeySignature {
    public readonly accidental: Accidental;
    public readonly count: number;

    public constructor(accidental = Accidental.NATURAL, count = 0) {
        if (!Number.isInteger(count) || count < 0 || count > 7) {
            throw new Error('A key signature must contain between zero and seven accidentals.');
        }
        this.accidental = accidental;
        this.count = count;
    }
}

export default KeySignature;
