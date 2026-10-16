import { Key } from '@/domain/key';
import { Tempo } from '@/domain/tempo';
import { TimeSignature } from '@/domain/time-signature';
import { Measure } from '@/domain/measure';

export class Score {
    public readonly title: string;
    public readonly author: string;
    public readonly timeSignature: TimeSignature;
    public readonly key: Key;
    public readonly tempo: Tempo;
    public readonly measures: Measure[];
    public readonly lyrics: string;

    public constructor(
        title: string,
        timeSignature: TimeSignature,
        key: Key,
        tempo: Tempo,
        measures: Measure[],
        author = '',
        lyrics = '',
    ) {
        this.title = title;
        this.author = author;
        this.timeSignature = timeSignature;
        this.key = key;
        this.tempo = tempo;
        this.measures = [...measures];
        this.lyrics = lyrics;
    }
}

export default Score;
