import { Letter } from './letter';
import { Mode } from './mode';
import { KeySignature } from './key-signature';

export class Key {
    public readonly letter: Letter;
    public readonly signature: KeySignature;
    public readonly mode: Mode;

    public constructor(letter = Letter.C, signature = new KeySignature(), mode = Mode.MAJOR) {
        this.letter = letter;
        this.signature = signature;
        this.mode = mode;
    }
}

export default Key;
