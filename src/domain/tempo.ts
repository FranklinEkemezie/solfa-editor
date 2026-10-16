import { NoteValue } from './note-value';

export class Tempo {
    public readonly beatUnit: NoteValue;
    public readonly beatsPerMinute: number;
    public readonly description: string;

    public constructor(beatUnit = NoteValue.QUARTER, beatsPerMinute = 100, description = '') {
        if (!Number.isInteger(beatsPerMinute) || beatsPerMinute < 20 || beatsPerMinute > 320) {
            throw new Error('Tempo must be an integer between 20 and 320 BPM.');
        }
        this.beatUnit = beatUnit;
        this.beatsPerMinute = beatsPerMinute;
        this.description = description.trim();
    }
}

export default Tempo;
