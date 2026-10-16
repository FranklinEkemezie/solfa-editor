import { Letter } from '@/domain/letter';
import { Mode } from '@/domain/mode';
import { KeySignature } from '@/domain/key-signature';

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
